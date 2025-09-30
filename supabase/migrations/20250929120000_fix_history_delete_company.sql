-- Fix history logging vs. company delete
-- 1) Update public.log_history to skip logging on DELETE for companies
-- 2) Make FK history.company_id deferrable initially deferred to avoid intra-tx FK conflicts

set check_function_bodies = off;

create or replace function public.log_history()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_company_id bigint;
  v_changed_by uuid := auth.uid();
  v_table text := tg_table_name;
  v_data_id bigint;
  v_payload jsonb;
  v_record_id bigint;
begin
  -- Special-case companies: do not log DELETE to avoid FK conflicts
  if v_table = 'companies' then
    if tg_op = 'DELETE' then
      return null;
    elsif tg_op = 'INSERT' then
      v_company_id := (new).id;
      v_data_id := (new).id;
      v_payload := to_jsonb(new);
      v_record_id := (new).id;
    elsif tg_op = 'UPDATE' then
      v_company_id := coalesce((new).id, (old).id);
      v_data_id := coalesce((new).id, (old).id);
      v_payload := to_jsonb(old);
      v_record_id := coalesce((old).id, (new).id);
    else
      v_company_id := (old).id;
      v_data_id := (old).id;
      v_payload := to_jsonb(old);
      v_record_id := (old).id;
    end if;
  else
    if tg_op = 'INSERT' then
      v_company_id := (new).company_id;
      v_data_id := (new).id;
      v_payload := to_jsonb(new);
      v_record_id := (new).id;
    elsif tg_op = 'UPDATE' then
      v_company_id := coalesce((new).company_id, (old).company_id);
      v_data_id := coalesce((new).id, (old).id);
      v_payload := to_jsonb(old);
      v_record_id := coalesce((old).id, (new).id);
    else
      v_company_id := (old).company_id;
      v_data_id := (old).id;
      v_payload := to_jsonb(old);
      v_record_id := (old).id;
    end if;
  end if;

  -- If company_id is missing, do not log (safety)
  if v_company_id is null then
    return null;
  end if;

  -- Adjust job-related data_id/record_id for better UX
  if v_table in ('job_booked_assets', 'job_assets_on_job') then
    v_data_id := coalesce((new).job_id, (old).job_id, v_data_id);
    if v_record_id is not null then
      v_payload := jsonb_set(v_payload, '{record_id}', to_jsonb(v_record_id), true);
    end if;
  end if;

  v_payload := jsonb_set(v_payload, '{_op}', to_jsonb(tg_op::text), true);

  insert into public.history (company_id, table_name, data_id, old_data, change_made_by)
  values (v_company_id, v_table, v_data_id, v_payload, v_changed_by);
  return null;
end;$function$;

-- Make FK deferrable so any residual inserts within the same tx don't violate FK
alter table public.history drop constraint if exists history_company_id_fkey;
alter table public.history
  add constraint history_company_id_fkey
  foreign key (company_id)
  references public.companies(id)
  on update cascade
  on delete cascade
  deferrable initially deferred;
