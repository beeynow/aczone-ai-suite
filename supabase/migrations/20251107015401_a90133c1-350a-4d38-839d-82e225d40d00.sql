-- Drop the restrictive INSERT policy on interview_participants
DROP POLICY IF EXISTS "Interview creators can add participants" ON public.interview_participants;

-- Create a new policy that allows users to add themselves to group interviews with valid joining codes
CREATE POLICY "Users can join group interviews with valid code"
ON public.interview_participants
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.interviews
    WHERE interviews.id = interview_participants.interview_id
    AND interviews.type = 'group'
    AND interviews.joining_code IS NOT NULL
    AND interviews.status != 'completed'
  )
);

-- Also allow creators to add participants
CREATE POLICY "Creators can add participants to their interviews"
ON public.interview_participants
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.interviews
    WHERE interviews.id = interview_participants.interview_id
    AND interviews.creator_id = auth.uid()
  )
);