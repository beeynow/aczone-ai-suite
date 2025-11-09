import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Video, VideoOff, Mic, MicOff, Phone, MessageSquare, Users, Sparkles, Share2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { VoiceMeetingClient } from "@/utils/VoiceMeeting";
import LoadingSpinner from "@/components/LoadingSpinner";
import MeetingMinutesModal from "@/components/MeetingMinutesModal";

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
  const [chatInput, setChatInput] = useState("");
  const [isVideoOn, setIsVideoOn] = useState(false);
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
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
    };
  }, [id]);

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
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('user_id', user.id)
        .single();
      
      setCurrentUserName(profile?.full_name || profile?.email || 'Anonymous');
    }
  };

  const getMeetingLink = () => {
    return `https://tryinterview.site/join-meeting/${meeting?.room_id || ''}`;
  };

  const fetchMeeting = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('meeting_sessions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setMeeting(data);
    } catch (error) {
      console.error('Error fetching meeting:', error);
      toast.error('Failed to load meeting');
    }
  };

  const joinMeeting = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

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
    if (voiceClient) {
      const muted = voiceClient.toggleMute();
      setIsAudioOn(!muted);
      
      // Update participant mute status in database
      try {
        await (supabase as any)
          .from('meeting_participants')
          .update({ is_muted: muted })
          .eq('meeting_id', id)
          .eq('user_id', currentUserId);
      } catch (error) {
        console.error('Error updating mute status:', error);
      }
      
      toast.success(muted ? "Microphone muted" : "Microphone unmuted");
      
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

  const subscribeToParticipants = () => {
    const channel = supabase
      .channel(`meeting_participants_${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'meeting_participants',
          filter: `meeting_id=eq.${id}`,
        },
        () => {
          fetchParticipants();
        }
      )
      .subscribe();

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
        .select('*, profiles!inner(avatar_url, full_name)')
        .eq('meeting_id', id)
        .is('left_at', null);

      if (error) throw error;
      
      // Enrich participants with profile data
      const enrichedParticipants = (data || []).map((p: any) => ({
        ...p,
        avatar_url: p.profiles?.avatar_url,
        display_name: p.display_name || p.profiles?.full_name || 'Anonymous'
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
        .select('*, profiles(full_name, email)')
        .eq('meeting_id', id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      const messagesWithNames = (data || []).map((msg: any) => ({
        ...msg,
        display_name: msg.profiles?.full_name || msg.profiles?.email || 'Anonymous'
      }));
      
      setChatMessages(messagesWithNames);
    } catch (error) {
      console.error('Error fetching chat:', error);
    }
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim()) return;

    try {
      await (supabase as any)
        .from('meeting_chat')
        .insert({
          meeting_id: id,
          user_id: currentUserId,
          message: chatInput,
        });

      // Append to transcript for AI minutes
      setTranscript(prev => `${prev}\n[${currentUserName}]: ${chatInput}`);
      setChatInput("");
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
          {/* AI Assistant Indicator */}
          {isVoiceConnected && (
            <div className="absolute top-6 right-6 z-10">
              <Badge className={`flex items-center gap-2 px-4 py-2 text-sm ${isAiSpeaking ? 'bg-primary shadow-lg shadow-primary/50 animate-pulse' : 'bg-muted border-border'}`}>
                <Sparkles className="w-4 h-4" />
                {isAiSpeaking ? 'AI Speaking...' : 'AI Listening'}
              </Badge>
            </div>
          )}

          {/* Video Grid - Compact layout like Zoom/Teams with a large active speaker tile */}
          {(() => {
            const active = participants.find(p => speakingUsers.has(p.user_id)) || participants[0];
            const ordered = active 
              ? [active, ...participants.filter(p => p.id !== active.id)]
              : participants;
            return (
              <div className="grid gap-2 max-w-7xl w-full grid-cols-2 md:grid-cols-4 auto-rows-[120px] md:auto-rows-[140px]">
                {ordered.map((participant, idx) => {
                  const isSpeaking = speakingUsers.has(participant.user_id);
                  const tileClasses = idx === 0
                    ? 'md:col-span-2 md:row-span-2 aspect-video'
                    : 'aspect-[4/3]';
                  return (
                    <Card 
                      key={participant.id} 
                      className={`relative overflow-hidden transition-all duration-200 ${tileClasses} ${
                        isSpeaking 
                          ? 'ring-4 ring-primary shadow-2xl shadow-primary/50 scale-[1.02]' 
                          : 'ring-2 ring-border/30 hover:ring-border/60'
                      }`}
                    >
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-muted/80 to-background/80">
                        <div className="text-center">
                          {participant.avatar_url ? (
                            <img 
                              src={participant.avatar_url} 
                              alt={participant.display_name}
                              className={`rounded-full mx-auto mb-1 object-cover ${idx === 0 ? 'w-24 h-24' : 'w-10 h-10'} ${isSpeaking ? 'ring-4 ring-primary animate-pulse' : ''}`}
                            />
                          ) : (
                            <div className={`rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center mx-auto mb-1 ${idx === 0 ? 'w-24 h-24' : 'w-10 h-10'} ${isSpeaking ? 'ring-4 ring-primary animate-pulse' : ''}`}>
                              <span className={`font-bold text-foreground ${idx === 0 ? 'text-3xl' : 'text-base'}`}>
                                {participant.display_name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <p className={`font-medium ${idx === 0 ? 'text-base' : 'text-xs'}`}>
                            {participant.display_name}
                            {participant.user_id === currentUserId && (
                              <span className="text-xs text-muted-foreground ml-1">(You)</span>
                            )}
                          </p>
                          {participant.is_host && (
                            <Badge className="text-[10px] mt-0.5 bg-primary/80 px-1.5 py-0">Host</Badge>
                          )}
                        </div>
                      </div>
                      <div className="absolute bottom-2 left-2">
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full backdrop-blur-sm text-xs ${
                          participant.is_muted 
                            ? 'bg-destructive/90 text-destructive-foreground' 
                            : 'bg-background/90 border border-primary/50'
                        }`}>
                          {participant.is_muted ? (
                            <MicOff className="w-3 h-3" />
                          ) : (
                            <Mic className={`w-3 h-3 ${isSpeaking ? 'text-primary animate-pulse' : 'text-muted-foreground'}`} />
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}

                {/* AI Assistant Card */}
                <Card className={`relative overflow-hidden transition-all duration-200 aspect-[4/3] ${
                  isAiSpeaking 
                    ? 'ring-4 ring-primary shadow-2xl shadow-primary/50 scale-[1.02]' 
                    : 'ring-2 ring-primary/30'
                } bg-gradient-to-br from-primary/10 via-background/80 to-accent/10`}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className={`rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-1 w-10 h-10 ${isAiSpeaking ? 'ring-4 ring-primary animate-pulse shadow-lg shadow-primary/50' : ''}`}>
                        <Sparkles className={`text-white w-5 h-5`} />
                      </div>
                      <p className={`font-medium text-xs`}>
                        AI Assistant
                      </p>
                      <Badge className="text-[10px] mt-0.5 bg-primary/80 px-1.5 py-0">
                        {isAiSpeaking ? 'Speaking' : 'Listening'}
                      </Badge>
                    </div>
                  </div>
                </Card>
              </div>
            );
          })()}

        </div>

        {/* Sidebar - Chat or Participants */}
        {showChat && (
          <div className="w-80 border-l bg-card flex flex-col">
            <div className="p-4 border-b">
              <h3 className="font-semibold">Chat</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.map((msg) => (
                <div key={msg.id} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium">{msg.display_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(msg.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm bg-muted p-2 rounded">{msg.message}</p>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t flex gap-2">
              <Input
                placeholder="Type a message..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
              />
              <Button onClick={sendChatMessage}>Send</Button>
            </div>
          </div>
        )}
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
              onClick={() => setIsVideoOn(!isVideoOn)}
              className="rounded-full h-14 w-14 shadow-lg hover:scale-105 transition-transform"
            >
              {isVideoOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
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
