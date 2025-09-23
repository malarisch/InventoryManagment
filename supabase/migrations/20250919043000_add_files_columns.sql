BEGIN;

alter table public.articles add column if not exists files jsonb;
alter table public.equipments add column if not exists files jsonb;
alter table public.locations add column if not exists files jsonb;
alter table public.customers add column if not exists files jsonb;
alter table public.jobs add column if not exists files jsonb;
alter table public.cases add column if not exists files jsonb;

alter table public.companies add column if not exists files jsonb;

COMMIT;

