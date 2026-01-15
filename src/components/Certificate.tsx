import { useRef } from "react";
import { Award, Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import html2canvas from "html2canvas";

interface CertificateProps {
  userName: string;
  topic: string;
  score: number;
  achievementType: string;
  issuedDate: string;
  certificateId: string;
}

export default function Certificate({
  userName,
  topic,
  score,
  achievementType,
  issuedDate,
  certificateId
}: CertificateProps) {
  const certificateRef = useRef<HTMLDivElement>(null);

  const downloadCertificate = async () => {
    if (!certificateRef.current) return;

    try {
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
      });
      
      const link = document.createElement('a');
      link.download = `certificate-${topic.replace(/\s+/g, '-')}-${certificateId.slice(0, 8)}.png`;
      link.href = canvas.toDataURL();
      link.click();
      
      toast.success("Certificate downloaded successfully!");
    } catch (error) {
      console.error("Error downloading certificate:", error);
      toast.error("Failed to download certificate");
    }
  };

  const shareCertificate = async () => {
    if (!certificateRef.current) return;

    try {
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
      });
      
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        
        const file = new File([blob], `certificate-${certificateId.slice(0, 8)}.png`, { type: 'image/png' });
        
        if (navigator.share && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: `${achievementType} Certificate`,
            text: `I earned a certificate for ${topic} with Rufaida AI Coach!`,
          });
          toast.success("Certificate shared successfully!");
        } else {
          // Fallback: copy link
          await navigator.clipboard.writeText(window.location.href);
          toast.success("Certificate link copied to clipboard!");
        }
      });
    } catch (error) {
      console.error("Error sharing certificate:", error);
      toast.error("Failed to share certificate");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getAchievementColor = () => {
    if (score >= 9) return 'from-yellow-400 to-amber-500'; // Gold
    if (score >= 7) return 'from-gray-300 to-gray-400'; // Silver
    return 'from-amber-600 to-amber-700'; // Bronze
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 justify-end">
        <Button onClick={downloadCertificate} variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Download
        </Button>
        <Button onClick={shareCertificate} variant="outline" size="sm">
          <Share2 className="w-4 h-4 mr-2" />
          Share
        </Button>
      </div>

      <Card 
        ref={certificateRef}
        className="p-8 bg-gradient-to-br from-background via-muted/30 to-background border-4 border-primary/20 relative overflow-hidden"
      >
        {/* Decorative corner elements */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/10 to-transparent" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-primary/10 to-transparent" />
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-primary/10 to-transparent" />

        <div className="relative z-10 space-y-8 text-center">
          {/* Badge */}
          <div className="flex justify-center">
            <div className={`p-6 rounded-full bg-gradient-to-br ${getAchievementColor()} shadow-lg`}>
              <Award className="w-16 h-16 text-white" />
            </div>
          </div>

          {/* Certificate of Achievement */}
          <div>
            <p className="text-sm text-muted-foreground uppercase tracking-wider mb-2">
              Certificate of Achievement
            </p>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              {achievementType}
            </h1>
          </div>

          {/* Awarded to */}
          <div className="space-y-4">
            <p className="text-lg text-muted-foreground">This certifies that</p>
            <h2 className="text-3xl font-bold">{userName}</h2>
            <p className="text-lg text-muted-foreground">has successfully completed</p>
            <h3 className="text-2xl font-semibold text-primary">{topic}</h3>
          </div>

          {/* Performance Score */}
          <div className="flex justify-center gap-8 py-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Performance Score</p>
              <div className="text-4xl font-bold">
                <span className={`bg-gradient-to-r ${getAchievementColor()} bg-clip-text text-transparent`}>
                  {score}/10
                </span>
              </div>
            </div>
          </div>

          {/* Coach signature */}
          <div className="pt-8 border-t">
            <div className="flex justify-center items-center gap-2 mb-2">
              <div className="h-px w-24 bg-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Certified by</p>
              <div className="h-px w-24 bg-muted-foreground/30" />
            </div>
            <p className="text-lg font-semibold">Rufaida AI Coach</p>
            <p className="text-sm text-muted-foreground">Expert AI Coaching Platform</p>
          </div>

          {/* Date and Certificate ID */}
          <div className="pt-6 space-y-1">
            <p className="text-sm text-muted-foreground">
              Issued on {formatDate(issuedDate)}
            </p>
            <p className="text-xs text-muted-foreground/60">
              Certificate ID: {certificateId.slice(0, 16).toUpperCase()}
            </p>
          </div>
        </div>

        {/* Watermark */}
        <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
          <Award className="w-96 h-96" />
        </div>
      </Card>
    </div>
  );
}
