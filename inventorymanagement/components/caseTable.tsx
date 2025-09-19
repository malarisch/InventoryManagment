"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Tables, Json } from "@/database.types";
import Link from "next/link";
import { Input } from "@/components/ui/input";

type CaseRow = Tables<"cases"> & {
  case_equipment_equipment?: { id: number } | null;
};

export function CaseTable({ pageSize = 10 }: { pageSize?: number }) {
  const supabase = useMemo(() => createClient(), []);
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<CaseRow[]>([]);
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const dq = useDeferredValue(q);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError(null);
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      let query = supabase
        .from("cases")
        .select("*, case_equipment_equipment:case_equipment(id)", { count: "exact" })
        .order("created_at", { ascending: false });

      const term = dq.trim();
      if (term.length > 0) {
        const filters: string[] = [];
        const numeric = Number(term);
        if (!Number.isNaN(numeric)) filters.push(`id.eq.${numeric}`);
        const like = `%${term}%`;
        filters.push(`name.ilike.${like}`);
        if (filters.length > 0) query = query.or(filters.join(",")); else query = query.or("id.eq.0");
      }

      const { data, error, count } = await query.range(from, to);
      if (!active) return;
      if (error) {
        setError(error.message);
        setRows([]);
        setCount(0);
      } else {
        setRows((data as CaseRow[]) ?? []);
        setCount(typeof count === "number" ? count : 0);
      }
      setLoading(false);
    }
    load();
    return () => { active = false; };
  }, [page, pageSize, dq, supabase]);

  const totalPages = useMemo(() => (count ? Math.max(1, Math.ceil(count / pageSize)) : 1), [count, pageSize]);
  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cases</CardTitle>
        <CardDescription>{count ?? 0} total</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-2 flex items-center gap-2">
          <Input
            placeholder="Suche (Name, ID)"
            value={q}
            onChange={(e) => { setPage(1); setQ(e.target.value); }}
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
                <th className="text-left font-medium px-3 py-2 border-b">Case-Equipment</th>
                <th className="text-left font-medium px-3 py-2 border-b">Equipments</th>
                <th className="text-left font-medium px-3 py-2 border-b">Artikel (Summe)</th>
                <th className="text-left font-medium px-3 py-2 border-b">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
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
                  <td className="px-3 py-3 text-muted-foreground" colSpan={4}>Keine Cases gefunden.</td>
                </tr>
              )}
              {!loading && !error && rows.map((row) => {
                const articleSum = Array.isArray(row.articles) ? (row.articles as unknown as Array<{ amount?: number }>).reduce((acc, it) => acc + (Number(it?.amount) || 0), 0) : 0;
                return (
                  <tr key={row.id} className="odd:bg-background even:bg-muted/20">
                    <td className="px-3 py-2 border-t">
                      <Link className="underline-offset-2 hover:underline" href={`/management/cases/${row.id}`}>{row.id}</Link>
                    </td>
                    <td className="px-3 py-2 border-t">{(row as any).name ?? "—"}</td>
                    <td className="px-3 py-2 border-t">
                      {row.case_equipment ? (
                        <Link className="underline-offset-2 hover:underline" href={`/management/equipments/${row.case_equipment}`}>#{row.case_equipment}</Link>
                      ) : "—"}
                    </td>
                    <td className="px-3 py-2 border-t">{row.equipments?.length ?? 0}</td>
                    <td className="px-3 py-2 border-t">{articleSum}</td>
                    <td className="px-3 py-2 border-t">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/management/cases/${row.id}`}>Bearbeiten</Link>
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground">Seite {page} von {totalPages}{typeof count === "number" && <span> • {count} Einträge</span>}</div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={!canPrev || loading}>Zurück</Button>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => (canNext ? p + 1 : p))} disabled={!canNext || loading}>Weiter</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
