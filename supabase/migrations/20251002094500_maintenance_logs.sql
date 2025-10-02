-- Maintenance logs for equipments and cases

create table if not exists public.maintenance_logs (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  company_id bigint not null,
  created_by uuid default auth.uid(),
  performed_by uuid default auth.uid(),
  performed_at timestamptz not null default now(),
  equipment_id bigint,
  case_id bigint,
  title text not null,
  notes text,
  constraint maintenance_logs_target_check check (equipment_id is not null or case_id is not null)
);

comment on table public.maintenance_logs is 'Maintenance log entries for equipments and cases.';
comment on column public.maintenance_logs.title is 'Short summary of the maintenance task.';
comment on column public.maintenance_logs.notes is 'Optional detailed notes about the maintenance action.';

alter table public.maintenance_logs
  add constraint maintenance_logs_company_id_fkey foreign key (company_id) references public.companies(id) on delete cascade on update cascade;

alter table public.maintenance_logs
  add constraint maintenance_logs_created_by_fkey foreign key (created_by) references public.profiles(id) on delete set null on update cascade;

alter table public.maintenance_logs
  add constraint maintenance_logs_performed_by_fkey foreign key (performed_by) references public.profiles(id) on delete set null on update cascade;

alter table public.maintenance_logs
  add constraint maintenance_logs_equipment_id_fkey foreign key (equipment_id) references public.equipments(id) on delete cascade on update cascade;

alter table public.maintenance_logs
  add constraint maintenance_logs_case_id_fkey foreign key (case_id) references public.cases(id) on delete cascade on update cascade;

create index if not exists maintenance_logs_equipment_id_idx on public.maintenance_logs using btree (equipment_id);
create index if not exists maintenance_logs_case_id_idx on public.maintenance_logs using btree (case_id);
create index if not exists maintenance_logs_company_id_idx on public.maintenance_logs using btree (company_id);

alter table public.maintenance_logs enable row level security;
create policy "Allow select for company members" on public.maintenance_logs for select using (public.is_company_member(company_id));
create policy "Allow insert for company members" on public.maintenance_logs for insert with check (public.is_company_member(company_id));
create policy "Allow update for company members" on public.maintenance_logs for update using (public.is_company_member(company_id));
create policy "Allow delete for company members" on public.maintenance_logs for delete using (public.is_company_member(company_id));

create or replace trigger trg_log_history_maintenance_logs
  after insert or delete or update on public.maintenance_logs
  for each row execute function public.log_history();
