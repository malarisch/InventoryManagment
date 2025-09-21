"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Tables } from "@/database.types";
import { Input } from "@/components/ui/input";
import Link from "next/link";

type LocationRow = Tables<"locations"> & { asset_tags?: { printed_code: string | null } | null };

type Props = {
  pageSize?: number;
  className?: string;
};

export function LocationTable({ pageSize = 10, className }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<LocationRow[]>([]);
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const dq = useDeferredValue(q);

  useEffect(() => {
    let isActive = true;
    async function load() {
      setLoading(true);
      setError(null);
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from("locations")
        .select("*, asset_tags:asset_tag(printed_code)", { count: "exact" })
        .order("created_at", { ascending: false });

      const searchTerm = dq.trim();
      if (searchTerm.length > 0) {
        const likeTerm = `*${searchTerm}*`;
        const filters = [`name.ilike.${likeTerm}`, `description.ilike.${likeTerm}`, `asset_tags.printed_code.ilike.${likeTerm}`];
        const numeric = Number(searchTerm);
        if (!Number.isNaN(numeric)) {
          filters.push(`asset_tag.eq.${numeric}`);
          filters.push(`id.eq.${numeric}`);
        }
        query = query.or(filters.join(","));
      }

      const { data, error, count } = await query.range(from, to);
      if (!isActive) return;
      if (error) {
        setError(error.message);
        setRows([]);
        setCount(0);
      } else {
        setRows((data as LocationRow[]) ?? []);
        setCount(typeof count === "number" ? count : 0);
      }
      setLoading(false);
    }
    load();
    return () => { isActive = false; };
  }, [page, pageSize, dq, supabase]);

  const totalPages = useMemo(() => {
    if (!count || count <= 0) return 1;
    return Math.max(1, Math.ceil(count / pageSize));
  }, [count, pageSize]);

  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Standorte</CardTitle>
        <CardDescription>{count} total</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-2">
          <Input
            placeholder="Suche (Name, Beschreibung)"
            value={q}
            onChange={(e) => {
              setPage(1);
              setQ(e.target.value);
            }}
            className="w-64"
          />
          {q !== dq && <span className="text-xs text-muted-foreground">Sucht…</span>}
        </div>
        <div className="overflow-x-auto border rounded-md">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left font-medium px-3 py-2 border-b">ID</th>
                <th className="text-left font-medium px-3 py-2 border-b">Name</th>
                <th className="text-left font-medium px-3 py-2 border-b">Beschreibung</th>
                <th className="text-left font-medium px-3 py-2 border-b">Asset Tag</th>
                <th className="text-left font-medium px-3 py-2 border-b">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {loading && rows.length === 0 && (
                <tr>
                  <td className="px-3 py-3 text-muted-foreground" colSpan={4}>Lädt…</td>
                </tr>
              )}
              {!loading && error && (
                <tr>
                  <td className="px-3 py-3 text-red-600" colSpan={4}>Fehler beim Laden: {error}</td>
                </tr>
              )}
              {!loading && !error && rows.length === 0 && (
                <tr>
                  <td className="px-3 py-3 text-muted-foreground" colSpan={4}>Keine Standorte gefunden.</td>
                </tr>
              )}
              {!loading && !error && rows.map((row) => (
                <tr key={row.id} className="odd:bg-background even:bg-muted/20">
                  <td className="px-3 py-2 border-t align-top">
                    <Link className="underline-offset-2 hover:underline" href={`/management/locations/${row.id}`}>{row.id}</Link>
                  </td>
                  <td className="px-3 py-2 border-t align-top">
                    <Link className="underline-offset-2 hover:underline" href={`/management/locations/${row.id}`}>{row.name}</Link>
                  </td>
                  <td className="px-3 py-2 border-t align-top">{row.description ?? "—"}</td>
                  <td className="px-3 py-2 border-t align-top">{row.asset_tag ? (row.asset_tags?.printed_code ?? `#${row.asset_tag}`) : "—"}</td>
                  <td className="px-3 py-2 border-t align-top">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/management/locations/${row.id}`}>Bearbeiten</Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground">
            Seite {page} von {totalPages}
            {typeof count === "number" && <span> • {count} Einträge</span>}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={!canPrev || loading}>
              Zurück
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => (canNext ? p + 1 : p))} disabled={!canNext || loading}>
              Weiter
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
