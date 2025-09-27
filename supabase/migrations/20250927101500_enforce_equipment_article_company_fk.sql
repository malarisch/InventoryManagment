-- Enforce that public.equipments.article_id (when set) references an article in the same company
-- 1) Clean up inconsistent data
update public.equipments e
set article_id = null
where article_id is not null
and exists (
  select 1
  from public.articles a
  where a.id = e.article_id
    and a.company_id <> e.company_id
);

-- 2) Ensure a unique key on (id, company_id) to support a composite FK
alter table public.articles
  add constraint articles_id_company_id_key unique (id, company_id);

-- 3) Replace the old single-column FK with a composite FK (article_id, company_id) -> articles(id, company_id)
alter table public.equipments
  drop constraint if exists "||equipments_article_id_fkey||";

alter table public.equipments
  add constraint equipments_article_id_company_fk
  foreign key (article_id, company_id)
  references public.articles (id, company_id)
  on delete no action
  on update no action;
