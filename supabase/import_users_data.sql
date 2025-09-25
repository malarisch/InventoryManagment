--https://gist.github.com/GitTom/27863f4b8811406d08fc76b3b1537848
begin;
-- Insert test data into the import.users table
INSERT INTO import.users (user_id, username, cc, email, password)
VALUES
  ('4a8b01dd-d981-4310-b730-47b48cbd6997', 'Testuser', 'DE', 'test@test.de', 'test'),
  (NULL, 'David', 'US', NULL, NULL),
  (NULL, 'Tom', 'CA', NULL, 'HelloTom');

-- The user_id, email, and password columns get UPDATEd by supa_import_auth_users.sql.
-- I preserve the updated user_id values (so they don't get lost across db resets)
-- because I use them in related test data.

-- I put this on Supabase dashboard (which doesn't get reset) but haven't yet
-- automated the automatic preservation of new user_id's across resets.
commit;