-- Add contact_person_id column to contacts table
-- This allows company-type contacts to reference a person contact as their main contact person

alter table public.contacts
add column contact_person_id bigint references public.contacts(id) on delete set null;

comment on column public.contacts.contact_person_id is 'Optional reference to a person contact who serves as the main contact for this company. Only used when contact_type is ''company''.';

-- Add index for better query performance
create index idx_contacts_contact_person_id on public.contacts(contact_person_id);
