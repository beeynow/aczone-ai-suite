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
  joined_at?: string;
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
    try {
      // Get all participants who have joined the interview
      const { data: joinedParticipants, error: joinError } = await supabase
        .from('interview_participants')
        .select('user_id, joined_at')
        .eq('interview_id', interviewId);

      if (joinError) {
        console.error('Error loading joined participants:', joinError);
        return;
      }

      // Get real-time presence status
      const { data: presenceData, error: presenceError } = await supabase
        .from('interview_participants_realtime')
        .select('*')
        .eq('interview_id', interviewId);

      if (presenceError) {
        console.error('Error loading presence:', presenceError);
      }

      // Get profile names for all participants
      const userIds = joinedParticipants?.map(p => p.user_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);

      // Combine the data
      const participantsMap = new Map();
      
      // Add all joined participants
      joinedParticipants?.forEach(jp => {
        const profile = profiles?.find(p => p.user_id === jp.user_id);
        const presence = presenceData?.find(p => p.user_id === jp.user_id);
        
        participantsMap.set(jp.user_id, {
          id: jp.user_id,
          user_id: jp.user_id,
          user_name: profile?.full_name || 'User',
          is_active: presence?.is_active || false,
          last_seen: presence?.last_seen || jp.joined_at,
          joined_at: jp.joined_at
        });
      });

      setParticipants(Array.from(participantsMap.values()));
    } catch (error) {
      console.error('Error loading participants:', error);
    }
  };

  const subscribeToParticipants = () => {
    // Subscribe to both tables for real-time updates
    const channel1 = supabase
      .channel(`interview-${interviewId}-participants`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'interview_participants',
          filter: `interview_id=eq.${interviewId}`
        },
        (payload) => {
          console.log('Participant joined:', payload);
          loadParticipants();
        }
      )
      .subscribe();

    const channel2 = supabase
      .channel(`interview-${interviewId}-presence`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'interview_participants_realtime',
          filter: `interview_id=eq.${interviewId}`
        },
        (payload) => {
          console.log('Presence change:', payload);
          loadParticipants();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel1);
      supabase.removeChannel(channel2);
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
          {participants.length + 1} {/* +1 for AI */}
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
