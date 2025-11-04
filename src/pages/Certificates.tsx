import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Award, ArrowLeft, Trophy, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Certificate from "@/components/Certificate";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface CertificateData {
  id: string;
  topic: string;
  score: number;
  achievement_type: string;
  issued_date: string;
  certificate_data: any;
}

export default function Certificates() {
  const navigate = useNavigate();
  const [certificates, setCertificates] = useState<CertificateData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCertificate, setSelectedCertificate] = useState<CertificateData | null>(null);
  const [userName, setUserName] = useState("Learner");

  useEffect(() => {
    fetchCertificates();
    fetchUserName();
  }, []);

  const fetchUserName = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', user.id)
          .single();
        
        if (profile?.full_name) {
          setUserName(profile.full_name);
        }
      }
    } catch (error) {
      console.error("Error fetching user name:", error);
    }
  };

  const fetchCertificates = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to view certificates");
        navigate('/auth');
        return;
      }

      const { data, error } = await supabase
        .from('certificates')
        .select('*')
        .eq('user_id', user.id)
        .order('issued_date', { ascending: false });

      if (error) throw error;

      setCertificates(data || []);
    } catch (error) {
      console.error("Error fetching certificates:", error);
      toast.error("Failed to load certificates");
    } finally {
      setLoading(false);
    }
  };

  const getAchievementIcon = (type: string) => {
    if (type.includes('Excellence')) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (type.includes('Mastery')) return <Star className="w-5 h-5 text-primary" />;
    return <Award className="w-5 h-5 text-secondary" />;
  };

  const getScoreColor = (score: number) => {
    if (score >= 9) return 'text-yellow-500';
    if (score >= 7) return 'text-gray-500';
    return 'text-amber-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading your achievements...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate('/')} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Award className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">Your Achievements</h1>
              <p className="text-muted-foreground mt-1">
                Certificates earned through dedication and mastery
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Certificates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{certificates.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Average Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {certificates.length > 0
                  ? (certificates.reduce((sum, cert) => sum + cert.score, 0) / certificates.length).toFixed(1)
                  : '0'}/10
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Excellence Certificates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-yellow-500">
                {certificates.filter(c => c.score >= 9).length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Certificates Grid */}
        {certificates.length === 0 ? (
          <Card className="p-12 text-center">
            <Award className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-xl font-semibold mb-2">No Certificates Yet</h3>
            <p className="text-muted-foreground mb-6">
              Complete interviews with high performance to earn achievement certificates!
            </p>
            <Button onClick={() => navigate('/create-interview')}>
              Start Your First Interview
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certificates.map((certificate) => (
              <Card
                key={certificate.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedCertificate(certificate)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    {getAchievementIcon(certificate.achievement_type)}
                    <span className={`text-2xl font-bold ${getScoreColor(certificate.score)}`}>
                      {certificate.score}/10
                    </span>
                  </div>
                  <CardTitle className="text-lg">{certificate.achievement_type}</CardTitle>
                  <CardDescription>{certificate.topic}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Issued {new Date(certificate.issued_date).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Certificate Dialog */}
        <Dialog open={!!selectedCertificate} onOpenChange={() => setSelectedCertificate(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Your Achievement Certificate</DialogTitle>
            </DialogHeader>
            {selectedCertificate && (
              <Certificate
                userName={userName}
                topic={selectedCertificate.topic}
                score={selectedCertificate.score}
                achievementType={selectedCertificate.achievement_type}
                issuedDate={selectedCertificate.issued_date}
                certificateId={selectedCertificate.id}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
