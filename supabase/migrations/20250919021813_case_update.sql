alter table "public"."cases" add column "asset_tag" bigint;

alter table "public"."cases" add column "description" text;

alter table "public"."cases" add column "name" text;

alter table "public"."cases" add constraint "cases_asset_tag_fkey" FOREIGN KEY (asset_tag) REFERENCES asset_tags(id) not valid;

alter table "public"."cases" validate constraint "cases_asset_tag_fkey";


