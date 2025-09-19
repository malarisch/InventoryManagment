BEGIN;

-- Enhance log_history to include operation tag in old_data payload under key _op
create or replace function public.log_history()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id bigint;
  v_changed_by uuid := auth.uid();
  v_table text := TG_TABLE_NAME;
  v_data_id bigint;
  v_payload jsonb;
begin
  if TG_OP = 'INSERT' then
    v_company_id := COALESCE((NEW).company_id, CASE WHEN v_table = 'companies' THEN (NEW).id ELSE NULL END);
    v_data_id := (NEW).id;
    v_payload := to_jsonb(NEW);
  elsif TG_OP = 'UPDATE' then
    v_company_id := COALESCE((NEW).company_id, (OLD).company_id, CASE WHEN v_table = 'companies' THEN COALESCE((NEW).id, (OLD).id) ELSE NULL END);
    v_data_id := COALESCE((NEW).id, (OLD).id);
    v_payload := to_jsonb(OLD);
  else -- DELETE
    v_company_id := COALESCE((OLD).company_id, CASE WHEN v_table = 'companies' THEN (OLD).id ELSE NULL END);
    v_data_id := (OLD).id;
    v_payload := to_jsonb(OLD);
  end if;

  v_payload := jsonb_set(v_payload, '{_op}', to_jsonb(TG_OP::text), true);

  insert into public.history (company_id, table_name, data_id, old_data, change_made_by)
  values (v_company_id, v_table, v_data_id, v_payload, v_changed_by);
  return null;
end;
$$;

COMMIT;

