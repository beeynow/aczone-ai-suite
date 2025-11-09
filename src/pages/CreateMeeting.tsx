import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Video, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function CreateMeeting() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
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

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("You must be logged in");
        return;
      }

      const roomId = `meeting_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const { data, error } = await (supabase as any)
        .from('meeting_sessions')
        .insert([
          {
            title: formData.title,
            description: formData.description,
            room_id: roomId,
            host_id: user.id,
            max_participants: formData.max_participants,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      toast.success("Meeting created successfully!");
      navigate(`/meeting/${data.id}`);
    } catch (error) {
      console.error('Error creating meeting:', error);
      toast.error("Failed to create meeting");
    } finally {
      setLoading(false);
    }
  };

  return (
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
              {loading ? "Creating..." : "Create Meeting"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
