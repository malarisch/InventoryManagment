"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import type { Tables } from "@/database.types";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";

type Article = Tables<"articles">;
type ArticleRow = Article & {
  locations?: { name: string } | null;
  asset_tags?: { printed_code: string | null } | null;
  equipments?: { count: number }[];
};

type Props = {
  pageSize?: number;
  className?: string;
};

export function ArticleTable({ pageSize = 10, className }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<ArticleRow[]>([]);
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
        .from("articles")
        .select("*, equipments(count), locations:default_location(name), asset_tags:asset_tag(printed_code)", { count: "exact" })
        .order("created_at", { ascending: false });

      const term = dq.trim();
      if (term.length > 0) {
        const filters: string[] = [];
        const numeric = Number(term);
        if (!Number.isNaN(numeric)) filters.push(`id.eq.${numeric}`);
        // own name ilike
        const like = `%${term}%`;
        filters.push(`name.ilike.${like}`);
        // FTS on asset tag code and location name to ids
        const [{ data: tagIdsFts }, { data: locIdsFts }] = await Promise.all([
          supabase.from("asset_tags").select("id").textSearch("printed_code", term, { type: "websearch" }).limit(100),
          supabase.from("locations").select("id").textSearch("name", term, { type: "websearch" }).limit(100),
        ]);
        const tagIds = (tagIdsFts as Array<{ id: number }> | null)?.map((t) => t.id) ?? [];
        const locIds = (locIdsFts as Array<{ id: number }> | null)?.map((l) => l.id) ?? [];
        if (tagIds.length > 0) filters.push(`asset_tag.in.(${tagIds.join(",")})`);
        if (locIds.length > 0) filters.push(`default_location.in.(${locIds.join(",")})`);
        if (filters.length > 0) query = query.or(filters.join(",")); else query = query.or("id.eq.0");
      }

      const { data, error, count } = await query.range(from, to);
      if (!isActive) return;
      if (error) {
        setError(error.message);
        setRows([]);
        setCount(0);
      } else {
        setRows((data as ArticleRow[]) ?? []);
        setCount(typeof count === "number" ? count : 0);
      }
      setLoading(false);
    }
    load();
    return () => {
      isActive = false;
    };
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
        <CardTitle>Artikel</CardTitle>
        <CardDescription>{count ?? 0} total</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-2 flex items-center gap-2">
          <Input
            placeholder="Suche (Name, AssetTag, Standort)"
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
                <th className="text-left font-medium px-3 py-2 border-b">Default Location</th>
                <th className="text-left font-medium px-3 py-2 border-b">Asset Tag</th>
                <th className="text-left font-medium px-3 py-2 border-b">Anzahl</th>
                <th className="text-left font-medium px-3 py-2 border-b">Aktionen</th>
                
              </tr>
            </thead>
            <tbody>
              {loading && rows.length === 0 && (
                <tr>
                  <td className="px-3 py-3 text-muted-foreground" colSpan={6}>
                    Lädt…
                  </td>
                </tr>
              )}
              {!loading && error && (
                <tr>
                  <td className="px-3 py-3 text-red-600" colSpan={6}>
                    Fehler beim Laden: {error}
                  </td>
                </tr>
              )}
              {!loading && !error && rows.length === 0 && (
                <tr>
                  <td className="px-3 py-3 text-muted-foreground" colSpan={6}>
                    Keine Artikel gefunden.
                  </td>
                </tr>
              )}
              {!loading && !error &&
                rows.map((row) => (
                  <tr key={row.id} className="odd:bg-background even:bg-muted/20">
                    <td className="px-3 py-2 border-t align-top">
                      <a className="underline-offset-2 hover:underline" href={`/management/articles/${row.id}`}>{row.id}</a>
                    </td>
                    <td className="px-3 py-2 border-t align-top">
                      <a className="underline-offset-2 hover:underline" href={`/management/articles/${row.id}`}>{row.name ?? "—"}</a>
                    </td>
                    <td className="px-3 py-2 border-t align-top">
                      {row.default_location ? (
                        <Link className="underline-offset-2 hover:underline" href={`/management/locations/${row.default_location}`}>
                          {row.locations?.name ?? `#${row.default_location}`}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-3 py-2 border-t align-top">{row.asset_tag ? (row.asset_tags?.printed_code ?? `#${row.asset_tag}`) : "—"}</td>
                    <td className="px-3 py-2 border-t align-top">{row.equipments?.[0]?.count ?? 0}</td>
                    <td className="px-3 py-2 border-t align-top">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/management/articles/${row.id}`}>Bearbeiten</Link>
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
            {typeof count === "number" && (
              <span> • {count} Einträge</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!canPrev || loading}
            >
              Zurück
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => (canNext ? p + 1 : p))}
              disabled={!canNext || loading}
            >
              Weiter
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
