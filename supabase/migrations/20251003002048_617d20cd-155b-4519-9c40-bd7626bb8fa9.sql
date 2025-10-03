-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Create interviews table
CREATE TABLE public.interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('personal', 'group')),
  experience_level TEXT NOT NULL,
  topic TEXT NOT NULL,
  issue TEXT,
  scheduled_time TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  room_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create interview_participants table
CREATE TABLE public.interview_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id UUID NOT NULL REFERENCES public.interviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE,
  left_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(interview_id, user_id)
);

-- Create interview_messages table
CREATE TABLE public.interview_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id UUID NOT NULL REFERENCES public.interviews(id) ON DELETE CASCADE,
  user_id UUID,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create interview_ratings table
CREATE TABLE public.interview_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id UUID NOT NULL REFERENCES public.interviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  progress_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(interview_id, user_id)
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_ratings ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- User roles policies
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Interviews policies
CREATE POLICY "Users can view their own interviews"
  ON public.interviews FOR SELECT
  USING (auth.uid() = creator_id OR 
         EXISTS (SELECT 1 FROM public.interview_participants WHERE interview_id = interviews.id AND user_id = auth.uid()));

CREATE POLICY "Users can create interviews"
  ON public.interviews FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update their interviews"
  ON public.interviews FOR UPDATE
  USING (auth.uid() = creator_id);

CREATE POLICY "Creators can delete their interviews"
  ON public.interviews FOR DELETE
  USING (auth.uid() = creator_id);

-- Interview participants policies
CREATE POLICY "Users can view participants of their interviews"
  ON public.interview_participants FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.interviews 
    WHERE id = interview_participants.interview_id 
    AND (creator_id = auth.uid() OR id IN (
      SELECT interview_id FROM public.interview_participants WHERE user_id = auth.uid()
    ))
  ));

CREATE POLICY "Interview creators can add participants"
  ON public.interview_participants FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.interviews 
    WHERE id = interview_id AND creator_id = auth.uid()
  ));

-- Interview messages policies
CREATE POLICY "Participants can view messages in their interviews"
  ON public.interview_messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.interviews 
    WHERE id = interview_messages.interview_id 
    AND (creator_id = auth.uid() OR id IN (
      SELECT interview_id FROM public.interview_participants WHERE user_id = auth.uid()
    ))
  ));

CREATE POLICY "Participants can send messages"
  ON public.interview_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id AND EXISTS (
    SELECT 1 FROM public.interviews 
    WHERE id = interview_id 
    AND (creator_id = auth.uid() OR id IN (
      SELECT interview_id FROM public.interview_participants WHERE user_id = auth.uid()
    ))
  ));

-- Interview ratings policies
CREATE POLICY "Users can view ratings for their interviews"
  ON public.interview_ratings FOR SELECT
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.interviews 
    WHERE id = interview_ratings.interview_id AND creator_id = auth.uid()
  ));

CREATE POLICY "Users can rate interviews they participated in"
  ON public.interview_ratings FOR INSERT
  WITH CHECK (auth.uid() = user_id AND EXISTS (
    SELECT 1 FROM public.interviews 
    WHERE id = interview_id 
    AND (creator_id = auth.uid() OR id IN (
      SELECT interview_id FROM public.interview_participants WHERE user_id = auth.uid()
    ))
  ));

CREATE POLICY "Users can update their own ratings"
  ON public.interview_ratings FOR UPDATE
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_interviews_updated_at
  BEFORE UPDATE ON public.interviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for interview messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.interview_messages;