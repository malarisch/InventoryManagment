-- Drop old policies
drop policy if exists "customers_insert_if_company_member" on public.customers;
drop policy if exists "customers_update_if_company_member" on public.customers;
drop policy if exists "Allow insert for company users" on public.history;
drop policy if exists "Allow All for Company Users" on public.articles;
drop policy if exists "Allow All for Company Users" on public.asset_tag_templates;
drop policy if exists "Disallow delete for enrolled templates" on public.asset_tag_templates;
drop policy if exists "Disallow update for enrolled templates" on public.asset_tag_templates;
drop policy if exists "Allow All for Company Users" on public.asset_tags;
drop policy if exists "Allow All for Company Users" on public.cases;
drop policy if exists "Allow company members select" on public.companies;
drop policy if exists "allow owner full access" on public.companies;
drop policy if exists "Allow All for Company Users" on public.customers;
drop policy if exists "Allow All for Company Users" on public.equipments;
drop policy if exists "Allow select for company users" on public.history;
drop policy if exists "Allow All for Company Users" on public.job_assets_on_job;
drop policy if exists "Allow All for Company Users" on public.job_booked_assets;
drop policy if exists "Allow All for Company Users" on public.jobs;
drop policy if exists "Allow All for Company Users" on public.locations;
drop policy if exists "Company Members can view their co-workers" on public.users_companies;
drop policy if exists "Owners can add their company users" on public.users_companies;
drop policy if exists "Owners can remove their company users" on public.users_companies;
drop policy if exists "Owners cannot remove self from their company" on public.users_companies;

-- Drop old functions
drop function if exists public.owned_company_ids_current_user();
drop function if exists public.company_ids_current_user();

-- Helper function to check company membership
create or replace function public.is_company_member(p_company_id bigint)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from users_companies uc
    where uc.company_id = p_company_id
      and uc.user_id = auth.uid()
  ) or exists (
    select 1
    from companies c
    where c.id = p_company_id
      and c.owner_user_id = auth.uid()
  );
$$;

grant execute on function public.is_company_member(bigint) to authenticated;

-- Policies
create policy "Allow all for company members" on public.articles for all
  using (public.is_company_member(company_id));
create policy "Allow all for company members" on public.asset_tag_templates for all
  using (public.is_company_member(company_id));
create policy "Allow all for company members" on public.asset_tags for all
  using (public.is_company_member(company_id));
create policy "Allow all for company members" on public.cases for all
  using (public.is_company_member(company_id));
create policy "Allow all for company members" on public.customers for all
  using (public.is_company_member(company_id));
create policy "Allow all for company members" on public.equipments for all
  using (public.is_company_member(company_id));
create policy "Allow all for company members" on public.job_assets_on_job for all
  using (public.is_company_member(company_id));
create policy "Allow all for company members" on public.job_booked_assets for all
  using (public.is_company_member(company_id));
create policy "Allow all for company members" on public.jobs for all
  using (public.is_company_member(company_id));
create policy "Allow all for company members" on public.locations for all
  using (public.is_company_member(company_id));

-- Companies
create policy "Allow select for company members" on public.companies for select
  using (public.is_company_member(id));
create policy "Allow insert for authenticated users" on public.companies for insert
  with check (true);
create policy "Allow update for company owners" on public.companies for update
  using (owner_user_id = auth.uid());
create policy "Allow delete for company owners" on public.companies for delete
  using (owner_user_id = auth.uid());

-- Users Companies
create policy "Allow select for company members" on public.users_companies for select
  using (public.is_company_member(company_id));
create policy "Allow insert for company owners" on public.users_companies for insert
  with check (exists (
    select 1 from companies
    where id = company_id and owner_user_id = auth.uid()
  ));
create policy "Allow delete for company owners" on public.users_companies for delete
  using (exists (
    select 1 from companies
    where id = company_id and owner_user_id = auth.uid() and user_id <> auth.uid()
  ));

-- History
create policy "Allow select for company members" on public.history for select
  using (public.is_company_member(company_id));