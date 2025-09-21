begin;

-- Create a public storage bucket for attachments if it doesn't exist
insert into storage.buckets (id, name, public)
values ('attachments','attachments', true)
on conflict (id) do nothing;

-- Add `files jsonb` with empty array default to core business tables
alter table public.articles add column if not exists files jsonb not null default '[]'::jsonb;
alter table public.equipments add column if not exists files jsonb not null default '[]'::jsonb;
alter table public.locations add column if not exists files jsonb not null default '[]'::jsonb;
alter table public.cases add column if not exists files jsonb not null default '[]'::jsonb;
alter table public.customers add column if not exists files jsonb not null default '[]'::jsonb;
alter table public.jobs add column if not exists files jsonb not null default '[]'::jsonb;

comment on column public.articles.files is 'Array of file attachments: [{id, link, name?, description?}].';
comment on column public.equipments.files is 'Array of file attachments: [{id, link, name?, description?}].';
comment on column public.locations.files is 'Array of file attachments: [{id, link, name?, description?}].';
comment on column public.cases.files is 'Array of file attachments: [{id, link, name?, description?}].';
comment on column public.customers.files is 'Array of file attachments: [{id, link, name?, description?}].';
comment on column public.jobs.files is 'Array of file attachments: [{id, link, name?, description?}].';

commit;

