import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Process base64 in chunks to prevent memory issues
function processBase64Chunks(base64String: string, chunkSize = 32768) {
  const chunks: Uint8Array[] = [];
  let position = 0;
  
  while (position < base64String.length) {
    const chunk = base64String.slice(position, position + chunkSize);
    const binaryChunk = atob(chunk);
    const bytes = new Uint8Array(binaryChunk.length);
    
    for (let i = 0; i < binaryChunk.length; i++) {
      bytes[i] = binaryChunk.charCodeAt(i);
    }
    
    chunks.push(bytes);
    position += chunkSize;
  }

  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { audio, language = 'en' } = await req.json();
    
    if (!audio) {
      throw new Error('Audio data is required');
    }

    const apiKey = Deno.env.get('SPEECHMATICS_API_KEY');
    if (!apiKey) {
      throw new Error('SPEECHMATICS_API_KEY not configured');
    }

    console.log('STT request received');

    // Process audio in chunks
    const binaryAudio = processBase64Chunks(audio);
    
    // Prepare form data for Speechmatics API
    const formData = new FormData();
    const blob = new Blob([binaryAudio], { type: 'audio/webm' });
    formData.append('data_file', blob, 'audio.webm');
    formData.append('config', JSON.stringify({
      type: 'transcription',
      transcription_config: {
        language: language,
        operating_point: 'standard',
      }
    }));

    // Call Speechmatics batch transcription API
    const response = await fetch('https://asr.api.speechmatics.com/v2/jobs', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Speechmatics API error:', response.status, errorText);
      throw new Error(`Speechmatics API error: ${response.status}`);
    }

    const result = await response.json();
    const jobId = result.id;

    // Poll for the transcription result
    let transcript = '';
    let attempts = 0;
    const maxAttempts = 30;

    while (attempts < maxAttempts) {
      const statusResponse = await fetch(`https://asr.api.speechmatics.com/v2/jobs/${jobId}/transcript`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json',
        },
      });

      if (statusResponse.ok) {
        const transcriptData = await statusResponse.json();
        transcript = transcriptData.results?.map((r: any) => r.alternatives[0]?.content).join(' ') || '';
        break;
      }

      // Wait 1 second before next attempt
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }

    if (!transcript) {
      throw new Error('Transcription timeout or failed');
    }

    return new Response(
      JSON.stringify({ text: transcript }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('STT error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});