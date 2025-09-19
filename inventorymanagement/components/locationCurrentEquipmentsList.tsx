"use client";

import type { Tables } from "@/database.types";
import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { safeParseDate, formatDate } from "@/lib/dates";

type EquipmentRow = Tables<"equipments"> & {
  articles?: { name: string } | null;
  asset_tags?: { printed_code: string | null } | null;
};

export function LocationCurrentEquipmentsList({ items, pageSize = 10 }: { items: EquipmentRow[]; pageSize?: number }) {
  const [page, setPage] = useState(1);
  const count = items.length;
  const totalPages = useMemo(() => (count ? Math.max(1, Math.ceil(count / pageSize)) : 1), [count, pageSize]);
  const canPrev = page > 1;
  const canNext = page < totalPages;

  const pageItems = useMemo(() => {
    const from = (page - 1) * pageSize;
    const to = from + pageSize;
    return items.slice(from, to);
  }, [items, page, pageSize]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Equipments an diesem Standort</CardTitle>
        <CardDescription>{count} Einträge</CardDescription>
      </CardHeader>
      <CardContent>
        {count === 0 ? (
          <div className="text-sm text-muted-foreground">Keine Equipments aktuell hier.</div>
        ) : (
          <div className="overflow-x-auto border rounded-md">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left font-medium px-3 py-2 border-b">ID</th>
                  <th className="text-left font-medium px-3 py-2 border-b">Asset Tag</th>
                  <th className="text-left font-medium px-3 py-2 border-b">Artikel</th>
                  <th className="text-left font-medium px-3 py-2 border-b">Im Lager seit</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((eq) => (
                  <tr key={eq.id} className="odd:bg-background even:bg-muted/20">
                    <td className="px-3 py-2 border-t align-top">
                      <Link className="underline-offset-2 hover:underline" href={`/management/equipments/${eq.id}`}>{eq.id}</Link>
                    </td>
                    <td className="px-3 py-2 border-t align-top">
                      <Link className="underline-offset-2 hover:underline" href={`/management/equipments/${eq.id}`}>
                        {eq.asset_tags?.printed_code ?? (eq.asset_tag !== null ? `#${eq.asset_tag}` : "—")}
                      </Link>
                    </td>
                    <td className="px-3 py-2 border-t align-top">{eq.articles?.name ?? "—"}</td>
                    <td className="px-3 py-2 border-t align-top">{formatDate(safeParseDate(eq.added_to_inventory_at))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground">
            Seite {page} von {totalPages}
            <span> • {count} Einträge</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={!canPrev}>
              Zurück
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => (canNext ? p + 1 : p))} disabled={!canNext}>
              Weiter
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
