alter table "public"."equipments" drop column "has_asset_sticker";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.company_ids_current_user()
 RETURNS SETOF bigint
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$select users_companies.company_id
  from public.users_companies
  where users_companies.user_id = (select auth.uid())$function$
;

CREATE OR REPLACE FUNCTION public.owned_company_ids_current_user()
 RETURNS SETOF bigint
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$select c.id
  from public.companies c
  where c.owner_user_id = (select auth.uid());$function$
;


