-- Create certificate collections table
CREATE TABLE public.certificate_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  badge_icon TEXT NOT NULL DEFAULT 'trophy',
  topic_pattern TEXT NOT NULL,
  min_certificates INTEGER NOT NULL DEFAULT 3,
  min_avg_score NUMERIC NOT NULL DEFAULT 8.0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user collection certificates table
CREATE TABLE public.user_collection_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  collection_id UUID NOT NULL REFERENCES certificate_collections(id) ON DELETE CASCADE,
  earned_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  certificate_ids UUID[] NOT NULL,
  avg_score NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, collection_id)
);

-- Enable RLS
ALTER TABLE public.certificate_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_collection_certificates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for certificate_collections (public read)
CREATE POLICY "Anyone can view collections"
  ON public.certificate_collections
  FOR SELECT
  USING (true);

-- RLS Policies for user_collection_certificates
CREATE POLICY "Users can view their own collection certificates"
  ON public.user_collection_certificates
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own collection certificates"
  ON public.user_collection_certificates
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_user_collection_certificates_user_id ON public.user_collection_certificates(user_id);
CREATE INDEX idx_user_collection_certificates_collection_id ON public.user_collection_certificates(collection_id);

-- Insert sample learning path collections
INSERT INTO public.certificate_collections (name, description, badge_icon, topic_pattern, min_certificates, min_avg_score) VALUES
('React Mastery', 'Complete mastery of React fundamentals and advanced concepts', 'trophy', 'React', 3, 8.0),
('JavaScript Expert', 'Deep understanding of JavaScript from basics to advanced topics', 'star', 'JavaScript', 4, 8.0),
('Full Stack Developer', 'Comprehensive knowledge across frontend and backend technologies', 'award', 'Full Stack|Backend|Frontend|API', 5, 7.5),
('Data Structures Pro', 'Master essential data structures and algorithms', 'brain', 'Data Structure|Algorithm', 3, 8.5);