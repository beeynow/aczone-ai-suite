import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FileText, Sparkles, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ResumeAnalyzer() {
  const [resumeText, setResumeText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);

  const analyzeResume = async () => {
    if (!resumeText.trim()) {
      toast.error('Please enter your resume text');
      return;
    }

    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-resume', {
        body: { resumeText, language: 'en' }
      });

      if (error) throw error;

      setAnalysis(data);
      
      // Save to database
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('user_resumes').insert({
          user_id: user.id,
          original_text: resumeText,
          improved_text: data.improvedText,
          clarity_rating: data.clarityRating,
          structure_rating: data.structureRating,
          relevance_rating: data.relevanceRating,
          suggested_roles: data.suggestedRoles,
          ai_analysis: data.analysis
        });
      }

      toast.success('Resume analyzed successfully!');
    } catch (error) {
      console.error('Error analyzing resume:', error);
      toast.error('Failed to analyze resume');
    } finally {
      setAnalyzing(false);
    }
  };

  const downloadImprovedResume = () => {
    if (!analysis?.improvedText) return;
    
    const blob = new Blob([analysis.improvedText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'improved-resume.txt';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Resume downloaded!');
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 80) return 'text-green-500';
    if (rating >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            AI Resume Analyzer
          </h1>
          <p className="text-muted-foreground">
            Get AI-powered feedback on your resume and discover matching job roles
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold">Your Resume</h2>
              </div>
              <Textarea
                placeholder="Paste your resume text here..."
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                className="min-h-[400px] font-mono text-sm"
              />
              <div className="mt-4 text-sm text-muted-foreground">
                {resumeText.split(/\s+/).filter(w => w).length} words
              </div>
            </Card>

            <Button
              onClick={analyzeResume}
              disabled={analyzing || !resumeText.trim()}
              className="w-full"
              size="lg"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Analyze Resume
                </>
              )}
            </Button>
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            {analysis ? (
              <>
                {/* Ratings */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Resume Ratings</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Clarity</span>
                        <span className={`text-sm font-bold ${getRatingColor(analysis.clarityRating)}`}>
                          {analysis.clarityRating}%
                        </span>
                      </div>
                      <Progress value={analysis.clarityRating} className="h-2" />
                    </div>

                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Structure</span>
                        <span className={`text-sm font-bold ${getRatingColor(analysis.structureRating)}`}>
                          {analysis.structureRating}%
                        </span>
                      </div>
                      <Progress value={analysis.structureRating} className="h-2" />
                    </div>

                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Relevance</span>
                        <span className={`text-sm font-bold ${getRatingColor(analysis.relevanceRating)}`}>
                          {analysis.relevanceRating}%
                        </span>
                      </div>
                      <Progress value={analysis.relevanceRating} className="h-2" />
                    </div>
                  </div>
                </Card>

                {/* Suggested Roles */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Suggested Job Roles</h3>
                  <div className="flex flex-wrap gap-2">
                    {analysis.suggestedRoles?.map((role: string, idx: number) => (
                      <Badge key={idx} variant="secondary" className="text-sm py-1 px-3">
                        {role}
                      </Badge>
                    ))}
                  </div>
                </Card>

                {/* Analysis Details */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Detailed Analysis</h3>
                  <div className="space-y-4">
                    {analysis.analysis?.strengths && analysis.analysis.strengths.length > 0 && (
                      <div>
                        <h4 className="font-medium text-green-600 mb-2">✓ Strengths</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          {analysis.analysis.strengths.map((s: string, idx: number) => (
                            <li key={idx}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {analysis.analysis?.weaknesses && analysis.analysis.weaknesses.length > 0 && (
                      <div>
                        <h4 className="font-medium text-red-600 mb-2">⚠ Areas to Improve</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          {analysis.analysis.weaknesses.map((w: string, idx: number) => (
                            <li key={idx}>{w}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {analysis.analysis?.recommendations && analysis.analysis.recommendations.length > 0 && (
                      <div>
                        <h4 className="font-medium text-blue-600 mb-2">💡 Recommendations</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          {analysis.analysis.recommendations.map((r: string, idx: number) => (
                            <li key={idx}>{r}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Improved Version */}
                {analysis.improvedText && (
                  <Card className="p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">AI-Improved Version</h3>
                      <Button onClick={downloadImprovedResume} variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                    <div className="bg-muted/50 p-4 rounded-lg max-h-96 overflow-y-auto">
                      <pre className="text-sm whitespace-pre-wrap font-mono">
                        {analysis.improvedText}
                      </pre>
                    </div>
                  </Card>
                )}
              </>
            ) : (
              <Card className="p-12 text-center">
                <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Paste your resume and click "Analyze Resume" to get started
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
  );
}
