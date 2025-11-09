import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, Download, BarChart3, Award, Target, Brain } from "lucide-react";
import { toast } from "sonner";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export default function Analytics() {
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [answers, setAnswers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalInterviews: 0,
    totalAnswers: 0,
    averageScore: 0,
    totalTimeSpent: 0,
    bestCategory: '',
    improvementRate: 0
  });

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load analytics - direct query without joins
      const { data: analyticsData, error: analyticsError } = await supabase
        .from('interview_analytics')
        .select('*')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: true });

      if (analyticsError) {
        console.error('Analytics error:', analyticsError);
        throw analyticsError;
      }

      // Load answers - direct query without joins
      const { data: answersData, error: answersError } = await supabase
        .from('interview_answers')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (answersError) {
        console.error('Answers error:', answersError);
        throw answersError;
      }

      setAnalytics(analyticsData || []);
      setAnswers(answersData || []);

      // Calculate stats
      if (analyticsData && analyticsData.length > 0) {
        const totalInterviews = analyticsData.length;
        const totalAnswers = analyticsData.reduce((sum, a) => sum + (a.total_answers || 0), 0);
        const avgScore = analyticsData.reduce((sum, a) => sum + (a.average_score || 0), 0) / totalInterviews;
        const totalTime = analyticsData.reduce((sum, a) => sum + (a.time_spent_seconds || 0), 0);
        
        // Find best category
        const categoryScores: { [key: string]: number[] } = {};
        analyticsData.forEach(a => {
          if (a.category && a.average_score) {
            if (!categoryScores[a.category]) categoryScores[a.category] = [];
            categoryScores[a.category].push(a.average_score);
          }
        });
        
        let bestCat = '';
        let bestAvg = 0;
        Object.entries(categoryScores).forEach(([cat, scores]) => {
          const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
          if (avg > bestAvg) {
            bestAvg = avg;
            bestCat = cat;
          }
        });

        // Calculate improvement rate
        const recentScores = analyticsData.slice(-3).map(a => a.average_score || 0);
        const oldScores = analyticsData.slice(0, 3).map(a => a.average_score || 0);
        const recentAvg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
        const oldAvg = oldScores.reduce((a, b) => a + b, 0) / oldScores.length;
        const improvement = oldAvg > 0 ? ((recentAvg - oldAvg) / oldAvg) * 100 : 0;

        setStats({
          totalInterviews,
          totalAnswers,
          averageScore: avgScore,
          totalTimeSpent: totalTime,
          bestCategory: bestCat,
          improvementRate: improvement
        });
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = async () => {
    toast.info('PDF export feature coming soon!');
  };

  // Prepare chart data
  const scoreProgressData = analytics.map((a, idx) => ({
    session: `Session ${idx + 1}`,
    score: a.average_score || 0,
    date: new Date(a.completed_at).toLocaleDateString()
  }));

  const categoryData = analytics.reduce((acc: any[], a) => {
    const existing = acc.find(item => item.category === a.category);
    if (existing) {
      existing.count++;
      existing.avgScore = (existing.avgScore + (a.average_score || 0)) / 2;
    } else {
      acc.push({
        category: a.category || 'Other',
        count: 1,
        avgScore: a.average_score || 0
      });
    }
    return acc;
  }, []);

  const scoreDistribution = answers.reduce((acc: any[], a) => {
    const range = Math.floor((a.overall_score || 0) / 20) * 20;
    const label = `${range}-${range + 20}`;
    const existing = acc.find(item => item.range === label);
    if (existing) {
      existing.count++;
    } else {
      acc.push({ range: label, count: 1 });
    }
    return acc;
  }, []);

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Performance Analytics
            </h1>
            <p className="text-muted-foreground">
              Track your progress and improvement over time
            </p>
          </div>
          <Button onClick={exportPDF} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Interviews</p>
                <p className="text-3xl font-bold">{stats.totalInterviews}</p>
              </div>
              <BarChart3 className="w-10 h-10 text-primary opacity-20" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Average Score</p>
                <p className="text-3xl font-bold">{stats.averageScore.toFixed(1)}</p>
              </div>
              <Award className="w-10 h-10 text-primary opacity-20" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Improvement Rate</p>
                <p className="text-3xl font-bold text-green-500">
                  {stats.improvementRate > 0 ? '+' : ''}{stats.improvementRate.toFixed(1)}%
                </p>
              </div>
              <TrendingUp className="w-10 h-10 text-green-500 opacity-20" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Best Category</p>
                <p className="text-xl font-bold capitalize">{stats.bestCategory || 'N/A'}</p>
              </div>
              <Target className="w-10 h-10 text-primary opacity-20" />
            </div>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Score Progress Chart */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              Score Progress Over Time
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={scoreProgressData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="session" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={{ fill: '#8b5cf6' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Category Performance */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Performance by Category</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="avgScore" fill="#8b5cf6" name="Avg Score" />
                <Bar dataKey="count" fill="#3b82f6" name="Count" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Score Distribution */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Score Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={scoreDistribution}
                  dataKey="count"
                  nameKey="range"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {scoreDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          {/* Recent Sessions */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Sessions</h3>
            <div className="space-y-4">
              {analytics.slice(-5).reverse().map((session, idx) => (
                <div key={session.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium capitalize">{session.category || 'Interview'}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(session.completed_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge>{session.difficulty}</Badge>
                    <Badge variant={session.average_score >= 80 ? 'default' : 'secondary'}>
                      {session.average_score?.toFixed(0)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
  );
}
