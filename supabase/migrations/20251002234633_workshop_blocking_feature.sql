-- Add files column to workshop_todos for photo attachments
alter table public.workshop_todos
  add column if not exists files jsonb not null default '[]'::jsonb;

comment on column public.workshop_todos.files is 'Array of file metadata (name, url, size, etc.) for photos and attachments.';

-- Add is_blocked column to equipments table to track blocking status
alter table public.equipments
  add column if not exists is_blocked boolean not null default false;

comment on column public.equipments.is_blocked is 'Whether this equipment is blocked from being booked on new jobs (e.g., due to maintenance/workshop work).';

-- Add is_blocked column to cases table
alter table public.cases
  add column if not exists is_blocked boolean not null default false;

comment on column public.cases.is_blocked is 'Whether this case is blocked from being booked on new jobs (e.g., due to maintenance/workshop work).';
