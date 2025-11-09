import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Video, VideoOff, Mic, MicOff, Phone, MessageSquare, Users, Sparkles, Share2, FileText, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { VoiceMeetingClient } from "@/utils/VoiceMeeting";
import { ZegoVideoClient } from "@/utils/ZegoVideoClient";
import LoadingSpinner from "@/components/LoadingSpinner";
import MeetingMinutesModal from "@/components/MeetingMinutesModal";
import MeetingChatModal from "@/components/MeetingChatModal";

interface Participant {
  id: string;
  user_id: string;
  display_name: string;
  is_host: boolean;
  is_muted: boolean;
  is_video_on: boolean;
  joined_at: string;
  avatar_url?: string;
  is_speaking?: boolean;
}

interface ChatMessage {
  id: string;
  user_id: string;
  message: string;
  created_at: string;
  display_name?: string;
}

export default function MeetingRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState<any>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [currentUserName, setCurrentUserName] = useState<string>('');
  const [transcript, setTranscript] = useState<string>("");
  const [elapsedTime, setElapsedTime] = useState(0);
  const [aiTranscript, setAiTranscript] = useState<string>("");
  const [voiceClient, setVoiceClient] = useState<VoiceMeetingClient | null>(null);
  const [isVoiceConnected, setIsVoiceConnected] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [showMinutesModal, setShowMinutesModal] = useState(false);
  const [meetingMinutes, setMeetingMinutes] = useState<any>(null);
  const [speakingUsers, setSpeakingUsers] = useState<Set<string>>(new Set());
  const [videoClient, setVideoClient] = useState<ZegoVideoClient | null>(null);
  const [localVideoStream, setLocalVideoStream] = useState<MediaStream | null>(null);
  const [remoteVideoStreams, setRemoteVideoStreams] = useState<Map<string, MediaStream>>(new Map());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const PROJECT_ID = "zhiiqdczslrnvlyflmke";

  useEffect(() => {
    if (id) {
      loadUser();
      fetchMeeting();
      joinMeeting();
      subscribeToParticipants();
      subscribeToChat();
      subscribeToMeetingEnd();
      initializeVoice();
    }

    return () => {
      leaveMeeting();
      voiceClient?.disconnect();
      videoClient?.disconnect();
    };
  }, [id]);

  // Initialize video after user is loaded
  useEffect(() => {
    if (currentUserId && currentUserName && meeting?.room_id) {
      initializeVideo();
    }
  }, [currentUserId, currentUserName, meeting?.room_id]);

  // Update local video element
  useEffect(() => {
    if (localVideoRef.current && localVideoStream) {
      localVideoRef.current.srcObject = localVideoStream;
    }
  }, [localVideoStream]);

  const initializeVoice = async () => {
    const client = new VoiceMeetingClient(
      PROJECT_ID,
      (text, isFinal) => {
        if (isFinal) {
          setAiTranscript(prev => prev + " " + text);
          setTranscript(prev => prev + "\n[AI Assistant]: " + text);
        }
      },
      (isSpeaking) => {
        setIsAiSpeaking(isSpeaking);
      },
      (error) => {
        console.error("Voice error:", error);
        toast.error(error);
      }
    );
    
    setVoiceClient(client);
    await client.connect();
    setIsVoiceConnected(true);
    toast.success("AI assistant joined the meeting");
  };

  const initializeVideo = async () => {
    if (!meeting?.room_id || !currentUserId || !currentUserName) return;

    try {
      console.log('[Meeting] Initializing video for room:', meeting.room_id);
      
      const client = new ZegoVideoClient(
        (userID: string, stream: MediaStream) => {
          console.log('[Meeting] Remote stream added:', userID);
          setRemoteVideoStreams(prev => {
            const newMap = new Map(prev);
            newMap.set(userID, stream);
            return newMap;
          });
          
          // Update participant video status
          updateParticipantStatus(userID, { is_video_on: true });
        },
        (userID: string) => {
          console.log('[Meeting] Remote stream removed:', userID);
          setRemoteVideoStreams(prev => {
            const newMap = new Map(prev);
            newMap.delete(userID);
            return newMap;
          });
          
          // Update participant video status
          updateParticipantStatus(userID, { is_video_on: false });
        },
        (error: string) => {
          console.error('[Meeting] Video error:', error);
          toast.error(error);
        },
        (userID: string, updateType: 'add' | 'delete') => {
          console.log(`[Meeting] User ${updateType}:`, userID);
          if (updateType === 'delete') {
            // User left, refresh participants
            fetchParticipants();
          }
        }
      );

      await client.init(meeting.room_id, currentUserId, currentUserName);
      const localStream = client.getLocalStream();
      
      setVideoClient(client);
      setLocalVideoStream(localStream);
      setIsVideoOn(!!localStream);
      
      // Update own video status in DB
      await updateParticipantStatus(currentUserId, { is_video_on: !!localStream });
      
      toast.success("Video connected");
      console.log('[Meeting] Video initialized successfully');
    } catch (error) {
      console.error('[Meeting] Failed to initialize video:', error);
      toast.error('Failed to start video. Using audio only.');
    }
  };

  const updateParticipantStatus = async (userId: string, status: { is_video_on?: boolean; is_muted?: boolean }) => {
    try {
      await (supabase as any)
        .from('meeting_participants')
        .update(status)
        .eq('meeting_id', id)
        .eq('user_id', userId);
    } catch (error) {
      console.error('[Meeting] Error updating participant status:', error);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => {
    if (meeting?.start_time) {
      const timer = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [meeting?.start_time]);

  const loadUser = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        toast.error("Please sign in to access meetings");
        navigate('/auth', { state: { returnTo: `/meeting/${id}` } });
        return;
      }

      setCurrentUserId(user.id);
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('user_id', user.id)
        .maybeSingle();
      
      setCurrentUserName(profile?.full_name || profile?.email || 'Anonymous');
    } catch (error) {
      console.error('Error loading user:', error);
      toast.error("Authentication error");
      navigate('/auth');
    }
  };

  const getMeetingLink = () => {
    return `${window.location.origin}/join-meeting/${meeting?.meeting_code || ''}`;
  };

  const fetchMeeting = async () => {
    try {
      // Check auth first
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        toast.error("Please sign in to access meetings");
        navigate('/auth', { state: { returnTo: `/meeting/${id}` } });
        return;
      }

      const { data, error } = await (supabase as any)
        .from('meeting_sessions')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      
      if (!data) {
        toast.error('Meeting not found');
        navigate('/');
        return;
      }
      
      setMeeting(data);
    } catch (error) {
      console.error('Error fetching meeting:', error);
      toast.error('Failed to load meeting');
      navigate('/');
    }
  };

  const joinMeeting = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        toast.error("Please sign in to join meetings");
        navigate('/auth', { state: { returnTo: `/meeting/${id}` } });
        return;
      }

      // Fetch profile for display name
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('user_id', user.id)
        .maybeSingle();

      // Avoid duplicate rows if already joined
      const { data: existing } = await (supabase as any)
        .from('meeting_participants')
        .select('id,left_at')
        .eq('meeting_id', id)
        .eq('user_id', user.id)
        .limit(1);

      if (!existing || existing.length === 0) {
        const { error: insertError } = await (supabase as any)
          .from('meeting_participants')
          .insert({
            meeting_id: id,
            user_id: user.id,
            display_name: profile?.full_name || profile?.email || 'Anonymous',
            is_host: meeting?.host_id === user.id,
          });
        if (insertError) {
          console.error("Error inserting participant:", insertError);
        }
      } else if (existing[0].left_at) {
        await (supabase as any)
          .from('meeting_participants')
          .update({ left_at: null })
          .eq('id', existing[0].id);
      }

      // Create notification for meeting join
      await supabase.from('notifications').insert({
        user_id: user.id,
        title: 'Joined Meeting',
        message: `You joined "${meeting?.title}"`,
        type: 'meeting'
      });

      // Subscribe to participant join/leave events
      const channel = supabase
        .channel(`participant_events_${id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'meeting_participants',
            filter: `meeting_id=eq.${id}`,
          },
          async (payload) => {
            if (payload.new.user_id !== user.id) {
              toast.success(`${payload.new.display_name} joined the meeting`);
              
              // Create notification for other participants
              await supabase.from('notifications').insert({
                user_id: user.id,
                title: 'Participant Joined',
                message: `${payload.new.display_name} joined the meeting`,
                type: 'meeting'
              });
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'meeting_participants',
            filter: `meeting_id=eq.${id}`,
          },
          async (payload: any) => {
            if (payload.new.left_at && payload.new.user_id !== user.id) {
              toast.info(`${payload.new.display_name} left the meeting`);
              
              // Create notification
              await supabase.from('notifications').insert({
                user_id: user.id,
                title: 'Participant Left',
                message: `${payload.new.display_name} left the meeting`,
                type: 'meeting'
              });
            }
          }
        )
        .subscribe();
    } catch (error) {
      console.error('Error joining meeting:', error);
      toast.error('Failed to join meeting');
    }
  };

  const leaveMeeting = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await (supabase as any)
        .from('meeting_participants')
        .update({ left_at: new Date().toISOString() })
        .eq('meeting_id', id)
        .eq('user_id', user.id);
      
      voiceClient?.disconnect();
    } catch (error) {
      console.error('Error leaving meeting:', error);
    }
  };

  const toggleMute = async () => {
    if (videoClient) {
      const muted = videoClient.toggleMute();
      setIsAudioOn(!muted);
      
      // Update participant mute status in database
      await updateParticipantStatus(currentUserId, { is_muted: muted });
      
      toast.success(muted ? "Microphone muted" : "Microphone unmuted");
      console.log('[Meeting] Audio', muted ? 'muted' : 'unmuted');
      
      // Simulate speaking detection when unmuted
      if (!muted) {
        setSpeakingUsers(prev => new Set(prev).add(currentUserId));
        setTimeout(() => {
          setSpeakingUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(currentUserId);
            return newSet;
          });
        }, 2000);
      }
    }
  };

  const toggleVideo = async () => {
    if (videoClient) {
      const enabled = videoClient.toggleVideo();
      setIsVideoOn(enabled);
      
      // Update participant video status in database
      await updateParticipantStatus(currentUserId, { is_video_on: enabled });
      
      toast.success(enabled ? "Camera on" : "Camera off");
      console.log('[Meeting] Video', enabled ? 'enabled' : 'disabled');
    }
  };

  const subscribeToParticipants = () => {
    const channel = supabase
      .channel(`meeting_participants_realtime_${id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'meeting_participants',
          filter: `meeting_id=eq.${id}`,
        },
        (payload) => {
          console.log('[Meeting] New participant joined:', payload.new);
          fetchParticipants();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'meeting_participants',
          filter: `meeting_id=eq.${id}`,
        },
        (payload) => {
          console.log('[Meeting] Participant updated:', payload.new);
          // Update specific participant in state
          setParticipants(prev => 
            prev.map(p => p.user_id === (payload.new as any).user_id 
              ? { ...p, ...(payload.new as any) }
              : p
            )
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'meeting_participants',
          filter: `meeting_id=eq.${id}`,
        },
        (payload) => {
          console.log('[Meeting] Participant left:', payload.old);
          fetchParticipants();
        }
      )
      .subscribe((status) => {
        console.log('[Meeting] Participants subscription status:', status);
      });

    fetchParticipants();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const subscribeToMeetingEnd = () => {
    const channel = supabase
      .channel(`meeting_end_${id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'meeting_sessions',
          filter: `id=eq.${id}`,
        },
        (payload: any) => {
          if (payload.new.end_time && payload.new.host_id !== currentUserId) {
            toast.info("The host has ended the meeting");
            setTimeout(() => {
              navigate('/');
            }, 2000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchParticipants = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('meeting_participants')
        .select('*')
        .eq('meeting_id', id)
        .is('left_at', null);

      if (error) throw error;
      
      // Fetch profiles separately for avatar URLs
      const userIds = (data || []).map((p: any) => p.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, avatar_url')
        .in('user_id', userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      
      // Enrich participants with profile data
      const enrichedParticipants = (data || []).map((p: any) => ({
        ...p,
        avatar_url: profileMap.get(p.user_id)?.avatar_url || null
      }));
      
      setParticipants(enrichedParticipants);
    } catch (error) {
      console.error('Error fetching participants:', error);
    }
  };

  const subscribeToChat = () => {
    const channel = supabase
      .channel(`meeting_chat_${id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'meeting_chat',
          filter: `meeting_id=eq.${id}`,
        },
        (payload) => {
          fetchChat();
        }
      )
      .subscribe();

    fetchChat();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchChat = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('meeting_chat')
        .select('*')
        .eq('meeting_id', id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      // Get display names from participants
      const { data: participantData } = await (supabase as any)
        .from('meeting_participants')
        .select('user_id, display_name')
        .eq('meeting_id', id);
      
      const participantMap = new Map(participantData?.map((p: any) => [p.user_id, p.display_name]) || []);
      
      const messagesWithNames = (data || []).map((msg: any) => ({
        ...msg,
        display_name: participantMap.get(msg.user_id) || 'Anonymous'
      }));
      
      setChatMessages(messagesWithNames);
    } catch (error) {
      console.error('Error fetching chat:', error);
    }
  };

  const sendChatMessage = async (message: string) => {
    if (!message.trim()) return;

    try {
      await (supabase as any)
        .from('meeting_chat')
        .insert({
          meeting_id: id,
          user_id: currentUserId,
          message: message,
        });

      // Append to transcript for AI minutes
      setTranscript(prev => `${prev}\n[${currentUserName}]: ${message}`);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const endMeeting = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || meeting?.host_id !== user.id) {
        toast.error('Only the host can end the meeting');
        return;
      }

      // Update meeting end time immediately so all clients get realtime update
      await (supabase as any)
        .from('meeting_sessions')
        .update({ 
          end_time: new Date().toISOString(),
          duration_minutes: Math.floor(elapsedTime / 60)
        })
        .eq('id', id);

      // Generate AI minutes and show instantly
      const participantNames = participants.map(p => p.display_name);
      const { data: minutesData, error: genErr } = await supabase.functions.invoke('generate-meeting-minutes', {
        body: {
          meetingId: id,
          transcript: transcript || 'Meeting discussion content',
          participants: participantNames
        }
      });
      if (genErr) {
        console.error('Error generating minutes:', genErr);
      }

      // Update modal immediately with generated content
      const generated = minutesData || {
        summary: 'Meeting summary',
        actionItems: [],
        keyPoints: [],
        participantRatings: {},
      };
      setMeetingMinutes({
        summary: generated.summary,
        action_items: generated.actionItems || [],
        key_topics: generated.keyPoints || [],
        participant_ratings: generated.participantRatings || {},
        full_transcript: transcript
      });
      setShowMinutesModal(true);
      toast.success('Meeting ended successfully!');

      // Persist minutes in background (best-effort)
      (supabase as any)
        .from('meeting_minutes')
        .insert({
          meeting_id: id,
          summary: generated.summary,
          full_transcript: transcript,
          action_items: generated.actionItems || [],
          key_topics: generated.keyPoints || [],
          participant_ratings: generated.participantRatings || {},
        })
        .select()
        .single()
        .then(({ data }) => data && setMeetingMinutes(data));
    } catch (error) {
      console.error('Error ending meeting:', error);
      toast.error('Failed to end meeting');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const copyMeetingLink = async () => {
    const link = `https://tryinterview.site/join-meeting/${meeting?.room_id || ''}`;
    try {
      await navigator.clipboard.writeText(link);
      toast.success('Meeting link copied!');
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  if (!meeting) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b bg-card p-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Video className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold">{meeting.title}</h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="outline" className="text-xs">
                  <Users className="w-3 h-3 mr-1" />
                  {participants.length} participants
                </Badge>
                <span>•</span>
                <span>{formatTime(elapsedTime)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={copyMeetingLink}>
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            {meeting.host_id === currentUserId && (
              <Button size="sm" variant="destructive" onClick={endMeeting}>
                <Phone className="w-4 h-4 mr-2" />
                End Meeting
              </Button>
            )}
            {meeting.host_id !== currentUserId && (
              <Button size="sm" variant="outline" onClick={() => { leaveMeeting(); navigate('/'); }}>
                Leave
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Area */}
        <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-muted/30 via-background to-muted/20 p-6 relative">
          {/* AI Assistant Small Indicator at Top */}
          {isVoiceConnected && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
              <Card className={`flex items-center gap-2 px-3 py-1.5 ${
                isAiSpeaking 
                  ? 'bg-gradient-to-r from-primary/90 to-purple-500/90 shadow-lg shadow-primary/50 animate-pulse border-primary' 
                  : 'bg-card/90 backdrop-blur-sm border-border/50'
              }`}>
                <Sparkles className={`w-3.5 h-3.5 ${isAiSpeaking ? 'text-primary-foreground' : 'text-primary'}`} />
                <span className={`text-xs font-medium ${isAiSpeaking ? 'text-primary-foreground' : 'text-foreground'}`}>
                  {isAiSpeaking ? 'AI Speaking' : 'AI Listening'}
                </span>
              </Card>
            </div>
          )}

          {/* Main Video Area - Large active speaker */}
          <div className="flex-1 flex flex-col gap-3 max-w-7xl w-full mx-auto">
            {/* Large Active Speaker Video */}
            <Card className="flex-1 relative overflow-hidden bg-muted/30">
              {(() => {
                const activeSpeaker = participants.find(p => speakingUsers.has(p.user_id)) || participants[0];
                const isLocalUser = activeSpeaker?.user_id === currentUserId;
                const stream = isLocalUser ? localVideoStream : remoteVideoStreams.get(activeSpeaker?.user_id || '');
                
                return (
                  <>
                    {stream && isVideoOn ? (
                      <video
                        ref={isLocalUser ? localVideoRef : undefined}
                        autoPlay
                        playsInline
                        muted={isLocalUser}
                        className="absolute inset-0 w-full h-full object-cover"
                        {...(!isLocalUser && { srcObject: stream } as any)}
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-muted/60 to-background/60">
                        <div className="text-center">
                          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center mx-auto mb-4">
                            <span className="text-6xl font-bold text-foreground">
                              {activeSpeaker?.display_name?.charAt(0).toUpperCase() || 'M'}
                            </span>
                          </div>
                          <p className="text-2xl font-medium">{activeSpeaker?.display_name || 'Meeting Room'}</p>
                          {!isVideoOn && isLocalUser && (
                            <p className="text-sm text-muted-foreground mt-2">Camera is off</p>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Participant name overlay */}
                    <div className="absolute bottom-4 left-4 backdrop-blur-sm bg-background/80 px-4 py-2 rounded-lg">
                      <p className="font-medium text-sm flex items-center gap-2">
                        {activeSpeaker?.display_name}
                        {activeSpeaker?.user_id === currentUserId && " (You)"}
                        {activeSpeaker?.is_host && <Badge variant="secondary" className="text-xs">Host</Badge>}
                        {speakingUsers.has(activeSpeaker?.user_id || '') && (
                          <span className="flex items-center gap-1 text-primary">
                            <Mic className="w-3 h-3 animate-pulse" />
                          </span>
                        )}
                      </p>
                    </div>
                  </>
                );
              })()}
            </Card>

            {/* Participant Thumbnails */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {/* Local user */}
              <Card 
                className={`relative flex-shrink-0 w-32 h-24 overflow-hidden transition-all duration-300 ${
                  currentUserId && speakingUsers.has(currentUserId) 
                    ? 'ring-4 ring-offset-2 ring-offset-background animate-pulse' 
                    : 'ring-1 ring-border/30'
                }`}
                style={currentUserId && speakingUsers.has(currentUserId) ? {
                  boxShadow: '0 0 20px rgba(var(--primary), 0.5)',
                  borderImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%) 1',
                } : {}}
              >
                {localVideoStream && isVideoOn ? (
                  <video
                    autoPlay
                    playsInline
                    muted
                    className="absolute inset-0 w-full h-full object-cover"
                    ref={(el) => { if (el && localVideoStream) el.srcObject = localVideoStream; }}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted/60">
                    <span className="text-xl font-bold">{currentUserName?.charAt(0).toUpperCase()}</span>
                  </div>
                )}
                <div className="absolute bottom-1 left-1 text-[10px] bg-background/90 px-1.5 py-0.5 rounded">
                  You {!isAudioOn && <MicOff className="w-2.5 h-2.5 inline ml-0.5" />}
                </div>
              </Card>

              {/* Remote participants */}
              {participants.filter(p => p.user_id !== currentUserId).map((participant) => {
                const stream = remoteVideoStreams.get(participant.user_id);
                const isSpeaking = speakingUsers.has(participant.user_id);
                
                return (
                  <Card 
                    key={participant.id}
                    className={`relative flex-shrink-0 w-32 h-24 overflow-hidden transition-all duration-300 ${
                      isSpeaking 
                        ? 'ring-4 ring-offset-2 ring-offset-background animate-pulse scale-105' 
                        : 'ring-1 ring-border/30'
                    }`}
                    style={isSpeaking ? {
                      boxShadow: '0 0 20px rgba(var(--primary), 0.5)',
                      borderImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%) 1',
                    } : {}}
                  >
                    {stream && participant.is_video_on ? (
                      <video
                        autoPlay
                        playsInline
                        className="absolute inset-0 w-full h-full object-cover"
                        ref={(el) => { if (el && stream) el.srcObject = stream; }}
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-muted/60">
                        <span className="text-xl font-bold">
                          {participant.display_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="absolute bottom-1 left-1 text-[10px] bg-background/90 px-1.5 py-0.5 rounded truncate max-w-[120px]">
                      {participant.display_name} {participant.is_muted && <MicOff className="w-2.5 h-2.5 inline ml-0.5" />}
                    </div>
                    {participant.is_host && (
                      <div className="absolute top-1 right-1">
                        <Badge variant="secondary" className="text-[8px] px-1 py-0">Host</Badge>
                      </div>
                    )}
                  </Card>
                  );
                })}
            </div>
          </div>

        </div>
      </div>

      {/* Controls */}
      <div className="border-t bg-card/95 backdrop-blur-sm p-6 shadow-2xl">
        <div className="flex items-center justify-between gap-6 max-w-7xl mx-auto">
          {/* Left side - Meeting info */}
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Badge variant="outline" className="font-mono">
              {formatTime(elapsedTime)}
            </Badge>
          </div>

          {/* Center - Main controls */}
          <div className="flex items-center justify-center gap-3">
            <Button
              variant={isAudioOn ? "default" : "destructive"}
              size="lg"
              onClick={toggleMute}
              className="rounded-full h-14 w-14 shadow-lg hover:scale-105 transition-transform"
              disabled={!isVoiceConnected}
            >
              {isAudioOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
            </Button>
            
            <Button
              variant={isVideoOn ? "default" : "secondary"}
              size="lg"
              onClick={toggleVideo}
              className="rounded-full h-14 w-14 shadow-lg hover:scale-105 transition-transform"
              disabled={!videoClient}
            >
              {isVideoOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              className="rounded-full h-14 w-14 shadow-lg hover:scale-105 transition-transform"
              title="Screen share (coming soon)"
              disabled
            >
              <Monitor className="w-6 h-6" />
            </Button>

            {meeting.host_id === currentUserId ? (
              <Button
                variant="destructive"
                size="lg"
                onClick={endMeeting}
                className="rounded-full h-14 px-8 shadow-lg hover:scale-105 transition-transform"
              >
                <Phone className="w-5 h-5 mr-2" />
                End Meeting
              </Button>
            ) : (
              <Button
                variant="outline"
                size="lg"
                onClick={() => { leaveMeeting(); navigate('/'); }}
                className="rounded-full h-14 px-8 shadow-lg hover:scale-105 transition-transform hover:bg-destructive hover:text-destructive-foreground"
              >
                <Phone className="w-5 h-5 mr-2" />
                Leave
              </Button>
            )}
          </div>

          {/* Right side - Additional controls */}
          <div className="flex items-center gap-2">
            {meetingMinutes && (
              <Button
                variant="outline"
                size="lg"
                onClick={() => setShowMinutesModal(true)}
                className="rounded-lg h-12 px-4 shadow-sm hover:scale-105 transition-transform"
              >
                <FileText className="w-5 h-5" />
                <span className="ml-2 hidden md:inline">Minutes</span>
              </Button>
            )}
            
            <Button
              variant={showChat ? "default" : "ghost"}
              size="lg"
              onClick={() => setShowChat(!showChat)}
              className="rounded-lg h-12 px-4 shadow-sm hover:scale-105 transition-transform"
            >
              <MessageSquare className="w-5 h-5" />
              <span className="ml-2 hidden md:inline">Chat</span>
            </Button>
            
            <Button
              variant="ghost"
              size="lg"
              onClick={copyMeetingLink}
              className="rounded-lg h-12 px-4 shadow-sm hover:scale-105 transition-transform"
            >
              <Share2 className="w-5 h-5" />
              <span className="ml-2 hidden md:inline">Share</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Meeting Chat Modal */}
      <MeetingChatModal
        open={showChat}
        onOpenChange={setShowChat}
        messages={chatMessages}
        currentUserId={currentUserId}
        onSendMessage={sendChatMessage}
      />

      {/* Meeting Minutes Modal */}
      <MeetingMinutesModal
        open={showMinutesModal}
        onOpenChange={setShowMinutesModal}
        minutes={meetingMinutes}
        meetingTitle={meeting?.title || "Meeting"}
        meetingDate={meeting?.start_time || new Date().toISOString()}
        participants={participants.map(p => p.display_name)}
      />
    </div>
  );
}
