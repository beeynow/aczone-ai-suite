import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { category, difficulty, count = 5 } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `You are an expert interview question generator. Generate ${count} unique, high-quality interview questions for the ${category} field at ${difficulty} level.

For each question, provide:
1. A clear, specific question that tests real-world knowledge
2. 3-5 expected keywords or concepts that a good answer should cover

Return a JSON array with this structure:
[
  {
    "question_text": "the interview question",
    "expected_keywords": ["keyword1", "keyword2", "keyword3"]
  }
]

Make questions practical, relevant, and appropriate for the difficulty level.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Generate ${count} ${difficulty} level interview questions for ${category}.` }
        ],
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content in AI response');
    }

    // Parse the JSON from the AI response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Could not parse questions from AI response');
    }

    const questions = JSON.parse(jsonMatch[0]);

    // Save questions to database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) {
      throw new Error('Unauthorized');
    }

    const questionsToInsert = questions.map((q: any) => ({
      category,
      difficulty,
      question_text: q.question_text,
      expected_keywords: q.expected_keywords,
      created_by: user.id,
      is_active: true,
    }));

    const { data: insertedQuestions, error: insertError } = await supabase
      .from('question_bank')
      .insert(questionsToInsert)
      .select();

    if (insertError) {
      console.error('Database error:', insertError);
      throw insertError;
    }

    return new Response(
      JSON.stringify({ questions: insertedQuestions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
