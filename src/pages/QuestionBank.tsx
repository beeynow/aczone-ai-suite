import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Sparkles, RefreshCw, Play, Target, TrendingUp } from "lucide-react";
import { toast } from "sonner";

type Category = 'tech' | 'medical' | 'law' | 'finance' | 'business' | 'education' | 'engineering' | 'sales' | 'marketing' | 'other';
type Difficulty = 'beginner' | 'intermediate' | 'expert';

const CATEGORIES: { value: Category; label: string; color: string }[] = [
  { value: 'tech', label: 'Technology', color: 'bg-blue-500' },
  { value: 'medical', label: 'Medical', color: 'bg-red-500' },
  { value: 'law', label: 'Law', color: 'bg-purple-500' },
  { value: 'finance', label: 'Finance', color: 'bg-green-500' },
  { value: 'business', label: 'Business', color: 'bg-orange-500' },
  { value: 'education', label: 'Education', color: 'bg-yellow-500' },
  { value: 'engineering', label: 'Engineering', color: 'bg-cyan-500' },
  { value: 'sales', label: 'Sales', color: 'bg-pink-500' },
  { value: 'marketing', label: 'Marketing', color: 'bg-indigo-500' },
  { value: 'other', label: 'Other', color: 'bg-gray-500' }
];

const DIFFICULTY_LEVELS: { value: Difficulty; label: string; color: string }[] = [
  { value: 'beginner', label: 'Beginner', color: 'bg-green-500' },
  { value: 'intermediate', label: 'Intermediate', color: 'bg-yellow-500' },
  { value: 'expert', label: 'Expert', color: 'bg-red-500' }
];

export default function QuestionBank() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<Category>('tech');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('beginner');
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<any>(null);

  useEffect(() => {
    loadQuestions();
  }, [selectedCategory, selectedDifficulty]);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('question_bank')
        .select('*')
        .eq('category', selectedCategory)
        .eq('difficulty', selectedDifficulty)
        .eq('is_active', true)
        .limit(10);

      if (error) throw error;
      setQuestions(data || []);
      if (data && data.length > 0) {
        setSelectedQuestion(data[0]);
      }
    } catch (error) {
      console.error('Error loading questions:', error);
      toast.error('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const regenerateQuestion = () => {
    if (questions.length > 0) {
      const randomIndex = Math.floor(Math.random() * questions.length);
      setSelectedQuestion(questions[randomIndex]);
      toast.success('New question selected!');
    }
  };

  const startInterview = () => {
    if (selectedQuestion) {
      navigate('/create-interview', {
        state: {
          category: selectedCategory,
          difficulty: selectedDifficulty,
          questionId: selectedQuestion.id
        }
      });
    }
  };

  const categoryInfo = CATEGORIES.find(c => c.value === selectedCategory);
  const difficultyInfo = DIFFICULTY_LEVELS.find(d => d.value === selectedDifficulty);

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="mb-8 text-center">
          <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
            AI Question Engine
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Powered by advanced AI to generate personalized interview questions tailored to your career path
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <Badge variant="secondary" className="text-sm">
              <Sparkles className="w-3 h-3 mr-1" />
              10,000+ Questions
            </Badge>
            <Badge variant="secondary" className="text-sm">
              AI-Generated Feedback
            </Badge>
            <Badge variant="secondary" className="text-sm">
              Real-time Analysis
            </Badge>
          </div>
        </div>

        {/* Selection Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="p-6">
            <label className="block text-sm font-medium mb-3">Interview Category</label>
            <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as Category)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${cat.color}`} />
                      {cat.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="mt-3 text-xs text-muted-foreground">
              {questions.length} questions available in this category
            </div>
          </Card>

          <Card className="p-6">
            <label className="block text-sm font-medium mb-3">Difficulty Level</label>
            <Select value={selectedDifficulty} onValueChange={(value) => setSelectedDifficulty(value as Difficulty)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DIFFICULTY_LEVELS.map(diff => (
                  <SelectItem key={diff.value} value={diff.value}>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${diff.color}`} />
                      {diff.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Card>
        </div>

        {/* Current Question Display */}
        {selectedQuestion && (
          <Card className="p-10 mb-8 bg-gradient-to-br from-primary/10 via-primary/5 to-background border-2 border-primary/30 shadow-xl">
            <div className="flex items-start justify-between mb-6">
              <div className="flex gap-2">
                <Badge className={`${categoryInfo?.color} text-white px-3 py-1`}>
                  {categoryInfo?.label}
                </Badge>
                <Badge className={`${difficultyInfo?.color} text-white px-3 py-1`}>
                  {difficultyInfo?.label}
                </Badge>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={regenerateQuestion}
                disabled={loading || questions.length <= 1}
                className="hover:bg-primary hover:text-primary-foreground"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                New Question
              </Button>
            </div>

            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Sparkles className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold">Interview Question</h3>
                </div>
                <p className="text-2xl font-medium leading-relaxed p-6 bg-background/50 rounded-lg border border-primary/20">
                  {selectedQuestion.question_text}
                </p>
              </div>

              {selectedQuestion.expected_keywords && selectedQuestion.expected_keywords.length > 0 && (
                <div className="p-6 bg-muted/30 rounded-lg">
                  <h4 className="text-base font-semibold mb-3 flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    Key Topics to Cover:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedQuestion.expected_keywords.map((keyword: string, idx: number) => (
                      <Badge key={idx} variant="secondary" className="text-sm py-1 px-3">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 mb-8">
          <Button
            size="lg"
            onClick={startInterview}
            disabled={!selectedQuestion}
            className="flex-1 h-14 text-lg bg-gradient-to-r from-primary to-primary/80"
          >
            <Play className="w-6 h-6 mr-2" />
            Start Interview with This Question
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate('/analytics')}
            className="h-14"
          >
            <TrendingUp className="w-5 h-5" />
          </Button>
        </div>

        {/* Available Questions Preview */}
        {questions.length > 1 && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">More Questions Available</h3>
            <div className="grid gap-4">
              {questions.slice(0, 5).map((q, idx) => (
                <Card
                  key={q.id}
                  className={`p-4 cursor-pointer transition-all hover:border-primary ${
                    selectedQuestion?.id === q.id ? 'border-primary bg-primary/5' : ''
                  }`}
                  onClick={() => setSelectedQuestion(q)}
                >
                  <p className="font-medium">Question {idx + 1}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {q.question_text.length > 100
                      ? q.question_text.substring(0, 100) + '...'
                      : q.question_text}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
  );
}
