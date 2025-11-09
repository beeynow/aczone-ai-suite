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
    const { resumeText, language = 'en' } = await req.json();
    
    if (!resumeText) {
      throw new Error('Resume text is required');
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are an expert career counselor, ATS specialist, and resume analyst. Analyze the provided resume comprehensively.

Analyze the resume on these dimensions (0-100):
1. **Clarity**: How clear and well-organized is the resume?
2. **Structure**: Quality of formatting, sections, and layout
3. **Relevance**: How relevant are the skills and experiences?
4. **ATS Score**: How well will this resume perform with Applicant Tracking Systems?
5. **Impact**: How impactful are the achievements and descriptions?

Also provide:
- Suggested job roles that match the candidate's profile (array of 5-7 roles)
- Improved version of the resume text with better wording and structure
- Detailed analysis of strengths and weaknesses
- Actionable recommendations for improvement
- Missing keywords for target roles
- ATS optimization tips
- Industry-specific insights

Language: ${language}

Resume:
${resumeText}

Respond in JSON format:
{
  "clarityRating": number,
  "structureRating": number,
  "relevanceRating": number,
  "atsScore": number,
  "impactScore": number,
  "overallScore": number,
  "suggestedRoles": ["role1", "role2", "role3", "role4", "role5"],
  "improvedText": "improved resume text",
  "analysis": {
    "strengths": ["strength 1", "strength 2", "strength 3"],
    "weaknesses": ["weakness 1", "weakness 2", "weakness 3"],
    "recommendations": ["rec 1", "rec 2", "rec 3", "rec 4"],
    "keySkills": ["skill 1", "skill 2", "skill 3"],
    "missingKeywords": ["keyword1", "keyword2", "keyword3"],
    "experienceLevel": "entry|junior|mid|senior|lead|executive",
    "industries": ["industry1", "industry2"],
    "atsOptimizationTips": ["tip1", "tip2", "tip3"],
    "formatIssues": ["issue1", "issue2"],
    "quantifiableAchievements": number,
    "actionVerbsUsed": number
  }
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
          { role: "user", content: `Analyze this resume and provide comprehensive feedback.` }
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
    console.error('Error in analyze-resume:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
