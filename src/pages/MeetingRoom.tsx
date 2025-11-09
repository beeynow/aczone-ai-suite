import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Video, VideoOff, Mic, MicOff, Phone, MessageSquare, Users, Download, Copy, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ParticipantsList from "@/components/ParticipantsList";

interface Participant {
  id: string;
  display_name: string;
  is_host: boolean;
  is_muted: boolean;
  is_video_on: boolean;
  joined_at: string;
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      loadUser();
      fetchMeeting();
      joinMeeting();
      subscribeToParticipants();
      subscribeToChat();
    }

    return () => {
      leaveMeeting();
    };
  }, [id]);

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

  const fetchMeeting = async () => {
    try {
      const { data, error } = await supabase
        .from('meeting_sessions')
        .select('*')
        .eq('id', id)
        .single() as any;

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

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('user_id', user.id)
        .single();

      await supabase
        .from('meeting_participants')
        .insert({
          meeting_id: id,
          user_id: user.id,
          display_name: profile?.full_name || profile?.email || 'Anonymous',
          is_host: meeting?.host_id === user.id,
        } as any);

      toast.success('Joined meeting');
    } catch (error) {
      console.error('Error joining meeting:', error);
    }
  };

  const leaveMeeting = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('meeting_participants')
        .update({ left_at: new Date().toISOString() } as any)
        .eq('meeting_id', id)
        .eq('user_id', user.id);
    } catch (error) {
      console.error('Error leaving meeting:', error);
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

  const fetchParticipants = async () => {
    try {
      const { data, error } = await supabase
        .from('meeting_participants')
        .select('*')
        .eq('meeting_id', id)
        .is('left_at', null) as any;

      if (error) throw error;
      setParticipants((data as any) || []);
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
      const { data, error } = await supabase
        .from('meeting_chat')
        .select('*, profiles(full_name, email)')
        .eq('meeting_id', id)
        .order('created_at', { ascending: true }) as any;

      if (error) throw error;
      
      const messagesWithNames = ((data as any) || []).map((msg: any) => ({
        ...msg,
        display_name: msg.profiles?.full_name || msg.profiles?.email || 'Anonymous'
      }));
      
      setChatMessages(messagesWithNames as any);
    } catch (error) {
      console.error('Error fetching chat:', error);
    }
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim()) return;

    try {
      await supabase
        .from('meeting_chat')
        .insert({
          meeting_id: id,
          user_id: currentUserId,
          message: chatInput,
        } as any);

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

      // Update meeting end time
      await supabase
        .from('meeting_sessions')
        .update({ 
          end_time: new Date().toISOString(),
          duration_minutes: Math.floor(elapsedTime / 60)
        } as any)
        .eq('id', id);

      // Generate AI meeting minutes
      toast.loading('Generating AI meeting minutes...');
      
      const participantNames = participants.map(p => p.display_name);
      
      const { data, error } = await supabase.functions.invoke('generate-meeting-minutes', {
        body: { 
          meetingId: id,
          transcript: transcript || 'Meeting discussion content',
          participants: participantNames
        }
      });

      if (error) throw error;

      // Save meeting minutes
      await supabase
        .from('meeting_minutes')
        .insert({
          meeting_id: id,
          summary: data.summary || 'Meeting summary',
          full_transcript: transcript,
          action_items: data.actionItems || [],
          key_topics: data.keyPoints || [],
          participant_ratings: data.participantRatings || {},
        } as any);

      toast.success('Meeting ended and minutes generated!');
      navigate('/');
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
    const link = `${window.location.origin}/meeting/${id}`;
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
        <Card className="p-8">
          <p className="text-muted-foreground">Loading meeting...</p>
        </Card>
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
        <div className="flex-1 flex flex-col items-center justify-center bg-muted/20 p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-6xl w-full">
            {participants.map((participant) => (
              <Card key={participant.id} className="aspect-video flex items-center justify-center relative">
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-primary/30 flex items-center justify-center mx-auto mb-2">
                      <span className="text-2xl font-bold text-primary">
                        {participant.display_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <p className="font-medium text-sm">{participant.display_name}</p>
                    {participant.is_host && (
                      <Badge variant="secondary" className="text-xs mt-1">Host</Badge>
                    )}
                  </div>
                </div>
                {participant.is_muted && (
                  <div className="absolute bottom-2 right-2 p-1 rounded-full bg-red-500">
                    <MicOff className="w-3 h-3 text-white" />
                  </div>
                )}
              </Card>
            ))}
          </div>
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
      <div className="border-t bg-card p-4">
        <div className="flex items-center justify-center gap-3 max-w-7xl mx-auto">
          <Button
            variant={isAudioOn ? "default" : "destructive"}
            size="lg"
            onClick={() => setIsAudioOn(!isAudioOn)}
            className="rounded-full"
          >
            {isAudioOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </Button>
          <Button
            variant={isVideoOn ? "default" : "secondary"}
            size="lg"
            onClick={() => setIsVideoOn(!isVideoOn)}
            className="rounded-full"
          >
            {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </Button>
          <Button
            variant={showChat ? "default" : "secondary"}
            size="lg"
            onClick={() => setShowChat(!showChat)}
            className="rounded-full"
          >
            <MessageSquare className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
