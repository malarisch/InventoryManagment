-- profiles RLS policies
-- Allows users to:
-- 1) select all profiles that belong to companies they are a member of
-- 2) insert/update/delete only their own profile row

-- enable rls on profiles (idempotent if already enabled)
alter table public.profiles enable row level security;

-- see company co-members' profiles
drop policy if exists profiles_select_company_members on public.profiles;
create policy profiles_select_company_members
on public.profiles
as permissive
for select
to authenticated
using (
  exists (
    select 1
    from public.users_companies as uc_target
    join public.users_companies as uc_me
      on uc_me.company_id = uc_target.company_id
    where uc_target.user_id = public.profiles.id
      and uc_me.user_id = auth.uid()
  )
);

-- allow users to manage only their own profile
drop policy if exists profiles_modify_own_row on public.profiles;
create policy profiles_modify_own_row
on public.profiles
as permissive
for all
to authenticated
using (public.profiles.id = auth.uid())
with check (public.profiles.id = auth.uid());

comment on policy profiles_select_company_members on public.profiles is 'Authenticated users can read profiles of users who share a company membership with them via public.users_companies.';
comment on policy profiles_modify_own_row on public.profiles is 'Authenticated users may insert, update, and delete only their own profile row.';

