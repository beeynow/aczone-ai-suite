import { useState, useEffect } from "react";
import { Copy, Share2, Users, Gift, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Referrals() {
  const [referralCode, setReferralCode] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalReferrals: 0,
    totalPoints: 0,
    successfulSignups: 0
  });
  const [referrals, setReferrals] = useState<any[]>([]);

  useEffect(() => {
    loadReferralData();
  }, []);

  const loadReferralData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get or create referral code
      let { data: existingReferral } = await (supabase as any)
        .from('referral_system')
        .select('referral_code')
        .eq('referrer_id', user.id)
        .maybeSingle();

      if (!existingReferral) {
        // Generate unique referral code
        const code = generateReferralCode(user.email!);
        const { data, error } = await (supabase as any)
          .from('referral_system')
          .insert({
            referrer_id: user.id,
            referral_code: code
          })
          .select()
          .single();

        if (error) throw error;
        setReferralCode(data.referral_code);
      } else {
        setReferralCode(existingReferral.referral_code);
      }

      // Get referral stats
      const { data: referralData, error: referralError } = await (supabase as any)
        .from('referral_system')
        .select('*')
        .eq('referrer_id', user.id);

      if (referralError) throw referralError;

      const referralArray = referralData || [];
      const successful = referralArray.filter((r: any) => r.signup_completed) || [];
      const totalPoints = successful.reduce((sum: number, r: any) => sum + (r.reward_points || 0), 0);

      setStats({
        totalReferrals: referralArray.length,
        totalPoints,
        successfulSignups: successful.length
      });

      setReferrals(referralArray);

    } catch (error) {
      console.error('Error loading referral data:', error);
      toast.error('Failed to load referral information');
    } finally {
      setLoading(false);
    }
  };

  const generateReferralCode = (email: string): string => {
    const username = email.split('@')[0].substring(0, 8).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${username}${random}`;
  };

  const getReferralLink = () => {
    return `https://tryinterview.site/auth?ref=${referralCode}`;
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(getReferralLink());
      toast.success('Referral link copied!');
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const shareLink = async () => {
    const link = getReferralLink();
    const text = `Join TryInterview and practice AI-powered interviews! Use my referral link: ${link}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: 'TryInterview Referral', text, url: link });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      copyLink();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading referral data...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold gradient-primary bg-clip-text text-transparent">
          🎁 Referral Program
        </h1>
        <p className="text-muted-foreground">
          Invite friends and earn 10 points for each successful signup!
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Referrals</p>
              <p className="text-3xl font-bold">{stats.totalReferrals}</p>
            </div>
            <Users className="w-10 h-10 text-blue-500" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Successful Signups</p>
              <p className="text-3xl font-bold">{stats.successfulSignups}</p>
            </div>
            <TrendingUp className="w-10 h-10 text-green-500" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Points Earned</p>
              <p className="text-3xl font-bold">{stats.totalPoints}</p>
            </div>
            <Gift className="w-10 h-10 text-yellow-500" />
          </div>
        </Card>
      </div>

      {/* Referral Link Card */}
      <Card className="p-6 space-y-4">
        <h2 className="text-xl font-semibold">Your Referral Link</h2>
        <div className="flex gap-2">
          <Input
            value={getReferralLink()}
            readOnly
            className="font-mono"
          />
          <Button onClick={copyLink} variant="outline">
            <Copy className="w-4 h-4 mr-2" />
            Copy
          </Button>
          <Button onClick={shareLink} className="gradient-primary text-white">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>
        <div className="p-4 bg-muted rounded-lg">
          <p className="text-sm">
            <strong>Your Referral Code:</strong> <span className="font-mono text-lg">{referralCode}</span>
          </p>
        </div>
      </Card>

      {/* How It Works */}
      <Card className="p-6 space-y-4">
        <h2 className="text-xl font-semibold">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl font-bold text-primary">1</span>
            </div>
            <h3 className="font-semibold mb-2">Share Your Link</h3>
            <p className="text-sm text-muted-foreground">
              Send your unique referral link to friends
            </p>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl font-bold text-primary">2</span>
            </div>
            <h3 className="font-semibold mb-2">They Sign Up</h3>
            <p className="text-sm text-muted-foreground">
              Your friends create an account using your link
            </p>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl font-bold text-primary">3</span>
            </div>
            <h3 className="font-semibold mb-2">Earn Rewards</h3>
            <p className="text-sm text-muted-foreground">
              Get 10 points for each successful signup
            </p>
          </div>
        </div>
      </Card>

      {/* Recent Referrals */}
      <Card className="p-6 space-y-4">
        <h2 className="text-xl font-semibold">Recent Referrals</h2>
        {referrals.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No referrals yet. Start sharing your link!
          </p>
        ) : (
          <div className="space-y-2">
            {referrals.map((referral) => (
              <div key={referral.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">
                    {referral.referred_user_id ? 'Signed Up' : 'Pending'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(referral.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant={referral.signup_completed ? "default" : "secondary"}>
                  {referral.signup_completed ? `+${referral.reward_points} pts` : 'Pending'}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
