-- Create achievements table
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  badge_icon TEXT NOT NULL,
  category TEXT NOT NULL,
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER NOT NULL,
  points_reward INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_achievements table
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id),
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Enable RLS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Policies for achievements
CREATE POLICY "Anyone can view achievements"
  ON public.achievements
  FOR SELECT
  USING (true);

-- Policies for user_achievements
CREATE POLICY "Users can view their own achievements"
  ON public.user_achievements
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create user achievements"
  ON public.user_achievements
  FOR INSERT
  WITH CHECK (true);

-- Insert default achievements
INSERT INTO public.achievements (name, description, badge_icon, category, requirement_type, requirement_value, points_reward) VALUES
('First Interview', 'Complete your first AI interview', 'Rocket', 'interviews', 'interviews_completed', 1, 10),
('Interview Novice', 'Complete 5 interviews', 'Target', 'interviews', 'interviews_completed', 5, 25),
('Interview Pro', 'Complete 10 interviews', 'Award', 'interviews', 'interviews_completed', 10, 50),
('Interview Master', 'Complete 25 interviews', 'Trophy', 'interviews', 'interviews_completed', 25, 100),
('3 Day Streak', 'Maintain a 3-day streak', 'Flame', 'streaks', 'streak_days', 3, 15),
('Week Warrior', 'Maintain a 7-day streak', 'Zap', 'streaks', 'streak_days', 7, 35),
('Month Champion', 'Maintain a 30-day streak', 'Crown', 'streaks', 'streak_days', 30, 150),
('First Referral', 'Refer your first friend', 'Users', 'referrals', 'referrals_count', 1, 10),
('Social Butterfly', 'Refer 5 friends', 'UserPlus', 'referrals', 'referrals_count', 5, 50),
('Influencer', 'Refer 10 friends', 'Star', 'referrals', 'referrals_count', 10, 100),
('Point Collector', 'Earn 100 total points', 'Gift', 'points', 'total_points', 100, 20),
('Point Hoarder', 'Earn 500 total points', 'Gem', 'points', 'total_points', 500, 50),
('Point Legend', 'Earn 1000 total points', 'Sparkles', 'points', 'total_points', 1000, 100)
ON CONFLICT DO NOTHING;