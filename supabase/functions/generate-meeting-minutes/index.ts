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
    const { meetingId, transcript, participants } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Generating meeting minutes for meeting:", meetingId);

    // Generate AI summary using Lovable AI
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an expert meeting analyst. Generate comprehensive meeting minutes with:
- Executive Summary (2-3 sentences)
- Key Discussion Points (bullet points)
- Action Items (who, what, deadline)
- Questions Raised
- Skills/Topics Discussed
- Confidence Ratings for each participant (1-10 scale)
- Next Steps

Format the output as JSON with these exact keys: summary, keyPoints, actionItems, questionsRaised, skillsDiscussed, participantRatings, nextSteps`
          },
          {
            role: "user",
            content: `Generate meeting minutes for this transcript:\n\nParticipants: ${participants.join(', ')}\n\nTranscript:\n${transcript}`
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse the JSON response
    let minutes;
    try {
      minutes = JSON.parse(content);
    } catch (e) {
      // If not valid JSON, create a structured response
      minutes = {
        summary: content,
        keyPoints: [],
        actionItems: [],
        questionsRaised: [],
        skillsDiscussed: [],
        participantRatings: {},
        nextSteps: []
      };
    }

    console.log("Meeting minutes generated successfully");

    return new Response(
      JSON.stringify(minutes),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error generating meeting minutes:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
