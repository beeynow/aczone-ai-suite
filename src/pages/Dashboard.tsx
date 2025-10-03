import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Calendar, Users, User, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface Interview {
  id: string;
  title: string;
  type: string;
  experience_level: string;
  topic: string;
  scheduled_time: string | null;
  duration_minutes: number;
  status: string;
  created_at: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInterviews();
  }, []);

  const fetchInterviews = async () => {
    try {
      const { data, error } = await supabase
        .from('interviews')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInterviews(data || []);
    } catch (error) {
      console.error('Error fetching interviews:', error);
      toast.error('Failed to load interviews');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-500/10 text-blue-500';
      case 'in_progress': return 'bg-green-500/10 text-green-500';
      case 'completed': return 'bg-gray-500/10 text-gray-500';
      case 'cancelled': return 'bg-red-500/10 text-red-500';
      default: return 'bg-gray-500/10 text-gray-500';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Interview Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Manage and join your AI-powered interview sessions
          </p>
        </div>
        <Button onClick={() => navigate('/create-interview')} size="lg">
          <Plus className="w-4 h-4 mr-2" />
          Create Interview
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Interviews</p>
              <p className="text-2xl font-bold">{interviews.length}</p>
            </div>
            <Calendar className="w-8 h-8 text-primary" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Scheduled</p>
              <p className="text-2xl font-bold">
                {interviews.filter(i => i.status === 'scheduled').length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold">
                {interviews.filter(i => i.status === 'completed').length}
              </p>
            </div>
            <Users className="w-8 h-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">In Progress</p>
              <p className="text-2xl font-bold">
                {interviews.filter(i => i.status === 'in_progress').length}
              </p>
            </div>
            <User className="w-8 h-8 text-green-500" />
          </div>
        </Card>
      </div>

      {/* Interviews List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Your Interviews</h2>
        {loading ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">Loading interviews...</p>
          </Card>
        ) : interviews.length === 0 ? (
          <Card className="p-12 text-center">
            <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No interviews yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first AI-powered interview session
            </p>
            <Button onClick={() => navigate('/create-interview')}>
              <Plus className="w-4 h-4 mr-2" />
              Create Interview
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {interviews.map((interview) => (
              <Card key={interview.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-lg">{interview.title}</h3>
                    <Badge className={getStatusColor(interview.status)}>
                      {interview.status}
                    </Badge>
                  </div>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      {interview.type === 'group' ? (
                        <Users className="w-4 h-4" />
                      ) : (
                        <User className="w-4 h-4" />
                      )}
                      <span className="capitalize">{interview.type} Interview</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{interview.duration_minutes} minutes</span>
                    </div>
                    {interview.scheduled_time && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{format(new Date(interview.scheduled_time), 'PPp')}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Badge variant="outline">{interview.topic}</Badge>
                    <Badge variant="outline">{interview.experience_level}</Badge>
                  </div>
                  {interview.status === 'scheduled' && (
                    <Button 
                      className="w-full mt-2"
                      onClick={() => navigate(`/interview/${interview.id}`)}
                    >
                      Join Interview
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}