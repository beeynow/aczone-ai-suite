import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Users, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function JoinInterview() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [joiningCode, setJoiningCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [autoJoining, setAutoJoining] = useState(false);

  useEffect(() => {
    // Check if there's a code in URL params
    const codeFromUrl = searchParams.get('code');
    if (codeFromUrl) {
      setJoiningCode(codeFromUrl.toUpperCase());
      setAutoJoining(true);
      handleJoin(codeFromUrl.toUpperCase());
    }
  }, [searchParams]);

  const handleJoin = async (code?: string) => {
    const finalCode = (code || joiningCode).trim().toUpperCase();
    
    if (!finalCode) {
      toast.error("Please enter a joining code");
      return;
    }

    if (finalCode.length !== 6) {
      toast.error("Joining code must be 6 characters");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("You must be logged in to join an interview");
        navigate('/auth');
        return;
      }

      // Find interview by joining code
      const { data: interview, error: interviewError } = await supabase
        .from('interviews')
        .select('*')
        .eq('joining_code', finalCode)
        .eq('type', 'group')
        .single();

      if (interviewError || !interview) {
        console.error('Interview not found:', interviewError);
        toast.error("Invalid joining code or interview not found");
        setAutoJoining(false);
        return;
      }

      // Check if interview is still available
      if (interview.status === 'completed') {
        toast.error("This interview has already been completed");
        setAutoJoining(false);
        return;
      }

      // Add user as participant if not already added
      const { error: participantError } = await supabase
        .from('interview_participants')
        .insert({
          interview_id: interview.id,
          user_id: user.id,
          joined_at: new Date().toISOString()
        });

      // Ignore duplicate key error (user already added)
      if (participantError && !participantError.message.includes('duplicate key')) {
        console.error('Error adding participant:', participantError);
        toast.error("Failed to join interview");
        setAutoJoining(false);
        return;
      }

      toast.success("Successfully joined the interview!");
      navigate(`/interview/${interview.id}`);
    } catch (error) {
      console.error('Error joining interview:', error);
      toast.error("Failed to join interview");
      setAutoJoining(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-6">
      <div className="max-w-md mx-auto space-y-6 pt-20">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/')} 
          className="mb-4"
          disabled={autoJoining}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <Card className="shadow-xl">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Join Group Interview</CardTitle>
            <CardDescription>
              Enter the 6-character code to join an interview session
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="code" className="text-base">
                Joining Code
              </Label>
              <Input
                id="code"
                type="text"
                placeholder="ABCD12"
                value={joiningCode}
                onChange={(e) => setJoiningCode(e.target.value.toUpperCase())}
                maxLength={6}
                className="text-center text-2xl font-mono tracking-widest uppercase"
                disabled={loading || autoJoining}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleJoin();
                  }
                }}
              />
              <p className="text-xs text-muted-foreground text-center">
                Ask the interview host for the joining code
              </p>
            </div>

            <Button 
              onClick={() => handleJoin()} 
              className="w-full" 
              size="lg"
              disabled={loading || autoJoining || joiningCode.length !== 6}
            >
              {loading || autoJoining ? (
                <>
                  <Lock className="w-4 h-4 mr-2 animate-spin" />
                  Joining...
                </>
              ) : (
                <>
                  <Users className="w-4 h-4 mr-2" />
                  Join Interview
                </>
              )}
            </Button>

            <div className="pt-4 border-t">
              <p className="text-sm text-center text-muted-foreground">
                Don't have a code?{" "}
                <Button 
                  variant="link" 
                  className="p-0 h-auto"
                  onClick={() => navigate('/create-interview')}
                >
                  Create your own interview
                </Button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
