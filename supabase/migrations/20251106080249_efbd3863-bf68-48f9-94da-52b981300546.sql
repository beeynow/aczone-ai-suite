-- Fix search_path for security functions by dropping dependencies first

DROP TRIGGER IF EXISTS trigger_set_joining_code ON public.interviews;
DROP FUNCTION IF EXISTS set_interview_joining_code();
DROP FUNCTION IF EXISTS generate_joining_code();

CREATE OR REPLACE FUNCTION generate_joining_code()
RETURNS TEXT 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

CREATE OR REPLACE FUNCTION set_interview_joining_code()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

CREATE TRIGGER trigger_set_joining_code
  BEFORE INSERT ON public.interviews
  FOR EACH ROW
  EXECUTE FUNCTION set_interview_joining_code();