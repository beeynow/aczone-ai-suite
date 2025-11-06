import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Video, VideoOff, Mic, MicOff, Phone, MessageSquare, Star, ArrowLeft, PhoneCall } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import VoiceInterview from "@/components/VoiceInterview";
import InterviewSummary from "@/components/InterviewSummary";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export default function InterviewRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [interview, setInterview] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (id) {
      fetchInterview();
      fetchMessages();
      subscribeToMessages();
      updateInterviewStatus('in_progress');
    }
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Timer with auto-end at 5 minutes (300 seconds)
  useEffect(() => {
    if (interview?.status === 'in_progress') {
      const timer = setInterval(() => {
        setElapsedTime(prev => {
          const newTime = prev + 1;
          // Auto-end at 5 minutes (300 seconds) for free plan
          if (newTime >= 300) {
            endInterview();
            clearInterval(timer);
            return 300;
          }
          return newTime;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [interview?.status]);

  const fetchInterview = async () => {
    try {
      const { data, error } = await supabase
        .from('interviews')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setInterview(data);
    } catch (error) {
      console.error('Error fetching interview:', error);
      toast.error('Failed to load interview');
    }
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('interview_messages')
        .select('*')
        .eq('interview_id', id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages((data || []) as Message[]);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel('interview-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'interview_messages',
          filter: `interview_id=eq.${id}`
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const updateInterviewStatus = async (status: string) => {
    try {
      await supabase
        .from('interviews')
        .update({ status })
        .eq('id', id);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      if (!accessToken) {
        toast.error('Authentication required');
        return;
      }
      
      // Save user message
      const { error: insertError } = await supabase
        .from('interview_messages')
        .insert([
          {
            interview_id: id,
            user_id: user?.id,
            role: 'user',
            content: userMessage
          }
        ]);

      if (insertError) throw insertError;

      // Get AI response
      const messagesForAI = [...messages, { role: 'user', content: userMessage }];
      
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/interview-chat`;
      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          messages: messagesForAI.map(m => ({ role: m.role, content: m.content })),
          interviewId: id,
          topic: interview?.topic,
          experience_level: interview?.experience_level
        }),
      });

      if (!response.ok) throw new Error('Failed to get AI response');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let aiResponse = "";

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
                // Ignore parse errors for incomplete chunks
              }
            }
          }
        }
      }

      // Save AI response
      if (aiResponse) {
        await supabase
          .from('interview_messages')
          .insert([
            {
              interview_id: id,
              user_id: null,
              role: 'assistant',
              content: aiResponse
            }
          ]);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const endInterview = async () => {
    await updateInterviewStatus('completed');
    setShowRating(true);
    
    // Generate AI analysis
    setLoadingAnalysis(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-interview', {
        body: {
          messages: messages.map(m => ({ role: m.role, content: m.content })),
          topic: interview.topic,
          experienceLevel: interview.experience_level
        }
      });

      if (error) throw error;
      setAiAnalysis(data);
    } catch (error) {
      console.error('Error analyzing interview:', error);
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      // Stop recording
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      // Start recording
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
          await transcribeAudio(audioBlob);
          
          // Stop all tracks
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
        toast.success('Recording started');
      } catch (error) {
        console.error('Error starting recording:', error);
        toast.error('Failed to access microphone');
      }
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    setLoading(true);
    try {
      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      await new Promise((resolve) => {
        reader.onloadend = resolve;
      });

      const base64Audio = (reader.result as string).split(',')[1];

      // Call speech-to-text function
      const { data, error } = await supabase.functions.invoke('speech-to-text', {
        body: { audio: base64Audio }
      });

      if (error) throw error;

      if (data?.text) {
        setInput(data.text);
        toast.success('Speech transcribed');
      }
    } catch (error) {
      console.error('Error transcribing audio:', error);
      toast.error('Failed to transcribe speech');
    } finally {
      setLoading(false);
    }
  };

  const submitRating = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      await supabase
        .from('interview_ratings')
        .insert([
          {
            interview_id: id,
            user_id: user?.id,
            rating,
            feedback,
            ai_performance_score: aiAnalysis?.performance_score || null,
            strengths: aiAnalysis?.strengths || null,
            areas_to_improve: aiAnalysis?.areas_to_improve || null,
            key_concepts: aiAnalysis?.key_concepts || null,
            detailed_analysis: aiAnalysis?.detailed_analysis || null
          }
        ]);

      // Generate certificate if performance is high enough (score >= 7/10)
      const performanceScore = aiAnalysis?.performance_score || 0;
      if (performanceScore >= 7) {
        let achievementType = "Certificate of Completion";
        if (performanceScore >= 9) {
          achievementType = "Certificate of Excellence";
        } else if (performanceScore >= 8) {
          achievementType = "Certificate of Mastery";
        }

        await supabase.from('certificates').insert({
          user_id: user.id,
          interview_id: id,
          achievement_type: achievementType,
          topic: interview.topic,
          score: performanceScore,
          certificate_data: {
            strengths: aiAnalysis?.strengths,
            key_concepts: aiAnalysis?.key_concepts,
          }
        });

        toast.success(`🎉 Congratulations! You earned a ${achievementType}!`);
      }

      toast.success('Thank you for your feedback!');
      navigate('/');
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast.error('Failed to submit rating');
    }
  };

  if (!interview) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading interview...</p>
      </div>
    );
  }

  if (isVoiceMode) {
    return (
      <VoiceInterview
        interviewId={id!}
        topic={interview.topic}
        experienceLevel={interview.experience_level}
        durationMinutes={interview.duration_minutes}
        learningGoals={interview.learning_goals}
        currentKnowledge={interview.current_knowledge}
        challenges={interview.specific_challenges}
        preferredStyle={interview.preferred_style}
        onEnd={() => {
          setIsVoiceMode(false);
          endInterview();
        }}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="p-4 border-b flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h2 className="font-semibold">{interview.title}</h2>
            <p className="text-sm text-muted-foreground">{interview.topic}</p>
          </div>
          <div className="ml-4 px-4 py-2 bg-primary/10 rounded-md">
            <p className="text-xs text-muted-foreground">Time</p>
            <p className={`text-lg font-bold ${elapsedTime >= 240 ? 'text-destructive' : 'text-foreground'}`}>
              {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')} / 5:00
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="default"
            onClick={() => setIsVoiceMode(true)}
          >
            <PhoneCall className="w-4 h-4 mr-2" />
            Voice Call Mode
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsVideoOn(!isVideoOn)}
          >
            {isVideoOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
          </Button>
          <Button
            variant={isRecording ? "destructive" : "outline"}
            size="icon"
            onClick={toggleRecording}
            disabled={loading}
          >
            {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </Button>
          <Button
            variant="destructive"
            onClick={endInterview}
          >
            <Phone className="w-4 h-4 mr-2" />
            End Interview
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Video/Chat Area */}
        <div className="flex-1 p-6">
          <Card className="h-full flex flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-muted-foreground py-12">
                  <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Start the conversation with your AI interviewer</p>
                </div>
              )}
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <Card className={`p-3 max-w-[80%] ${
                    message.role === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </Card>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type your message..."
                disabled={loading}
              />
              <Button onClick={sendMessage} disabled={loading || !input.trim()}>
                Send
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Rating Dialog */}
      <Dialog open={showRating} onOpenChange={setShowRating}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Interview Complete - Review & Rate</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <InterviewSummary 
              messages={messages} 
              rating={rating} 
              aiAnalysis={aiAnalysis}
              loading={loadingAnalysis}
            />
            
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Rate Your Experience with Rufaida</p>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              
              <Textarea
                placeholder="Share your feedback about the interview session (optional)"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={4}
              />
              
              <Button onClick={submitRating} className="w-full" disabled={rating === 0}>
                Submit & Return to Dashboard
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}