-- Break RLS recursion and add real notifications table

-- 1) Helper functions (idempotent)
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

-- 2) Fix meeting_sessions SELECT policy to avoid recursion
DROP POLICY IF EXISTS "Anyone can view meetings they host or participate in" ON meeting_sessions;
CREATE POLICY "Anyone can view meetings they host or participate in"
ON meeting_sessions FOR SELECT
TO authenticated
USING (
  public.is_meeting_host(auth.uid(), id) OR
  public.is_meeting_participant(auth.uid(), id)
);

-- 3) Fix meeting_participants SELECT policy to avoid referencing meeting_sessions directly
DROP POLICY IF EXISTS "Users can view participants in their meetings" ON meeting_participants;
CREATE POLICY "Users can view participants in their meetings"
ON meeting_participants FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR
  public.is_meeting_host(auth.uid(), meeting_id)
);

-- 4) Real notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'system',
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Owner policies
DROP POLICY IF EXISTS "Users can view their notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can create their notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete their notifications" ON public.notifications;

CREATE POLICY "Users can view their notifications"
ON public.notifications FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their notifications"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their notifications"
ON public.notifications FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their notifications"
ON public.notifications FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON public.notifications(user_id, created_at DESC);
