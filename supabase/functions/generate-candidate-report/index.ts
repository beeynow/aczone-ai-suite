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
    const authHeader = req.headers.get('Authorization')!;
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { interviewId, candidateId } = await req.json();
    
    if (!interviewId || !candidateId) {
      throw new Error('Interview ID and candidate ID are required');
    }

    // Fetch interview data
    const { data: interview, error: interviewError } = await supabase
      .from('interviews')
      .select('*')
      .eq('id', interviewId)
      .single();

    if (interviewError) throw interviewError;

    // Fetch candidate answers
    const { data: answers, error: answersError } = await supabase
      .from('interview_answers')
      .select('*')
      .eq('interview_id', interviewId)
      .eq('user_id', candidateId);

    if (answersError) throw answersError;

    // Fetch analytics
    const { data: analytics, error: analyticsError } = await supabase
      .from('interview_analytics')
      .select('*')
      .eq('interview_id', interviewId)
      .eq('user_id', candidateId)
      .single();

    if (analyticsError && analyticsError.code !== 'PGRST116') throw analyticsError;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Generate comprehensive report using AI
    const systemPrompt = `You are an expert recruiter and talent assessor. Generate a comprehensive candidate evaluation report.

Interview Topic: ${interview.topic}
Experience Level: ${interview.experience_level}
Number of Answers: ${answers?.length || 0}
Average Score: ${analytics?.average_score || 'N/A'}

Candidate Answers and Scores:
${answers?.map((a: any, i: number) => `
Q${i + 1}: ${a.question_text}
Answer: ${a.answer_text}
Scores: Clarity ${a.clarity_score}, Grammar ${a.grammar_score}, Confidence ${a.confidence_score}, Tone ${a.tone_score}
Overall: ${a.overall_score}
Feedback: ${a.ai_feedback}
`).join('\n') || 'No answers recorded'}

Generate a comprehensive report in JSON format:
{
  "overallRating": number (0-100),
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "recommendedAction": "hire|consider|reject with explanation",
  "detailedAnalysis": {
    "communicationSkills": "detailed assessment",
    "technicalKnowledge": "detailed assessment",
    "problemSolving": "detailed assessment",
    "cultureFit": "detailed assessment",
    "growthPotential": "detailed assessment"
  },
  "summary": "executive summary of the candidate",
  "keyHighlights": ["highlight 1", "highlight 2"],
  "concernAreas": ["concern 1", "concern 2"]
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Generate comprehensive candidate evaluation report.` }
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

    let report;
    try {
      report = JSON.parse(content);
    } catch (e) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse AI response");
    }

    return new Response(
      JSON.stringify(report),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-candidate-report:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
