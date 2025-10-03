-- Update log_history to respect companies.enable_history flag
-- Only log history rows when the owning company has enable_history = true

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
  v_enabled boolean;
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

  -- Respect company history setting; only log when enable_history is true
  select c.enable_history into v_enabled
  from public.companies c
  where c.id = v_company_id;

  if not coalesce(v_enabled, false) then
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
