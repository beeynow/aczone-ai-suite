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
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<HTMLAudioElement[]>([]);
  const isPlayingRef = useRef(false);

  useEffect(() => {
    // Initialize audio context
    audioContextRef.current = new AudioContext();
    
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
      stopRecording();
      audioContextRef.current?.close();
    };
  }, []);

  const startInterview = async () => {
    // AI greeting
    await speakAIResponse("Hello sir! Welcome to your interview. I'm excited to discuss your experience with " + topic + ". Shall we begin?");
  };

  const speakAIResponse = async (text: string) => {
    setIsAISpeaking(true);
    try {
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { text, voice: 'en-US' }
      });

      if (error) throw error;

      if (data?.audioContent) {
        await playAudio(data.audioContent);
      }
    } catch (error) {
      console.error('Error with TTS:', error);
      toast.error('Failed to generate speech');
    } finally {
      setIsAISpeaking(false);
    }
  };

  const playAudio = async (base64Audio: string): Promise<void> => {
    return new Promise((resolve) => {
      const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`);
      audioQueueRef.current.push(audio);

      audio.onended = () => {
        audioQueueRef.current.shift();
        if (audioQueueRef.current.length === 0) {
          isPlayingRef.current = false;
        }
        resolve();
      };

      if (!isPlayingRef.current) {
        isPlayingRef.current = true;
        audio.play();
      }
    });
  };

  const startRecording = async () => {
    if (isAISpeaking) {
      toast.error('Please wait for AI to finish speaking');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processUserSpeech(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setIsUserSpeaking(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Failed to access microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsUserSpeaking(false);
    }
  };

  const processUserSpeech = async (audioBlob: Blob) => {
    try {
      // Convert to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      await new Promise((resolve) => {
        reader.onloadend = resolve;
      });

      const base64Audio = (reader.result as string).split(',')[1];

      // Transcribe speech
      const { data: transcriptData, error: transcriptError } = await supabase.functions.invoke('speech-to-text', {
        body: { audio: base64Audio }
      });

      if (transcriptError) throw transcriptError;

      const userText = transcriptData?.text || '';
      
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

      const { data: aiData, error: aiError } = await supabase.functions.invoke('ai21-interview-chat', {
        body: {
          messages: updatedHistory,
          interviewId,
          topic,
          experience_level: experienceLevel
        }
      });

      if (aiError) throw aiError;

      const aiResponse = aiData?.content || '';

      // Save AI message
      await supabase.from('interview_messages').insert({
        interview_id: interviewId,
        user_id: null,
        role: 'assistant',
        content: aiResponse
      });

      setConversationHistory([...updatedHistory, { role: 'assistant', content: aiResponse }]);

      // Speak AI response
      await speakAIResponse(aiResponse);
      
    } catch (error) {
      console.error('Error processing speech:', error);
      toast.error('Failed to process speech');
    }
  };

  const endInterview = async () => {
    stopRecording();
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
