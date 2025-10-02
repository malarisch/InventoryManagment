alter table public.jobs
  add column contact_id bigint references public.contacts(id) on delete set null;

create index jobs_contact_id_idx on public.jobs (contact_id);
