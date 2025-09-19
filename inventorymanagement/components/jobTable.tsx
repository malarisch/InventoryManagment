"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Tables } from "@/database.types";
import Link from "next/link";
import { safeParseDate, formatDate } from "@/lib/dates";

type JobRow = Tables<"jobs"> & {
  customers?: { id: number; company_name: string | null; forename: string | null; surname: string | null } | null;
};

type Props = {
  pageSize?: number;
  className?: string;
};

function customerDisplay(c: JobRow["customers"] | null | undefined): string {
  if (!c) return "—";
  const company = c.company_name?.trim();
  const fn = c.forename?.trim();
  const sn = c.surname?.trim();
  if (company) return company;
  const person = [fn, sn].filter(Boolean).join(" ").trim();
  return person || `#${c.id}`;
}

export function JobTable({ pageSize = 10, className }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<JobRow[]>([]);
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
        .from("jobs")
        .select("*, customers:customer_id(id,company_name,forename,surname)", { count: "exact" })
        .order("created_at", { ascending: false });

      const search = dq.trim();
      if (search.length > 0) {
        const like = `*${search}*`;
        const filters = [
          `name.ilike.${like}`,
          `type.ilike.${like}`,
          `job_location.ilike.${like}`,
          `customers.company_name.ilike.${like}`,
          `customers.forename.ilike.${like}`,
          `customers.surname.ilike.${like}`,
        ];
        const numeric = Number(search);
        if (!Number.isNaN(numeric)) {
          filters.push(`id.eq.${numeric}`);
          filters.push(`customer_id.eq.${numeric}`);
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
        setRows((data as JobRow[]) ?? []);
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
        <CardTitle>Jobs</CardTitle>
        <CardDescription>{count ?? 0} total</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-2 flex items-center gap-2">
          <Input
            placeholder="Suche (Name, Kunde, Ort)"
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
                <th className="text-left font-medium px-3 py-2 border-b">Typ</th>
                <th className="text-left font-medium px-3 py-2 border-b">Kunde</th>
                <th className="text-left font-medium px-3 py-2 border-b">Zeitraum</th>
                <th className="text-left font-medium px-3 py-2 border-b">Ort</th>
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
                    Keine Jobs gefunden.
                  </td>
                </tr>
              )}
              {!loading && !error &&
                rows.map((row) => (
                  <tr key={row.id} className="odd:bg-background even:bg-muted/20">
                    <td className="px-3 py-2 border-t align-top">
                      <Link className="underline-offset-2 hover:underline" href={`/management/jobs/${row.id}`}>{row.id}</Link>
                    </td>
                    <td className="px-3 py-2 border-t align-top">
                      <Link className="underline-offset-2 hover:underline" href={`/management/jobs/${row.id}`}>{row.name ?? "—"}</Link>
                    </td>
                    <td className="px-3 py-2 border-t align-top">{row.type ?? "—"}</td>
                    <td className="px-3 py-2 border-t align-top">
                      {row.customers?.id ? (
                        <Link className="underline-offset-2 hover:underline" href={`/management/customers/${row.customers.id}`}>
                          {customerDisplay(row.customers)}
                        </Link>
                      ) : customerDisplay(row.customers)}
                    </td>
                    <td className="px-3 py-2 border-t align-top">
                      {row.startdate ? formatDate(safeParseDate(row.startdate)) : "—"}
                      {" – "}
                      {row.enddate ? formatDate(safeParseDate(row.enddate)) : "—"}
                    </td>
                    <td className="px-3 py-2 border-t align-top">{row.job_location ?? "—"}</td>
                    <td className="px-3 py-2 border-t align-top">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/management/jobs/${row.id}`}>Bearbeiten</Link>
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
