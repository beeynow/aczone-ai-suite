-- Fix infinite recursion issue in meeting_sessions policies only
-- Drop and recreate only the problematic meeting_sessions policies

DROP POLICY IF EXISTS "Users can view meeting sessions they're part of" ON meeting_sessions;
DROP POLICY IF EXISTS "Hosts can create meeting sessions" ON meeting_sessions;
DROP POLICY IF EXISTS "Hosts can update their meeting sessions" ON meeting_sessions;

-- Create security definer functions to avoid recursion
CREATE OR REPLACE FUNCTION public.is_meeting_host(_user_id uuid, _meeting_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM meeting_sessions 
    WHERE id = _meeting_id AND host_id = _user_id
  )
$$;

CREATE OR REPLACE FUNCTION public.is_meeting_participant(_user_id uuid, _meeting_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM meeting_participants 
    WHERE meeting_id = _meeting_id AND user_id = _user_id AND left_at IS NULL
  )
$$;

-- Recreate policies correctly without recursion
CREATE POLICY "Anyone can create meetings"
ON meeting_sessions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Anyone can view meetings they host or participate in"
ON meeting_sessions FOR SELECT
TO authenticated
USING (
  auth.uid() = host_id OR
  EXISTS (
    SELECT 1 FROM meeting_participants 
    WHERE meeting_id = meeting_sessions.id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Hosts can update their meetings"
ON meeting_sessions FOR UPDATE
TO authenticated
USING (auth.uid() = host_id)
WITH CHECK (auth.uid() = host_id);