import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Calendar, Users, User, Clock, Award, Share2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import ShareInterviewModal from "@/components/ShareInterviewModal";

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
  joining_code: string | null;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [certificateCount, setCertificateCount] = useState(0);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);

  useEffect(() => {
    fetchInterviews();
    fetchCertificateCount();
  }, []);

  const fetchInterviews = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Get interviews where user is creator
      const { data: createdInterviews, error: createdError } = await supabase
        .from('interviews')
        .select('*')
        .eq('creator_id', user.id);

      if (createdError) throw createdError;

      // Get interviews where user is a participant
      const { data: participantInterviews, error: participantError } = await supabase
        .from('interview_participants')
        .select('interview_id')
        .eq('user_id', user.id);

      if (participantError) throw participantError;

      const participantInterviewIds = participantInterviews?.map(p => p.interview_id) || [];
      
      let joinedInterviews: any[] = [];
      if (participantInterviewIds.length > 0) {
        const { data, error } = await supabase
          .from('interviews')
          .select('*')
          .in('id', participantInterviewIds);
        
        if (error) throw error;
        joinedInterviews = data || [];
      }

      // Combine and deduplicate
      const allInterviews = [...(createdInterviews || []), ...joinedInterviews];
      const uniqueInterviews = Array.from(
        new Map(allInterviews.map(i => [i.id, i])).values()
      ).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setInterviews(uniqueInterviews);
    } catch (error) {
      console.error('Error fetching interviews:', error);
      toast.error('Failed to load interviews');
    } finally {
      setLoading(false);
    }
  };

  const fetchCertificateCount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { count, error } = await supabase
        .from('certificates')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (error) throw error;
      setCertificateCount(count || 0);
    } catch (error) {
      console.error('Error fetching certificate count:', error);
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

  const copyJoiningCode = async (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Joining code copied!");
    } catch (error) {
      toast.error("Failed to copy code");
    }
  };

  const openShareModal = (interview: Interview, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedInterview(interview);
    setShareModalOpen(true);
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
        <Card className="p-4 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/certificates')}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Certificates Earned</p>
              <p className="text-2xl font-bold">{certificateCount}</p>
            </div>
            <Award className="w-8 h-8 text-yellow-500" />
          </div>
        </Card>
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
                  
                  {interview.type === 'group' && interview.joining_code && (
                    <div className="mt-3 p-2 bg-muted rounded-lg">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-xs text-muted-foreground">Joining Code</p>
                          <p className="font-mono font-bold text-sm">{interview.joining_code}</p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={(e) => copyJoiningCode(interview.joining_code!, e)}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={(e) => openShareModal(interview, e)}
                          >
                            <Share2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  
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
      
      {selectedInterview && (
        <ShareInterviewModal
          open={shareModalOpen}
          onOpenChange={setShareModalOpen}
          joiningCode={selectedInterview.joining_code || ''}
          interviewTitle={selectedInterview.title}
        />
      )}
    </div>
  );
}