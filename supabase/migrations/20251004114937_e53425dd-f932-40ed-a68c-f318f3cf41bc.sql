-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view participants of their interviews" ON interview_participants;
DROP POLICY IF EXISTS "Interview creators can add participants" ON interview_participants;
DROP POLICY IF EXISTS "Users can view their own interviews" ON interviews;

-- Create security definer functions to avoid infinite recursion
CREATE OR REPLACE FUNCTION public.is_interview_participant(_user_id uuid, _interview_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM interview_participants
    WHERE user_id = _user_id AND interview_id = _interview_id
  )
$$;

CREATE OR REPLACE FUNCTION public.is_interview_creator(_user_id uuid, _interview_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM interviews
    WHERE id = _interview_id AND creator_id = _user_id
  )
$$;

-- Recreate policies using security definer functions
CREATE POLICY "Users can view their own interviews"
ON interviews FOR SELECT
USING (
  auth.uid() = creator_id 
  OR public.is_interview_participant(auth.uid(), id)
);

CREATE POLICY "Users can view participants of their interviews"
ON interview_participants FOR SELECT
USING (
  public.is_interview_creator(auth.uid(), interview_id)
  OR user_id = auth.uid()
);

CREATE POLICY "Interview creators can add participants"
ON interview_participants FOR INSERT
WITH CHECK (
  public.is_interview_creator(auth.uid(), interview_id)
);