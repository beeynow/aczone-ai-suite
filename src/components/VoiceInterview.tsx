import { useState, useEffect, useRef } from "react";
import { Bot, Mic, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface VoiceInterviewProps {
  interviewId: string;
  topic: string;
  experienceLevel: string;
  durationMinutes: number;
  onEnd: () => void;
}

// Extend Window for webkit prefix
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

export default function VoiceInterview({
  interviewId,
  topic,
  experienceLevel,
  durationMinutes,
  onEnd
}: VoiceInterviewProps) {
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [timeLeft, setTimeLeft] = useState(durationMinutes * 60);
  const [conversationHistory, setConversationHistory] = useState<any[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const speechTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const spokenLengthRef = useRef(0);

  useEffect(() => {
    // Initialize Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      toast.error('Speech recognition not supported in this browser');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      console.log('Speech recognized:', transcript);
      setIsUserSpeaking(false);
      setIsRecording(false);
      await processUserSpeech(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsUserSpeaking(false);
      setIsRecording(false);
      if (event.error !== 'no-speech') {
        toast.error('Speech recognition error: ' + event.error);
      }
    };

    recognition.onend = () => {
      setIsUserSpeaking(false);
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    
    // Start with AI greeting
    startInterview();
    
    // Start timer countdown
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          endInterview();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const startInterview = async () => {
    // Load previous messages from database
    try {
      const { data: previousMessages } = await supabase
        .from('interview_messages')
        .select('role, content')
        .eq('interview_id', interviewId)
        .order('created_at', { ascending: true });

      if (previousMessages && previousMessages.length > 0) {
        // Continue from previous conversation
        setConversationHistory(previousMessages);
        await speakAIResponse("Welcome back! I'm Beeynow, your interview coach. Let's continue where we left off. Are you ready to proceed?");
      } else {
        // Start fresh
        await speakAIResponse("Hello! I'm Beeynow, your friendly interview coach. I'm excited to help you with " + topic + ". Let's begin this journey together. Are you ready?");
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      await speakAIResponse("Hello! I'm Beeynow, your friendly interview coach. I'm excited to help you with " + topic + ". Let's begin!");
    }
  };

  const speakAIResponse = async (text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!window.speechSynthesis) {
        toast.error('Text-to-speech not supported in this browser');
        resolve();
        return;
      }

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      
      utterance.onstart = () => {
        setIsAISpeaking(true);
        console.log('AI started speaking');
      };
      
      utterance.onend = () => {
        setIsAISpeaking(false);
        console.log('AI finished speaking');
        resolve();
      };

      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        setIsAISpeaking(false);
        resolve();
      };

      synthRef.current = utterance;
      
      // Small delay to ensure state updates before speaking
      setTimeout(() => {
        window.speechSynthesis.speak(utterance);
      }, 100);
    });
  };

  const startRecording = () => {
    if (isAISpeaking) {
      toast.error('Please wait for AI to finish speaking');
      return;
    }

    if (!recognitionRef.current) {
      toast.error('Speech recognition not initialized');
      return;
    }

    try {
      setIsRecording(true);
      setIsUserSpeaking(true);
      recognitionRef.current.start();
    } catch (error) {
      console.error('Error starting recognition:', error);
      toast.error('Failed to start speech recognition');
      setIsRecording(false);
      setIsUserSpeaking(false);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
      setIsUserSpeaking(false);
    }
  };

  const processUserSpeech = async (userText: string) => {
    try {
      if (!userText.trim()) {
        toast.error('Could not understand speech, please try again');
        return;
      }

      // Build conversation history
      const updatedHistory = [...conversationHistory, { role: 'user', content: userText }];
      setConversationHistory(updatedHistory);

      // Get current auth token for secured function (verify_jwt = true)
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      if (!accessToken) throw new Error('Not authenticated');

      // Save user message in background (don't await)
      supabase.from('interview_messages').insert({
        interview_id: interviewId,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        role: 'user',
        content: userText
      }).then(({ error }) => {
        if (error) console.error('Failed to save user message:', error);
      });

      // Start streaming AI response
      console.log('Sending request to AI with', updatedHistory.length, 'messages');
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/interview-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          messages: updatedHistory,
          interviewId,
          topic,
          experience_level: experienceLevel
        })
      });

      if (!resp.ok || !resp.body) {
        console.error('AI response error:', resp.status, resp.statusText);
        if (resp.status === 429) throw new Error('Rate limit exceeded. Please wait a moment.');
        if (resp.status === 402) throw new Error('AI credits exhausted. Please add credits.');
        throw new Error(`Failed to get AI response: ${resp.statusText}`);
      }

      console.log('Starting to stream AI response');
      
      // Reset spoken length for this new response
      spokenLengthRef.current = 0;
      
      // Progressive TTS while streaming
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let aiResponse = '';

      const speakSegment = (segment: string) => {
        if (!segment.trim()) return;
        if (!window.speechSynthesis) return;
        console.log('Speaking segment:', segment.substring(0, 50) + '...');
        setIsAISpeaking(true);
        const u = new SpeechSynthesisUtterance(segment);
        u.lang = 'en-US';
        u.rate = 1.1; // Slightly faster for more responsive feel
        u.pitch = 1.0;
        u.onend = () => {
          // Check if there are more utterances in the queue
          setTimeout(() => {
            if (!window.speechSynthesis.speaking && !window.speechSynthesis.pending) {
              setIsAISpeaking(false);
            }
          }, 50);
        };
        window.speechSynthesis.speak(u);
      };

      const emitDelta = (delta: string) => {
        aiResponse += delta;
        // Update assistant message progressively in memory
        setConversationHistory(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === 'assistant') {
            const cloned = [...prev];
            cloned[cloned.length - 1] = { ...last, content: aiResponse } as any;
            return cloned as any[];
          }
          return [...prev, { role: 'assistant', content: aiResponse } as any];
        });

        // Progressive TTS: speak any newly completed sentence(s) or chunks for instant response
        const newText = aiResponse.slice(spokenLengthRef.current);
        const match = newText.match(/([\s\S]*?[\.\!\?\u2026])\s/); // up to first sentence end
        if (match && match[1]) {
          const sentence = match[1];
          spokenLengthRef.current += sentence.length + 1; // +1 for the space
          speakSegment(sentence);
        } else if (newText.length > 80) {
          // Reduced threshold for faster initial response - speak chunks sooner
          const chunk = newText.slice(0, 80);
          spokenLengthRef.current += 80;
          speakSegment(chunk);
        }
      };

      let streamDone = false;
      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line || line.startsWith(':')) continue;
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') { streamDone = true; break; }
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) emitDelta(content);
          } catch {
            // Put it back; wait for more data
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      // Flush any remaining text
      const remaining = aiResponse.slice(spokenLengthRef.current).trim();
      if (remaining) {
        console.log('Speaking remaining text:', remaining.substring(0, 50) + '...');
        speakSegment(remaining);
      }
      
      console.log('AI response complete. Total length:', aiResponse.length);

    } catch (error) {
      console.error('Error processing speech:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to process speech');
      setIsAISpeaking(false);
    }
  };

  const endInterview = async () => {
    stopRecording();
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    await supabase.from('interviews').update({ status: 'completed' }).eq('id', interviewId);
    onEnd();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-b from-background to-muted">
      <div className="w-full max-w-4xl space-y-8">
        {/* AI Container */}
        <Card className="p-8 bg-primary/5 border-2 border-primary/20">
          <div className="flex items-center gap-4">
            <div className={`relative ${isAISpeaking ? 'animate-pulse' : ''}`}>
              <Bot className="w-16 h-16 text-primary" />
              {isAISpeaking && (
                <div className="absolute -inset-2 bg-primary/20 rounded-full animate-ping" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold">Beeynow - Your AI Coach</h3>
              <p className="text-sm text-muted-foreground">
                {isAISpeaking ? 'Speaking...' : 'Listening...'}
              </p>
            </div>
          </div>
        </Card>

        {/* Timer */}
        <div className="text-center">
          <div className={`text-6xl font-bold ${timeLeft < 60 ? 'text-destructive animate-pulse' : 'text-foreground'}`}>
            {formatTime(timeLeft)}
          </div>
          <p className="text-sm text-muted-foreground mt-2">Time Remaining</p>
        </div>

        {/* User Container */}
        <Card className="p-8 bg-secondary/5 border-2 border-secondary/20">
          <div className="flex items-center gap-4">
            <div className={`relative ${isUserSpeaking ? 'animate-pulse' : ''}`}>
              <Mic className="w-16 h-16 text-secondary" />
              {isUserSpeaking && (
                <div className="absolute -inset-2 bg-secondary/20 rounded-full animate-ping" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold">You</h3>
              <p className="text-sm text-muted-foreground">
                {isUserSpeaking ? 'Speaking...' : 'Ready to speak'}
              </p>
            </div>
          </div>
        </Card>

        {/* Controls */}
        <div className="flex justify-center gap-4">
          {!isRecording ? (
            <Button
              size="lg"
              onClick={startRecording}
              disabled={isAISpeaking}
              className="px-8"
            >
              <Mic className="w-5 h-5 mr-2" />
              Start Speaking
            </Button>
          ) : (
            <Button
              size="lg"
              variant="secondary"
              onClick={stopRecording}
              className="px-8"
            >
              <Mic className="w-5 h-5 mr-2" />
              Stop Speaking
            </Button>
          )}
          
          <Button
            size="lg"
            variant="destructive"
            onClick={endInterview}
          >
            <Phone className="w-5 h-5 mr-2" />
            End Interview
          </Button>
        </div>
      </div>
    </div>
  );
}
