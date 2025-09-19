begin;
-- https://gist.github.com/GitTom/27863f4b8811406d08fc76b3b1537848
--
-- 2024-10 Started from ...
-- https://gist.github.com/khattaksd/4e8f4c89f4e928a2ecaad56d4a17ecd1
-- With addition of 'provider_id' as per @fluid-design-io
-- With my additions to load import data from import.users table,
--   to save generated values back into that table, and
--   to be able to add rows when destination tables are not empty.

-- Update NULL emails
DO $$
BEGIN
  UPDATE import.users
    SET email = username || '-' || cc || '@findingthem.com'
    WHERE email IS NULL;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Email update aborted on error: %', SQLERRM;
END $$;

-- Generate UUIDs for users who don't have one yet
UPDATE import.users
  SET user_id = uuid_generate_v4()
  WHERE user_id IS NULL;

-- Generate passwords for users who don't have one yet
UPDATE import.users
  SET password = 'Hello' || username
  WHERE password IS NULL;


-- Log the existing row count for auth.users
DO $$
DECLARE
  user_count INTEGER;
BEGIN
  -- Log the number of rows in the auth.users table
  SELECT COUNT(*) INTO user_count FROM auth.users;
  RAISE LOG 'Rows in auth.users before insert = %', user_count;
END $$;

-- create test users
INSERT INTO
  auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    recovery_token,
              email_confirmed_at,
              email_change_token_new
  )
    SELECT
      '00000000-0000-0000-0000-000000000000',
      user_id,
      'authenticated' AS aud,
      'authenticated' AS role,
      email,
      crypt(password, gen_salt('bf')),
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP,
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object('username', username, 'country_code', cc),
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP,
      '',
      '',
      '',
      CURRENT_TIMESTAMP,
      ''
    FROM
      import.users
    ON CONFLICT (id) DO NOTHING;

-- create auth user identities
INSERT INTO
  auth.identities (
    user_id,
    provider_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  )
    SELECT
      user_id,
      user_id,
      format('{"sub":"%s","email":"%s"}', user_id::text, email)::jsonb,
      'email',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    FROM
      import.users
    ON CONFLICT (provider_id, provider) DO NOTHING;
commit;