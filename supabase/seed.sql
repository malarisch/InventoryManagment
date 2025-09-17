-- Generated seed for public + auth (data only)
BEGIN;

truncate table public.companies restart identity cascade;
insert into public.companies (id, created_at, name, description, metadata, owner_user_id) values
(1, '2025-09-17T19:04:57.674393+00:00', 'Testcompany', 'Company of your tests', '{"logo":"lol.png"}'::jsonb, '0d928167-a948-450c-85ee-9f37758e2bf1');

truncate table public.locations restart identity cascade;
insert into public.locations (id, created_at, created_by, name, description, metadata, company_id) values
(1, '2025-09-17T19:07:56.566952+00:00', '0d928167-a948-450c-85ee-9f37758e2bf1', 'Regal 1', 'Erstes Regal', NULL, 1),
(2, '2025-09-17T19:08:28.922927+00:00', '0d928167-a948-450c-85ee-9f37758e2bf1', 'Regal 2', 'Zweites Regal', NULL, 1);

truncate table public.articles restart identity cascade;
insert into public.articles (id, created_at, name, metadata, created_by, default_location, company_id) values
(1, '2025-09-17T19:05:46.214877+00:00', 'Lautsprecherartikel 1', NULL, '0d928167-a948-450c-85ee-9f37758e2bf1', 1, 1),
(2, '2025-09-17T19:05:46.214877+00:00', 'Lautsprecherartikel 2', NULL, '0d928167-a948-450c-85ee-9f37758e2bf1', NULL, 1),
(3, '2025-09-17T19:05:46.214877+00:00', 'Lichtart 1', NULL, '0d928167-a948-450c-85ee-9f37758e2bf1', NULL, 1),
(4, '2025-09-17T19:05:46.214877+00:00', 'Müllartikel', NULL, '0d928167-a948-450c-85ee-9f37758e2bf1', NULL, 1);

truncate table public.equipments restart identity cascade;
insert into public.equipments (id, created_at, asset_tag, has_asset_sticker, added_to_inventory_at, metadata, article_id, created_by, company_id) values
(1, '2025-09-17T19:10:34.863324+00:00', '1', false, NULL, NULL, 1, '0d928167-a948-450c-85ee-9f37758e2bf1', 1),
(8, '2025-09-17T19:13:09.7051+00:00', '2', false, NULL, NULL, 1, '0d928167-a948-450c-85ee-9f37758e2bf1', 1),
(9, '2025-09-17T19:13:09.7051+00:00', '3', false, NULL, NULL, 1, '0d928167-a948-450c-85ee-9f37758e2bf1', 1),
(10, '2025-09-17T19:13:09.7051+00:00', '4', false, NULL, NULL, 1, '0d928167-a948-450c-85ee-9f37758e2bf1', 1),
(11, '2025-09-17T19:13:09.7051+00:00', '5', false, NULL, NULL, 1, '0d928167-a948-450c-85ee-9f37758e2bf1', 1),
(12, '2025-09-17T19:13:09.7051+00:00', '6', false, NULL, NULL, 1, '0d928167-a948-450c-85ee-9f37758e2bf1', 1),
(13, '2025-09-17T19:13:09.7051+00:00', '12', false, NULL, NULL, 2, '0d928167-a948-450c-85ee-9f37758e2bf1', 1),
(14, '2025-09-17T19:13:09.7051+00:00', '13', false, NULL, NULL, 2, '0d928167-a948-450c-85ee-9f37758e2bf1', 1),
(15, '2025-09-17T19:13:09.7051+00:00', '14', false, NULL, NULL, 2, '0d928167-a948-450c-85ee-9f37758e2bf1', 1),
(16, '2025-09-17T19:13:09.7051+00:00', '15', false, NULL, NULL, 2, '0d928167-a948-450c-85ee-9f37758e2bf1', 1),
(17, '2025-09-17T19:13:09.7051+00:00', '16', false, NULL, NULL, 2, '0d928167-a948-450c-85ee-9f37758e2bf1', 1);

truncate table public.article_location_history restart identity cascade;
insert into public.article_location_history (id, created_at, location_id, equipment_id, created_by_user, gps_coordinates, gps_accuracy, company_id) values
(1, '2025-09-17T19:13:48.687373+00:00', 1, 1, '0d928167-a948-450c-85ee-9f37758e2bf1', NULL, NULL, 1),
(2, '2025-09-17T19:14:11.583282+00:00', 2, 9, '0d928167-a948-450c-85ee-9f37758e2bf1', NULL, NULL, 1);

COMMIT;
