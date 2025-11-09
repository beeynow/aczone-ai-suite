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

    const { referralCode, newUserId } = await req.json();

    console.log("Processing referral:", { referralCode, newUserId });

    // Find the referrer
    const { data: referralData, error: referralError } = await supabase
      .from('referral_system')
      .select('*')
      .eq('referral_code', referralCode)
      .single();

    if (referralError || !referralData) {
      console.log("Referral code not found:", referralCode);
      return new Response(
        JSON.stringify({ success: false, message: "Invalid referral code" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update referral record
    await supabase
      .from('referral_system')
      .update({
        referred_user_id: newUserId,
        signup_completed: true,
        reward_points: 10
      })
      .eq('id', referralData.id);

    // Award points to referrer
    const { data: pointsData } = await supabase
      .from('user_points')
      .select('*')
      .eq('user_id', referralData.referrer_id)
      .single();

    if (pointsData) {
      await supabase
        .from('user_points')
        .update({
          total_points: pointsData.total_points + 10,
          referrals_count: pointsData.referrals_count + 1,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', referralData.referrer_id);
    } else {
      await supabase
        .from('user_points')
        .insert({
          user_id: referralData.referrer_id,
          total_points: 10,
          referrals_count: 1
        });
    }

    // Update leaderboard
    await updateLeaderboard(supabase, referralData.referrer_id);

    console.log("Referral processed successfully");

    return new Response(
      JSON.stringify({ success: true, points: 10 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error processing referral:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function updateLeaderboard(supabase: any, userId: string) {
  const { data: pointsData } = await supabase
    .from('user_points')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!pointsData) return;

  const { data: userData } = await supabase.auth.admin.getUserById(userId);
  const username = userData?.user?.email?.split('@')[0] || 'Anonymous';

  const { data: existing } = await supabase
    .from('leaderboard_entries')
    .select('*')
    .eq('user_id', userId)
    .eq('category', 'Referrals')
    .single();

  if (existing) {
    await supabase
      .from('leaderboard_entries')
      .update({
        points: pointsData.total_points,
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id);
  } else {
    await supabase
      .from('leaderboard_entries')
      .insert({
        user_id: userId,
        username,
        points: pointsData.total_points,
        category: 'Referrals'
      });
  }
}
