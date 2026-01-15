import { useState, useEffect } from "react";
import { Trophy, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AchievementBadge } from "@/components/AchievementBadge";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Achievements() {
  const [loading, setLoading] = useState(true);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [userAchievements, setUserAchievements] = useState<Set<string>>(new Set());
  const [userAchievementData, setUserAchievementData] = useState<Map<string, any>>(new Map());

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get all achievements
      const { data: allAchievements, error: achievementsError } = await (supabase as any)
        .from('achievements')
        .select('*')
        .order('category', { ascending: true });

      if (achievementsError) throw achievementsError;

      // Get user's unlocked achievements
      const { data: unlockedAchievements, error: userAchievementsError } = await (supabase as any)
        .from('user_achievements')
        .select('achievement_id, unlocked_at')
        .eq('user_id', user.id);

      if (userAchievementsError) throw userAchievementsError;

      const unlockedSet = new Set<string>(unlockedAchievements?.map((ua: any) => ua.achievement_id as string) || []);
      const unlockedMap = new Map<string, any>(
        unlockedAchievements?.map((ua: any) => [ua.achievement_id as string, ua]) || []
      );

      setAchievements(allAchievements || []);
      setUserAchievements(unlockedSet);
      setUserAchievementData(unlockedMap);
    } catch (error) {
      console.error('Error loading achievements:', error);
      toast.error('Failed to load achievements');
    } finally {
      setLoading(false);
    }
  };

  const categorizeAchievements = (category: string) => {
    return achievements.filter(a => a.category === category);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const categories = ['interviews', 'streaks', 'referrals', 'points'];
  const unlockedCount = userAchievements.size;
  const totalCount = achievements.length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold gradient-primary bg-clip-text text-transparent">
          <Trophy className="inline w-10 h-10 mb-2 mr-2" />
          Achievements
        </h1>
        <p className="text-muted-foreground">
          Unlock badges by completing challenges and reaching milestones
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mt-4">
          <span className="text-2xl font-bold text-primary">{unlockedCount}</span>
          <span className="text-muted-foreground">/ {totalCount} Unlocked</span>
        </div>
      </div>

      {/* Achievements Grid */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="interviews">Interviews</TabsTrigger>
          <TabsTrigger value="streaks">Streaks</TabsTrigger>
          <TabsTrigger value="referrals">Referrals</TabsTrigger>
          <TabsTrigger value="points">Points</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {achievements.map((achievement) => (
              <AchievementBadge
                key={achievement.id}
                name={achievement.name}
                description={achievement.description}
                icon={achievement.badge_icon}
                unlocked={userAchievements.has(achievement.id)}
                unlockedAt={userAchievementData.get(achievement.id)?.unlocked_at}
              />
            ))}
          </div>
        </TabsContent>

        {categories.map((category) => (
          <TabsContent key={category} value={category} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categorizeAchievements(category).map((achievement) => (
                <AchievementBadge
                  key={achievement.id}
                  name={achievement.name}
                  description={achievement.description}
                  icon={achievement.badge_icon}
                  unlocked={userAchievements.has(achievement.id)}
                  unlockedAt={userAchievementData.get(achievement.id)?.unlocked_at}
                />
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
