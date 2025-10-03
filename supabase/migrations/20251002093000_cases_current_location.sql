-- Allow assigning cases to physical locations for scanner workflows

alter table public.cases
  add column if not exists current_location bigint references public.locations(id) on delete set null on update cascade;

comment on column public.cases.current_location is 'Current location for the case, used for logistics scanners and workshop tracking.';

create index if not exists cases_current_location_idx on public.cases using btree (current_location);
