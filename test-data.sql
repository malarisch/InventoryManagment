-- Create test user and company
INSERT INTO auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'authenticated', 
    'authenticated', 
    'test@test.com',
    crypt('password123', gen_salt('bf', 10)),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
);

INSERT INTO auth.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    '{"sub":"00000000-0000-0000-0000-000000000001","email":"test@test.com"}',
    'email',
    NOW(),
    NOW(),
    NOW()
);

-- Create company
INSERT INTO public.companies (id, name, description, owner_user_id, created_at)
VALUES (
    999,
    'Test Company',
    'Test company for debugging',
    '00000000-0000-0000-0000-000000000001',
    NOW()
);

-- Add user to company
INSERT INTO public.users_companies (user_id, company_id, created_at)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    999,
    NOW()
);

-- Create test asset tag template
INSERT INTO public.asset_tag_templates (id, template, company_id, created_by, created_at)
VALUES (
    999,
    '{"name":"Test Template","width":100,"height":50,"elements":[{"type":"text","x":10,"y":10,"value":"{equipment_id}"},{"type":"qrcode","x":10,"y":30,"value":"{equipment_id}"}]}',
    999,
    '00000000-0000-0000-0000-000000000001',
    NOW()
);

-- Create test asset tag
INSERT INTO public.asset_tags (id, printed_code, printed_template, printed_applied, company_id, created_by, created_at)
VALUES (
    999,
    'TEST001',
    999,
    false,
    999,
    '00000000-0000-0000-0000-000000000001',
    NOW()
);