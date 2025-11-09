-- Fix infinite recursion in meeting_sessions RLS policies
DROP POLICY IF EXISTS "Users can view meeting sessions they're part of" ON public.meeting_sessions;

-- Create corrected policy without recursion
CREATE POLICY "Users can view meeting sessions they're part of"
  ON public.meeting_sessions
  FOR SELECT
  USING (
    host_id = auth.uid() 
    OR EXISTS (
      SELECT 1 
      FROM public.meeting_participants 
      WHERE meeting_participants.meeting_id = meeting_sessions.id 
      AND meeting_participants.user_id = auth.uid()
    )
  );