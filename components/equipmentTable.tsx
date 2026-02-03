'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import type { Tables } from '@/database.types';
import Link from 'next/link';
import { AlertTriangle, Pencil, Scan } from 'lucide-react';
import { DataTable } from '@/components/data-table';
import { safeParseDate, formatDate } from '@/lib/dates';
import { createClient } from '@/lib/supabase/client';
import { useCompany } from '@/app/management/_libs/companyHook';

type EquipmentRow = Tables<"equipments"> & {
  articles?: { name: string } | null;
  asset_tags?: { printed_code: string | null } | null;
  current_location_location?: { id: number; name: string | null } | null;
};

type CaseRow = Tables<"cases"> & {
  case_equipment_equipment?: {
    id: number;
    current_location: number | null;
    current_location_location?: { id: number; name: string | null } | null;
  } | null;
};

type CaseMembership = {
  id: number;
  name: string;
  locationId: number | null;
  locationName: string | null;
  kind: 'contained' | 'case-equipment';
};

type EquipmentCaseMap = Record<number, CaseMembership[]>;

type Props = {
  pageSize?: number;
  className?: string;
  onScanClick?: () => void;
};

export function EquipmentTable({ pageSize = 10, className, onScanClick }: Props) {
  const { company } = useCompany();
  const supabase = useMemo(() => createClient(), []);
  const [visibleEquipmentIds, setVisibleEquipmentIds] = useState<number[]>([]);
  const [equipmentCases, setEquipmentCases] = useState<EquipmentCaseMap>({});

  const handleRowsLoaded = useCallback((rows: EquipmentRow[]) => {
    const ids = rows
      .map((row) => Number(row.id))
      .filter((id) => Number.isFinite(id))
      .sort((a, b) => a - b);
    setVisibleEquipmentIds((previous) => {
      if (previous.length === ids.length && previous.every((value, index) => value === ids[index])) {
        return previous;
      }
      return ids;
    });
  }, []);

  useEffect(() => {
    if (visibleEquipmentIds.length === 0 || !company) {
      setEquipmentCases({});
      return;
    }
    let cancelled = false;
    const ids = visibleEquipmentIds;
    const idSet = new Set(ids);
    const companyId = company.id; // Capture company ID to satisfy TypeScript

    async function loadCases() {
      const selectColumns = 'id, name, contains_equipments, case_equipment, case_equipment_equipment:case_equipment(id, current_location, current_location_location:current_location(id,name))';

      const [containsRes, caseEquipmentRes] = await Promise.all([
        supabase
          .from('cases')
          .select(selectColumns)
          .eq('company_id', companyId)
          .overlaps('contains_equipments', ids),
        supabase
          .from('cases')
          .select(selectColumns)
          .eq('company_id', companyId)
          .in('case_equipment', ids),
      ]);

      if (cancelled) return;

      if (containsRes.error && caseEquipmentRes.error) {
        setEquipmentCases({});
        return;
      }

      const membership: EquipmentCaseMap = {};
      const pushMembership = (equipmentId: number, caseRow: CaseRow, kind: CaseMembership['kind']) => {
        if (!idSet.has(equipmentId)) return;
        const displayName = caseRow.name ?? `Case #${caseRow.id}`;
        const existing = membership[equipmentId] ?? [];
        if (!existing.some((entry) => entry.id === caseRow.id && entry.kind === kind)) {
          const caseLocationId = caseRow.case_equipment_equipment?.current_location ?? null;
          const caseLocationName = caseRow.case_equipment_equipment?.current_location_location?.name ?? null;
          existing.push({
            id: caseRow.id,
            name: displayName,
            locationId: caseLocationId,
            locationName: caseLocationName,
            kind,
          });
          membership[equipmentId] = existing;
        }
      };

      const containsData = (containsRes.data as CaseRow[] | null) ?? [];
      for (const caseRow of containsData) {
        const contained = Array.isArray(caseRow.contains_equipments) ? caseRow.contains_equipments : [];
        contained.forEach((rawId) => {
          const numericId = Number(rawId);
          if (Number.isFinite(numericId)) {
            pushMembership(numericId, caseRow, 'contained');
          }
        });
      }

      const caseEquipData = (caseEquipmentRes.data as CaseRow[] | null) ?? [];
      for (const caseRow of caseEquipData) {
        const equipmentIdRaw = caseRow.case_equipment;
        if (equipmentIdRaw === null || equipmentIdRaw === undefined) continue;
        const numericId = Number(equipmentIdRaw);
        if (Number.isFinite(numericId)) {
          pushMembership(numericId, caseRow, 'case-equipment');
        }
      }

      // Ensure deterministic ordering of case names
      for (const key of Object.keys(membership)) {
        const numericKey = Number(key);
        if (Number.isNaN(numericKey)) continue;
        membership[numericKey] = membership[numericKey]
          .slice()
          .sort((a, b) => a.name.localeCompare(b.name, 'de-DE'));
      }

      setEquipmentCases(membership);
    }

    void loadCases();

    return () => {
      cancelled = true;
    };
  }, [supabase, visibleEquipmentIds, company]);

  if (!company) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        No company selected. Please select a company to view equipment.
      </div>
    );
  }

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
    { key: 'current_location', label: 'Standort', render: (row: EquipmentRow) => {
        const cases = equipmentCases[row.id] ?? [];
        const containedCases = cases.filter((entry) => entry.kind === 'contained');
        const containerCases = cases.filter((entry) => entry.kind === 'case-equipment');

        const equipmentLocationLabel = row.current_location_location?.name ?? (row.current_location ? `#${row.current_location}` : null);
        const equipmentLocationId = row.current_location ?? row.current_location_location?.id ?? null;

        const renderLocationLink = (label: string, locationId: number | null, className?: string) => {
          if (!locationId) return <span className={className}>{label}</span>;
          return (
            <Link className={`underline-offset-2 hover:underline ${className ?? ''}`} href={`/management/locations/${locationId}`}>
              {label}
            </Link>
          );
        };

        const renderCaseLinks = (memberships: CaseMembership[], className?: string) => (
          <>
            {memberships.map((entry, index) => (
              <span key={`${entry.id}-${entry.kind}`}>
                <Link className={`underline-offset-2 hover:underline ${className ?? ''}`} href={`/management/cases/${entry.id}`}>
                  {entry.name}
                </Link>
                {index < memberships.length - 1 ? ', ' : ''}
              </span>
            ))}
          </>
        );

        if (containedCases.length > 0) {
          const primaryCase = containedCases[0];
          const caseLocationLabel = primaryCase.locationName ?? (primaryCase.locationId ? `#${primaryCase.locationId}` : 'Case ohne Standort');

          if (equipmentLocationLabel) {
            return (
              <span className="inline-flex items-center gap-1 text-destructive">
                <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                {renderLocationLink(equipmentLocationLabel, equipmentLocationId, 'text-destructive')}
                <span>(-&gt; nicht in {renderCaseLinks([primaryCase], 'text-destructive')})</span>
              </span>
            );
          }

          return (
            <span>
              {renderLocationLink(caseLocationLabel, primaryCase.locationId)}
              <span> (-&gt; {renderCaseLinks([primaryCase])})</span>
            </span>
          );
        }

        if (equipmentLocationLabel) {
          const combinedCases = containerCases.length > 0 ? containerCases : cases;
          const caseLinks = combinedCases.length > 0 ? renderCaseLinks(combinedCases) : null;

          return (
            <span>
              {renderLocationLink(equipmentLocationLabel, equipmentLocationId)}
              {caseLinks ? <span> ({caseLinks})</span> : null}
            </span>
          );
        }

        if (cases.length > 0) {
          return <span>{renderCaseLinks(cases)}</span>;
        }

        return '—';
      } },
   // { key: 'added_to_inventory_at', label: 'Im Lager seit', render: (row: EquipmentRow) => formatDate(safeParseDate(row.added_to_inventory_at)) },
  ];

  const renderRowActions = (row: EquipmentRow) => (
    <Button asChild variant="ghost" size="icon">
      <Link href={`/management/equipments/${row.id}`}><Pencil className="w-4 h-4" /></Link>
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

  const renderMobileFooter = (row: EquipmentRow) => {
    const assetTagCode = row.asset_tags?.printed_code ?? (row.asset_tag !== null ? `#${row.asset_tag}` : null);
    const inventoryDate = row.added_to_inventory_at ? formatDate(safeParseDate(row.added_to_inventory_at)) : null;
    if (!assetTagCode && !inventoryDate) return null;

    const parts: string[] = [];
    if (inventoryDate) parts.push(`Im Lager seit ${inventoryDate}`);
    if (assetTagCode) parts.push(`Asset-Tag ${assetTagCode}`);

    return parts.join(' • ');
  };

  return (
    <DataTable<EquipmentRow>
      tableName="equipments"
      columns={columns}
      renderRowActions={renderRowActions}
      pageSize={pageSize}
      className={className}
      searchTrailingAction={searchTrailingAction}
      mobileHiddenColumnKeys={['asset_tag']}
      renderMobileFooterRight={renderMobileFooter}
      searchableFields={[
        { field: 'id', type: 'number' },
        { field: 'asset_tag', type: 'number' },
        { field: 'article_id', type: 'number' },
        { field: 'current_location', type: 'number' },
        { field: 'articles.name', type: 'text' },
        { field: 'asset_tag.printed_code', type: 'text' },
      ]}
      select="*, articles(name), asset_tags:asset_tag(printed_code), current_location_location:current_location(id,name)"
      onRowsLoaded={handleRowsLoaded}
      filters={[{ column: 'company_id', value: company.id }]}
    />
  );
}
