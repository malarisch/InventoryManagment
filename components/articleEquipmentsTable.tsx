"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/database.types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { safeParseDate, formatDate } from "@/lib/dates";
import { useCompany } from "@/app/management/_libs/companyHook";

type EquipmentRow = Tables<"equipments"> & {
  asset_tags?: { printed_code: string | null } | null;
  current_location_location?: { id: number; name: string | null } | null;
};

export function ArticleEquipmentsTable({ articleId, pageSize = 10 }: { articleId: number; pageSize?: number }) {
  const { company } = useCompany();
  const supabase = useMemo(() => createClient(), []);
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<EquipmentRow[]>([]);
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!company) {
      setRows([]);
      setCount(0);
      return;
    }
    let active = true;
    async function load() {
      setLoading(true);
      setError(null);
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      const { data, error, count } = await supabase
        .from("equipments")
        .select(
          "*, asset_tags:asset_tag(printed_code), current_location_location:current_location(id,name)",
          { count: "exact" }
        )
        .eq("article_id", articleId)
        .eq("company_id", company!.id)
        .order("created_at", { ascending: false })
        .range(from, to);
      if (!active) return;
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
    return () => { active = false; };
  }, [articleId, page, pageSize, supabase, company]);

  const totalPages = useMemo(() => (count ? Math.max(1, Math.ceil(count / pageSize)) : 1), [count, pageSize]);
  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Equipments dieses Artikels</CardTitle>
          <CardDescription>{count ?? 0} Einträge</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto border rounded-md">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left font-medium px-3 py-2 border-b">ID</th>
                <th className="text-left font-medium px-3 py-2 border-b">Asset Tag</th>
                <th className="text-left font-medium px-3 py-2 border-b">Aktueller Standort</th>
                <th className="text-left font-medium px-3 py-2 border-b">Im Lager seit</th>
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
                  <td className="px-3 py-3 text-muted-foreground" colSpan={4}>Keine Equipments vorhanden.</td>
                </tr>
              )}
              {!loading && !error && rows.map((eq) => (
                <tr key={eq.id} className="odd:bg-background even:bg-muted/20">
                  <td className="px-3 py-2 border-t align-top">
                    <Link className="underline-offset-2 hover:underline" href={`/management/equipments/${eq.id}`}>{eq.id}</Link>
                  </td>
                  <td className="px-3 py-2 border-t align-top">
                    <Link className="underline-offset-2 hover:underline" href={`/management/equipments/${eq.id}`}>
                      {eq.asset_tags?.printed_code ?? (eq.asset_tag !== null ? `#${eq.asset_tag}` : "—")}
                    </Link>
                  </td>
                  <td className="px-3 py-2 border-t align-top">
                    {eq.current_location ? (
                      <Link className="underline-offset-2 hover:underline" href={`/management/locations/${eq.current_location}`}>
                        {eq.current_location_location?.name ?? `#${eq.current_location}`}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-3 py-2 border-t align-top">{formatDate(safeParseDate(eq.added_to_inventory_at))}</td>
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
