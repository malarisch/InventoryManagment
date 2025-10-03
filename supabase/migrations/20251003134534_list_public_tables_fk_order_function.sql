set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.list_public_tables_fk_order()
 RETURNS TABLE(table_name regclass, level integer)
 LANGUAGE sql
 STABLE
AS $function$
WITH RECURSIVE fkeys AS (
   -- source and target tables for all foreign keys
   SELECT conrelid AS source,
          confrelid AS target
   FROM pg_catalog.pg_constraint
   WHERE contype = 'f'
),
tables AS (
      (   -- all tables ...
          SELECT oid AS table_name,
                 1 AS level,
                 ARRAY[oid] AS trail,
                 FALSE AS circular
          FROM pg_catalog.pg_class
          WHERE relkind = 'r'
            AND NOT relnamespace::regnamespace::text LIKE ANY
                    (ARRAY['pg_catalog', 'information_schema', 'pg_temp_%'])
       EXCEPT
          -- ... except the ones that have a foreign key
          SELECT source,
                 1,
                 ARRAY[source],
                 FALSE
          FROM fkeys
      )
   UNION ALL
      -- all tables with a foreign key pointing a table in the working set
      SELECT f.source,
             t.level + 1,
             t.trail || f.source,
             t.trail @> ARRAY[f.source]
      FROM fkeys f
      JOIN tables t ON t.table_name = f.target
      -- stop when a table appears in the trail the third time
      WHERE cardinality(array_positions(t.trail, f.source)) < 2
),
ordered_tables AS (
   -- get the highest level per table
   SELECT DISTINCT ON (table_name)
          table_name,
          level,
          circular
   FROM tables
   ORDER BY table_name, level DESC
)
SELECT ot.table_name::regclass,
       ot.level
FROM ordered_tables ot
JOIN pg_catalog.pg_class c ON c.oid = ot.table_name
JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
WHERE NOT ot.circular
  AND n.nspname = 'public'
ORDER BY ot.level, ot.table_name;
$function$
;


