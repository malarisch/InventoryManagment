'use client';

import { Button } from '@/components/ui/button';
import type { Tables } from '@/database.types';
import Link from 'next/link';
import { Pencil, Scan } from 'lucide-react';
import { DataTable } from '@/components/data-table';

type LocationRow = Tables<"locations"> & { asset_tags?: { printed_code: string | null } | null };

type Props = {
  pageSize?: number;
  className?: string;
  onScanClick?: () => void;
};

export function LocationTable({ pageSize = 10, className, onScanClick }: Props) {
  const columns = [
    { key: 'id', label: 'ID', render: (row: LocationRow) => <Link className="underline-offset-2 hover:underline" href={`/management/locations/${row.id}`}>{row.id}</Link> },
    { key: 'name', label: 'Name', render: (row: LocationRow) => <Link className="underline-offset-2 hover:underline" href={`/management/locations/${row.id}`}>{row.name}</Link> },
    { key: 'description', label: 'Beschreibung', render: (row: LocationRow) => row.description ?? "—" },
    { key: 'asset_tag', label: 'Asset Tag', render: (row: LocationRow) => (row.asset_tag ? (row.asset_tags?.printed_code ?? `#${row.asset_tag}`) : "—") },
  ];

  const renderRowActions = (row: LocationRow) => (
    <Button asChild variant="ghost" size="icon">
      <Link href={`/management/locations/${row.id}`}><Pencil className="w-4 h-4" /></Link>
    </Button>
  );

  const searchTrailingAction = onScanClick ? (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={onScanClick}
      className="h-9 w-9"
    >
      <Scan className="h-4 w-4" />
      <span className="sr-only">Asset-Tag scannen</span>
    </Button>
  ) : null;

  const renderMobileFooterRight = (row: LocationRow) => {
    const assetTagCode = row.asset_tags?.printed_code ?? (row.asset_tag ? `#${row.asset_tag}` : null);
    if (!assetTagCode) return null;
    return `Asset-Tag ${assetTagCode}`;
  };

  return (
    <DataTable<LocationRow>
      tableName="locations"
      columns={columns}
      renderRowActions={renderRowActions}
      pageSize={pageSize}
      className={className}
      searchTrailingAction={searchTrailingAction}
      mobileHiddenColumnKeys={['asset_tag']}
      renderMobileFooterRight={renderMobileFooterRight}
      searchableFields={[
        { field: 'id', type: 'number' },
        { field: 'name', type: 'text' },
        { field: 'description', type: 'text' },
        { field: 'asset_tag', type: 'number' },
      ]}
      select="*, asset_tags:asset_tag(printed_code)"
    />
  );
}