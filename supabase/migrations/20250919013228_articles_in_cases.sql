alter table "public"."cases" add column "articles" jsonb[];

create policy "customers_insert_if_company_member"
on "public"."customers"
as permissive
for insert
to authenticated
with check ((company_id IN ( SELECT company_ids_current_user() AS company_ids_current_user)));


create policy "customers_update_if_company_member"
on "public"."customers"
as permissive
for update
to authenticated
using ((company_id IN ( SELECT company_ids_current_user() AS company_ids_current_user)))
with check ((company_id IN ( SELECT company_ids_current_user() AS company_ids_current_user)));



