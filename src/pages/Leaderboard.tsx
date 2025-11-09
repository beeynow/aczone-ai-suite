import { useState, useEffect } from "react";
import { Trophy, Medal, Award, TrendingUp, Users, Star, Target } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface LeaderboardEntry {
  id: string;
  user_id: string;
  username: string;
  points: number;
  rank: number | null;
  category: string;
}

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [userStats, setUserStats] = useState<any>(null);

  useEffect(() => {
    loadCurrentUser();
    fetchLeaderboard('Overall');
  }, []);

  const loadCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
      fetchUserStats(user.id);
    }
  };

  const fetchUserStats = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_points')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle() as any;

      if (error) throw error;
      setUserStats(data);
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const fetchLeaderboard = async (category: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('leaderboard_entries')
        .select('*')
        .eq('category', category)
        .order('points', { ascending: false })
        .limit(100) as any;

      if (error) throw error;
      
      // Add ranks
      const rankedData = ((data as any) || []).map((entry: any, index: number) => ({
        ...entry,
        rank: index + 1
      }));
      
      setEntries(rankedData);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      toast.error('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Award className="w-6 h-6 text-amber-600" />;
    return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white";
    if (rank === 2) return "bg-gradient-to-r from-gray-300 to-gray-500 text-white";
    if (rank === 3) return "bg-gradient-to-r from-amber-400 to-amber-600 text-white";
    return "bg-muted";
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold gradient-primary bg-clip-text text-transparent">
          🏆 Leaderboard
        </h1>
        <p className="text-muted-foreground">
          Compete with others and climb to the top!
        </p>
      </div>

      {/* User Stats Card */}
      {userStats && (
        <Card className="p-6 gradient-hero border-2 border-primary/20">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <Target className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{userStats.total_points}</p>
              <p className="text-sm text-muted-foreground">Total Points</p>
            </div>
            <div className="text-center">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold">{userStats.streak_days}</p>
              <p className="text-sm text-muted-foreground">Day Streak</p>
            </div>
            <div className="text-center">
              <Users className="w-8 h-8 mx-auto mb-2 text-blue-500" />
              <p className="text-2xl font-bold">{userStats.interviews_completed}</p>
              <p className="text-sm text-muted-foreground">Interviews</p>
            </div>
            <div className="text-center">
              <Star className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
              <Badge className="text-lg px-4 py-1">{userStats.level}</Badge>
              <p className="text-sm text-muted-foreground mt-1">Level</p>
            </div>
          </div>
        </Card>
      )}

      {/* Leaderboard Tabs */}
      <Tabs defaultValue="Overall" className="space-y-4" onValueChange={fetchLeaderboard}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="Overall">Overall</TabsTrigger>
          <TabsTrigger value="Referrals">Referrals</TabsTrigger>
          <TabsTrigger value="Interviews">Interviews</TabsTrigger>
        </TabsList>

        <TabsContent value="Overall" className="space-y-3">
          {loading ? (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">Loading rankings...</p>
            </Card>
          ) : entries.length === 0 ? (
            <Card className="p-12 text-center">
              <Trophy className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No rankings yet</h3>
              <p className="text-muted-foreground">
                Be the first to earn points and claim the top spot!
              </p>
            </Card>
          ) : (
            entries.map((entry) => (
              <Card
                key={entry.id}
                className={`p-4 transition-all ${
                  entry.user_id === currentUserId
                    ? 'border-2 border-primary shadow-lg'
                    : 'hover:shadow-md'
                } ${entry.rank && entry.rank <= 3 ? getRankBadge(entry.rank) : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 flex justify-center">
                      {entry.rank && getRankIcon(entry.rank)}
                    </div>
                    <div>
                      <p className={`font-semibold ${entry.rank && entry.rank <= 3 ? 'text-white' : ''}`}>
                        {entry.username}
                        {entry.user_id === currentUserId && (
                          <Badge variant="secondary" className="ml-2">You</Badge>
                        )}
                      </p>
                      <p className={`text-sm ${entry.rank && entry.rank <= 3 ? 'text-white/80' : 'text-muted-foreground'}`}>
                        Rank #{entry.rank}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-bold ${entry.rank && entry.rank <= 3 ? 'text-white' : 'text-primary'}`}>
                      {entry.points}
                    </p>
                    <p className={`text-sm ${entry.rank && entry.rank <= 3 ? 'text-white/80' : 'text-muted-foreground'}`}>
                      points
                    </p>
                  </div>
                </div>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="Referrals">
          <p className="text-center text-muted-foreground py-8">
            Referral leaderboard - invite friends to earn points!
          </p>
        </TabsContent>

        <TabsContent value="Interviews">
          <p className="text-center text-muted-foreground py-8">
            Interview completion leaderboard coming soon!
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
