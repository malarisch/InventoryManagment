-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "public"."articles" (
    "id" BIGSERIAL NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" VARCHAR NOT NULL DEFAULT '',
    "metadata" JSONB,
    "created_by" UUID DEFAULT auth.uid(),
    "default_location" BIGINT,
    "company_id" BIGINT NOT NULL,
    "asset_tag" BIGINT,
    "files" JSONB,

    CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."asset_tag_templates" (
    "id" BIGSERIAL NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID DEFAULT auth.uid(),
    "template" JSONB,
    "company_id" BIGINT,

    CONSTRAINT "asset_tag_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."asset_tags" (
    "id" BIGSERIAL NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID DEFAULT auth.uid(),
    "printed_code" VARCHAR,
    "printed_template" BIGINT,
    "printed_applied" BOOLEAN NOT NULL DEFAULT false,
    "company_id" BIGINT,
    "nfc_tag_id" BIGINT,

    CONSTRAINT "asset_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."cases" (
    "id" BIGSERIAL NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "case_equipment" BIGINT,
    "company_id" BIGINT,
    "created_by" UUID DEFAULT auth.uid(),
    "articles" JSONB[],
    "asset_tag" BIGINT,
    "description" TEXT,
    "name" TEXT,
    "files" JSONB,

    CONSTRAINT "cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."companies" (
    "id" BIGSERIAL NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" VARCHAR NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "owner_user_id" UUID DEFAULT auth.uid(),
    "files" JSONB,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."customers" (
    "id" BIGSERIAL NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "company_id" BIGINT NOT NULL,
    "created_by" UUID DEFAULT auth.uid(),
    "type" TEXT,
    "forename" TEXT,
    "surname" TEXT,
    "company_name" TEXT,
    "address" TEXT,
    "postal_code" TEXT,
    "country" TEXT,
    "email" TEXT,
    "metadata" JSONB,
    "files" JSONB,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."equipments" (
    "id" BIGSERIAL NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "asset_tag" BIGINT,
    "added_to_inventory_at" TIMESTAMP(6),
    "metadata" JSONB,
    "article_id" BIGINT,
    "created_by" UUID NOT NULL DEFAULT auth.uid(),
    "company_id" BIGINT NOT NULL,
    "current_location" BIGINT,
    "files" JSONB,

    CONSTRAINT "equipments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."history" (
    "id" BIGSERIAL NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "company_id" BIGINT,
    "table_name" TEXT NOT NULL,
    "data_id" BIGINT NOT NULL,
    "old_data" JSONB NOT NULL,
    "change_made_by" UUID,

    CONSTRAINT "history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."job_assets_on_job" (
    "id" BIGSERIAL NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID DEFAULT auth.uid(),
    "company_id" BIGINT NOT NULL,
    "job_id" BIGINT NOT NULL,
    "equipment_id" BIGINT,
    "case_id" BIGINT,

    CONSTRAINT "job_assets_on_job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."job_booked_assets" (
    "id" BIGSERIAL NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID DEFAULT auth.uid(),
    "company_id" BIGINT NOT NULL,
    "job_id" BIGINT NOT NULL,
    "equipment_id" BIGINT,
    "case_id" BIGINT,

    CONSTRAINT "job_booked_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."jobs" (
    "id" BIGSERIAL NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "customer_id" BIGINT,
    "created_by" UUID,
    "startdate" TIMESTAMP(6),
    "enddate" TIMESTAMP(6),
    "name" TEXT,
    "type" TEXT,
    "job_location" TEXT,
    "meta" JSONB,
    "company_id" BIGINT NOT NULL,
    "files" JSONB,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."locations" (
    "id" BIGSERIAL NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID NOT NULL DEFAULT auth.uid(),
    "name" VARCHAR NOT NULL,
    "description" TEXT,
    "company_id" BIGINT NOT NULL,
    "asset_tag" BIGINT,
    "files" JSONB,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."nfc_tags" (
    "id" BIGSERIAL NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID DEFAULT auth.uid(),
    "tag_id" VARCHAR NOT NULL,
    "company_id" BIGINT NOT NULL,

    CONSTRAINT "nfc_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."profiles" (
    "id" UUID NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "email" TEXT,
    "avatar_url" TEXT,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."users_companies" (
    "id" BIGSERIAL NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" UUID NOT NULL,
    "company_id" BIGINT NOT NULL,

    CONSTRAINT "users_companies_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."articles" ADD CONSTRAINT "articles_asset_tag_fkey" FOREIGN KEY ("asset_tag") REFERENCES "public"."asset_tags"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."articles" ADD CONSTRAINT "articles_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."articles" ADD CONSTRAINT "articles_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."articles" ADD CONSTRAINT "articles_default_location_fkey" FOREIGN KEY ("default_location") REFERENCES "public"."locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."asset_tag_templates" ADD CONSTRAINT "asset_tag_templates_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."asset_tag_templates" ADD CONSTRAINT "asset_tag_templates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."asset_tags" ADD CONSTRAINT "asset_tags_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."asset_tags" ADD CONSTRAINT "asset_tags_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."asset_tags" ADD CONSTRAINT "asset_tags_nfc_tag_id_fkey" FOREIGN KEY ("nfc_tag_id") REFERENCES "public"."nfc_tags"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."asset_tags" ADD CONSTRAINT "asset_tags_printed_template_fkey" FOREIGN KEY ("printed_template") REFERENCES "public"."asset_tag_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cases" ADD CONSTRAINT "cases_asset_tag_fkey" FOREIGN KEY ("asset_tag") REFERENCES "public"."asset_tags"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."cases" ADD CONSTRAINT "cases_case_equipment_fkey" FOREIGN KEY ("case_equipment") REFERENCES "public"."equipments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."cases" ADD CONSTRAINT "cases_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cases" ADD CONSTRAINT "cases_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."companies" ADD CONSTRAINT "companies_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "public"."profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."customers" ADD CONSTRAINT "customers_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."customers" ADD CONSTRAINT "customers_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."equipments" ADD CONSTRAINT "equipments_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."equipments" ADD CONSTRAINT "equipments_asset_tag_fkey" FOREIGN KEY ("asset_tag") REFERENCES "public"."asset_tags"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."equipments" ADD CONSTRAINT "equipments_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."equipments" ADD CONSTRAINT "equipments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."equipments" ADD CONSTRAINT "equipments_current_location_fkey" FOREIGN KEY ("current_location") REFERENCES "public"."locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."history" ADD CONSTRAINT "history_change_made_by_fkey" FOREIGN KEY ("change_made_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."history" ADD CONSTRAINT "history_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."job_assets_on_job" ADD CONSTRAINT "job_assets_on_job_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."job_assets_on_job" ADD CONSTRAINT "job_assets_on_job_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."job_assets_on_job" ADD CONSTRAINT "job_assets_on_job_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."job_assets_on_job" ADD CONSTRAINT "job_assets_on_job_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "public"."equipments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."job_assets_on_job" ADD CONSTRAINT "job_assets_on_job_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."job_booked_assets" ADD CONSTRAINT "job_booked_assets_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."job_booked_assets" ADD CONSTRAINT "job_booked_assets_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."job_booked_assets" ADD CONSTRAINT "job_booked_assets_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."job_booked_assets" ADD CONSTRAINT "job_booked_assets_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "public"."equipments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."job_booked_assets" ADD CONSTRAINT "job_booked_assets_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."jobs" ADD CONSTRAINT "jobs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."jobs" ADD CONSTRAINT "jobs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."jobs" ADD CONSTRAINT "jobs_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."locations" ADD CONSTRAINT "locations_asset_tag_fkey" FOREIGN KEY ("asset_tag") REFERENCES "public"."asset_tags"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."locations" ADD CONSTRAINT "locations_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."locations" ADD CONSTRAINT "locations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."nfc_tags" ADD CONSTRAINT "nfc_tags_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."nfc_tags" ADD CONSTRAINT "nfc_tags_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."profiles" ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."users_companies" ADD CONSTRAINT "users_companies_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."users_companies" ADD CONSTRAINT "users_companies_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

