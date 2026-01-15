-- Add more fields to interviews table for better AI context and user information
ALTER TABLE interviews 
ADD COLUMN IF NOT EXISTS learning_goals TEXT,
ADD COLUMN IF NOT EXISTS current_knowledge TEXT,
ADD COLUMN IF NOT EXISTS specific_challenges TEXT,
ADD COLUMN IF NOT EXISTS preferred_style TEXT;

-- Add AI performance rating fields to interview_ratings table
ALTER TABLE interview_ratings
ADD COLUMN IF NOT EXISTS ai_performance_score INTEGER,
ADD COLUMN IF NOT EXISTS strengths TEXT[],
ADD COLUMN IF NOT EXISTS areas_to_improve TEXT[],
ADD COLUMN IF NOT EXISTS key_concepts TEXT[],
ADD COLUMN IF NOT EXISTS detailed_analysis TEXT;