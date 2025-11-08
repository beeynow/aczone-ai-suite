import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Sparkles, RefreshCw, Play } from "lucide-react";
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
    <div className="container mx-auto py-8 px-4 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            AI Question Engine
          </h1>
          <p className="text-muted-foreground">
            Select your category and difficulty to get personalized interview questions
          </p>
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
          <Card className="p-8 mb-6 bg-gradient-to-br from-primary/5 to-primary/10 border-2 border-primary/20">
            <div className="flex items-start justify-between mb-4">
              <div className="flex gap-2">
                <Badge className={categoryInfo?.color}>
                  {categoryInfo?.label}
                </Badge>
                <Badge className={difficultyInfo?.color}>
                  {difficultyInfo?.label}
                </Badge>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={regenerateQuestion}
                disabled={loading || questions.length <= 1}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Regenerate
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold">Interview Question</h3>
                </div>
                <p className="text-xl font-medium leading-relaxed">
                  {selectedQuestion.question_text}
                </p>
              </div>

              {selectedQuestion.expected_keywords && selectedQuestion.expected_keywords.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2 text-muted-foreground">
                    Keywords to cover:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedQuestion.expected_keywords.map((keyword: string, idx: number) => (
                      <Badge key={idx} variant="secondary">
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
        <div className="flex gap-4">
          <Button
            size="lg"
            onClick={startInterview}
            disabled={!selectedQuestion}
            className="flex-1"
          >
            <Play className="w-5 h-5 mr-2" />
            Start Interview with This Question
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
