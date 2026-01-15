import { Award, Flame, Rocket, Star, Target, Trophy, Users, Zap, Crown, Gift, Gem, Sparkles, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface AchievementBadgeProps {
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
}

const iconMap: Record<string, any> = {
  Award, Flame, Rocket, Star, Target, Trophy, Users, Zap, Crown, Gift, Gem, Sparkles, UserPlus
};

export function AchievementBadge({ name, description, icon, unlocked, unlockedAt }: AchievementBadgeProps) {
  const Icon = iconMap[icon] || Award;
  
  return (
    <Card className={`p-4 transition-all ${unlocked ? 'bg-gradient-to-br from-primary/10 to-accent/10 border-primary/30' : 'bg-muted/50 opacity-60'}`}>
      <div className="flex items-start gap-3">
        <div className={`p-3 rounded-full ${unlocked ? 'bg-primary/20' : 'bg-muted'}`}>
          <Icon className={`w-6 h-6 ${unlocked ? 'text-primary' : 'text-muted-foreground'}`} />
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between gap-2">
            <h4 className={`font-semibold ${unlocked ? 'text-foreground' : 'text-muted-foreground'}`}>
              {name}
            </h4>
            {unlocked && (
              <Badge variant="default" className="text-xs">
                Unlocked
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
          {unlocked && unlockedAt && (
            <p className="text-xs text-muted-foreground mt-2">
              Earned {new Date(unlockedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
