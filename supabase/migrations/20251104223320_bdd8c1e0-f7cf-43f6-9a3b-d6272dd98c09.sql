-- Create certificates table
CREATE TABLE public.certificates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  interview_id UUID REFERENCES public.interviews(id),
  achievement_type TEXT NOT NULL,
  topic TEXT NOT NULL,
  score INTEGER NOT NULL,
  issued_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  certificate_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own certificates"
  ON public.certificates
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create certificates"
  ON public.certificates
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX idx_certificates_user_id ON public.certificates(user_id);
CREATE INDEX idx_certificates_issued_date ON public.certificates(issued_date DESC);