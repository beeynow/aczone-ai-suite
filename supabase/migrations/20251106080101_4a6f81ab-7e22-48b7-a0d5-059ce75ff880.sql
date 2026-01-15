-- Add joining_code to interviews table
ALTER TABLE public.interviews 
ADD COLUMN IF NOT EXISTS joining_code TEXT UNIQUE;

-- Create function to generate random 6-character joining code
CREATE OR REPLACE FUNCTION generate_joining_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate joining code on insert
CREATE OR REPLACE FUNCTION set_interview_joining_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.joining_code IS NULL THEN
    NEW.joining_code := generate_joining_code();
    -- Ensure uniqueness
    WHILE EXISTS (SELECT 1 FROM interviews WHERE joining_code = NEW.joining_code) LOOP
      NEW.joining_code := generate_joining_code();
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_joining_code ON public.interviews;
CREATE TRIGGER trigger_set_joining_code
  BEFORE INSERT ON public.interviews
  FOR EACH ROW
  EXECUTE FUNCTION set_interview_joining_code();

-- Update RLS policy to allow users to view interviews they can join via code
CREATE POLICY "Users can view interviews with joining code" 
ON public.interviews 
FOR SELECT 
USING (
  joining_code IS NOT NULL AND type = 'group'
);

-- Create interview_participants_realtime table for real-time presence
CREATE TABLE IF NOT EXISTS public.interview_participants_realtime (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id UUID NOT NULL REFERENCES public.interviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(interview_id, user_id)
);

ALTER TABLE public.interview_participants_realtime ENABLE ROW LEVEL SECURITY;

-- RLS for interview_participants_realtime
CREATE POLICY "Participants can view active participants"
ON public.interview_participants_realtime
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM interviews 
    WHERE interviews.id = interview_participants_realtime.interview_id
    AND (
      interviews.creator_id = auth.uid() 
      OR EXISTS (
        SELECT 1 FROM interview_participants 
        WHERE interview_participants.interview_id = interviews.id 
        AND interview_participants.user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "Participants can insert their presence"
ON public.interview_participants_realtime
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Participants can update their presence"
ON public.interview_participants_realtime
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Participants can delete their presence"
ON public.interview_participants_realtime
FOR DELETE
USING (auth.uid() = user_id);

-- Enable realtime for interview_participants_realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.interview_participants_realtime;