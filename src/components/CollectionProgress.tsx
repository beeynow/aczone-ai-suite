import { Trophy, Star, Award, Brain, Lock, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface CollectionProgressProps {
  collection: {
    id: string;
    name: string;
    description: string;
    badge_icon: string;
    topic_pattern: string;
    min_certificates: number;
    min_avg_score: number;
  };
  userCertificates: Array<{
    topic: string;
    score: number;
  }>;
  isEarned: boolean;
  earnedDate?: string;
}

export default function CollectionProgress({ 
  collection, 
  userCertificates,
  isEarned,
  earnedDate 
}: CollectionProgressProps) {
  const getIcon = (iconName: string) => {
    const iconMap: Record<string, any> = {
      trophy: Trophy,
      star: Star,
      award: Award,
      brain: Brain,
    };
    const Icon = iconMap[iconName] || Trophy;
    return <Icon className="w-6 h-6" />;
  };

  // Match certificates based on topic pattern
  const matchingCerts = userCertificates.filter(cert => {
    const patterns = collection.topic_pattern.split('|');
    return patterns.some(pattern => 
      cert.topic.toLowerCase().includes(pattern.toLowerCase())
    );
  });

  const avgScore = matchingCerts.length > 0
    ? matchingCerts.reduce((sum, cert) => sum + cert.score, 0) / matchingCerts.length
    : 0;

  const certProgress = (matchingCerts.length / collection.min_certificates) * 100;
  const scoreProgress = (avgScore / collection.min_avg_score) * 100;
  
  const meetsRequirements = 
    matchingCerts.length >= collection.min_certificates && 
    avgScore >= collection.min_avg_score;

  return (
    <Card className={`relative overflow-hidden ${isEarned ? 'border-primary' : ''}`}>
      {isEarned && (
        <div className="absolute top-2 right-2">
          <CheckCircle2 className="w-6 h-6 text-primary" />
        </div>
      )}
      
      <CardHeader>
        <div className="flex items-center gap-3 mb-2">
          <div className={`p-2 rounded-lg ${isEarned ? 'bg-primary/20 text-primary' : 'bg-muted'}`}>
            {getIcon(collection.badge_icon)}
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg">{collection.name}</CardTitle>
            {isEarned && earnedDate && (
              <Badge variant="secondary" className="mt-1">
                Earned {new Date(earnedDate).toLocaleDateString()}
              </Badge>
            )}
          </div>
        </div>
        <CardDescription>{collection.description}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {!isEarned && (
          <>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Certificates</span>
                <span className="font-medium">
                  {matchingCerts.length}/{collection.min_certificates}
                </span>
              </div>
              <Progress value={Math.min(certProgress, 100)} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Average Score</span>
                <span className="font-medium">
                  {avgScore.toFixed(1)}/{collection.min_avg_score}
                </span>
              </div>
              <Progress value={Math.min(scoreProgress, 100)} className="h-2" />
            </div>

            {meetsRequirements && (
              <div className="pt-2 flex items-center gap-2 text-sm text-primary">
                <CheckCircle2 className="w-4 h-4" />
                <span className="font-medium">Requirements met! Certificate will be issued.</span>
              </div>
            )}

            {matchingCerts.length === 0 && (
              <div className="pt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <Lock className="w-4 h-4" />
                <span>Complete interviews on {collection.topic_pattern.split('|').join(', ')} topics</span>
              </div>
            )}
          </>
        )}

        {isEarned && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Certificates Earned</span>
              <span className="font-medium">{matchingCerts.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Average Score</span>
              <span className="font-medium text-primary">{avgScore.toFixed(1)}/10</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
