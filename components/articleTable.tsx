'use client';

import { Button } from '@/components/ui/button';
import type { Tables } from '@/database.types';
import Link from 'next/link';
import { Pencil, Scan } from 'lucide-react';
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
  onScanClick?: () => void;
};

export function ArticleTable({ pageSize = 10, className, onScanClick }: Props) {

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

  const renderMobileFooterRight = (row: ArticleRow) => {
    const assetTagCode = row.asset_tags?.printed_code ?? (row.asset_tag ? `#${row.asset_tag}` : null);
    if (!assetTagCode) return null;
    return `Asset-Tag ${assetTagCode}`;
  };

  return (
    <DataTable<ArticleRow>
      tableName="articles"
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
        { field: 'asset_tag', type: 'number' },
        { field: 'default_location', type: 'number' },
      ]}
      select="*, equipments(count), locations:default_location(name), asset_tags:asset_tag(printed_code)"
    />
  );
}