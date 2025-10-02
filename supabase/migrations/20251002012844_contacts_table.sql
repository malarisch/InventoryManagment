create table public.contacts (
  id bigint generated always as identity primary key,
  company_id bigint not null references public.companies(id) on delete cascade,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id),
  contact_type text not null default 'general',
  display_name text not null,
  first_name text,
  last_name text,
  organization text,
  email text,
  phone text,
  has_signal boolean not null default false,
  has_whatsapp boolean not null default false,
  has_telegram boolean not null default false,
  role text,
  street text,
  city text,
  state text,
  zip_code text,
  country text,
  notes text,
  website text,
  metadata jsonb
);

comment on table public.contacts is 'Central contact directory for each company (suppliers, customers, partners).';

create index contacts_company_id_idx on public.contacts (company_id);

alter table public.contacts enable row level security;

create policy "Contacts are viewable by company members" on public.contacts
  for select
  using (public.is_company_member(company_id));

create policy "Contacts can be inserted by company members" on public.contacts
  for insert
  with check (public.is_company_member(company_id));

create policy "Contacts can be updated by company members" on public.contacts
  for update
  using (public.is_company_member(company_id))
  with check (public.is_company_member(company_id));

create policy "Contacts can be deleted by company members" on public.contacts
  for delete
  using (public.is_company_member(company_id));
