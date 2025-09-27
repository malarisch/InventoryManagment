-- Migrate cases.contains_equipments from 1:1 FK to bigint[] (many)
-- Rationale: Domain model specifies an array of contained equipment IDs per case.

set check_function_bodies = off;

-- Drop the FK that enforced 1:1 to public.equipments(id)
alter table if exists public.cases
  drop constraint if exists "cases_case_contains_equipments_fkey";

-- Change column type to bigint[]; keep nullability; set a sensible default
alter table public.cases
  alter column contains_equipments type bigint[] using (
    case when contains_equipments is null then null else array[contains_equipments] end
  ),
  alter column contains_equipments set default '{}'::bigint[];

comment on column public.cases.contains_equipments is 'IDs of equipments contained in the case (bigint[]).';

