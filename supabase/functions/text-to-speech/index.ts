import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, voice = 'en-US' } = await req.json();
    
    if (!text) {
      throw new Error('Text is required');
    }

    const apiKey = Deno.env.get('SPEECHMATICS_API_KEY');
    if (!apiKey) {
      throw new Error('SPEECHMATICS_API_KEY not configured');
    }

    console.log('TTS request for text length:', text.length);

    // Call Speechmatics TTS API
    const response = await fetch('https://api.speechmatics.com/v1/tts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text,
        voice: voice,
        audio_format: 'mp3',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Speechmatics API error:', response.status, errorText);
      throw new Error(`Speechmatics API error: ${response.status}`);
    }

    // Convert audio buffer to base64
    const arrayBuffer = await response.arrayBuffer();
    const base64Audio = btoa(
      String.fromCharCode(...new Uint8Array(arrayBuffer))
    );

    return new Response(
      JSON.stringify({ audioContent: base64Audio }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('TTS error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});