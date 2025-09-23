'use client';

import { Button } from '@/components/ui/button';
import type { Tables } from '@/database.types';
import Link from 'next/link';
import { Pencil } from 'lucide-react';
import { DataTable } from '@/components/data-table';
import { safeParseDate, formatDate } from '@/lib/dates';

type EquipmentRow = Tables<"equipments"> & {
  articles?: { name: string } | null;
  asset_tags?: { printed_code: string | null } | null;
  current_location_location?: { id: number; name: string | null } | null;
};

type Props = {
  pageSize?: number;
  className?: string;
};

export function EquipmentTable({ pageSize = 10, className }: Props) {
  const columns = [
    { key: 'id', label: 'ID', render: (row: EquipmentRow) => <Link className="underline-offset-2 hover:underline" href={`/management/equipments/${row.id}`}>{row.id}</Link> },
    { key: 'asset_tag', label: 'Asset Tag', render: (row: EquipmentRow) => (
        <Link className="underline-offset-2 hover:underline" href={`/management/equipments/${row.id}`}>
          {row.asset_tags?.printed_code ?? (row.asset_tag !== null ? `#${row.asset_tag}` : "—")}
        </Link>
      ) },
    { key: 'article_id', label: 'Artikel', render: (row: EquipmentRow) => (
        row.article_id ? (
          <Link className="underline-offset-2 hover:underline" href={`/management/articles/${row.article_id}`}>
            {row.articles?.name ?? `#${row.article_id}`}
          </Link>
        ) : (
          "—"
        )
      ) },
    { key: 'current_location', label: 'Aktueller Standort', render: (row: EquipmentRow) => (
        row.current_location ? (
          <Link className="underline-offset-2 hover:underline" href={`/management/locations/${row.current_location}`}>
            {row.current_location_location?.name ?? `#${row.current_location}`}
          </Link>
        ) : (
          "—"
        )
      ) },
    { key: 'added_to_inventory_at', label: 'Im Lager seit', render: (row: EquipmentRow) => formatDate(safeParseDate(row.added_to_inventory_at)) },
  ];

  const renderRowActions = (row: EquipmentRow) => (
    <Button asChild variant="ghost" size="icon">
      <Link href={`/management/equipments/${row.id}`}><Pencil className="w-4 h-4" /></Link>
    </Button>
  );

  return (
    <DataTable<EquipmentRow>
      tableName="equipments"
      columns={columns}
      renderRowActions={renderRowActions}
      pageSize={pageSize}
      className={className}
      searchableFields={[
        { field: 'id', type: 'number' },
        { field: 'asset_tag', type: 'number' },
        { field: 'article_id', type: 'number' },
        { field: 'current_location', type: 'number' },
      ]}
      select="*, articles(name), asset_tags:asset_tag(printed_code), current_location_location:current_location(id,name)"
    />
  );
}