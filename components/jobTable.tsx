'use client';

import { Button } from '@/components/ui/button';
import type { Tables } from '@/database.types';
import Link from 'next/link';
import { Pencil } from 'lucide-react';
import { DataTable } from '@/components/data-table';
import { safeParseDate, formatDate } from '@/lib/dates';

type JobRow = Tables<"jobs"> & {
  customers?: { id: number; company_name: string | null; forename: string | null; surname: string | null } | null;
};

function customerDisplay(c: JobRow["customers"] | null | undefined): string {
  if (!c) return "—";
  const company = c.company_name?.trim();
  const fn = c.forename?.trim();
  const sn = c.surname?.trim();
  if (company) return company;
  const person = [fn, sn].filter(Boolean).join(" ").trim();
  return person || `#${c.id}`;
}

type Props = {
  pageSize?: number;
  className?: string;
};

export function JobTable({ pageSize = 10, className }: Props) {
  const columns = [
    { key: 'id', label: 'ID', render: (row: JobRow) => <Link className="underline-offset-2 hover:underline" href={`/management/jobs/${row.id}`}>{row.id}</Link> },
    { key: 'name', label: 'Name', render: (row: JobRow) => <Link className="underline-offset-2 hover:underline" href={`/management/jobs/${row.id}`}>{row.name ?? "—"}</Link> },
    { key: 'type', label: 'Typ', render: (row: JobRow) => row.type ?? "—" },
    { key: 'customer_id', label: 'Kunde', render: (row: JobRow) => (
        row.customers?.id ? (
          <Link className="underline-offset-2 hover:underline" href={`/management/customers/${row.customers.id}`}>
            {customerDisplay(row.customers)}
          </Link>
        ) : customerDisplay(row.customers)
      ) },
    { key: 'startdate', label: 'Zeitraum', render: (row: JobRow) => (
        <>{row.startdate ? formatDate(safeParseDate(row.startdate)) : "—"}
        {" – "}
        {row.enddate ? formatDate(safeParseDate(row.enddate)) : "—"}</>
      ) },
    { key: 'job_location', label: 'Ort', render: (row: JobRow) => row.job_location ?? "—" },
  ];

  const renderRowActions = (row: JobRow) => (
    <Button asChild variant="ghost" size="icon">
      <Link href={`/management/jobs/${row.id}`}><Pencil className="w-4 h-4" /></Link>
    </Button>
  );

  return (
    <DataTable<JobRow>
      tableName="jobs"
      columns={columns}
      renderRowActions={renderRowActions}
      pageSize={pageSize}
      className={className}
      searchableFields={[
        { field: 'id', type: 'number' },
        { field: 'name', type: 'text' },
        { field: 'type', type: 'text' },
        { field: 'job_location', type: 'text' },
        { field: 'customer_id', type: 'number' },
      ]}
      select="*, customers:customer_id(id,company_name,forename,surname)"
    />
  );
}