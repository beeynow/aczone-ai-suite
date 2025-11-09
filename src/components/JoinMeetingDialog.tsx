import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Video, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function JoinMeetingDialog() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [loading, setLoading] = useState(false);

  const joinMeeting = async () => {
    if (!roomId.trim()) {
      toast.error("Please enter a meeting ID");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to join a meeting");
        setLoading(false);
        return;
      }

      // Join via secure backend function
      const { data, error: fnError } = await supabase.functions.invoke('join-meeting-by-code', {
        body: { code: roomId.trim().toUpperCase() }
      });

      if (fnError || !data?.meetingId) {
        toast.error("Meeting not found or has ended.");
        setLoading(false);
        return;
      }

      navigate(`/meeting/${data.meetingId}`);
      setOpen(false);
    } catch (error) {
      console.error("Error joining meeting:", error);
      toast.error("Failed to join meeting");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="lg">
          <Video className="w-5 h-5 mr-2" />
          Join Meeting
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Join a Meeting</DialogTitle>
          <DialogDescription>
            Enter the meeting ID to join an existing meeting
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="meeting-id">Meeting Code</Label>
            <Input
              id="meeting-id"
              placeholder="Enter meeting code (e.g., ABC123)..."
              value={roomId}
              onChange={(e) => setRoomId(e.target.value.toUpperCase())}
              onKeyPress={(e) => e.key === "Enter" && joinMeeting()}
              className="uppercase font-mono tracking-wider"
            />
          </div>
          <Button
            onClick={joinMeeting}
            disabled={loading || !roomId.trim()}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Joining...
              </>
            ) : (
              <>
                <Video className="w-4 h-4 mr-2" />
                Join Meeting
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
