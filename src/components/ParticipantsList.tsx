import { useEffect, useState } from "react";
import { Users, User, Bot } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Participant {
  id: string;
  user_id: string;
  user_name: string;
  is_active: boolean;
  last_seen: string;
}

interface ParticipantsListProps {
  interviewId: string;
  currentUserId: string;
}

export default function ParticipantsList({ interviewId, currentUserId }: ParticipantsListProps) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    loadUserName();
    loadParticipants();
    subscribeToParticipants();
    addCurrentUserPresence();

    // Update heartbeat every 30 seconds
    const heartbeat = setInterval(() => {
      updatePresence();
    }, 30000);

    return () => {
      clearInterval(heartbeat);
      removePresence();
    };
  }, [interviewId, currentUserId]);

  const loadUserName = async () => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('user_id', currentUserId)
      .single();
    
    if (profile?.full_name) {
      setUserName(profile.full_name);
    } else {
      setUserName('User');
    }
  };

  const loadParticipants = async () => {
    const { data, error } = await supabase
      .from('interview_participants_realtime')
      .select('*')
      .eq('interview_id', interviewId)
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading participants:', error);
      return;
    }

    setParticipants(data || []);
  };

  const subscribeToParticipants = () => {
    const channel = supabase
      .channel(`interview-${interviewId}-participants`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'interview_participants_realtime',
          filter: `interview_id=eq.${interviewId}`
        },
        (payload) => {
          console.log('Participant change:', payload);
          loadParticipants();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const addCurrentUserPresence = async () => {
    if (!userName) return;

    const { error } = await supabase
      .from('interview_participants_realtime')
      .upsert({
        interview_id: interviewId,
        user_id: currentUserId,
        user_name: userName,
        is_active: true,
        last_seen: new Date().toISOString()
      }, {
        onConflict: 'interview_id,user_id'
      });

    if (error) {
      console.error('Error adding presence:', error);
    }
  };

  const updatePresence = async () => {
    const { error } = await supabase
      .from('interview_participants_realtime')
      .update({ 
        last_seen: new Date().toISOString(),
        is_active: true
      })
      .eq('interview_id', interviewId)
      .eq('user_id', currentUserId);

    if (error) {
      console.error('Error updating presence:', error);
    }
  };

  const removePresence = async () => {
    const { error } = await supabase
      .from('interview_participants_realtime')
      .update({ is_active: false })
      .eq('interview_id', interviewId)
      .eq('user_id', currentUserId);

    if (error) {
      console.error('Error removing presence:', error);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">Participants</h3>
        <Badge variant="secondary" className="ml-auto">
          {participants.length + 1}
        </Badge>
      </div>

      <div className="space-y-2">
        {/* AI Interviewer */}
        <div className="flex items-center gap-3 p-2 rounded-lg bg-primary/5">
          <Avatar className="w-8 h-8 bg-primary/20">
            <AvatarFallback>
              <Bot className="w-4 h-4 text-primary" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="text-sm font-medium">Rufaida AI</p>
            <p className="text-xs text-muted-foreground">AI Coach</p>
          </div>
          <Badge variant="default" className="text-xs">Active</Badge>
        </div>

        {/* Participants */}
        {participants.map((participant) => (
          <div
            key={participant.id}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <Avatar className="w-8 h-8 bg-muted">
              <AvatarFallback>
                {getInitials(participant.user_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-sm font-medium">
                {participant.user_name}
                {participant.user_id === currentUserId && (
                  <span className="text-xs text-muted-foreground ml-1">(You)</span>
                )}
              </p>
              <p className="text-xs text-muted-foreground">Participant</p>
            </div>
            {participant.is_active && (
              <div className="w-2 h-2 rounded-full bg-green-500" />
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
