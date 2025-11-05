import { Trophy, Star, Award, Brain, Lock } from "lucide-react";
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
  matchingCertificates: Array<{ id: string; score: number; topic: string }>;
  isCompleted: boolean;
  avgScore: number;
}

const iconMap: Record<string, any> = {
  trophy: Trophy,
  star: Star,
  award: Award,
  brain: Brain,
};

export default function CollectionProgress({ 
  collection, 
  matchingCertificates, 
  isCompleted,
  avgScore 
}: CollectionProgressProps) {
  const Icon = iconMap[collection.badge_icon] || Trophy;
  const progress = (matchingCertificates.length / collection.min_certificates) * 100;
  const meetsScoreRequirement = avgScore >= collection.min_avg_score;

  return (
    <Card className={isCompleted ? "border-primary/50 bg-primary/5" : ""}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isCompleted ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                {collection.name}
                {isCompleted && <Badge variant="default">Completed</Badge>}
              </CardTitle>
              <CardDescription>{collection.description}</CardDescription>
            </div>
          </div>
          {!isCompleted && matchingCertificates.length === 0 && (
            <Lock className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">
              {matchingCertificates.length} / {collection.min_certificates} certificates
            </span>
          </div>
          <Progress value={Math.min(progress, 100)} className="h-2" />
        </div>

        {matchingCertificates.length > 0 && (
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Average Score</span>
              <span className={`font-medium ${meetsScoreRequirement ? 'text-green-600' : 'text-amber-600'}`}>
                {avgScore.toFixed(1)} / {collection.min_avg_score}
              </span>
            </div>
            <Progress 
              value={(avgScore / 10) * 100} 
              className="h-2"
            />
          </div>
        )}

        {matchingCertificates.length > 0 && (
          <div>
            <p className="text-sm text-muted-foreground mb-2">Qualifying Certificates:</p>
            <div className="flex flex-wrap gap-2">
              {matchingCertificates.map((cert) => (
                <Badge key={cert.id} variant="secondary" className="text-xs">
                  {cert.topic} ({cert.score}/10)
                </Badge>
              ))}
            </div>
          </div>
        )}

        {isCompleted && (
          <Badge className="w-full justify-center" variant="default">
            🎉 Collection Completed!
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
