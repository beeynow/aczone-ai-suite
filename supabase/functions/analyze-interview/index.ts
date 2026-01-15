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
    const { messages, topic, experienceLevel } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Analyzing interview performance');

    const analysisPrompt = `Analyze this interview conversation and provide a comprehensive performance evaluation.

Topic: ${topic}
Experience Level: ${experienceLevel}

Conversation:
${messages.map((m: any) => `${m.role === 'user' ? 'Candidate' : 'Rufaida'}: ${m.content}`).join('\n\n')}

Provide a JSON response with:
{
  "performance_score": <number 1-10>,
  "strengths": [<array of 3-5 specific strengths demonstrated by the candidate>],
  "areas_to_improve": [<array of 3-5 specific areas where the candidate needs improvement>],
  "key_concepts": [<array of 3-5 essential concepts that the candidate must master for ${topic}>],
  "detailed_analysis": "<2-3 paragraph detailed analysis: 1) Overall performance assessment, 2) Learning progress and understanding depth, 3) Specific actionable recommendations for improvement>"
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are Rufaida, an expert AI coaching evaluator with deep knowledge of learning psychology and professional development. Provide constructive, encouraging, and highly actionable feedback in JSON format that helps learners understand exactly what they did well and what they need to focus on next." },
          { role: "user", content: analysisPrompt }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const analysis = JSON.parse(data.choices[0].message.content);

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error('Interview analysis error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
