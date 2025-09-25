-- Generated seed for public + auth (data only)
BEGIN;

truncate table public.companies restart identity cascade;
insert into public.companies (id, created_at, name, description, metadata, owner_user_id, files) values
(1, '2025-09-18T23:47:39.56662+00:00', 'Wolff Audio', 'Sound mit Biss', '{"notes":"","phone":"0800112","address":"zu Hause Weg 1","logoUrl":"http://127.0.0.1:54321/storage/v1/object/public/public-assets/1/companies/1/1758742484243_wolffAudioWhiteBg.png","website":"http://website.com","industry":"Audio Rental","taxNumber":"01234666","contactInfo":[],"customTypes":{"caseTypes":["Flight Case","Road Case","Soft Case","Rack Case"],"articleTypes":["Lautsprecher","Mikrofon","Mischpult","PA-System","Monitor"],"locationTypes":["Tisch"]},"standardData":{"power":{"powerType":"AC","frequencyHz":"50Hz","voltageRangeV":"220-240V","powerConnectorType":"IEC C13"},"person":{"lastName":"Wolff","position":"Inhaberin","pronouns":"she/iher","firstName":"Mala","contactInfo":[{"email":"mala.wolff00@gmail.com","phone":"017642147759"}]},"taxRate":19,"currency":"EUR"},"establishedYear":2018,"companyWidePrefix":"WA","numberOfEmployees":1,"assetTagCasePrefix":"CA","assetTagArticlePrefix":"AR","assetTagLocationPrefix":"LO","assetTagEquipmentPrefix":"EQ","defaultCaseAssetTagTemplateId":6,"defaultArticleAssetTagTemplateId":6,"defaultLocationAssetTagTemplateId":6,"defaultEquipmentAssetTagTemplateId":6}'::jsonb, '4a8b01dd-d981-4310-b730-47b48cbd6997', '[{"id":"1/companies/1/1758742484243_wolffAudioWhiteBg.png","link":"http://127.0.0.1:54321/storage/v1/object/public/public-assets/1/companies/1/1758742484243_wolffAudioWhiteBg.png","name":"Logo","public":true,"description":"White BG"},{"id":"1/companies/1/1758749228921_wolffAudioWhiteBg.svg","link":"http://127.0.0.1:54321/storage/v1/object/public/public-assets/1/companies/1/1758749228921_wolffAudioWhiteBg.svg","name":null,"public":true,"description":null}]'::jsonb);
select setval(pg_get_serial_sequence('public.companies','id'), (select max(id) from public.companies));


truncate table public.users_companies restart identity cascade;
insert into public.users_companies (id, created_at, user_id, company_id) values
(1, '2025-09-19T01:19:51.122489+00:00', '4a8b01dd-d981-4310-b730-47b48cbd6997', 1);
select setval(pg_get_serial_sequence('public.users_companies','id'), (select max(id) from public.users_companies));

truncate table public.asset_tag_templates restart identity cascade;
insert into public.asset_tag_templates (id, created_at, created_by, template, company_id) values

(6, '2025-09-24T16:30:12.192859+00:00', '4a8b01dd-d981-4310-b730-47b48cbd6997', '{"name":"wolfftemp","prefix":"WA","suffix":"","codeType":"QR","elements":[{"x":54.16,"y":0,"size":160,"type":"qrcode","color":"#000000","value":"{printed_code}","height":1},{"x":65.12,"y":43.69,"size":25,"type":"text","color":"#000000","value":"{printed_code}","height":1},{"x":15.61,"y":7.9,"size":44,"type":"image","color":"#000000","value":"http://127.0.0.1:54321/storage/v1/object/public/public-assets/1/companies/1/1758749228921_wolffAudioWhiteBg.svg","height":67},{"x":5.85,"y":43.09,"size":15,"type":"text","color":"#000000","value":"{equipment_name}"}],"marginMm":2,"textColor":"#000000","codeSizeMm":15,"tagWidthMm":100,"textSizePt":12,"borderColor":"#000000","description":"","tagHeightMm":50,"isMonochrome":false,"numberLength":4,"borderWidthMm":1,"stringTemplate":"{prefix}-{number}","backgroundColor":"#ffffff","numberingScheme":"sequential"}'::jsonb, 1);

truncate table public.asset_tags restart identity cascade;
select setval(pg_get_serial_sequence('public.asset_tag_templates','id'), (select max(id) from public.asset_tag_templates));

insert into public.asset_tags (id, created_at, created_by, printed_code, printed_template, printed_applied, company_id, nfc_tag_id) values

(4, '2025-09-24T16:27:05.327651+00:00', '4a8b01dd-d981-4310-b730-47b48cbd6997', '{equipment_name}', 6, false, 1, NULL),
(8, '2025-09-24T20:32:57.711148+00:00', '4a8b01dd-d981-4310-b730-47b48cbd6997', 'Texttextprnt', 6, false, 1, NULL),
(9, '2025-09-24T21:28:41.461376+00:00', '4a8b01dd-d981-4310-b730-47b48cbd6997', '{printed_code}', 6, false, 1, NULL);

select setval(pg_get_serial_sequence('public.asset_tags','id'), (select max(id) from public.asset_tags));

truncate table public.locations restart identity cascade;
insert into public.locations (id, created_at, created_by, name, description, company_id, asset_tag, files) values
(1, '2025-09-19T01:00:01.934098+00:00', '4a8b01dd-d981-4310-b730-47b48cbd6997', 'Regal 1', 'Regal 1 Location', 1, NULL, NULL),
(2, '2025-09-19T01:00:30.617282+00:00', '4a8b01dd-d981-4310-b730-47b48cbd6997', 'Regal 2', 'Regal 2 Locaition', 1, NULL, NULL);

-- Ensure sequence is advanced past the max inserted id to avoid duplicate key on next identity insert
select setval(pg_get_serial_sequence('public.locations','id'), (select max(id) from public.locations));

truncate table public.articles restart identity cascade;
insert into public.articles (id, created_at, name, metadata, created_by, default_location, company_id, asset_tag, files) values
(1, '2025-09-18T23:48:55.900497+00:00', 'Testartikel', NULL, '4a8b01dd-d981-4310-b730-47b48cbd6997', NULL, 1, NULL, NULL),
(2, '2025-09-19T00:45:00.839621+00:00', 'Lautsprecherartikel 1', NULL, '4a8b01dd-d981-4310-b730-47b48cbd6997', NULL, 1, NULL, NULL),
(3, '2025-09-19T00:59:05.343745+00:00', 'Lautsprecherartikel 2', NULL, '4a8b01dd-d981-4310-b730-47b48cbd6997', 1, 1, NULL, NULL),

(19, '2025-09-23T21:43:46.627304+00:00', 'Nexo PS15', '{"case":{"is19Inch":false,"heightUnits":0},"type":"Lautsprecher","model":"PS15","power":{"powerType":"Other","frequencyHz":"50Hz","voltageRangeV":"220-240V","powerConnectorType":"IEC C13"},"is19Inch":false,"weightKg":25,"heightUnits":0,"manufacturer":"Nexo"}'::jsonb, '4a8b01dd-d981-4310-b730-47b48cbd6997', NULL, 1, 9, NULL);

select setval(pg_get_serial_sequence('public.articles','id'), (select max(id) from public.articles));

truncate table public.customers restart identity cascade;
insert into public.customers (id, created_at, company_id, created_by, type, forename, surname, company_name, address, postal_code, country, email, metadata, files) values
(2, '2025-09-23T20:24:20.629749+00:00', 1, '4a8b01dd-d981-4310-b730-47b48cbd6997', 'private', 'Max', 'Mustermann', NULL, 'Musterstraße 123, München', NULL, NULL, 'max.mustermann@example.com', '{"name":"","lastName":"","firstName":"","preferredContactMethod":"email"}'::jsonb, NULL),
(4, '2025-09-19T01:19:59.368904+00:00', 1, '4a8b01dd-d981-4310-b730-47b48cbd6997', 'Firma', NULL, NULL, 'firma', 'lol', NULL, NULL, 'test@test.de', '{}'::jsonb, NULL);

truncate table public.jobs restart identity cascade;
insert into public.jobs (id, created_at, customer_id, created_by, startdate, enddate, name, type, job_location, meta, company_id, files) values
(1, '2025-09-19T01:21:13.703156+00:00', 4, '4a8b01dd-d981-4310-b730-47b48cbd6997', '2025-09-19T00:00:00', '2025-09-20T00:00:00', 'Testjob', 'Konzert', 'zuhausee', '{}'::jsonb, 1, NULL);

select setval(pg_get_serial_sequence('public.jobs','id'), (select max(id) from public.jobs));


truncate table public.equipments restart identity cascade;
insert into public.equipments (id, created_at, asset_tag, added_to_inventory_at, metadata, article_id, created_by, company_id, current_location, files) values
(1, '2025-09-18T23:50:07.036793+00:00', NULL, NULL, NULL, 1, '4a8b01dd-d981-4310-b730-47b48cbd6997', 1, NULL, NULL),
(2, '2025-09-19T00:50:20.79856+00:00', NULL, NULL, '{}'::jsonb, 2, '4a8b01dd-d981-4310-b730-47b48cbd6997', 1, 2, NULL),
(3, '2025-09-19T00:59:15.83968+00:00', NULL, NULL, '{"case":{"is19Inch":false,"heightUnits":0},"type":"","model":"TestModel","power":{"powerType":"AC","frequencyHz":"50Hz","voltageRangeV":"220-240V","powerConnectorType":"IEC C13"},"is19Inch":false,"heightUnits":0,"manufacturer":"TestManufacturer","serialNumber":"SN12345","canLeaveLocation":true}'::jsonb, 3, '4a8b01dd-d981-4310-b730-47b48cbd6997', 1, 1, NULL),
(4, '2025-09-19T00:59:15.83968+00:00', NULL, NULL, '{}'::jsonb, 3, '4a8b01dd-d981-4310-b730-47b48cbd6997', 1, 2, '[{"id":"1/equipments/4/1758660576752_shipping-label.pdf","link":"http://127.0.0.1:54321/storage/v1/object/sign/private-attachments/1/equipments/4/1758660576752_shipping-label.pdf?token=eyJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwcml2YXRlLWF0dGFjaG1lbnRzLzEvZXF1aXBtZW50cy80LzE3NTg2NjA1NzY3NTJfc2hpcHBpbmctbGFiZWwucGRmIiwiaWF0IjoxNzU4NjYwNTc3LCJleHAiOjIwNzQwMjA1Nzd9.FC4LdAZ1gQ0-F86xEAHbqWD4X6y6YAfxXFDzrW7munQ","name":null,"description":null}]'::jsonb),
(5, '2025-09-19T00:59:15.83968+00:00', NULL, NULL, '{}'::jsonb, 3, '4a8b01dd-d981-4310-b730-47b48cbd6997', 1, NULL, NULL),
(6, '2025-09-19T00:59:15.83968+00:00', NULL, NULL, '{}'::jsonb, 3, '4a8b01dd-d981-4310-b730-47b48cbd6997', 1, NULL, NULL),
(7, '2025-09-23T21:44:29.070384+00:00', 8, '2025-09-23T00:00:00', '{"case":{"is19Inch":false,"heightUnits":0},"type":"","power":{"powerType":"AC","frequencyHz":"50Hz","voltageRangeV":"220-240V","powerConnectorType":"IEC C13"},"is19Inch":false,"heightUnits":0,"canLeaveLocation":true}'::jsonb, 19, '4a8b01dd-d981-4310-b730-47b48cbd6997', 1, NULL, NULL),
(8, '2025-09-23T21:44:29.070384+00:00', 4, '2025-09-23T00:00:00', '{"case":{"is19Inch":false,"heightUnits":0},"type":"","power":{"powerType":"AC","frequencyHz":"50Hz","voltageRangeV":"220-240V","powerConnectorType":"IEC C13"},"is19Inch":false,"heightUnits":0,"canLeaveLocation":true}'::jsonb, 19, '4a8b01dd-d981-4310-b730-47b48cbd6997', 1, NULL, NULL);

select setval(pg_get_serial_sequence('public.equipments','id'), (select max(id) from public.equipments));


truncate table public.history restart identity cascade;
commit;