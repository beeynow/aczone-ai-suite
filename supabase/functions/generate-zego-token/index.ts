import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createHmac } from "https://deno.land/std@0.160.0/node/crypto.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, roomId } = await req.json();
    const appId = Deno.env.get('ZEGOCLOUD_APP_ID');
    const serverSecret = Deno.env.get('ZEGOCLOUD_SERVER_SECRET');
    
    if (!appId || !serverSecret) {
      throw new Error('ZegoCloud credentials not configured');
    }

    console.log('Generating ZegoCloud token for:', { userId, roomId });

    const time = Math.floor(Date.now() / 1000);
    const nonce = Math.floor(Math.random() * 999999);
    const payload = {
      app_id: parseInt(appId),
      user_id: userId,
      room_id: roomId,
      privilege: {
        1: 1, // Login
        2: 1  // Publish stream
      },
      stream_id_list: null,
      nonce: nonce,
      create_time: time,
      expire_time: time + 7200 // 2 hours
    };

    const payloadStr = JSON.stringify(payload);
    const payloadBase64 = btoa(payloadStr);
    
    const hmac = createHmac("sha256", serverSecret);
    hmac.update(payloadBase64);
    const signature = hmac.digest("hex");

    const token = `04${payloadBase64}.${signature}`;

    return new Response(
      JSON.stringify({ token, appId: parseInt(appId) }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('ZegoCloud token generation error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});