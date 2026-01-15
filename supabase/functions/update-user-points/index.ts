import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { userId, pointsToAdd, reason } = await req.json();

    console.log("Updating user points:", { userId, pointsToAdd, reason });

    // Get current points
    const { data: pointsData } = await supabase
      .from('user_points')
      .select('*')
      .eq('user_id', userId)
      .single();

    const today = new Date().toISOString().split('T')[0];
    let streakDays = pointsData?.streak_days || 0;
    let interviewsCompleted = pointsData?.interviews_completed || 0;

    // Update streak
    if (reason === 'interview_completed') {
      interviewsCompleted += 1;
      const lastActivity = pointsData?.last_activity_date;
      
      if (lastActivity) {
        const lastDate = new Date(lastActivity);
        const todayDate = new Date(today);
        const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          streakDays += 1; // Consecutive day
        } else if (diffDays > 1) {
          streakDays = 1; // Streak broken, restart
        }
      } else {
        streakDays = 1; // First activity
      }
    }

    // Calculate level
    const totalPoints = (pointsData?.total_points || 0) + pointsToAdd;
    let level = 'Beginner';
    if (totalPoints >= 500) level = 'Pro';
    else if (totalPoints >= 200) level = 'Expert';

    // Upsert user points
    if (pointsData) {
      await supabase
        .from('user_points')
        .update({
          total_points: totalPoints,
          streak_days: streakDays,
          interviews_completed: interviewsCompleted,
          last_activity_date: today,
          level,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
    } else {
      await supabase
        .from('user_points')
        .insert({
          user_id: userId,
          total_points: pointsToAdd,
          streak_days: 1,
          interviews_completed: reason === 'interview_completed' ? 1 : 0,
          last_activity_date: today,
          level
        });
    }

    // Update user streak table
    await supabase
      .from('user_streaks')
      .upsert({
        user_id: userId,
        current_streak: streakDays,
        longest_streak: Math.max(streakDays, pointsData?.streak_days || 0),
        last_activity_date: today,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    // Update leaderboard
    const { data: userData } = await supabase.auth.admin.getUserById(userId);
    const username = userData?.user?.email?.split('@')[0] || 'Anonymous';

    await supabase
      .from('leaderboard_entries')
      .upsert({
        user_id: userId,
        username,
        points: totalPoints,
        category: 'Overall',
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,category' });

    console.log("User points updated successfully");

    // Check for new achievements
    try {
      await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/check-achievements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
        },
        body: JSON.stringify({ userId })
      });
    } catch (error) {
      console.error("Error checking achievements:", error);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        totalPoints, 
        streakDays, 
        level 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error updating user points:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
