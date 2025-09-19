-- Generated seed for public + auth (data only)
BEGIN;

truncate table public.companies restart identity cascade;
insert into public.companies (id, created_at, name, description, metadata, owner_user_id) values
(1, '2025-09-18T23:47:39.56662+00:00', 'Test Company', 'COmpany Test', '{}'::jsonb, '4891b73c-3a01-40eb-b3c4-eaa5b4067e68');

truncate table public.users_companies restart identity cascade;
insert into public.users_companies (id, created_at, user_id, company_id) values
(1, '2025-09-19T01:19:51.122489+00:00', '4891b73c-3a01-40eb-b3c4-eaa5b4067e68', 1);

truncate table public.locations restart identity cascade;
insert into public.locations (id, created_at, created_by, name, description, company_id, asset_tag) values
(1, '2025-09-19T01:00:01.934098+00:00', '4891b73c-3a01-40eb-b3c4-eaa5b4067e68', 'Regal 1', 'Regal 1 Location', 1, NULL),
(2, '2025-09-19T01:00:30.617282+00:00', '4891b73c-3a01-40eb-b3c4-eaa5b4067e68', 'Regal 2', 'Regal 2 Locaition', 1, NULL);

truncate table public.articles restart identity cascade;
insert into public.articles (id, created_at, name, metadata, created_by, default_location, company_id, asset_tag) values
(1, '2025-09-18T23:48:55.900497+00:00', 'Testartikel', NULL, '4891b73c-3a01-40eb-b3c4-eaa5b4067e68', NULL, 1, NULL),
(2, '2025-09-19T00:45:00.839621+00:00', 'Lautsprecherartikel 1', NULL, '4891b73c-3a01-40eb-b3c4-eaa5b4067e68', NULL, 1, NULL),
(3, '2025-09-19T00:59:05.343745+00:00', 'Lautsprecherartikel 2', NULL, '4891b73c-3a01-40eb-b3c4-eaa5b4067e68', 1, 1, NULL);

truncate table public.customers restart identity cascade;
insert into public.customers (id, created_at, company_id, created_by, type, forename, surname, company_name, address, postal_code, country, email, metadata) values
(4, '2025-09-19T01:19:59.368904+00:00', 1, '4891b73c-3a01-40eb-b3c4-eaa5b4067e68', 'Firma', NULL, NULL, 'firma', 'lol', NULL, NULL, 'test@test.de', '{}'::jsonb);

truncate table public.jobs restart identity cascade;
insert into public.jobs (id, created_at, customer_id, created_by, startdate, enddate, name, type, job_location, meta, company_id) values
(1, '2025-09-19T01:21:13.703156+00:00', 4, '4891b73c-3a01-40eb-b3c4-eaa5b4067e68', '2025-09-19T00:00:00', '2025-09-20T00:00:00', 'Testjob', 'Konzert', 'zuhausee', '{}'::jsonb, 1);

truncate table public.equipments restart identity cascade;
insert into public.equipments (id, created_at, asset_tag, added_to_inventory_at, metadata, article_id, created_by, company_id, current_location) values
(1, '2025-09-18T23:50:07.036793+00:00', NULL, NULL, NULL, 1, '4891b73c-3a01-40eb-b3c4-eaa5b4067e68', 1, NULL),
(2, '2025-09-19T00:50:20.79856+00:00', NULL, NULL, '{}'::jsonb, 2, '4891b73c-3a01-40eb-b3c4-eaa5b4067e68', 1, 2),
(3, '2025-09-19T00:59:15.83968+00:00', NULL, NULL, '{}'::jsonb, 3, '4891b73c-3a01-40eb-b3c4-eaa5b4067e68', 1, 1),
(4, '2025-09-19T00:59:15.83968+00:00', NULL, NULL, '{}'::jsonb, 3, '4891b73c-3a01-40eb-b3c4-eaa5b4067e68', 1, 2),
(5, '2025-09-19T00:59:15.83968+00:00', NULL, NULL, '{}'::jsonb, 3, '4891b73c-3a01-40eb-b3c4-eaa5b4067e68', 1, NULL),
(6, '2025-09-19T00:59:15.83968+00:00', NULL, NULL, '{}'::jsonb, 3, '4891b73c-3a01-40eb-b3c4-eaa5b4067e68', 1, NULL);

COMMIT;
