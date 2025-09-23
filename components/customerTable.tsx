'use client';

import { Button } from '@/components/ui/button';
import type { Tables } from '@/database.types';
import Link from 'next/link';
import { Pencil } from 'lucide-react';
import { DataTable } from '@/components/data-table';

type Customer = Tables<"customers">;

function displayName(c: Customer): string {
  const company = c.company_name?.trim();
  if (company) return company;
  const full = `${c.forename ?? ""} ${c.surname ?? ""}`.trim();
  return full || `#${c.id}`;
}

type Props = {
  pageSize?: number;
  className?: string;
};

export function CustomerTable({ pageSize = 10, className }: Props) {
  const columns = [
    { key: 'id', label: 'ID', render: (row: Customer) => <Link className="underline-offset-2 hover:underline" href={`/management/customers/${row.id}`}>{row.id}</Link> },
    { key: 'type', label: 'Typ', render: (row: Customer) => row.type ?? "—" },
    { key: 'name', label: 'Name', render: (row: Customer) => <Link className="underline-offset-2 hover:underline" href={`/management/customers/${row.id}`}>{displayName(row)}</Link> },
    { key: 'email', label: 'E-Mail', render: (row: Customer) => row.email ?? "—" },
    { key: 'address', label: 'Adresse', render: (row: Customer) => row.address ?? "—" },
  ];

  const renderRowActions = (row: Customer) => (
    <Button asChild variant="ghost" size="icon">
      <Link href={`/management/customers/${row.id}`}><Pencil className="w-4 h-4" /></Link>
    </Button>
  );

  return (
    <DataTable<Customer>
      tableName="customers"
      columns={columns}
      renderRowActions={renderRowActions}
      pageSize={pageSize}
      className={className}
      searchableFields={[
        { field: 'id', type: 'number' },
        { field: 'company_name', type: 'text' },
        { field: 'forename', type: 'text' },
        { field: 'surname', type: 'text' },
        { field: 'email', type: 'text' },
        { field: 'address', type: 'text' },
        { field: 'country', type: 'text' },
        { field: 'postal_code', type: 'text' },
      ]}
    />
  );
}