import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code } = await req.json();
    if (!code || typeof code !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid meeting code' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      throw new Error('Backend environment not fully configured');
    }

    // Client bound to the user's auth (for reading user identity)
    const supabaseUser = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: req.headers.get('Authorization') || '' } },
      auth: { persistSession: false }
    });

    // Admin client to bypass RLS for controlled operations
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false }
    });

    const {
      data: { user },
      error: userErr
    } = await supabaseUser.auth.getUser();

    if (userErr || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const normalized = code.trim().toUpperCase();

    // Locate an active, unlocked meeting by code
    const { data: meetings, error: meetErr } = await supabaseAdmin
      .from('meeting_sessions')
      .select('*')
      .eq('room_id', normalized)
      .is('end_time', null)
      .limit(1);

    if (meetErr || !meetings || meetings.length === 0) {
      return new Response(JSON.stringify({ error: 'Meeting not found or has ended' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const meeting = meetings[0];
    if (meeting.is_locked) {
      return new Response(JSON.stringify({ error: 'Meeting is locked' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Ensure participant exists (idempotent)
    const { data: existing } = await supabaseAdmin
      .from('meeting_participants')
      .select('id, left_at')
      .eq('meeting_id', meeting.id)
      .eq('user_id', user.id)
      .limit(1);

    if (!existing || existing.length === 0) {
      // Fetch a reasonable display name
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('full_name, email')
        .eq('user_id', user.id)
        .maybeSingle();

      await supabaseAdmin.from('meeting_participants').insert({
        meeting_id: meeting.id,
        user_id: user.id,
        display_name: profile?.full_name || profile?.email || 'Participant',
        is_host: meeting.host_id === user.id,
        is_muted: false,
        is_video_on: false,
      });
    } else {
      // If previously left, mark as active again
      if (existing[0].left_at) {
        await supabaseAdmin
          .from('meeting_participants')
          .update({ left_at: null })
          .eq('id', existing[0].id);
      }
    }

    return new Response(JSON.stringify({ meetingId: meeting.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('join-meeting-by-code error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
