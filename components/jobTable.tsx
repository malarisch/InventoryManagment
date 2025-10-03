'use client';

import { Button } from '@/components/ui/button';
import type { Tables } from '@/database.types';
import Link from 'next/link';
import { Pencil } from 'lucide-react';
import { DataTable } from '@/components/data-table';
import { safeParseDate, formatDate } from '@/lib/dates';

type JobRow = Tables<"jobs"> & {
  contacts?: {
    id: number;
    display_name: string | null;
    company_name: string | null;
    forename: string | null;
    surname: string | null;
    first_name: string | null;
    last_name: string | null;
    contact_type: string | null;
  } | null;
};

function contactDisplay(c: JobRow["contacts"] | null | undefined): string {
  if (!c) return "—";
  const company = c.company_name?.trim();
  const fn = (c.forename ?? c.first_name)?.trim();
  const sn = (c.surname ?? c.last_name)?.trim();
  if (c.display_name?.trim()) return c.display_name.trim();
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
    { key: 'contact_id', label: 'Kontakt', render: (row: JobRow) => (
        row.contacts?.id ? (
          <Link className="underline-offset-2 hover:underline" href={`/management/contacts/${row.contacts.id}`}>
            {contactDisplay(row.contacts)}
          </Link>
        ) : contactDisplay(row.contacts)
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
        { field: 'contact_id', type: 'number' },
      ]}
      select="*, contacts:contact_id(id,display_name,company_name,forename,surname,first_name,last_name,contact_type)"
    />
  );
}
