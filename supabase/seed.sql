-- Generated seed for public + auth (data only)
BEGIN;

truncate table public.companies restart identity cascade;
insert into public.companies (id, created_at, name, description, metadata, owner_user_id) values
(1, '2025-09-18T23:47:39.56662+00:00', 'Wolff Audio', 'Sound mit Biss', '{"notes":"","phone":"0800112","address":"zu Hause Weg 1","logoUrl":"","website":"http://website.com","industry":"Audio Rental","taxNumber":"01234666","contactInfo":[],"customTypes":{"caseTypes":["Flight Case","Road Case","Soft Case","Rack Case"],"articleTypes":["Lautsprecher","Mikrofon","Mischpult","PA-System","Monitor"],"locationTypes":["Tisch"]},"standardData":{"power":{"powerType":"AC","frequencyHz":"50Hz","voltageRangeV":"220-240V","powerConnectorType":"IEC C13"},"person":{"lastName":"Wolff","position":"Inhaberin","pronouns":"she/iher","firstName":"Mala","contactInfo":[{"email":"mala.wolff00@gmail.com","phone":"017642147759"}]},"taxRate":19,"currency":"EUR"},"establishedYear":2018,"numberOfEmployees":1}'::jsonb, '4891b73c-3a01-40eb-b3c4-eaa5b4067e68');
truncate table public.users_companies restart identity cascade;
insert into public.users_companies (id, created_at, user_id, company_id) values
(1, '2025-09-19T01:19:51.122489+00:00', '4891b73c-3a01-40eb-b3c4-eaa5b4067e68', 1);

truncate table public.locations restart identity cascade;
insert into public.locations (id, created_at, created_by, name, description, company_id, asset_tag, files) values
(1, '2025-09-19T01:00:01.934098+00:00', '4891b73c-3a01-40eb-b3c4-eaa5b4067e68', 'Regal 1', 'Regal 1 Location', 1, NULL, NULL),
(2, '2025-09-19T01:00:30.617282+00:00', '4891b73c-3a01-40eb-b3c4-eaa5b4067e68', 'Regal 2', 'Regal 2 Locaition', 1, NULL, NULL);

truncate table public.articles restart identity cascade;
insert into public.articles (id, created_at, name, metadata, created_by, default_location, company_id, asset_tag, files) values
(1, '2025-09-18T23:48:55.900497+00:00', 'Testartikel', NULL, '4891b73c-3a01-40eb-b3c4-eaa5b4067e68', NULL, 1, NULL, NULL),
(2, '2025-09-19T00:45:00.839621+00:00', 'Lautsprecherartikel 1', NULL, '4891b73c-3a01-40eb-b3c4-eaa5b4067e68', NULL, 1, NULL, NULL),
(3, '2025-09-19T00:59:05.343745+00:00', 'Lautsprecherartikel 2', NULL, '4891b73c-3a01-40eb-b3c4-eaa5b4067e68', 1, 1, NULL, NULL),
(19, '2025-09-23T21:43:46.627304+00:00', 'Nexo PS15', '{"case":{"is19Inch":false,"heightUnits":0},"type":"Lautsprecher","model":"PS15","power":{"powerType":"Other","frequencyHz":"50Hz","voltageRangeV":"220-240V","powerConnectorType":"IEC C13"},"is19Inch":false,"weightKg":25,"heightUnits":0,"manufacturer":"Nexo"}'::jsonb, '4891b73c-3a01-40eb-b3c4-eaa5b4067e68', NULL, 1, NULL, NULL);

truncate table public.customers restart identity cascade;
insert into public.customers (id, created_at, company_id, created_by, type, forename, surname, company_name, address, postal_code, country, email, metadata, files) values
(2, '2025-09-23T20:24:20.629749+00:00', 1, '4891b73c-3a01-40eb-b3c4-eaa5b4067e68', 'private', 'Max', 'Mustermann', NULL, 'Musterstraße 123, München', NULL, NULL, 'max.mustermann@example.com', '{"name":"","lastName":"","firstName":"","preferredContactMethod":"email"}'::jsonb, NULL),
(4, '2025-09-19T01:19:59.368904+00:00', 1, '4891b73c-3a01-40eb-b3c4-eaa5b4067e68', 'Firma', NULL, NULL, 'firma', 'lol', NULL, NULL, 'test@test.de', '{}'::jsonb, NULL);

truncate table public.jobs restart identity cascade;
insert into public.jobs (id, created_at, customer_id, created_by, startdate, enddate, name, type, job_location, meta, company_id, files) values
(1, '2025-09-19T01:21:13.703156+00:00', 4, '4891b73c-3a01-40eb-b3c4-eaa5b4067e68', '2025-09-19T00:00:00', '2025-09-20T00:00:00', 'Testjob', 'Konzert', 'zuhausee', '{}'::jsonb, 1, NULL);

truncate table public.equipments restart identity cascade;
insert into public.equipments (id, created_at, asset_tag, added_to_inventory_at, metadata, article_id, created_by, company_id, current_location, files) values
(1, '2025-09-18T23:50:07.036793+00:00', NULL, NULL, NULL, 1, '4891b73c-3a01-40eb-b3c4-eaa5b4067e68', 1, NULL, NULL),
(2, '2025-09-19T00:50:20.79856+00:00', NULL, NULL, '{}'::jsonb, 2, '4891b73c-3a01-40eb-b3c4-eaa5b4067e68', 1, 2, NULL),
(3, '2025-09-19T00:59:15.83968+00:00', NULL, NULL, '{"case":{"is19Inch":false,"heightUnits":0},"type":"","model":"TestModel","power":{"powerType":"AC","frequencyHz":"50Hz","voltageRangeV":"220-240V","powerConnectorType":"IEC C13"},"is19Inch":false,"heightUnits":0,"manufacturer":"TestManufacturer","serialNumber":"SN12345","canLeaveLocation":true}'::jsonb, 3, '4891b73c-3a01-40eb-b3c4-eaa5b4067e68', 1, 1, NULL),
(4, '2025-09-19T00:59:15.83968+00:00', NULL, NULL, '{}'::jsonb, 3, '4891b73c-3a01-40eb-b3c4-eaa5b4067e68', 1, 2, '[{"id":"1/equipments/4/1758660576752_shipping-label.pdf","link":"http://127.0.0.1:54321/storage/v1/object/sign/private-attachments/1/equipments/4/1758660576752_shipping-label.pdf?token=eyJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwcml2YXRlLWF0dGFjaG1lbnRzLzEvZXF1aXBtZW50cy80LzE3NTg2NjA1NzY3NTJfc2hpcHBpbmctbGFiZWwucGRmIiwiaWF0IjoxNzU4NjYwNTc3LCJleHAiOjIwNzQwMjA1Nzd9.FC4LdAZ1gQ0-F86xEAHbqWD4X6y6YAfxXFDzrW7munQ","name":null,"description":null}]'::jsonb),
(5, '2025-09-19T00:59:15.83968+00:00', NULL, NULL, '{}'::jsonb, 3, '4891b73c-3a01-40eb-b3c4-eaa5b4067e68', 1, NULL, NULL),
(6, '2025-09-19T00:59:15.83968+00:00', NULL, NULL, '{}'::jsonb, 3, '4891b73c-3a01-40eb-b3c4-eaa5b4067e68', 1, NULL, NULL),
(7, '2025-09-23T21:44:29.070384+00:00', NULL, '2025-09-23T00:00:00', '{"case":{"is19Inch":false,"heightUnits":0},"type":"","power":{"powerType":"AC","frequencyHz":"50Hz","voltageRangeV":"220-240V","powerConnectorType":"IEC C13"},"is19Inch":false,"heightUnits":0,"canLeaveLocation":true}'::jsonb, 19, '4891b73c-3a01-40eb-b3c4-eaa5b4067e68', 1, NULL, NULL),
(8, '2025-09-23T21:44:29.070384+00:00', NULL, '2025-09-23T00:00:00', '{"case":{"is19Inch":false,"heightUnits":0},"type":"","power":{"powerType":"AC","frequencyHz":"50Hz","voltageRangeV":"220-240V","powerConnectorType":"IEC C13"},"is19Inch":false,"heightUnits":0,"canLeaveLocation":true}'::jsonb, 19, '4891b73c-3a01-40eb-b3c4-eaa5b4067e68', 1, NULL, NULL);

truncate table public.history restart identity cascade;
commit;