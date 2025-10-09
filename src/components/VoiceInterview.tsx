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
    // AI greeting
    await speakAIResponse("Hello sir! Welcome to your interview. I'm excited to discuss your experience with " + topic + ". Shall we begin?");
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

      // Save user message
      await supabase.from('interview_messages').insert({
        interview_id: interviewId,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        role: 'user',
        content: userText
      });

      // Get AI response
      const updatedHistory = [...conversationHistory, { role: 'user', content: userText }];
      setConversationHistory(updatedHistory);

      // Call the interview-chat function and handle streaming response
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/interview-chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            messages: updatedHistory,
            interviewId,
            topic,
            experience_level: experienceLevel
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get AI response: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let aiResponse = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;
              
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  aiResponse += content;
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }
      }

      if (!aiResponse.trim()) {
        throw new Error('No response from AI');
      }

      // Save AI message
      await supabase.from('interview_messages').insert({
        interview_id: interviewId,
        user_id: null,
        role: 'assistant',
        content: aiResponse
      });

      setConversationHistory([...updatedHistory, { role: 'assistant', content: aiResponse }]);

      // Speak AI response immediately
      await speakAIResponse(aiResponse);
      
    } catch (error) {
      console.error('Error processing speech:', error);
      toast.error('Failed to process speech');
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
              <h3 className="text-lg font-semibold">AI Interviewer</h3>
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
