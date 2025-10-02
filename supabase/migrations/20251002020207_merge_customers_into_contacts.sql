alter table public.contacts
  add column company_name text,
  add column forename text,
  add column surname text,
  add column customer_type text,
  add column address text,
  add column postal_code text,
  add column files jsonb,
  add column legacy_customer_id bigint;

create unique index contacts_legacy_customer_id_idx on public.contacts(legacy_customer_id) where legacy_customer_id is not null;

insert into public.contacts (
  company_id,
  created_at,
  created_by,
  contact_type,
  display_name,
  email,
  customer_type,
  company_name,
  forename,
  surname,
  address,
  postal_code,
  country,
  metadata,
  files,
  legacy_customer_id
)
select
  company_id,
  created_at,
  created_by,
  'customer',
  coalesce(company_name, trim(coalesce(forename, '') || ' ' || coalesce(surname, '')), 'Customer #' || id),
  email,
  type,
  company_name,
  forename,
  surname,
  address,
  postal_code,
  country,
  metadata,
  files,
  id
from public.customers;

update public.jobs
set contact_id = c.id
from public.contacts c
where c.legacy_customer_id is not null
  and jobs.customer_id = c.legacy_customer_id;

alter table public.jobs drop constraint if exists jobs_customer_id_fkey;
alter table public.jobs drop column if exists customer_id;

drop index if exists contacts_legacy_customer_id_idx;
alter table public.contacts drop column legacy_customer_id;

drop table if exists public.customers cascade;
