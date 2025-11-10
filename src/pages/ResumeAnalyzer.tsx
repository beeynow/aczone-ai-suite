import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Sparkles, Download, Loader2, Upload, X, History, Target, Brain, TrendingUp, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import mammoth from "mammoth";
import ResumeTemplates from "@/components/ResumeTemplates";

export default function ResumeAnalyzer() {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [dragActive, setDragActive] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [activeTab, setActiveTab] = useState("upload");

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_resumes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const extractTextFromFile = async (file: File): Promise<string> => {
    const fileType = file.type;
    const fileName = file.name.toLowerCase();

    // Handle DOCX files
    if (fileType.includes('wordprocessingml') || fileName.endsWith('.docx')) {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value;
    }

    // Handle PDF files (basic text extraction)
    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      // For PDF, we'll use the document parser
      toast.info('Processing PDF file...');
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const text = e.target?.result as string;
          resolve(text);
        };
        reader.onerror = reject;
        reader.readAsText(file);
      });
    }

    // Handle plain text files
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        resolve(text);
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const handleFile = async (file: File) => {
    const fileName = file.name.toLowerCase();
    const validExtensions = ['.txt', '.pdf', '.docx', '.doc'];
    const isValid = validExtensions.some(ext => fileName.endsWith(ext));

    if (!isValid) {
      toast.error('Please upload a TXT, PDF, or DOCX file');
      return;
    }

    setResumeFile(file);
    try {
      const text = await extractTextFromFile(file);
      setResumeText(text);
      toast.success('Resume uploaded successfully!');
      setActiveTab("analyze");
    } catch (error) {
      console.error('Error reading file:', error);
      toast.error('Failed to read file. Please try another format.');
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const analyzeResume = async () => {
    if (!resumeText.trim()) {
      toast.error('Please upload your resume first');
      return;
    }

    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-resume', {
        body: { resumeText, language: 'en' }
      });

      if (error) throw error;

      setAnalysis(data);
      setActiveTab("results");
      
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
        await loadHistory();
      }

      toast.success('Resume analyzed successfully!');
      } catch (error: any) {
        console.error('Error analyzing resume:', error);
        const message = typeof error === 'string' ? error : (error?.message || error?.error || 'Failed to analyze resume');
        if (String(message).includes('Rate limit')) {
          toast.error('AI rate limit reached. Please try again shortly.');
        } else if (String(message).includes('Payment')) {
          toast.error('AI credits exhausted. Please add credits to your workspace.');
        } else {
          toast.error(message);
        }
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
    if (rating >= 80) return 'text-emerald-600 dark:text-emerald-400';
    if (rating >= 60) return 'text-amber-600 dark:text-amber-400';
    return 'text-rose-600 dark:text-rose-400';
  };

  const getScoreGrade = (score: number) => {
    if (score >= 90) return { grade: 'A+', color: 'text-emerald-600 dark:text-emerald-400' };
    if (score >= 80) return { grade: 'A', color: 'text-emerald-600 dark:text-emerald-400' };
    if (score >= 70) return { grade: 'B', color: 'text-blue-600 dark:text-blue-400' };
    if (score >= 60) return { grade: 'C', color: 'text-amber-600 dark:text-amber-400' };
    return { grade: 'D', color: 'text-rose-600 dark:text-rose-400' };
  };

  const loadHistoryItem = (item: any) => {
    setResumeText(item.original_text);
    setAnalysis({
      clarityRating: item.clarity_rating,
      structureRating: item.structure_rating,
      relevanceRating: item.relevance_rating,
      improvedText: item.improved_text,
      suggestedRoles: item.suggested_roles,
      analysis: item.ai_analysis
    });
    setActiveTab("results");
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
          AI Resume Analyzer
        </h1>
        <p className="text-muted-foreground">
          Get comprehensive AI-powered analysis with ATS scoring, keyword insights, and professional recommendations
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="upload" className="gap-2">
            <Upload className="w-4 h-4" />
            Upload
          </TabsTrigger>
          <TabsTrigger value="analyze" disabled={!resumeText} className="gap-2">
            <Brain className="w-4 h-4" />
            Analyze
          </TabsTrigger>
          <TabsTrigger value="results" disabled={!analysis} className="gap-2">
            <TrendingUp className="w-4 h-4" />
            Results
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Upload className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold">Upload Your Resume</h2>
              </div>
              
              {!resumeFile ? (
                <div
                  className={`border-2 border-dashed rounded-lg p-12 text-center transition-all duration-300 ${
                    dragActive 
                      ? 'border-primary bg-primary/10 scale-105' 
                      : 'border-border hover:border-primary/50 hover:bg-accent/50'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <Upload className="w-16 h-16 mx-auto mb-4 text-primary animate-pulse" />
                  <p className="text-lg font-semibold mb-2">Drop your resume here</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Supports TXT, PDF, DOCX formats
                  </p>
                  <input
                    type="file"
                    id="resume-upload"
                    className="hidden"
                    accept=".txt,.pdf,.docx,.doc"
                    onChange={handleChange}
                  />
                  <Button asChild>
                    <label htmlFor="resume-upload" className="cursor-pointer">
                      <FileText className="w-4 h-4 mr-2" />
                      Select File
                    </label>
                  </Button>
                  <div className="mt-3">
                    <ResumeTemplates onSelect={(text) => {
                      setResumeText(text);
                      setAnalysis(null);
                      setActiveTab("analyze");
                    }} />
                  </div>
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center justify-between p-4 bg-accent rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <FileText className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">{resumeFile.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(resumeFile.size / 1024).toFixed(2)} KB • {resumeText.split(/\s+/).filter(w => w).length} words
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setResumeFile(null);
                        setResumeText('');
                        setAnalysis(null);
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="p-4 bg-muted rounded-lg max-h-80 overflow-y-auto border">
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">
                      {resumeText.substring(0, 1000)}{resumeText.length > 1000 ? '...' : ''}
                    </p>
                  </div>
                </div>
              )}
            </Card>

            {/* History Section */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <History className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold">Recent Analyses</h2>
              </div>
              
              {loadingHistory ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : history.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {history.slice(0, 5).map((item) => (
                    <div
                      key={item.id}
                      className="p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => loadHistoryItem(item)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {item.original_text.substring(0, 100)}...
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(item.created_at).toLocaleDateString()} • Score: {item.clarity_rating}%
                          </p>
                        </div>
                        <Badge variant="secondary" className="ml-2">
                          View
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No previous analyses found
                </p>
              )}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analyze" className="space-y-6">
          <Card className="p-8 text-center">
            <div className="mb-6">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Ready to Analyze</h2>
              <p className="text-muted-foreground mb-6">
                Our AI will analyze your resume across multiple dimensions including ATS compatibility, keyword optimization, and structure quality.
              </p>
            </div>

            <Button
              onClick={analyzeResume}
              disabled={analyzing || !resumeText.trim()}
              size="lg"
              className="w-full max-w-md"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Analyzing with AI...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Analyze Resume with AI
                </>
              )}
            </Button>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
              <div className="p-4 border rounded-lg">
                <Target className="w-8 h-8 text-primary mb-2" />
                <h3 className="font-semibold mb-1">ATS Scoring</h3>
                <p className="text-sm text-muted-foreground">
                  Check how well your resume performs with applicant tracking systems
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <Brain className="w-8 h-8 text-primary mb-2" />
                <h3 className="font-semibold mb-1">AI Insights</h3>
                <p className="text-sm text-muted-foreground">
                  Get detailed analysis of strengths, weaknesses, and recommendations
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <TrendingUp className="w-8 h-8 text-primary mb-2" />
                <h3 className="font-semibold mb-1">Career Guidance</h3>
                <p className="text-sm text-muted-foreground">
                  Discover suitable job roles and industry insights
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {analysis ? (
              <>
                {/* Overall Score Card */}
                <Card className="p-6 lg:col-span-3 bg-gradient-to-br from-primary/5 via-primary/10 to-transparent border-primary/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Overall Resume Score</h3>
                      <div className="flex items-baseline gap-3">
                        <span className={`text-5xl font-bold ${getRatingColor(analysis.overallScore || Math.round((analysis.clarityRating + analysis.structureRating + analysis.relevanceRating) / 3))}`}>
                          {analysis.overallScore || Math.round((analysis.clarityRating + analysis.structureRating + analysis.relevanceRating) / 3)}
                        </span>
                        <span className={`text-3xl font-bold ${getScoreGrade(analysis.overallScore || Math.round((analysis.clarityRating + analysis.structureRating + analysis.relevanceRating) / 3)).color}`}>
                          {getScoreGrade(analysis.overallScore || Math.round((analysis.clarityRating + analysis.structureRating + analysis.relevanceRating) / 3)).grade}
                        </span>
                      </div>
                    </div>
                    <Button onClick={downloadImprovedResume} size="lg" className="gap-2">
                      <Download className="w-5 h-5" />
                      Download Improved
                    </Button>
                  </div>
                </Card>

                {/* Detailed Scores */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Detailed Ratings
                  </h3>
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

                    {analysis.atsScore && (
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium">ATS Score</span>
                          <span className={`text-sm font-bold ${getRatingColor(analysis.atsScore)}`}>
                            {analysis.atsScore}%
                          </span>
                        </div>
                        <Progress value={analysis.atsScore} className="h-2" />
                      </div>
                    )}

                    {analysis.impactScore && (
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium">Impact</span>
                          <span className={`text-sm font-bold ${getRatingColor(analysis.impactScore)}`}>
                            {analysis.impactScore}%
                          </span>
                        </div>
                        <Progress value={analysis.impactScore} className="h-2" />
                      </div>
                    )}
                  </div>
                </Card>

                {/* Suggested Roles */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    Suggested Job Roles
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {analysis.suggestedRoles?.map((role: string, idx: number) => (
                      <Badge key={idx} className="text-sm py-2 px-4 bg-primary/10 text-primary hover:bg-primary/20 border-primary/20">
                        {role}
                      </Badge>
                    ))}
                  </div>
                </Card>

                {/* Missing Keywords */}
                {analysis.analysis?.missingKeywords && analysis.analysis.missingKeywords.length > 0 && (
                  <Card className="p-6 border-amber-200 dark:border-amber-900/30 bg-amber-50/50 dark:bg-amber-950/20">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-amber-700 dark:text-amber-400">
                      <AlertCircle className="w-5 h-5" />
                      Missing Keywords
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {analysis.analysis.missingKeywords.map((keyword: string, idx: number) => (
                        <Badge key={idx} variant="outline" className="border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">
                      Consider adding these keywords to improve ATS compatibility
                    </p>
                  </Card>
                )}

                {/* Analysis Details */}
                <Card className="p-6 lg:col-span-2">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Brain className="w-5 h-5 text-primary" />
                    Detailed Analysis
                  </h3>
                  <div className="space-y-6">
                    {analysis.analysis?.strengths && analysis.analysis.strengths.length > 0 && (
                      <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-900/30">
                        <h4 className="font-semibold text-emerald-700 dark:text-emerald-400 mb-3 flex items-center gap-2">
                          ✓ Strengths
                        </h4>
                        <ul className="space-y-2">
                          {analysis.analysis.strengths.map((s: string, idx: number) => (
                            <li key={idx} className="text-sm flex items-start gap-2">
                              <span className="text-emerald-600 dark:text-emerald-400 mt-0.5">•</span>
                              <span>{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {analysis.analysis?.weaknesses && analysis.analysis.weaknesses.length > 0 && (
                      <div className="p-4 bg-rose-50 dark:bg-rose-950/20 rounded-lg border border-rose-200 dark:border-rose-900/30">
                        <h4 className="font-semibold text-rose-700 dark:text-rose-400 mb-3 flex items-center gap-2">
                          ⚠ Areas to Improve
                        </h4>
                        <ul className="space-y-2">
                          {analysis.analysis.weaknesses.map((w: string, idx: number) => (
                            <li key={idx} className="text-sm flex items-start gap-2">
                              <span className="text-rose-600 dark:text-rose-400 mt-0.5">•</span>
                              <span>{w}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {analysis.analysis?.recommendations && analysis.analysis.recommendations.length > 0 && (
                      <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900/30">
                        <h4 className="font-semibold text-blue-700 dark:text-blue-400 mb-3 flex items-center gap-2">
                          💡 Recommendations
                        </h4>
                        <ul className="space-y-2">
                          {analysis.analysis.recommendations.map((r: string, idx: number) => (
                            <li key={idx} className="text-sm flex items-start gap-2">
                              <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                              <span>{r}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {analysis.analysis?.atsOptimizationTips && analysis.analysis.atsOptimizationTips.length > 0 && (
                      <div className="p-4 bg-violet-50 dark:bg-violet-950/20 rounded-lg border border-violet-200 dark:border-violet-900/30">
                        <h4 className="font-semibold text-violet-700 dark:text-violet-400 mb-3 flex items-center gap-2">
                          🎯 ATS Optimization Tips
                        </h4>
                        <ul className="space-y-2">
                          {analysis.analysis.atsOptimizationTips.map((tip: string, idx: number) => (
                            <li key={idx} className="text-sm flex items-start gap-2">
                              <span className="text-violet-600 dark:text-violet-400 mt-0.5">•</span>
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Improved Version */}
                {analysis.improvedText && (
                  <Card className="p-6 lg:col-span-3">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-primary" />
                        AI-Improved Version
                      </h3>
                    </div>
                    <div className="bg-muted p-6 rounded-lg max-h-[600px] overflow-y-auto border">
                      <pre className="text-sm whitespace-pre-wrap leading-relaxed">
                        {analysis.improvedText}
                      </pre>
                    </div>
                  </Card>
                )}
              </>
            ) : null}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
