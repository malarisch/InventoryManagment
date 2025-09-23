'use client';

import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import type { Tables } from '@/database.types';
import Link from 'next/link';
import { Pencil } from 'lucide-react';
import { DataTable } from '@/components/data-table';

type CaseRow = Tables<"cases"> & {
  case_equipment_equipment?: { id: number } | null;
};

type Props = {
  pageSize?: number;
  className?: string;
};

export function CaseTable({ pageSize = 10, className }: Props) {
  const columns = [
    { key: 'id', label: 'ID', render: (row: CaseRow) => <Link className="underline-offset-2 hover:underline" href={`/management/cases/${row.id}`}>{row.id}</Link> },
    { key: 'name', label: 'Name', render: (row: CaseRow) => row.name ?? "—" },
    { key: 'case_equipment', label: 'Case-Equipment', render: (row: CaseRow) => (
        row.case_equipment ? (
          <Link className="underline-offset-2 hover:underline" href={`/management/equipments/${row.case_equipment}`}>#{row.case_equipment}</Link>
        ) : "—"
      ) },
    { key: 'equipments', label: 'Equipments', render: (row: CaseRow) => row.equipments?.length ?? 0 },
    { key: 'articles', label: 'Artikel (Summe)', render: (row: CaseRow) => (
        Array.isArray(row.articles) ? (row.articles as unknown as Array<{ amount?: number }>).reduce((acc, it) => acc + (Number(it?.amount) || 0), 0) : 0
      ) },
  ];

  const renderRowActions = (row: CaseRow) => (
    <Button asChild variant="ghost" size="icon">
      <Link href={`/management/cases/${row.id}`}><Pencil className="w-4 h-4" /></Link>
    </Button>
  );

  return (
    <DataTable<CaseRow>
      tableName="cases"
      columns={columns}
      renderRowActions={renderRowActions}
      pageSize={pageSize}
      className={className}
      searchableFields={[
        { field: 'id', type: 'number' },
        { field: 'name', type: 'text' },
      ]}
      select="*, case_equipment_equipment:case_equipment(id)"
    />
  );
}