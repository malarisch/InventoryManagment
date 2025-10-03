WITH RECURSIVE fkeys AS (
   /* source and target tables for all foreign keys */
   SELECT conrelid AS source,
          confrelid AS target
   FROM pg_constraint
   WHERE contype = 'f'
),
tables AS (
      (   /* all tables ... */
          SELECT oid AS table_name,
                 1 AS level,
                 ARRAY[oid] AS trail,
                 FALSE AS circular
          FROM pg_class
          WHERE relkind = 'r'
            AND NOT relnamespace::regnamespace::text LIKE ANY
                    (ARRAY['pg_catalog', 'information_schema', 'pg_temp_%'])
       EXCEPT
          /* ... except the ones that have a foreign key */
          SELECT source,
                 1,
                 ARRAY[ source ],
                 FALSE
          FROM fkeys
      )
   UNION ALL
      /* all tables with a foreign key pointing a table in the working set */
      SELECT fkeys.source,
             tables.level + 1,
             tables.trail || fkeys.source,
             tables.trail @> ARRAY[fkeys.source]
      FROM fkeys
         JOIN tables ON tables.table_name = fkeys.target
      WHERE cardinality(array_positions(tables.trail, fkeys.source)) < 2
),
ordered_tables AS (
   /* get the highest level per table */
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
JOIN pg_class c ON c.oid = ot.table_name
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE NOT ot.circular
ORDER BY ot.level, ot.table_name;
