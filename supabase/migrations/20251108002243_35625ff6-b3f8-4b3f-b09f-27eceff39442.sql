-- Create enum types for the new features
CREATE TYPE question_category AS ENUM ('medical', 'law', 'finance', 'tech', 'business', 'education', 'engineering', 'sales', 'marketing', 'other');
CREATE TYPE difficulty_level AS ENUM ('beginner', 'intermediate', 'expert');
CREATE TYPE language_code AS ENUM ('en', 'fr', 'ar', 'hi', 'es', 'pt', 'de', 'zh');

-- Question bank table
CREATE TABLE public.question_bank (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category question_category NOT NULL,
  difficulty difficulty_level NOT NULL,
  question_text TEXT NOT NULL,
  expected_keywords TEXT[],
  language language_code DEFAULT 'en',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true
);

-- Interview answers table with AI scoring
CREATE TABLE public.interview_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id UUID REFERENCES public.interviews(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  question_id UUID REFERENCES public.question_bank(id),
  question_text TEXT NOT NULL,
  answer_text TEXT NOT NULL,
  transcription TEXT,
  clarity_score INTEGER CHECK (clarity_score >= 0 AND clarity_score <= 100),
  grammar_score INTEGER CHECK (grammar_score >= 0 AND grammar_score <= 100),
  confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
  tone_score INTEGER CHECK (tone_score >= 0 AND tone_score <= 100),
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
  ai_feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Interview analytics table
CREATE TABLE public.interview_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id UUID REFERENCES public.interviews(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  total_questions INTEGER DEFAULT 0,
  total_answers INTEGER DEFAULT 0,
  average_score NUMERIC(5,2),
  time_spent_seconds INTEGER,
  category question_category,
  difficulty difficulty_level,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  session_data JSONB
);

-- User resumes table
CREATE TABLE public.user_resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  original_text TEXT NOT NULL,
  improved_text TEXT,
  clarity_rating INTEGER CHECK (clarity_rating >= 0 AND clarity_rating <= 100),
  structure_rating INTEGER CHECK (structure_rating >= 0 AND structure_rating <= 100),
  relevance_rating INTEGER CHECK (relevance_rating >= 0 AND relevance_rating <= 100),
  suggested_roles TEXT[],
  ai_analysis JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Recruiter organizations table
CREATE TABLE public.recruiter_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  website TEXT,
  logo_url TEXT,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

-- Recruiter members table
CREATE TABLE public.recruiter_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.recruiter_organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- Candidate reports table
CREATE TABLE public.candidate_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id UUID REFERENCES public.interviews(id) ON DELETE CASCADE NOT NULL,
  candidate_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recruiter_id UUID REFERENCES auth.users(id),
  organization_id UUID REFERENCES public.recruiter_organizations(id),
  overall_rating INTEGER CHECK (overall_rating >= 0 AND overall_rating <= 100),
  strengths TEXT[],
  weaknesses TEXT[],
  recommended_action TEXT,
  detailed_analysis JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User preferences table for language and settings
CREATE TABLE public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  preferred_language language_code DEFAULT 'en',
  ui_language language_code DEFAULT 'en',
  tts_enabled BOOLEAN DEFAULT true,
  stt_enabled BOOLEAN DEFAULT true,
  theme TEXT DEFAULT 'light',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.question_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recruiter_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recruiter_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for question_bank
CREATE POLICY "Anyone can view active questions"
  ON public.question_bank FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage questions"
  ON public.question_bank FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for interview_answers
CREATE POLICY "Users can view their own answers"
  ON public.interview_answers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own answers"
  ON public.interview_answers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Recruiters can view candidate answers"
  ON public.interview_answers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.recruiter_members rm
      JOIN public.interviews i ON i.id = interview_answers.interview_id
      WHERE rm.user_id = auth.uid()
    )
  );

-- RLS Policies for interview_analytics
CREATE POLICY "Users can view their own analytics"
  ON public.interview_analytics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analytics"
  ON public.interview_analytics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Recruiters can view candidate analytics"
  ON public.interview_analytics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.recruiter_members rm
      JOIN public.interviews i ON i.id = interview_analytics.interview_id
      WHERE rm.user_id = auth.uid()
    )
  );

-- RLS Policies for user_resumes
CREATE POLICY "Users can manage their own resumes"
  ON public.user_resumes FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for recruiter_organizations
CREATE POLICY "Anyone can view active organizations"
  ON public.recruiter_organizations FOR SELECT
  USING (is_active = true);

CREATE POLICY "Users can create organizations"
  ON public.recruiter_organizations FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creators can update their organizations"
  ON public.recruiter_organizations FOR UPDATE
  USING (auth.uid() = created_by);

-- RLS Policies for recruiter_members
CREATE POLICY "Members can view their organization members"
  ON public.recruiter_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.recruiter_members
      WHERE organization_id = recruiter_members.organization_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Organization admins can manage members"
  ON public.recruiter_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.recruiter_organizations
      WHERE id = recruiter_members.organization_id
      AND created_by = auth.uid()
    )
  );

-- RLS Policies for candidate_reports
CREATE POLICY "Candidates can view their own reports"
  ON public.candidate_reports FOR SELECT
  USING (auth.uid() = candidate_id);

CREATE POLICY "Recruiters can manage reports"
  ON public.candidate_reports FOR ALL
  USING (
    auth.uid() = recruiter_id OR
    EXISTS (
      SELECT 1 FROM public.recruiter_members
      WHERE organization_id = candidate_reports.organization_id
      AND user_id = auth.uid()
    )
  );

-- RLS Policies for user_preferences
CREATE POLICY "Users can manage their own preferences"
  ON public.user_preferences FOR ALL
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_question_bank_category ON public.question_bank(category);
CREATE INDEX idx_question_bank_difficulty ON public.question_bank(difficulty);
CREATE INDEX idx_interview_answers_interview_id ON public.interview_answers(interview_id);
CREATE INDEX idx_interview_answers_user_id ON public.interview_answers(user_id);
CREATE INDEX idx_interview_analytics_user_id ON public.interview_analytics(user_id);
CREATE INDEX idx_user_resumes_user_id ON public.user_resumes(user_id);
CREATE INDEX idx_recruiter_members_org_id ON public.recruiter_members(organization_id);
CREATE INDEX idx_candidate_reports_candidate_id ON public.candidate_reports(candidate_id);

-- Add trigger for updating updated_at timestamp
CREATE TRIGGER update_user_resumes_updated_at
  BEFORE UPDATE ON public.user_resumes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample questions
INSERT INTO public.question_bank (category, difficulty, question_text, expected_keywords, language) VALUES
('tech', 'beginner', 'What is your experience with web development?', ARRAY['HTML', 'CSS', 'JavaScript', 'frontend', 'backend'], 'en'),
('tech', 'intermediate', 'Explain the concept of RESTful APIs and their importance.', ARRAY['REST', 'HTTP', 'API', 'endpoints', 'stateless'], 'en'),
('tech', 'expert', 'How would you design a scalable microservices architecture?', ARRAY['microservices', 'scalability', 'containers', 'orchestration', 'distributed'], 'en'),
('medical', 'beginner', 'What motivated you to pursue a career in healthcare?', ARRAY['passion', 'helping', 'patient', 'care', 'medicine'], 'en'),
('medical', 'intermediate', 'Describe your experience with patient care protocols.', ARRAY['protocol', 'safety', 'procedures', 'documentation', 'compliance'], 'en'),
('law', 'beginner', 'Why did you choose to study law?', ARRAY['justice', 'legal', 'advocacy', 'rights', 'society'], 'en'),
('law', 'intermediate', 'Explain the difference between civil and criminal law.', ARRAY['civil', 'criminal', 'procedure', 'evidence', 'burden'], 'en'),
('finance', 'beginner', 'What interests you about the finance industry?', ARRAY['markets', 'analysis', 'investment', 'economics', 'numbers'], 'en'),
('finance', 'intermediate', 'How do you analyze financial statements?', ARRAY['balance sheet', 'income', 'cash flow', 'ratios', 'metrics'], 'en'),
('business', 'beginner', 'Tell me about your leadership experience.', ARRAY['team', 'lead', 'project', 'management', 'collaboration'], 'en'),
('business', 'intermediate', 'How do you handle conflict in a team environment?', ARRAY['communication', 'resolution', 'mediation', 'compromise', 'collaboration'], 'en');
