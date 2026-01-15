-- Fix infinite recursion in recruiter_members SELECT policy using security definer function
create or replace function public.user_org_ids(_user_id uuid)
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id from public.recruiter_members where user_id = _user_id
$$;

-- Replace recursive policy
drop policy if exists "Members can view their organization members" on public.recruiter_members;
create policy "Members can view their organization members"
on public.recruiter_members
for select
using (
  (user_id = auth.uid())
  OR (organization_id in (select public.user_org_ids(auth.uid())))
);
