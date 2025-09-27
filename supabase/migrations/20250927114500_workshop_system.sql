-- Workshop system: add locations.is_workshop and workshop_todos table

-- 1) Add is_workshop flag to locations
alter table public.locations
  add column if not exists is_workshop boolean not null default false;

comment on column public.locations.is_workshop is 'Marks the location as a workshop. Equipments with current_location pointing here are considered "in workshop".';

-- 2) Create workshop_todos
create table if not exists public.workshop_todos (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  company_id bigint not null,
  created_by uuid default auth.uid(),
  equipment_id bigint,
  case_id bigint,
  title text not null,
  notes text,
  status text not null default 'open',
  due_date date,
  closed_at timestamptz
);
comment on table public.workshop_todos is 'Maintenance todos for equipments/cases within a company workshop workflow.';

-- FKs
alter table public.workshop_todos
  add constraint workshop_todos_company_id_fkey foreign key (company_id) references public.companies(id) on delete cascade on update cascade;

alter table public.workshop_todos
  add constraint workshop_todos_created_by_fkey foreign key (created_by) references public.profiles(id) on delete set null on update cascade;

alter table public.workshop_todos
  add constraint workshop_todos_equipment_id_fkey foreign key (equipment_id) references public.equipments(id) on delete set null on update cascade;

alter table public.workshop_todos
  add constraint workshop_todos_case_id_fkey foreign key (case_id) references public.cases(id) on delete set null on update cascade;

-- Simple status constraint
alter table public.workshop_todos
  add constraint workshop_todos_status_check check (status in ('open','in_progress','blocked','done'));

-- RLS
alter table public.workshop_todos enable row level security;
create policy "Allow all for company members" on public.workshop_todos using (public.is_company_member(company_id));
create policy "Allow insert for members" on public.workshop_todos for insert with check (public.is_company_member(company_id));

-- History trigger
create or replace trigger trg_log_history_workshop_todos
  after insert or delete or update on public.workshop_todos
  for each row execute function public.log_history();
