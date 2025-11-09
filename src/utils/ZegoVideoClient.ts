import { ZegoExpressEngine } from 'zego-express-engine-webrtc';
import { supabase } from '@/integrations/supabase/client';

export class ZegoVideoClient {
  private zg: ZegoExpressEngine | null = null;
  private localStream: MediaStream | null = null;
  private remoteStreams: Map<string, MediaStream> = new Map();
  private appID: number = 0;
  private roomID: string = '';
  private userID: string = '';
  private userName: string = '';
  private isAudioMuted: boolean = false;
  private isVideoEnabled: boolean = true;

  constructor(
    private onStreamAdd: (userID: string, stream: MediaStream) => void,
    private onStreamRemove: (userID: string) => void,
    private onError: (error: string) => void
  ) {}

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
      this.onError(error instanceof Error ? error.message : 'Failed to initialize video');
      throw error;
    }
  }

  private setupEventListeners(): void {
    if (!this.zg) return;

    // Handle remote stream added
    this.zg.on('roomStreamUpdate', async (roomID, updateType, streamList) => {
      if (updateType === 'ADD') {
        for (const stream of streamList) {
          try {
            const remoteStream = await this.zg!.startPlayingStream(stream.streamID);
            this.remoteStreams.set(stream.user.userID, remoteStream);
            this.onStreamAdd(stream.user.userID, remoteStream);
          } catch (error) {
            console.error('Error playing remote stream:', error);
          }
        }
      } else if (updateType === 'DELETE') {
        for (const stream of streamList) {
          this.zg!.stopPlayingStream(stream.streamID);
          this.remoteStreams.delete(stream.user.userID);
          this.onStreamRemove(stream.user.userID);
        }
      }
    });

    // Handle room user updates
    this.zg.on('roomUserUpdate', (roomID, updateType, userList) => {
      console.log('Room user update:', updateType, userList);
    });

    // Handle errors
    this.zg.on('roomStateUpdate', (roomID, state, errorCode, extendedData) => {
      if (state === 'DISCONNECTED') {
        this.onError('Disconnected from room');
      } else if (state === 'CONNECTING') {
        console.log('Connecting to room...');
      } else if (state === 'CONNECTED') {
        console.log('Connected to room');
      }
    });
  }

  async startLocalStream(): Promise<MediaStream | null> {
    if (!this.zg) return null;

    try {
      // Create local stream
      this.localStream = await this.zg.createStream({
        camera: {
          audio: true,
          video: {
            width: 1280,
            height: 720,
            frameRate: 30
          }
        }
      });

      // Publish stream
      const streamID = `stream_${this.userID}_${Date.now()}`;
      await this.zg.startPublishingStream(streamID, this.localStream);

      console.log('Local stream started:', streamID);
      return this.localStream;
    } catch (error) {
      console.error('Error starting local stream:', error);
      this.onError('Failed to access camera/microphone');
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
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => track.stop());
        this.localStream = null;
      }

      if (this.zg) {
        await this.zg.logoutRoom(this.roomID);
        this.zg.off('roomStreamUpdate');
        this.zg.off('roomUserUpdate');
        this.zg.off('roomStateUpdate');
      }

      this.remoteStreams.clear();
      console.log('ZegoCloud disconnected');
    } catch (error) {
      console.error('Error disconnecting:', error);
    }
  }

  isMuted(): boolean {
    return this.isAudioMuted;
  }

  isVideoOn(): boolean {
    return this.isVideoEnabled;
  }
}
