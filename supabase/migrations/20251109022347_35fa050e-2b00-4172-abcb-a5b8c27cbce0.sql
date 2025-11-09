-- Fix infinite recursion in recruiter_members RLS policy
DROP POLICY IF EXISTS "Members can view their organization members" ON recruiter_members;

CREATE POLICY "Members can view their organization members"
ON recruiter_members
FOR SELECT
USING (
  user_id = auth.uid() 
  OR organization_id IN (
    SELECT organization_id 
    FROM recruiter_members 
    WHERE user_id = auth.uid()
  )
);