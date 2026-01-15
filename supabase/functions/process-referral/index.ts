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

    if (!referralCode || !newUserId) {
      return new Response(
        JSON.stringify({ error: 'Missing referralCode or newUserId' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Find the referrer
    const { data: referralData, error: referralError } = await supabase
      .from('referral_system')
      .select('*')
      .eq('referral_code', referralCode)
      .eq('signup_completed', false)
      .single();

    if (referralError || !referralData) {
      console.log("Referral code not found or already used:", referralCode);
      return new Response(
        JSON.stringify({ error: "Invalid or already used referral code" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Prevent self-referral
    if (referralData.referrer_id === newUserId) {
      return new Response(
        JSON.stringify({ error: 'Cannot refer yourself' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
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

    // Award 10 points to referrer
    const { data: referrerPoints } = await supabase
      .from('user_points')
      .select('*')
      .eq('user_id', referralData.referrer_id)
      .single();

    if (referrerPoints) {
      await supabase
        .from('user_points')
        .update({
          total_points: referrerPoints.total_points + 10,
          referrals_count: referrerPoints.referrals_count + 1,
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

    // Award 10 points to new user
    const { data: newUserPoints } = await supabase
      .from('user_points')
      .select('*')
      .eq('user_id', newUserId)
      .single();

    if (newUserPoints) {
      await supabase
        .from('user_points')
        .update({
          total_points: newUserPoints.total_points + 10,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', newUserId);
    } else {
      await supabase
        .from('user_points')
        .insert({
          user_id: newUserId,
          total_points: 10
        });
    }

    // Update leaderboard for both users
    await updateLeaderboard(supabase, referralData.referrer_id);
    await updateLeaderboard(supabase, newUserId);

    // Create notification for referrer
    const { data: newUserProfile } = await supabase
      .from('profiles')
      .select('username')
      .eq('user_id', newUserId)
      .single();

    await supabase
      .from('notifications')
      .insert({
        user_id: referralData.referrer_id,
        title: 'Referral Reward',
        message: `${newUserProfile?.username || 'A new user'} joined using your referral code! You earned 10 points.`,
        type: 'reward'
      });

    console.log("Referral processed successfully - both users earned 10 points");

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Referral processed successfully! Both you and your referrer earned 10 points.',
        points: 10 
      }),
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
