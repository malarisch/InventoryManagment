"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Tables } from "@/database.types";
import { Input } from "@/components/ui/input";
import { safeParseDate, formatDate } from "@/lib/dates";
import Link from "next/link";

type EquipmentRow = Tables<"equipments"> & {
  articles?: { name: string } | null;
  asset_tags?: { printed_code: string | null } | null;
  current_location_location?: { id: number; name: string | null } | null;
};

type Props = {
  pageSize?: number;
  className?: string;
};

export function EquipmentTable({ pageSize = 10, className }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<EquipmentRow[]>([]);
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
        .from("equipments")
        .select(
          "*, articles(name), asset_tags:asset_tag(printed_code), current_location_location:current_location(id,name)",
          { count: "exact" }
        )
        .order("created_at", { ascending: false });

      const searchTerm = dq.trim();
      if (searchTerm.length > 0) {
        const filters: string[] = [];
        const numeric = Number(searchTerm);
        if (!Number.isNaN(numeric)) {
          filters.push(`asset_tag.eq.${numeric}`);
          filters.push(`id.eq.${numeric}`);
        }

        // Fulltext search first
        let articleIds: number[] = [];
        let tagIds: number[] = [];
        const [{ data: artsFts }, { data: tagsFts }] = await Promise.all([
          supabase.from("articles").select("id").textSearch("name", searchTerm, { type: "websearch" }).limit(100),
          supabase.from("asset_tags").select("id").textSearch("printed_code", searchTerm, { type: "websearch" }).limit(100),
        ]);
        articleIds = (artsFts as Array<{ id: number }> | null)?.map((a) => a.id) ?? [];
        tagIds = (tagsFts as Array<{ id: number }> | null)?.map((t) => t.id) ?? [];

        // Fallback to ilike to support prefixes/short tokens
        if (articleIds.length === 0) {
          const likeTerm = `%${searchTerm}%`;
          const { data: artsLike } = await supabase.from("articles").select("id").ilike("name", likeTerm).limit(100);
          articleIds = (artsLike as Array<{ id: number }> | null)?.map((a) => a.id) ?? [];
        }
        if (tagIds.length === 0) {
          const likeTerm = `%${searchTerm}%`;
          const { data: tagsLike } = await supabase.from("asset_tags").select("id").ilike("printed_code", likeTerm).limit(100);
          tagIds = (tagsLike as Array<{ id: number }> | null)?.map((t) => t.id) ?? [];
        }

        if (articleIds.length > 0) filters.push(`article_id.in.(${articleIds.join(",")})`);
        if (tagIds.length > 0) filters.push(`asset_tag.in.(${tagIds.join(",")})`);

        if (filters.length > 0) {
          query = query.or(filters.join(","));
        } else {
          // No candidates -> force empty result for non-empty search
          query = query.or("id.eq.0");
        }
      }

      // no sticker filter; column removed

      const { data, error, count } = await query.range(from, to);

      if (!isActive) return;
      if (error) {
        setError(error.message);
        setRows([]);
        setCount(0);
      } else {
        setRows((data as EquipmentRow[]) ?? []);
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
        <CardTitle>Equipments</CardTitle>
        <CardDescription>{count ?? 0} total</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-2">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Suche (Asset Tag oder Artikel)"
              value={q}
              onChange={(e) => {
                setPage(1);
                setQ(e.target.value);
              }}
              className="w-64"
            />
            {q !== dq && <span className="text-xs text-muted-foreground">Sucht…</span>}
          </div>
        </div>
        <div className="overflow-x-auto border rounded-md">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left font-medium px-3 py-2 border-b">ID</th>
                <th className="text-left font-medium px-3 py-2 border-b">Asset Tag</th>
                <th className="text-left font-medium px-3 py-2 border-b">Artikel</th>
                <th className="text-left font-medium px-3 py-2 border-b">Aktueller Standort</th>
                <th className="text-left font-medium px-3 py-2 border-b">Im Lager seit</th>
                <th className="text-left font-medium px-3 py-2 border-b">Aktionen</th>
            </tr>
          </thead>
          <tbody>
              {loading && rows.length === 0 && (
                <tr>
                  <td className="px-3 py-3 text-muted-foreground" colSpan={5}>
                    Lädt…
                  </td>
                </tr>
              )}
              {!loading && error && (
                <tr>
                  <td className="px-3 py-3 text-red-600" colSpan={5}>
                    Fehler beim Laden: {error}
                  </td>
                </tr>
              )}
              {!loading && !error && rows.length === 0 && (
                <tr>
                  <td className="px-3 py-3 text-muted-foreground" colSpan={5}>
                    Keine Equipments gefunden.
                  </td>
                </tr>
              )}
              {!loading && !error &&
                rows.map((row) => (
                  <tr key={row.id} className="odd:bg-background even:bg-muted/20">
                    <td className="px-3 py-2 border-t align-top">
                      <Link className="underline-offset-2 hover:underline" href={`/management/equipments/${row.id}`}>{row.id}</Link>
                    </td>
                    <td className="px-3 py-2 border-t align-top">
                      <Link className="underline-offset-2 hover:underline" href={`/management/equipments/${row.id}`}>
                        {row.asset_tags?.printed_code ?? (row.asset_tag !== null ? `#${row.asset_tag}` : "—")}
                      </Link>
                    </td>
                    <td className="px-3 py-2 border-t align-top">
                      {row.article_id ? (
                        <Link className="underline-offset-2 hover:underline" href={`/management/articles/${row.article_id}`}>
                          {row.articles?.name ?? `#${row.article_id}`}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-3 py-2 border-t align-top">
                      {row.current_location ? (
                        <Link className="underline-offset-2 hover:underline" href={`/management/locations/${row.current_location}`}>
                          {row.current_location_location?.name ?? `#${row.current_location}`}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-3 py-2 border-t align-top">{formatDate(safeParseDate(row.added_to_inventory_at))}</td>
                    <td className="px-3 py-2 border-t align-top">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/management/equipments/${row.id}`}>Bearbeiten</Link>
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
