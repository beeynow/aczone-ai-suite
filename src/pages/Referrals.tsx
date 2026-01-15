import { useState, useEffect } from "react";
import { Copy, Share2, Users, Gift, TrendingUp, QrCode } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { QRCodeSVG } from 'qrcode.react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

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
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-3 mb-3">
          <Gift className="w-12 h-12 text-primary" />
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Referral Program
          </h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Invite friends and earn 10 points for each successful signup! Share your unique link or QR code.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Total Referrals</p>
              <p className="text-4xl font-bold text-blue-600">{stats.totalReferrals}</p>
            </div>
            <div className="p-4 bg-blue-500/10 rounded-full">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </Card>
        <Card className="p-6 bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Successful Signups</p>
              <p className="text-4xl font-bold text-green-600">{stats.successfulSignups}</p>
            </div>
            <div className="p-4 bg-green-500/10 rounded-full">
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </Card>
        <Card className="p-6 bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Points Earned</p>
              <p className="text-4xl font-bold text-yellow-600">{stats.totalPoints}</p>
            </div>
            <div className="p-4 bg-yellow-500/10 rounded-full">
              <Gift className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Referral Link Card */}
        <Card className="p-6 space-y-4 lg:col-span-2">
          <div className="flex items-center gap-2 mb-2">
            <Share2 className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">Your Referral Link</h2>
          </div>
          <div className="flex gap-2">
            <Input
              value={getReferralLink()}
              readOnly
              className="font-mono text-sm"
            />
            <Button onClick={copyLink} variant="outline" className="flex-shrink-0">
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </Button>
            <Button onClick={shareLink} className="bg-gradient-primary text-white flex-shrink-0">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
          <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
            <p className="text-sm font-medium mb-1">Your Referral Code</p>
            <p className="font-mono text-2xl font-bold text-primary">{referralCode}</p>
          </div>
        </Card>

        {/* QR Code Card */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <QrCode className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">QR Code</h2>
          </div>
          <div className="flex flex-col items-center">
            <div className="p-4 bg-white rounded-lg border-2 border-primary/20">
              <QRCodeSVG
                value={getReferralLink()}
                size={180}
                level="H"
                includeMargin={true}
              />
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="mt-4">
                  View Full Size
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Referral QR Code</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col items-center p-4">
                  <div className="p-6 bg-white rounded-lg">
                    <QRCodeSVG
                      value={getReferralLink()}
                      size={300}
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mt-4 text-center">
                    Scan this QR code to visit your referral link
                  </p>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </Card>
      </div>

      {/* How It Works */}
      <Card className="p-6 mb-8">
        <h2 className="text-xl font-semibold mb-6 text-center">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mx-auto mb-4 border-2 border-primary/20">
              <span className="text-3xl font-bold text-primary">1</span>
            </div>
            <h3 className="font-semibold text-lg mb-2">Share Your Link</h3>
            <p className="text-sm text-muted-foreground">
              Send your unique referral link or QR code to friends via social media, email, or messaging apps
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mx-auto mb-4 border-2 border-primary/20">
              <span className="text-3xl font-bold text-primary">2</span>
            </div>
            <h3 className="font-semibold text-lg mb-2">They Sign Up</h3>
            <p className="text-sm text-muted-foreground">
              Your friends create an account using your referral link and complete their profile
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mx-auto mb-4 border-2 border-primary/20">
              <span className="text-3xl font-bold text-primary">3</span>
            </div>
            <h3 className="font-semibold text-lg mb-2">Earn Rewards</h3>
            <p className="text-sm text-muted-foreground">
              Get 10 points instantly for each successful signup that can be used for premium features
            </p>
          </div>
        </div>
      </Card>

      {/* Recent Referrals */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Referrals</h2>
        {referrals.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground text-lg">No referrals yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Start sharing your link to earn rewards!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {referrals.map((referral) => (
              <div key={referral.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${referral.signup_completed ? 'bg-green-500' : 'bg-yellow-500'}`} />
                  <div>
                    <p className="font-medium">
                      {referral.referred_user_id ? 'Successfully Signed Up ✓' : 'Pending Signup'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(referral.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                <Badge 
                  variant={referral.signup_completed ? "default" : "secondary"}
                  className={referral.signup_completed ? "bg-green-500" : ""}
                >
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
