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

    const { userId } = await req.json();

    console.log("Checking achievements for user:", userId);

    // Get user stats
    const { data: userPoints } = await supabase
      .from('user_points')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!userPoints) {
      return new Response(
        JSON.stringify({ success: true, newAchievements: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get all achievements
    const { data: allAchievements } = await supabase
      .from('achievements')
      .select('*');

    // Get user's existing achievements
    const { data: userAchievements } = await supabase
      .from('user_achievements')
      .select('achievement_id')
      .eq('user_id', userId);

    const earnedAchievementIds = new Set(
      userAchievements?.map((ua: any) => ua.achievement_id) || []
    );

    // Check which achievements user qualifies for
    const newAchievements = [];
    for (const achievement of allAchievements || []) {
      if (earnedAchievementIds.has(achievement.id)) continue;

      let qualifies = false;
      const value = userPoints[achievement.requirement_type] || 0;

      if (value >= achievement.requirement_value) {
        qualifies = true;
      }

      if (qualifies) {
        // Award achievement
        await supabase
          .from('user_achievements')
          .insert({
            user_id: userId,
            achievement_id: achievement.id
          });

        newAchievements.push(achievement);
        console.log(`Awarded achievement: ${achievement.name} to user ${userId}`);
      }
    }

    return new Response(
      JSON.stringify({ success: true, newAchievements }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error checking achievements:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
