import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Video,
  Users,
  Brain,
  TrendingUp,
  Target,
  Flame,
  Trophy,
  Award,
  Calendar,
  Clock
} from "lucide-react";
import { toast } from "sonner";
import JoinMeetingDialog from "@/components/JoinMeetingDialog";
import { ProgressCard } from "@/components/ProgressCard";

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
  const [userStats, setUserStats] = useState<any>(null);
  const [recentAchievements, setRecentAchievements] = useState<any[]>([]);

  useEffect(() => {
    fetchInterviews();
    fetchCertificateCount();
    fetchUserStats();
    fetchRecentAchievements();
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

  const fetchUserStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await (supabase as any)
        .from('user_points')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setUserStats(data);
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const fetchRecentAchievements = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await (supabase as any)
        .from('user_achievements')
        .select(`
          *,
          achievements:achievement_id (
            name,
            description,
            badge_icon
          )
        `)
        .eq('user_id', user.id)
        .order('unlocked_at', { ascending: false })
        .limit(3);

      if (error) throw error;
      setRecentAchievements(data || []);
    } catch (error) {
      console.error('Error fetching achievements:', error);
    }
  };

  const getLevelProgress = () => {
    if (!userStats) return { current: 0, next: 200, percentage: 0 };
    const points = userStats.total_points;
    if (points < 200) return { current: points, next: 200, percentage: (points / 200) * 100 };
    if (points < 500) return { current: points - 200, next: 300, percentage: ((points - 200) / 300) * 100 };
    return { current: points - 500, next: 1000, percentage: ((points - 500) / 500) * 100 };
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

    return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
          Welcome Back!
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Your AI-powered interview platform
        </p>
        {userStats && (
          <div className="flex items-center justify-center gap-3">
            <Badge variant="default" className="text-lg px-4 py-2">
              {userStats.level}
            </Badge>
            <Badge variant="outline" className="text-lg px-4 py-2">
              {userStats.total_points} Points
            </Badge>
            <Badge variant="outline" className="text-lg px-4 py-2">
              <Flame className="w-4 h-4 mr-1" />
              {userStats.streak_days} Day Streak
            </Badge>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Quick Actions */}
        <Card className="lg:col-span-2 p-6 bg-gradient-to-br from-primary/5 to-primary/10">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              size="lg"
              className="h-auto py-8 flex-col gap-3 bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
              onClick={() => navigate('/create-interview')}
            >
              <Video className="w-10 h-10" />
              <div className="text-center">
                <div className="text-lg font-semibold">Start AI Interview</div>
                <div className="text-sm opacity-90 font-normal">Practice with AI</div>
              </div>
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="h-auto py-8 flex-col gap-3 border-2"
              onClick={() => navigate('/create-meeting')}
            >
              <Users className="w-10 h-10" />
              <div className="text-center">
                <div className="text-lg font-semibold">Create Meeting</div>
                <div className="text-sm text-muted-foreground">Host conference</div>
              </div>
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="h-auto py-8 flex-col gap-3 border-2"
              onClick={() => navigate('/question-bank')}
            >
              <Brain className="w-10 h-10" />
              <div className="text-center">
                <div className="text-lg font-semibold">Question Bank</div>
                <div className="text-sm text-muted-foreground">AI questions</div>
              </div>
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="h-auto py-8 flex-col gap-3 border-2"
              onClick={() => navigate('/analytics')}
            >
              <TrendingUp className="w-10 h-10" />
              <div className="text-center">
                <div className="text-lg font-semibold">Analytics</div>
                <div className="text-sm text-muted-foreground">View stats</div>
              </div>
            </Button>
          </div>
          
          <div className="mt-6">
            <JoinMeetingDialog />
          </div>
        </Card>

        {/* Quick Stats */}
        <div className="space-y-4">
          <Card className="p-6 cursor-pointer hover:shadow-lg transition-shadow bg-gradient-to-br from-yellow-500/10 to-yellow-500/5" onClick={() => navigate('/certificates')}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Certificates</p>
                <p className="text-4xl font-bold">{certificateCount}</p>
              </div>
              <Award className="w-12 h-12 text-yellow-500" />
            </div>
          </Card>
          
          <Card className="p-6 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/achievements')}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Achievements</p>
                <p className="text-4xl font-bold">{recentAchievements.length}</p>
              </div>
              <Trophy className="w-12 h-12 text-primary" />
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Interviews</p>
                <p className="text-4xl font-bold">{interviews.length}</p>
              </div>
              <Calendar className="w-12 h-12 text-blue-500" />
            </div>
          </Card>
        </div>
      </div>

      {/* Progress Section */}
      {userStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <ProgressCard
            title="Next Level"
            current={getLevelProgress().current}
            goal={getLevelProgress().next}
            icon={Target}
            color="text-primary"
          />
          <ProgressCard
            title="Current Streak"
            current={userStats.streak_days}
            goal={30}
            icon={Flame}
            color="text-orange-500"
          />
          <ProgressCard
            title="Interviews"
            current={userStats.interviews_completed}
            goal={25}
            icon={Video}
            color="text-blue-500"
          />
          <ProgressCard
            title="Total Progress"
            current={userStats.total_points}
            goal={1000}
            icon={TrendingUp}
            color="text-green-500"
          />
        </div>
      )}

      {/* Recent Achievements */}
      {recentAchievements.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              Recent Achievements
            </h2>
            <Button variant="ghost" onClick={() => navigate('/achievements')}>
              View All
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {recentAchievements.map((achievement: any) => (
              <div
                key={achievement.id}
                className="p-3 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/30 rounded-lg"
              >
                <p className="font-semibold text-sm">{achievement.achievements.name}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(achievement.unlocked_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

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
            <Clock className="w-8 h-8 text-green-500" />
          </div>
        </Card>
      </div>

      {/* Interviews List - Simplified */}
      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Calendar className="w-6 h-6 text-primary" />
          Your Interviews
        </h2>
        {loading ? (
          <div className="p-12 text-center">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        ) : interviews.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No interviews yet</h3>
            <p className="text-muted-foreground mb-4">Create your first AI interview</p>
            <Button onClick={() => navigate('/create-interview')}>
              Create Interview
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {interviews.slice(0, 6).map((interview) => (
              <Card key={interview.id} className="p-4 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/interview/${interview.id}`)}>
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-sm">{interview.title}</h3>
                    <Badge className="text-xs" variant={interview.status === 'completed' ? 'secondary' : 'default'}>
                      {interview.status}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      <span>{interview.duration_minutes} min</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Badge variant="outline" className="text-xs">{interview.topic}</Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
        {interviews.length > 6 && (
          <div className="mt-4 text-center">
            <Button variant="outline" onClick={() => navigate('/analytics')}>
              View All Interviews
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}