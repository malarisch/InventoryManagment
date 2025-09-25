-- Create custom user
create user "prisma" with password 'custom_password' bypassrls createdb;
-- extend prisma's privileges to postgres (necessary to view changes in Dashboard)
grant "prisma" to "postgres";
-- Grant it necessary permissions over the relevant schemas (public)
grant usage on schema public to prisma;
grant create on schema public to prisma;
grant all on all tables in schema public to prisma;
grant all on all routines in schema public to prisma;
grant all on all sequences in schema public to prisma;
alter default privileges for role postgres in schema public grant all on tables to prisma;
alter default privileges for role postgres in schema public grant all on routines to prisma;
alter default privileges for role postgres in schema public grant all on sequences to prisma;