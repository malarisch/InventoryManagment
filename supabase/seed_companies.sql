
-- Generated seed for public + auth (data only)
begin;
truncate table public.companies restart identity cascade;
insert into public.companies (id, created_at, name, description, metadata, owner_user_id) values
(1, '2025-09-17T19:04:57.674393+00:00', 'Testcompany', 'Company of your tests', '{"logo":"lol.png"}'::jsonb, '4891b73c-3a01-40eb-b3c4-eaa5b4067e68'),
(2, '2025-09-17T20:04:57.674393+00:00', 'Die Konkurrenz', 'Second Company of your tests', '{"logo":"lol2.png"}'::jsonb, NULL);

truncate table public.locations restart identity cascade;
insert into public.locations (id, created_at, created_by, name, description, company_id) values
(1, '2025-09-17T19:07:56.566952+00:00', '4891b73c-3a01-40eb-b3c4-eaa5b4067e68', 'Regal 1', 'Erstes Regal', 1),
(2, '2025-09-17T19:08:28.922927+00:00', '4891b73c-3a01-40eb-b3c4-eaa5b4067e68', 'Regal 2', 'Zweites Regal', 1);

truncate table public.articles restart identity cascade;
insert into public.articles (id, created_at, name, metadata, created_by, default_location, company_id) values
(1, '2025-09-17T19:05:46.214877+00:00', 'Lautsprecherartikel 1', NULL, '4891b73c-3a01-40eb-b3c4-eaa5b4067e68', 1, 1),
(2, '2025-09-17T19:05:46.214877+00:00', 'Lautsprecherartikel 2', NULL, '4891b73c-3a01-40eb-b3c4-eaa5b4067e68', NULL, 1),
(3, '2025-09-17T19:05:46.214877+00:00', 'Lichtart 1', NULL, '4891b73c-3a01-40eb-b3c4-eaa5b4067e68', NULL, 1),
(4, '2025-09-17T19:05:46.214877+00:00', 'Müllartikel', NULL, '4891b73c-3a01-40eb-b3c4-eaa5b4067e68', NULL, 1);

truncate table public.equipments restart identity cascade;

insert into public.equipments (
    id,
    created_at,
    added_to_inventory_at,
    metadata,
    article_id,
    created_by,
    company_id
) values
      (1, '2025-09-17T19:10:34.863324+00:00', NULL, NULL, 1, '4891b73c-3a01-40eb-b3c4-eaa5b4067e68', 1),
      (8, '2025-09-17T19:13:09.7051+00:00', NULL, NULL, 1, '4891b73c-3a01-40eb-b3c4-eaa5b4067e68', 1),
      (9, '2025-09-17T19:13:09.7051+00:00', NULL, NULL, 1, '4891b73c-3a01-40eb-b3c4-eaa5b4067e68', 1),
      (10, '2025-09-17T19:13:09.7051+00:00', NULL, NULL, 1, '4891b73c-3a01-40eb-b3c4-eaa5b4067e68', 1),
      (11, '2025-09-17T19:13:09.7051+00:00', NULL, NULL, 1, '4891b73c-3a01-40eb-b3c4-eaa5b4067e68', 1),
      (12, '2025-09-17T19:13:09.7051+00:00', NULL, NULL, 1, '4891b73c-3a01-40eb-b3c4-eaa5b4067e68', 1),
      (13, '2025-09-17T19:13:09.7051+00:00', NULL, NULL, 2, '4891b73c-3a01-40eb-b3c4-eaa5b4067e68', 1),
      (14, '2025-09-17T19:13:09.7051+00:00', NULL, NULL, 2, '4891b73c-3a01-40eb-b3c4-eaa5b4067e68', 1),
      (15, '2025-09-17T19:13:09.7051+00:00', NULL, NULL, 2, '4891b73c-3a01-40eb-b3c4-eaa5b4067e68', 1),
      (16, '2025-09-17T19:13:09.7051+00:00', NULL, NULL, 2, '4891b73c-3a01-40eb-b3c4-eaa5b4067e68', 1),
      (17, '2025-09-17T19:13:09.7051+00:00', NULL, NULL, 2, '4891b73c-3a01-40eb-b3c4-eaa5b4067e68', 1);
