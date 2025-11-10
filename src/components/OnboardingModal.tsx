import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  MessageSquare, 
  Users, 
  Award, 
  BarChart3, 
  Lightbulb,
  ArrowRight,
  X
} from "lucide-react";

interface OnboardingModalProps {
  open: boolean;
  onComplete: () => void;
}

const steps = [
  {
    icon: MessageSquare,
    title: "AI-Powered Interviews",
    description: "Practice with our advanced AI interviewer that adapts to your responses and provides real-time feedback.",
    color: "text-primary"
  },
  {
    icon: Users,
    title: "Live Meetings & Collaboration",
    description: "Join group interviews, host meetings with video/audio, and collaborate with peers in real-time.",
    color: "text-blue-500"
  },
  {
    icon: Award,
    title: "Certificates & Achievements",
    description: "Earn certificates for completing interviews, unlock achievements, and track your progress with our gamification system.",
    color: "text-amber-500"
  },
  {
    icon: BarChart3,
    title: "Analytics & Insights",
    description: "Get detailed performance analytics, track your improvement over time, and identify areas for growth.",
    color: "text-green-500"
  },
  {
    icon: Lightbulb,
    title: "Smart Tools & Resources",
    description: "Access resume analyzer, question bank, code generator, and AI-powered content creation tools.",
    color: "text-purple-500"
  }
];

export default function OnboardingModal({ open, onComplete }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const progress = ((currentStep + 1) / steps.length) * 100;
  const CurrentIcon = steps[currentStep].icon;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[600px] p-0 gap-0">
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 z-10"
            onClick={handleSkip}
          >
            <X className="h-4 w-4" />
          </Button>

          <div className="p-8 pb-6">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className={`p-6 rounded-2xl bg-gradient-to-br from-background to-muted ${steps[currentStep].color}`}>
                <CurrentIcon className="h-16 w-16" />
              </div>

              <div className="space-y-3">
                <h2 className="text-2xl font-bold tracking-tight">
                  {steps[currentStep].title}
                </h2>
                <p className="text-muted-foreground text-lg leading-relaxed max-w-md">
                  {steps[currentStep].description}
                </p>
              </div>

              <div className="flex items-center gap-2 pt-4">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === currentStep
                        ? "w-8 bg-primary"
                        : index < currentStep
                        ? "w-2 bg-primary/50"
                        : "w-2 bg-muted"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="border-t bg-muted/30 p-6">
            <div className="space-y-4">
              <Progress value={progress} className="h-1" />
              
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  onClick={handleSkip}
                  className="text-muted-foreground"
                >
                  Skip Tutorial
                </Button>

                <Button onClick={handleNext} className="min-w-[120px]">
                  {currentStep < steps.length - 1 ? (
                    <>
                      Next
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  ) : (
                    "Get Started"
                  )}
                </Button>
              </div>

              <p className="text-center text-sm text-muted-foreground">
                Step {currentStep + 1} of {steps.length}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
