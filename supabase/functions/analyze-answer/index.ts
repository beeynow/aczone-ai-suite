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
    const { answerText, questionText, expectedKeywords, language = 'en' } = await req.json();
    
    if (!answerText || !questionText) {
      throw new Error('Answer text and question text are required');
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are an expert interview answer evaluator. Analyze the candidate's answer and provide detailed scoring and feedback.

Score the answer on these dimensions (0-100):
1. **Clarity**: How clear and understandable is the answer?
2. **Grammar**: Quality of grammar, spelling, and sentence structure
3. **Confidence**: Does the answer show confidence and conviction?
4. **Tone**: Professional, appropriate tone for an interview
5. **Overall**: Overall quality of the answer

Also provide:
- Constructive feedback on what was good and what could be improved
- Specific suggestions for improvement
- Whether the answer addressed the question effectively

Language: ${language}

Question: ${questionText}
${expectedKeywords ? `Expected keywords: ${expectedKeywords.join(', ')}` : ''}

Answer: ${answerText}

Respond in JSON format:
{
  "clarityScore": number,
  "grammarScore": number,
  "confidenceScore": number,
  "toneScore": number,
  "overallScore": number,
  "feedback": "detailed feedback text",
  "strengths": ["strength 1", "strength 2"],
  "improvements": ["improvement 1", "improvement 2"],
  "addressedQuestion": boolean
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analyze this answer and provide scores.` }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse the JSON response
    let analysis;
    try {
      analysis = JSON.parse(content);
    } catch (e) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse AI response");
    }

    return new Response(
      JSON.stringify(analysis),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-answer:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
