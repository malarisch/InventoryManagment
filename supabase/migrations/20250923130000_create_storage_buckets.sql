-- Create public bucket
-- insert into storage.buckets (id, name, public) values ('public-assets', 'public-assets', true) ON CONFLICT DO NOTHING;

-- Create private bucket
-- insert into storage.buckets (id, name, public) values ('private-attachments', 'private-attachments', false) ON CONFLICT DO NOTHING;

-- RLS policies for private-attachments bucket
-- create policy if not exists "Allow all for company members on private attachments" on storage.objects for all
--  using ( bucket_id = 'private-attachments' and public.is_company_member((string_to_array(name, '/'))[1]::bigint) );