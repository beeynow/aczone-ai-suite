import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import OnboardingModal from "@/components/OnboardingModal";

export default function Auth() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/");
      }
    };
    checkUser();
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Passwords don't match",
        description: "Please make sure your passwords match.",
      });
      return;
    }

    if (username.length < 3 || username.length > 20) {
      toast({
        variant: "destructive",
        title: "Invalid username",
        description: "Username must be 3-20 characters long.",
      });
      return;
    }

    if (!/^[a-z0-9_]+$/.test(username)) {
      toast({
        variant: "destructive",
        title: "Invalid username",
        description: "Username can only contain lowercase letters, numbers, and underscores.",
      });
      return;
    }

    setLoading(true);

    // Check if username already exists
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("username")
      .eq("username", username)
      .single();

    if (existingProfile) {
      setLoading(false);
      toast({
        variant: "destructive",
        title: "Username taken",
        description: "This username is already taken. Please choose another.",
      });
      return;
    }

    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          username,
        },
      },
    });

    if (signUpError) {
      setLoading(false);
      toast({
        variant: "destructive",
        title: "Sign up failed",
        description: signUpError.message,
      });
      return;
    }

    if (authData.user) {
      // Create profile with username
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          user_id: authData.user.id,
          email: email,
          username: username,
        });

      if (profileError) {
        console.error("Profile creation error:", profileError);
      }

      // Process referral code if provided
      if (referralCode.trim()) {
        const { error: referralError } = await supabase.rpc("process-referral", {
          referral_code: referralCode,
        });

        if (referralError) {
          console.error("Referral processing error:", referralError);
        }
      }
    }

    setLoading(false);
    toast({
      title: "Success!",
      description: "Account created successfully. You can now sign in.",
    });
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let loginEmail = usernameOrEmail;

    // Check if input is username (no @ symbol)
    if (!usernameOrEmail.includes("@")) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("email")
        .eq("username", usernameOrEmail)
        .single();

      if (!profile) {
        setLoading(false);
        toast({
          variant: "destructive",
          title: "Sign in failed",
          description: "Invalid username or password.",
        });
        return;
      }

      loginEmail = profile.email;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password,
    });

    if (error) {
      setLoading(false);
      toast({
        variant: "destructive",
        title: "Sign in failed",
        description: error.message,
      });
      return;
    }

    // Check if this is first login
    const { data: profile } = await supabase
      .from("profiles")
      .select("created_at")
      .eq("email", loginEmail)
      .single();

    if (profile) {
      const accountAge = Date.now() - new Date(profile.created_at).getTime();
      const isFirstLogin = accountAge < 60000; // Less than 1 minute old

      if (isFirstLogin) {
        setShowOnboarding(true);
      } else {
        navigate("/");
      }
    } else {
      navigate("/");
    }

    setLoading(false);
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">TryInterview</CardTitle>
          <CardDescription className="text-center">
            Sign in to start your AI-powered interview practice
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-username-email">Username or Email</Label>
                  <Input
                    id="signin-username-email"
                    type="text"
                    placeholder="username or email@example.com"
                    value={usernameOrEmail}
                    onChange={(e) => setUsernameOrEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign In
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-username">Username</Label>
                  <Input
                    id="signup-username"
                    type="text"
                    placeholder="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase())}
                    required
                    minLength={3}
                    maxLength={20}
                    pattern="[a-z0-9_]+"
                  />
                  <p className="text-xs text-muted-foreground">
                    3-20 characters, lowercase letters, numbers, and underscores only
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-confirm-password">Confirm Password</Label>
                  <Input
                    id="signup-confirm-password"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-referral">Referral Code (Optional)</Label>
                  <Input
                    id="signup-referral"
                    type="text"
                    placeholder="Enter referral code"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign Up
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <OnboardingModal 
        open={showOnboarding} 
        onComplete={handleOnboardingComplete}
      />
    </div>
  );
}
