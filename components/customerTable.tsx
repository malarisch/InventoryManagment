'use client';

import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import type { Tables } from '@/database.types';
import Link from 'next/link';
import { Pencil } from 'lucide-react';
import { DataTable } from '@/components/data-table';

type Contact = Tables<"contacts">;

function displayName(contact: Contact): string {
  const company = contact.company_name?.trim();
  if (company) return company;
  const person = `${contact.forename ?? contact.first_name ?? ""} ${contact.surname ?? contact.last_name ?? ""}`.trim();
  return person || contact.display_name || `#${contact.id}`;
}

type Props = {
  pageSize?: number;
  className?: string;
};

export function CustomerTable({ pageSize = 10, className }: Props) {
  const customerFilters = useMemo(() => [{ column: 'contact_type', value: 'customer' }], []);
  const columns = [
    { key: 'id', label: 'ID', render: (row: Contact) => <Link className="underline-offset-2 hover:underline" href={`/management/customers/${row.id}`}>{row.id}</Link> },
    { key: 'customer_type', label: 'Typ', render: (row: Contact) => row.customer_type ?? "—" },
    { key: 'display_name', label: 'Name', render: (row: Contact) => <Link className="underline-offset-2 hover:underline" href={`/management/customers/${row.id}`}>{displayName(row)}</Link> },
    { key: 'email', label: 'E-Mail', render: (row: Contact) => row.email ?? "—" },
    { key: 'address', label: 'Adresse', render: (row: Contact) => row.address ?? row.street ?? "—" },
  ];

  const renderRowActions = (row: Contact) => (
    <Button asChild variant="ghost" size="icon">
      <Link href={`/management/customers/${row.id}`}><Pencil className="w-4 h-4" /></Link>
    </Button>
  );

  return (
    <DataTable<Contact>
      tableName="contacts"
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
      filters={customerFilters}
    />
  );
}
