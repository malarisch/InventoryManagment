
'use client';

import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
    filters = []
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

      filters.forEach(({ column, operator = 'eq', value }) => {
        query = query.filter(column, operator, value as never);
      });

      const term = dq.trim();
      if (term.length > 0) {
        const filters: string[] = [];
        searchableFields.forEach(({ field, type }) => {
          if (type === 'number') {
            const numeric = Number(term);
            if (!Number.isNaN(numeric)) filters.push(`${field}.eq.${numeric}`);
          } else {
            filters.push(`${field}.ilike.%${term}%`);
          }
        });
        if (filters.length > 0) query = query.or(filters.join(',')); else query = query.or('id.eq.0');
      }

      const { data, error, count } = await query.range(from, to);
      if (!isActive) return;
      if (error) {
        setError(error.message);
        setRows([]);
        setCount(0);
      } else {
  setRows(((data as unknown) as T[]) ?? []);
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
  }, [page, pageSize, dq, supabase, tableName, filtersKey, searchableFieldsKey, select]);

  const totalPages = useMemo(() => {
    if (!count || count <= 0) return 1;
    return Math.max(1, Math.ceil(count / pageSize));
  }, [count, pageSize]);

  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{tableName}</CardTitle>
        <CardDescription>{count ?? 0} total</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-2 flex items-center gap-2">
          <Input
            placeholder="Search…"
            value={q}
            onChange={(e) => { setPage(1); setQ(e.target.value); }}
            className="w-64"
          />
          {q !== dq && <span className="text-xs text-muted-foreground">Sucht…</span>}
        </div>
        <div className="overflow-x-auto border rounded-md">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-muted">
              <tr>
                {columns.map((col) => (
                  <th key={col.key} className="text-left font-semibold px-4 py-3 border-b">
                    {col.label}
                  </th>
                ))}
                <th className="text-left font-semibold px-4 py-3 border-b">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {loading && rows.length === 0 && (
                <tr>
                  <td className="px-4 py-4 text-muted-foreground" colSpan={columns.length + 1}>
                    Lädt…
                  </td>
                </tr>
              )}
              {!loading && error && (
                <tr>
                  <td className="px-4 py-4 text-red-600" colSpan={columns.length + 1}>
                    Fehler beim Laden: {error}
                  </td>
                </tr>
              )}
              {!loading && !error && rows.length === 0 && (
                <tr>
                  <td className="px-4 py-4 text-muted-foreground" colSpan={columns.length + 1}>
                    Keine Einträge gefunden.
                  </td>
                </tr>
              )}
              {!loading && !error &&
                rows.map((row) => (
                  <tr key={row.id} className="border-b hover:bg-muted/50">
                    {columns.map((col) => (
                      <td key={col.key} className="px-4 py-3 align-top">
                        {col.render ? col.render(row) : (row as unknown as Record<string, unknown>)[col.key] as React.ReactNode}
                      </td>
                    ))}
                    <td className="px-4 py-3 align-top">
                      {renderRowActions(row)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="text-sm text-muted-foreground">
            Seite {page} von {totalPages}
            {typeof count === "number" && (
              <span> • {count} Einträge</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!canPrev || loading}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage((p) => (canNext ? p + 1 : p))}
              disabled={!canNext || loading}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
