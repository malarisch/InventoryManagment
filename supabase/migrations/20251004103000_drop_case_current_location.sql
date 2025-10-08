begin;

update public.equipments e
set current_location = c.current_location
from public.cases c
where c.case_equipment = e.id
  and c.current_location is not null
  and (e.current_location is distinct from c.current_location);

drop index if exists public.cases_current_location_idx;
alter table public.cases drop column if exists current_location;

commit;
