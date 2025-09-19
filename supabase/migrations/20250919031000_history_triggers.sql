-- History trigger function + policies + triggers for main tables
BEGIN;

-- Allow insert into history for company users (RLS)
create policy "Allow insert for company users"
on "public"."history"
as permissive
for insert
to authenticated
with check ((company_id IN (select public.company_ids_current_user())));

-- Generic logging function
create or replace function public.log_history()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id bigint;
  v_changed_by uuid := auth.uid();
  v_table text := TG_TABLE_NAME;
  v_data_id bigint;
  v_old jsonb;
begin
  if TG_OP = 'INSERT' then
    v_company_id := COALESCE((NEW).company_id, CASE WHEN v_table = 'companies' THEN (NEW).id ELSE NULL END);
    v_data_id := (NEW).id;
    v_old := to_jsonb(NEW);
  elsif TG_OP = 'UPDATE' then
    v_company_id := COALESCE((NEW).company_id, (OLD).company_id, CASE WHEN v_table = 'companies' THEN COALESCE((NEW).id, (OLD).id) ELSE NULL END);
    v_data_id := COALESCE((NEW).id, (OLD).id);
    v_old := to_jsonb(OLD);
  else -- DELETE
    v_company_id := COALESCE((OLD).company_id, CASE WHEN v_table = 'companies' THEN (OLD).id ELSE NULL END);
    v_data_id := (OLD).id;
    v_old := to_jsonb(OLD);
  end if;
  insert into public.history (company_id, table_name, data_id, old_data, change_made_by)
  values (v_company_id, v_table, v_data_id, v_old, v_changed_by);
  return null;
end;
$$;

-- Helper to attach triggers to a table
-- Note: Using AFTER trigger so writes succeed before logging; history writes use RLS insert policy above.

-- Articles
drop trigger if exists trg_log_history_articles on public.articles;
create trigger trg_log_history_articles
after insert or update or delete on public.articles
for each row execute function public.log_history();

-- Equipments
drop trigger if exists trg_log_history_equipments on public.equipments;
create trigger trg_log_history_equipments
after insert or update or delete on public.equipments
for each row execute function public.log_history();

-- Locations
drop trigger if exists trg_log_history_locations on public.locations;
create trigger trg_log_history_locations
after insert or update or delete on public.locations
for each row execute function public.log_history();

-- Cases
drop trigger if exists trg_log_history_cases on public.cases;
create trigger trg_log_history_cases
after insert or update or delete on public.cases
for each row execute function public.log_history();

-- Customers
drop trigger if exists trg_log_history_customers on public.customers;
create trigger trg_log_history_customers
after insert or update or delete on public.customers
for each row execute function public.log_history();

-- Jobs
drop trigger if exists trg_log_history_jobs on public.jobs;
create trigger trg_log_history_jobs
after insert or update or delete on public.jobs
for each row execute function public.log_history();

-- Job booked assets
drop trigger if exists trg_log_history_job_booked_assets on public.job_booked_assets;
create trigger trg_log_history_job_booked_assets
after insert or update or delete on public.job_booked_assets
for each row execute function public.log_history();

-- Job assets on job
drop trigger if exists trg_log_history_job_assets_on_job on public.job_assets_on_job;
create trigger trg_log_history_job_assets_on_job
after insert or update or delete on public.job_assets_on_job
for each row execute function public.log_history();

-- Asset tags
drop trigger if exists trg_log_history_asset_tags on public.asset_tags;
create trigger trg_log_history_asset_tags
after insert or update or delete on public.asset_tags
for each row execute function public.log_history();

-- Companies (company_id is the company's own id)
drop trigger if exists trg_log_history_companies on public.companies;
create trigger trg_log_history_companies
after insert or update or delete on public.companies
for each row execute function public.log_history();

COMMIT;

