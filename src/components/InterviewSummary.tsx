import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, Target } from "lucide-react";

interface InterviewSummaryProps {
  messages: Array<{ role: string; content: string }>;
  rating?: number;
}

export default function InterviewSummary({ messages, rating }: InterviewSummaryProps) {
  const userResponses = messages.filter(m => m.role === 'user').length;
  const aiQuestions = messages.filter(m => m.role === 'assistant').length;

  // Extract key topics from conversation
  const getKeyTopics = () => {
    const topics: string[] = [];
    messages.forEach(msg => {
      if (msg.role === 'assistant' && msg.content.includes('?')) {
        const words = msg.content.split(' ').slice(0, 5).join(' ');
        topics.push(words);
      }
    });
    return topics.slice(0, 3);
  };

  return (
    <div className="space-y-4">
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

          {rating && (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Your Rating</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold">{rating}/5</p>
                <Badge variant={rating >= 4 ? "default" : "secondary"}>
                  {rating >= 4 ? "Great!" : "Good effort"}
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            Areas Covered
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {getKeyTopics().map((topic, i) => (
              <div key={i} className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 text-primary" />
                <p className="text-sm">{topic}...</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Key Takeaways</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Review your responses for clarity and depth</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Focus on providing specific examples in your answers</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Practice articulating your thoughts more concisely</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
