
'use client';

import { useDeferredValue, useEffect, useMemo, useState, type ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { PostgrestFilterBuilder } from '@supabase/postgrest-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MobileCard } from '@/components/ui/mobile-card';

interface DataTableProps<T> {
  tableName: string;
  columns: { key: string; label: string; render?: (row: T) => React.ReactNode }[];
  renderRowActions: (row: T) => React.ReactNode;
  pageSize?: number;
  className?: string;
  searchableFields?: { field: string; type: 'text' | 'number' }[];
  initialQuery?: string;
  select?: string;
  filters?: { column: string; operator?: string; value: string | number | boolean | null }[];
  searchTrailingAction?: React.ReactNode;
  mobileHiddenColumnKeys?: string[];
  renderMobileFooterLeft?: (row: T) => React.ReactNode;
  renderMobileFooterRight?: (row: T) => React.ReactNode;
  onRowsLoaded?: (rows: T[]) => void;
}

export function DataTable<T extends { id: number }>(
  {
    tableName,
    columns,
    renderRowActions,
    pageSize = 10,
    className,
    searchableFields = [],
    initialQuery = '',
    select = '*',
    filters = [],
    searchTrailingAction,
    mobileHiddenColumnKeys,
    renderMobileFooterLeft,
    renderMobileFooterRight,
    onRowsLoaded
  }: DataTableProps<T>
) {
  const supabase = useMemo(() => createClient(), []);
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<T[]>([]);
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState(initialQuery);
  const dq = useDeferredValue(q);

  // Serialize array dependencies to prevent infinite loops
  const filtersKey = useMemo(() => JSON.stringify(filters), [filters]);
  const searchableFieldsKey = useMemo(() => JSON.stringify(searchableFields), [searchableFields]);

  useEffect(() => {
    let isActive = true;
    async function load() {
      setLoading(true);
      setError(null);
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      let query = supabase.from(tableName).select(select, { count: 'exact' }).order('created_at', { ascending: false });

      const applyBaseFilters = <T,>(builder: PostgrestFilterBuilder<T, any, any, any>) => {
        let next = builder;
        filters.forEach(({ column, operator = 'eq', value }) => {
          next = next.filter(column, operator, value as never);
        });
        return next;
      };

      query = applyBaseFilters(query);

      const term = dq.trim();
      if (term.length > 0 && searchableFields.length > 0) {
        const filters: string[] = [];
        const relatedFilters = new Map<string, string[]>();
        searchableFields.forEach(({ field, type }) => {
          if (type === 'number') {
            const numeric = Number(term);
            if (!Number.isNaN(numeric)) filters.push(`${field}.eq.${numeric}`);
          } else {
            const dotIndex = field.indexOf('.');
            if (dotIndex > 0) {
              const relation = field.slice(0, dotIndex);
              const column = field.slice(dotIndex + 1);
              const list = relatedFilters.get(relation) ?? [];
              list.push(`${column}.ilike.%${term}%`);
              relatedFilters.set(relation, list);
            } else {
              filters.push(`${field}.ilike.%${term}%`);
            }
          }
        });
        if (filters.length > 0) {
          query = query.or(filters.join(','));
        } else if (relatedFilters.size > 0) {
          const ids = new Set<number>();
          for (const [relation, relationFilters] of relatedFilters.entries()) {
            let relatedQuery = supabase
              .from(tableName)
              .select(`id, ${relation}!inner(id)`)
              .order('created_at', { ascending: false });
            relatedQuery = applyBaseFilters(relatedQuery);
            relatedQuery = relatedQuery.or(relationFilters.join(','), { foreignTable: relation });
            const { data, error } = await relatedQuery;
            if (error) {
              setError(error.message);
              setRows([]);
              onRowsLoaded?.([]);
              setCount(0);
              setLoading(false);
              return;
            }
            (data as Array<{ id: number }> | null ?? []).forEach((row) => {
              if (typeof row?.id === 'number') ids.add(row.id);
            });
          }

          if (!isActive) return;
          if (ids.size === 0) {
            setRows([]);
            onRowsLoaded?.([]);
            setCount(0);
            setLoading(false);
            return;
          }

          const idList = Array.from(ids);
          let idQuery = supabase
            .from(tableName)
            .select(select)
            .order('created_at', { ascending: false })
            .in('id', idList);
          idQuery = applyBaseFilters(idQuery);
          const { data, error } = await idQuery.range(from, to);
          if (!isActive) return;
          if (error) {
            setError(error.message);
            setRows([]);
            onRowsLoaded?.([]);
            setCount(0);
          } else {
            const typedRows = ((data as unknown) as T[]) ?? [];
            setRows(typedRows);
            onRowsLoaded?.(typedRows);
            setCount(idList.length);
          }
          setLoading(false);
          return;
        } else {
          if (!isActive) return;
          setRows([]);
          onRowsLoaded?.([]);
          setCount(0);
          setLoading(false);
          return;
        }
      }

      const { data, error, count } = await query.range(from, to);
      if (!isActive) return;
      if (error) {
        setError(error.message);
        setRows([]);
        setCount(0);
        onRowsLoaded?.([]);
      } else {
        const typedRows = ((data as unknown) as T[]) ?? [];
        setRows(typedRows);
        onRowsLoaded?.(typedRows);
        setCount(typeof count === 'number' ? count : 0);
      }
      setLoading(false);
    }
    load();
    return () => {
      isActive = false;
    };
    // Use serialized keys instead of array references to prevent infinite loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, dq, supabase, tableName, filtersKey, searchableFieldsKey, select, onRowsLoaded]);

  const totalPages = useMemo(() => {
    if (!count || count <= 0) return 1;
    return Math.max(1, Math.ceil(count / pageSize));
  }, [count, pageSize]);

  const canPrev = page > 1;
  const canNext = page < totalPages;

  const headerCellClass = 'text-left font-semibold border-b px-3 py-2 text-xs sm:px-4 sm:py-3 sm:text-sm';
  const bodyCellClass = 'px-3 py-2 align-top text-xs sm:px-4 sm:py-3 sm:text-sm';
  const renderCellContent = (row: T, col: (typeof columns)[number]): ReactNode => (
    col.render
      ? col.render(row)
      : ((row as unknown as Record<string, unknown>)[col.key] as ReactNode)
  );
  const hiddenKeys = useMemo(() => {
    const base = new Set(mobileHiddenColumnKeys ?? []);
    base.add('id');
    return base;
  }, [mobileHiddenColumnKeys]);
  const mobileColumns = useMemo(() => columns.filter((column) => !hiddenKeys.has(column.key)), [columns, hiddenKeys]);

  return (
    <Card className={className}>
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="text-base sm:text-lg">{tableName}</CardTitle>
        <CardDescription className="text-xs sm:text-sm">{count ?? 0} total</CardDescription>
      </CardHeader>
      <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
        <div className="mb-3 flex flex-col gap-2 sm:mb-4 sm:flex-row sm:items-center sm:gap-3">
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <Input
              placeholder="Search…"
              value={q}
              onChange={(e) => {
                setPage(1);
                setQ(e.target.value);
              }}
              className="w-full sm:w-64"
            />
            {searchTrailingAction ? (
              <div className="flex shrink-0 items-center">
                {searchTrailingAction}
              </div>
            ) : null}
          </div>
          {q !== dq && <span className="text-xs text-muted-foreground">Sucht…</span>}
        </div>
        <div className="sm:hidden">
          {loading && rows.length === 0 && (
            <div className="rounded-md border bg-muted/20 p-3 text-xs text-muted-foreground">
              Lädt…
            </div>
          )}
          {!loading && error && (
            <div className="rounded-md border border-red-200 bg-red-100/60 p-3 text-xs text-red-700">
              Fehler beim Laden: {error}
            </div>
          )}
          {!loading && !error && rows.length === 0 && (
            <div className="rounded-md border bg-muted/20 p-3 text-xs text-muted-foreground">
              Keine Einträge gefunden.
            </div>
          )}
          {!loading && !error && rows.length > 0 && (
            <div className="space-y-2.5" data-testid="data-table-mobile">
              {rows.map((row) => {
                const fields = mobileColumns.map((col) => ({
                  label: col.label,
                  value: renderCellContent(row, col)
                }));
                
                const leftContent = renderMobileFooterLeft ? renderMobileFooterLeft(row) : `ID ${row.id}`;
                const rightContent = renderMobileFooterRight ? renderMobileFooterRight(row) : null;

                return (
                  <MobileCard
                    key={row.id}
                    fields={fields}
                    actions={renderRowActions(row)}
                    footerLeft={leftContent}
                    footerRight={rightContent}
                  />
                );
              })}
            </div>
          )}
        </div>
        <div className="hidden sm:block">
          <div className="rounded-md border">
            <div className="overflow-hidden">
              <table className="w-full border-collapse text-xs sm:text-sm">
                <thead className="bg-muted">
                  <tr>
                    {columns.map((col) => (
                      <th key={col.key} className={headerCellClass} data-testid={`thead-${col.key}`}>
                        {col.label}
                      </th>
                    ))}
                    <th className={headerCellClass}>Aktionen</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && rows.length === 0 && (
                    <tr>
                      <td className={bodyCellClass} colSpan={columns.length + 1} data-testid="loading-msg">
                        Lädt…
                      </td>
                    </tr>
                  )}
                  {!loading && error && (
                    <tr>
                      <td className={cn(bodyCellClass, "text-red-600")} colSpan={columns.length + 1} data-testid="error-msg">
                        Fehler beim Laden: {error}
                      </td>
                    </tr>
                  )}
                  {!loading && !error && rows.length === 0 && (
                    <tr>
                      <td className={cn(bodyCellClass, "text-muted-foreground")} colSpan={columns.length + 1} data-testid="no-entries">
                        Keine Einträge gefunden.
                      </td>
                    </tr>
                  )}
                  {!loading && !error &&
                    rows.map((row) => (
                      <tr key={row.id} className="border-b hover:bg-muted/50">
                        {columns.map((col) => (
                          <td key={col.key} className={bodyCellClass} data-testid={`cell-${col.key}`}>
                            {renderCellContent(row, col)}
                          </td>
                        ))}
                        <td className={bodyCellClass}>{renderRowActions(row)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-muted-foreground sm:text-sm">
            Seite {page} von {totalPages}
            {typeof count === "number" && <span> • {count} Einträge</span>}
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!canPrev || loading}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage((p) => (canNext ? p + 1 : p))}
              disabled={!canNext || loading}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
