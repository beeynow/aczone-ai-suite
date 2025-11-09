import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function JoinMeetingByCode() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const joinMeeting = async () => {
      if (!code) {
        setError("No meeting code provided");
        return;
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast.error("Please sign in to join a meeting");
          navigate('/auth', { state: { returnTo: `/join-meeting/${code}` } });
          return;
        }

        // Find meeting by room_id
        const { data: meetings, error: meetingError } = await supabase
          .from("meeting_sessions")
          .select("*")
          .eq("room_id", code.toUpperCase())
          .is("end_time", null);

        if (meetingError || !meetings || meetings.length === 0) {
          setError("Meeting not found or has ended");
          toast.error("Meeting not found. Please check the code.");
          setTimeout(() => navigate('/'), 2000);
          return;
        }

        const meeting = meetings[0];

        // Check if meeting is locked
        if (meeting.is_locked) {
          setError("This meeting is locked");
          toast.error("This meeting is locked");
          setTimeout(() => navigate('/'), 2000);
          return;
        }

        // Redirect to meeting room
        navigate(`/meeting/${meeting.id}`);
      } catch (error) {
        console.error("Error joining meeting:", error);
        setError("Failed to join meeting");
        toast.error("Failed to join meeting");
        setTimeout(() => navigate('/'), 2000);
      }
    };

    joinMeeting();
  }, [code, navigate]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-destructive text-lg">{error}</p>
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <LoadingSpinner size="lg" />
      <p className="text-muted-foreground">Joining meeting...</p>
    </div>
  );
}
