'use client';

import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import type { Tables } from '@/database.types';
import { useMemo } from 'react';
import Link from 'next/link';
import { Pencil } from 'lucide-react';
import { DataTable } from '@/components/data-table';

type Article = Tables<"articles">;
type ArticleRow = Article & {
  locations?: { name: string } | null;
  asset_tags?: { printed_code: string | null } | null;
  equipments?: { count: number }[];
};

type Props = {
  pageSize?: number;
  className?: string;
};

export function ArticleTable({ pageSize = 10, className }: Props) {
  const supabase = useMemo(() => createClient(), []);

  const columns = [
    { key: 'id', label: 'ID', render: (row: ArticleRow) => <Link className="underline-offset-2 hover:underline" href={`/management/articles/${row.id}`}>{row.id}</Link> },
    { key: 'name', label: 'Name', render: (row: ArticleRow) => <Link className="underline-offset-2 hover:underline" href={`/management/articles/${row.id}`}>{row.name ?? "—"}</Link> },
    { key: 'default_location', label: 'Default Location', render: (row: ArticleRow) => (
        row.default_location ? (
          <Link className="underline-offset-2 hover:underline" href={`/management/locations/${row.default_location}`}>
            {row.locations?.name ?? `#${row.default_location}`}
          </Link>
        ) : (
          "—"
        )
      ) },
    { key: 'asset_tag', label: 'Asset Tag', render: (row: ArticleRow) => (row.asset_tag ? (row.asset_tags?.printed_code ?? `#${row.asset_tag}`) : "—") },
    { key: 'equipments', label: 'Anzahl', render: (row: ArticleRow) => (row.equipments?.[0]?.count ?? 0) },
  ];

  const renderRowActions = (row: ArticleRow) => (
    <Button asChild variant="ghost" size="icon">
      <Link href={`/management/articles/${row.id}`}><Pencil className="w-4 h-4" /></Link>
    </Button>
  );

  return (
    <DataTable<ArticleRow>
      tableName="articles"
      columns={columns}
      renderRowActions={renderRowActions}
      pageSize={pageSize}
      className={className}
      searchableFields={[
        { field: 'id', type: 'number' },
        { field: 'name', type: 'text' },
        { field: 'asset_tag', type: 'number' },
        { field: 'default_location', type: 'number' },
      ]}
      select="*, equipments(count), locations:default_location(name), asset_tags:asset_tag(printed_code)"
    />
  );
}