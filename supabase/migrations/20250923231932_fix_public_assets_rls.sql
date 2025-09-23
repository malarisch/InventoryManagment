-- Add RLS policies for public-assets bucket
-- Public assets should be accessible to company members for upload/management
-- but publicly readable by anyone

create policy "Allow company members to manage public assets" on storage.objects for all
  using ( 
    bucket_id = 'public-assets' 
    and public.is_company_member((string_to_array(name, '/'))[1]::bigint) 
  );

-- Allow anyone to read public assets (for logo display, etc.)
create policy "Allow public read access to public assets" on storage.objects for select
  using ( bucket_id = 'public-assets' );
