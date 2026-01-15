import { ZegoExpressEngine } from 'zego-express-engine-webrtc';
import { supabase } from '@/integrations/supabase/client';

export class ZegoVideoClient {
  private zg: ZegoExpressEngine | null = null;
  private localStream: MediaStream | null = null;
  private remoteStreams: Map<string, MediaStream> = new Map<string, MediaStream>();
  private streamIDs: Map<string, string> = new Map<string, string>();
  private appID: number = 0;
  private roomID: string = '';
  private userID: string = '';
  private userName: string = '';
  private isAudioMuted: boolean = false;
  private isVideoEnabled: boolean = true;
  private localStreamID: string = '';
  private onStreamAddCallback: (userID: string, stream: MediaStream) => void;
  private onStreamRemoveCallback: (userID: string) => void;
  private onErrorCallback: (error: string) => void;
  private onUserUpdateCallback?: (userID: string, updateType: 'add' | 'delete') => void;

  constructor(
    onStreamAdd: (userID: string, stream: MediaStream) => void,
    onStreamRemove: (userID: string) => void,
    onError: (error: string) => void,
    onUserUpdate?: (userID: string, updateType: 'add' | 'delete') => void
  ) {
    this.onStreamAddCallback = onStreamAdd;
    this.onStreamRemoveCallback = onStreamRemove;
    this.onErrorCallback = onError;
    this.onUserUpdateCallback = onUserUpdate;
  }

  async init(roomID: string, userID: string, userName: string): Promise<void> {
    try {
      // Get ZegoCloud token from edge function
      const { data, error } = await supabase.functions.invoke('generate-zego-token', {
        body: { userId: userID, roomId: roomID }
      });

      if (error) throw error;
      if (!data?.token || !data?.appId) {
        throw new Error('Failed to get ZegoCloud credentials');
      }

      this.appID = data.appId;
      this.roomID = roomID;
      this.userID = userID;
      this.userName = userName;

      // Initialize ZegoExpressEngine
      this.zg = new ZegoExpressEngine(this.appID, 'wss://webliveroom-api.zego.im/ws');
      
      // Set up event listeners
      this.setupEventListeners();

      // Login to room
      await this.zg.loginRoom(
        this.roomID,
        data.token,
        { userID: this.userID, userName: this.userName },
        { userUpdate: true }
      );

      // Create and publish local stream
      await this.startLocalStream();
      
      console.log('ZegoCloud initialized successfully');
    } catch (error) {
      console.error('ZegoCloud init error:', error);
      this.onErrorCallback(error instanceof Error ? error.message : 'Failed to initialize video');
      throw error;
    }
  }

  private setupEventListeners(): void {
    if (!this.zg) return;

    // Handle remote stream updates
    this.zg.on('roomStreamUpdate', async (roomID: string, updateType: string, streamList: any[]) => {
      console.log(`[ZegoVideo] Stream ${updateType}:`, streamList.map(s => ({ 
        streamID: s.streamID, 
        userID: s.user?.userID,
        userName: s.user?.userName 
      })));

      if (updateType === 'ADD') {
        for (const stream of streamList) {
          try {
            // Start playing the remote stream
            const remoteStream = await this.zg!.startPlayingStream(stream.streamID);
            const userID = stream.user.userID;
            
            this.remoteStreams.set(userID, remoteStream);
            this.streamIDs.set(userID, stream.streamID);
            
            console.log(`[ZegoVideo] Playing remote stream for user ${userID}`);
            this.onStreamAddCallback(userID, remoteStream);
            
            // Start monitoring audio levels for this stream
            this.monitorAudioLevel(stream.streamID, userID);
          } catch (error) {
            console.error('[ZegoVideo] Error playing remote stream:', error);
          }
        }
      } else if (updateType === 'DELETE') {
        for (const stream of streamList) {
          const userID = stream.user.userID;
          const streamID = this.streamIDs.get(userID);
          
          if (streamID) {
            try {
              this.zg!.stopPlayingStream(streamID);
            } catch (error) {
              console.error('[ZegoVideo] Error stopping stream:', error);
            }
          }
          
          this.remoteStreams.delete(userID);
          this.streamIDs.delete(userID);
          this.onStreamRemoveCallback(userID);
          
          console.log(`[ZegoVideo] Removed stream for user ${userID}`);
        }
      }
    });

    // Handle room user updates
    this.zg.on('roomUserUpdate', (roomID: string, updateType: string, userList: any[]) => {
      console.log(`[ZegoVideo] User ${updateType}:`, userList.map(u => ({ 
        userID: u.userID, 
        userName: u.userName 
      })));
      
      if (this.onUserUpdateCallback) {
        userList.forEach(user => {
          this.onUserUpdateCallback!(
            user.userID, 
            updateType === 'ADD' ? 'add' : 'delete'
          );
        });
      }
    });

    // Handle connection state changes
    this.zg.on('roomStateUpdate', (roomID: string, state: string, errorCode: number, extendedData: any) => {
      console.log(`[ZegoVideo] Room state: ${state}, error: ${errorCode}`);
      
      if (state === 'DISCONNECTED') {
        this.onErrorCallback('Disconnected from room');
      } else if (state === 'CONNECTING') {
        console.log('[ZegoVideo] Connecting to room...');
      } else if (state === 'CONNECTED') {
        console.log('[ZegoVideo] Connected to room successfully');
      }
    });

    // Handle network quality updates
    this.zg.on('publishQualityUpdate', (streamID: string, stats: any) => {
      if (stats.quality < 2) {
        console.warn('[ZegoVideo] Poor publish quality:', stats);
      }
    });

    this.zg.on('playQualityUpdate', (streamID: string, stats: any) => {
      if (stats.quality < 2) {
        console.warn('[ZegoVideo] Poor playback quality:', stats);
      }
    });
  }

  private monitorAudioLevel(streamID: string, userID: string): void {
    if (!this.zg) return;
    
    // Monitor audio level to detect speaking
    const interval = setInterval(() => {
      if (!this.zg || !this.streamIDs.has(userID)) {
        clearInterval(interval);
        return;
      }
      
      // The sound level API is available in ZegoExpressEngine
      // This is a placeholder - actual implementation depends on ZegoCloud API
      // For now, we'll rely on manual detection through audio/video state changes
    }, 500);
  }

  async startLocalStream(): Promise<MediaStream | null> {
    if (!this.zg) return null;

    try {
      console.log('[ZegoVideo] Creating local stream...');
      
      // Create local stream with optimal settings
      this.localStream = await this.zg.createStream({
        camera: {
          audio: true,
          video: true
        }
      }) as MediaStream;

      // Generate unique stream ID
      this.localStreamID = `stream_${this.userID}_${Date.now()}`;
      
      // Publish stream with config
      await this.zg.startPublishingStream(this.localStreamID, this.localStream, {
        videoCodec: 'H264'
      });

      console.log('[ZegoVideo] Local stream published:', this.localStreamID);
      return this.localStream;
    } catch (error) {
      console.error('[ZegoVideo] Error starting local stream:', error);
      this.onErrorCallback('Failed to access camera/microphone');
      return null;
    }
  }

  toggleMute(): boolean {
    if (!this.zg || !this.localStream) return this.isAudioMuted;

    this.isAudioMuted = !this.isAudioMuted;
    this.zg.mutePublishStreamAudio(this.localStream, this.isAudioMuted);
    return this.isAudioMuted;
  }

  toggleVideo(): boolean {
    if (!this.zg || !this.localStream) return !this.isVideoEnabled;

    this.isVideoEnabled = !this.isVideoEnabled;
    this.zg.mutePublishStreamVideo(this.localStream, !this.isVideoEnabled);
    return this.isVideoEnabled;
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  getRemoteStream(userID: string): MediaStream | null {
    return this.remoteStreams.get(userID) || null;
  }

  async disconnect(): Promise<void> {
    try {
      console.log('[ZegoVideo] Disconnecting...');
      
      // Stop publishing local stream
      if (this.zg && this.localStreamID) {
        try {
          await this.zg.stopPublishingStream(this.localStreamID);
        } catch (error) {
          console.error('[ZegoVideo] Error stopping publish:', error);
        }
      }

      // Stop all local tracks
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => {
          track.stop();
          console.log('[ZegoVideo] Stopped track:', track.kind);
        });
        this.localStream = null;
      }

      // Stop all remote streams
      this.streamIDs.forEach((streamID, userID) => {
        try {
          this.zg?.stopPlayingStream(streamID);
        } catch (error) {
          console.error(`[ZegoVideo] Error stopping remote stream ${streamID}:`, error);
        }
      });

      // Logout from room
      if (this.zg) {
        try {
          await this.zg.logoutRoom(this.roomID);
        } catch (error) {
          console.error('[ZegoVideo] Error logging out:', error);
        }
        
        // Remove all event listeners
        this.zg.off('roomStreamUpdate');
        this.zg.off('roomUserUpdate');
        this.zg.off('roomStateUpdate');
        this.zg.off('publishQualityUpdate');
        this.zg.off('playQualityUpdate');
      }

      // Clear all maps
      this.remoteStreams.clear();
      this.streamIDs.clear();
      
      console.log('[ZegoVideo] Disconnected successfully');
    } catch (error) {
      console.error('[ZegoVideo] Error during disconnect:', error);
    }
  }

  getAllRemoteStreams(): Map<string, MediaStream> {
    return new Map(this.remoteStreams);
  }

  isMuted(): boolean {
    return this.isAudioMuted;
  }

  isVideoOn(): boolean {
    return this.isVideoEnabled;
  }
}
