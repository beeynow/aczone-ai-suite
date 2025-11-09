import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Video, Users, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import MeetingSuccessModal from "@/components/MeetingSuccessModal";

export default function CreateMeeting() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [meetingType, setMeetingType] = useState<"instant" | "scheduled">("instant");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdMeeting, setCreatedMeeting] = useState<any>(null);
  const [scheduledDate, setScheduledDate] = useState<Date>();
  const [scheduledTime, setScheduledTime] = useState("09:00");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    max_participants: 10,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title) {
      toast.error("Please enter a meeting title");
      return;
    }

    if (meetingType === "scheduled") {
      if (!scheduledDate) {
        toast.error("Please select a date");
        return;
      }
      if (!scheduledTime) {
        toast.error("Please select a time");
        return;
      }
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("You must be logged in");
        return;
      }

      const roomId = `meeting_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const meetingId = crypto.randomUUID();
      const meetingCode = `${Math.random().toString(36).substr(2, 4).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

      // Combine date and time for scheduled meetings
      let startTime = null;
      if (meetingType === "scheduled" && scheduledDate) {
        const [hours, minutes] = scheduledTime.split(':');
        const scheduledDateTime = new Date(scheduledDate);
        scheduledDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        startTime = scheduledDateTime.toISOString();
      }

      const { error } = await (supabase as any)
        .from('meeting_sessions')
        .insert([
          {
            id: meetingId,
            title: formData.title,
            description: formData.description,
            room_id: roomId,
            meeting_code: meetingCode,
            host_id: user.id,
            max_participants: Number.isFinite(formData.max_participants) ? formData.max_participants : 10,
            start_time: startTime || new Date().toISOString(),
          },
        ]);

      if (error) throw error;

      setCreatedMeeting({
        id: meetingId,
        title: formData.title,
        code: meetingCode,
      });
      setShowSuccessModal(true);
      toast.success("Meeting created successfully!");
    } catch (error) {
      console.error('Error creating meeting:', error);
      const message = error instanceof Error ? error.message : (typeof error === 'object' ? JSON.stringify(error) : String(error));
      toast.error(`Failed to create meeting: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate('/')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-lg bg-primary/10">
              <Video className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Create Meeting Room</h1>
              <p className="text-muted-foreground">Start a live discussion with your team</p>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Meeting Type Selection */}
            <Tabs value={meetingType} onValueChange={(v) => setMeetingType(v as "instant" | "scheduled")} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="instant" className="flex items-center gap-2">
                  <Video className="w-4 h-4" />
                  Instant Meeting
                </TabsTrigger>
                <TabsTrigger value="scheduled" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Schedule Meeting
                </TabsTrigger>
              </TabsList>

              <TabsContent value="instant" className="mt-6 space-y-6">
                <div className="p-4 rounded-lg bg-muted/50 border">
                  <p className="text-sm text-muted-foreground">
                    Create and start your meeting immediately. Perfect for quick discussions and impromptu calls.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="scheduled" className="mt-6 space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Select Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !scheduledDate && "text-muted-foreground"
                          )}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {scheduledDate ? format(scheduledDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={scheduledDate}
                          onSelect={setScheduledDate}
                          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="time">Select Time *</Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="time"
                        type="time"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Common Fields */}
            <div className="space-y-2">
              <Label htmlFor="title">Meeting Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Team Standup, Project Discussion"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="What will you discuss in this meeting?"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_participants">Maximum Participants</Label>
              <Input
                id="max_participants"
                type="number"
                min="2"
                max="50"
                value={formData.max_participants}
                onChange={(e) => setFormData({ ...formData, max_participants: parseInt(e.target.value) })}
              />
              <p className="text-xs text-muted-foreground">
                <Users className="w-3 h-3 inline mr-1" />
                AI will generate meeting minutes automatically
              </p>
            </div>

            <div className="flex gap-4">
              <Button type="button" variant="outline" onClick={() => navigate('/')} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? "Creating..." : meetingType === "instant" ? "Create & Join" : "Schedule Meeting"}
              </Button>
            </div>
          </form>
        </Card>
      </div>

      {/* Success Modal */}
      {createdMeeting && (
        <MeetingSuccessModal
          open={showSuccessModal}
          onOpenChange={setShowSuccessModal}
          meetingId={createdMeeting.id}
          meetingTitle={createdMeeting.title}
          meetingCode={createdMeeting.code}
          onJoinNow={() => {
            setShowSuccessModal(false);
            navigate(`/meeting/${createdMeeting.id}`);
          }}
        />
      )}
    </>
  );
}
