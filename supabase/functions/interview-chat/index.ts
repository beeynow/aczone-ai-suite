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
    const { messages, interviewId, topic, experience_level, userName, learningGoals, currentKnowledge, challenges, preferredStyle } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Interview chat request:', { interviewId, topic, experience_level, userName });

    const systemPrompt = `You are Beeynow, a friendly and expert AI interview coach. Your name is Beeynow.

Candidate: ${userName || 'Candidate'}
Topic: ${topic}
Experience Level: ${experience_level}
Learning Goals: ${learningGoals || 'Not specified'}
Current Knowledge: ${currentKnowledge || 'Not specified'}
Challenges: ${challenges || 'Not specified'}
Preferred Style: ${preferredStyle || 'balanced'}

Your approach:
- Address the candidate by name (${userName || 'friend'}) naturally in conversation
- Start with a warm introduction ONLY at the very beginning of the interview
- If this is a continuing conversation (messages exist), DO NOT repeat introductions - continue naturally
- Ask one clear, meaningful question at a time based on their goals, knowledge level, and preferred style
- Use simple, easy-to-understand language appropriate for ${preferredStyle} learning
- After each answer, provide:
  1. Address them by name and give positive acknowledgment
  2. One specific, constructive feedback point
  3. A helpful tip or insight tailored to their learning goals
  4. Then ask the next relevant question building on previous topics
- Focus on their stated challenges: ${challenges || 'general improvement'}
- Be encouraging, supportive, and professional
- Keep responses conversational and concise (2-4 sentences)
- Make every question meaningful and connected to their learning journey

Remember: You're ${userName}'s supportive coach helping them achieve their goals. Build on the conversation naturally.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error('Interview chat error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});