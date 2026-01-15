import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { LucideIcon } from "lucide-react";

interface ProgressCardProps {
  title: string;
  current: number;
  goal: number;
  icon: LucideIcon;
  color?: string;
}

export function ProgressCard({ title, current, goal, icon: Icon, color = "text-primary" }: ProgressCardProps) {
  const percentage = Math.min((current / goal) * 100, 100);
  
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon className={`w-5 h-5 ${color}`} />
          </div>
          <div>
            <h3 className="font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground">
              {current} / {goal}
            </p>
          </div>
        </div>
        <span className="text-2xl font-bold">{Math.round(percentage)}%</span>
      </div>
      <Progress value={percentage} className="h-2" />
    </Card>
  );
}
