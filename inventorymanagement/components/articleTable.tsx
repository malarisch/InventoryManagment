"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import type { Tables } from "@/database.types";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Article = Tables<"articles">;
type ArticleRow = Article & { locations?: { name: string } | null };

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

  useEffect(() => {
    let isActive = true;
    async function load() {
      setLoading(true);
      setError(null);
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      const { data, error, count } = await supabase
        .from("articles")
        .select("*, equipments(count), locations:default_location(name)", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to);
      console.log(data);
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
  }, [page, pageSize, supabase]);

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
          <CardDescription>{count} total</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto border rounded-md">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left font-medium px-3 py-2 border-b">ID</th>
                <th className="text-left font-medium px-3 py-2 border-b">Name</th>
                <th className="text-left font-medium px-3 py-2 border-b">Default Location</th>
                  <th className="text-left font-medium px-3 py-2 border-b">Anzahl</th>
                
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td className="px-3 py-3 text-muted-foreground" colSpan={4}>
                    Lädt…
                  </td>
                </tr>
              )}
              {!loading && error && (
                <tr>
                  <td className="px-3 py-3 text-red-600" colSpan={4}>
                    Fehler beim Laden: {error}
                  </td>
                </tr>
              )}
              {!loading && !error && rows.length === 0 && (
                <tr>
                  <td className="px-3 py-3 text-muted-foreground" colSpan={4}>
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
                      <td className="px-3 py-2 border-t align-top">{(row as any).equipments?.[0]?.count ?? 0}</td>
                  
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
