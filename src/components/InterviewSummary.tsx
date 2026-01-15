import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, Target, TrendingUp, BookOpen, Star } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface InterviewSummaryProps {
  messages: Array<{ role: string; content: string }>;
  rating?: number;
  aiAnalysis?: {
    performance_score?: number;
    strengths?: string[];
    areas_to_improve?: string[];
    key_concepts?: string[];
    detailed_analysis?: string;
  } | null;
  loading?: boolean;
}

export default function InterviewSummary({ messages, rating, aiAnalysis, loading }: InterviewSummaryProps) {
  const userResponses = messages.filter(m => m.role === 'user').length;
  const aiQuestions = messages.filter(m => m.role === 'assistant').length;

  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Interview Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Interview Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Questions</p>
              <p className="text-2xl font-bold">{aiQuestions}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Your Responses</p>
              <p className="text-2xl font-bold">{userResponses}</p>
            </div>
          </div>

          {aiAnalysis?.performance_score && (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Beeynow AI Performance Score</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold">{aiAnalysis.performance_score}/10</p>
                <Badge variant={aiAnalysis.performance_score >= 7 ? "default" : "secondary"}>
                  {aiAnalysis.performance_score >= 7 ? "Great Job!" : "Good Effort"}
                </Badge>
              </div>
            </div>
          )}

          {rating && (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Your Experience Rating</p>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Performance Analysis */}
      {aiAnalysis?.detailed_analysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5" />
              Beeynow's Performance Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed whitespace-pre-line">{aiAnalysis.detailed_analysis}</p>
          </CardContent>
        </Card>
      )}

      {/* Strengths */}
      {aiAnalysis?.strengths && aiAnalysis.strengths.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              Your Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {aiAnalysis.strengths.map((strength, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
                  <p className="text-sm">{strength}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Areas to Improve */}
      {aiAnalysis?.areas_to_improve && aiAnalysis.areas_to_improve.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-500" />
              Focus Areas for Improvement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {aiAnalysis.areas_to_improve.map((area, i) => (
                <div key={i} className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 text-orange-500 flex-shrink-0" />
                  <p className="text-sm">{area}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Concepts */}
      {aiAnalysis?.key_concepts && aiAnalysis.key_concepts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-500" />
              Core Concepts Covered
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {aiAnalysis.key_concepts.map((concept, i) => (
                <Badge key={i} variant="outline" className="text-sm">
                  {concept}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
