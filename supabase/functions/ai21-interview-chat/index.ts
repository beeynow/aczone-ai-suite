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
    const { messages, interviewId, topic, experience_level } = await req.json();
    
    const apiKey = Deno.env.get('AI21_API_KEY');
    if (!apiKey) {
      throw new Error('AI21_API_KEY not configured');
    }

    console.log('AI21 interview chat request:', { interviewId, topic, experience_level });

    const systemPrompt = `You are an expert AI interviewer conducting a professional interview about ${topic}.
The candidate has ${experience_level} experience level.
Be professional, encouraging, and ask relevant follow-up questions.
Keep responses concise and conversational for voice interaction.
Start with a warm greeting if this is the first message.`;

    // Call AI21 Jamba API
    const response = await fetch('https://api.ai21.com/studio/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'jamba-1.5-large',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI21 API error:', response.status, errorText);
      throw new Error(`AI21 API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || '';

    return new Response(
      JSON.stringify({ content: aiResponse }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('AI21 interview chat error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
