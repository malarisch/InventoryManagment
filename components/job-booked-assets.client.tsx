"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Tables } from "@/database.types";
import type { ArticleMetadata } from "@/components/metadataTypes.types";

type Booked = {
  id: number;
  job_id: number;
  company_id: number;
  equipment_id: number | null;
  case_id: number | null;
  equipments?: { id: number; article_id: number | null; articles?: { name: string | null; metadata?: unknown } | null } | null;
  cases?: { id: number } | null;
};

export function JobBookedAssetsList({ jobId, initial }: { jobId: number; initial: Booked[] }) {
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<Booked[]>(() => initial);
  const [status, setStatus] = useState<string | null>(null);
  const [lastRemoved, setLastRemoved] = useState<Booked | null>(null);
  const [loading, setLoading] = useState(false);

  const loadLatest = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("job_booked_assets")
      .select("*, equipments:equipment_id(id, article_id, articles(name,metadata)), cases:case_id(id)")
      .eq("job_id", jobId)
      .order("created_at", { ascending: false });
    if (!error && Array.isArray(data)) {
      setRows(data as Booked[]);
    }
    setLoading(false);
  }, [supabase, jobId]);

  useEffect(() => {
    void loadLatest();

    const channel = supabase
      .channel(`job-booked-assets-${jobId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'job_booked_assets', filter: `job_id=eq.${jobId}` },
        async (payload) => {
          const newRowId = (payload.new as { id?: number } | null)?.id;
          if (!newRowId) return;
          const { data } = await supabase
            .from("job_booked_assets")
            .select("*, equipments:equipment_id(id, article_id, articles(name,metadata)), cases:case_id(id)")
            .eq("id", newRowId)
            .limit(1)
            .single();
          if (!data) return;
          setRows((prev) => {
            const filtered = prev.filter((row) => row.id !== (data as Booked).id);
            return [{ ...(data as Booked) }, ...filtered];
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'job_booked_assets', filter: `job_id=eq.${jobId}` },
        async (payload) => {
          const updatedId = (payload.new as { id?: number } | null)?.id;
          if (!updatedId) return;
          const { data } = await supabase
            .from("job_booked_assets")
            .select("*, equipments:equipment_id(id, article_id, articles(name,metadata)), cases:case_id(id)")
            .eq("id", updatedId)
            .limit(1)
            .single();
          if (!data) return;
          setRows((prev) => {
            const rest = prev.filter((row) => row.id !== updatedId);
            return [{ ...(data as Booked) }, ...rest];
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'job_booked_assets', filter: `job_id=eq.${jobId}` },
        (payload) => {
          const removedId = (payload.old as { id?: number } | null)?.id;
          if (!removedId) return;
          setRows((prev) => prev.filter((row) => row.id !== removedId));
        }
      )
      .subscribe();

    // Listen to manual refresh requests (from other components) and reload
    const onRefresh: EventListener = (event) => {
      try {
        const custom = event as CustomEvent<{ jobId?: number }>;
        if (!custom.detail?.jobId || custom.detail.jobId === jobId) {
          void loadLatest();
        }
      } catch {
        void loadLatest();
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('job-booked-assets:refresh', onRefresh);
    }

    return () => {
      supabase.removeChannel(channel);
      if (typeof window !== 'undefined') {
        window.removeEventListener('job-booked-assets:refresh', onRefresh);
      }
    };
  }, [supabase, jobId, loadLatest]);

  async function remove(id: number) {
    setStatus(null);
    const prev = rows;
    const removed = rows.find((x) => x.id === id) || null;
    setRows((r) => r.filter((x) => x.id !== id));
    const { error } = await supabase.from("job_booked_assets").delete().eq("id", id);
    if (error) {
      setRows(prev);
      setStatus(error.message);
    } else {
      setLastRemoved(removed);
      setStatus("Entfernt. ");
    }
  }

  async function undo() {
    if (!lastRemoved) return;
    const payload: {
      company_id: number;
      job_id: number;
      equipment_id?: number;
      case_id?: number;
    } = {
      company_id: lastRemoved.company_id,
      job_id: lastRemoved.job_id,
    };
    if (typeof lastRemoved.equipment_id === 'number') payload.equipment_id = lastRemoved.equipment_id;
    if (typeof lastRemoved.case_id === 'number') payload.case_id = lastRemoved.case_id;
    const { data, error } = await supabase
      .from("job_booked_assets")
      .insert(payload)
      .select("*, equipments:equipment_id(id, article_id, articles(name,metadata)), cases:case_id(id)")
      .single();
    if (error) {
      setStatus(error.message);
      return;
    }
    setRows((prev) => {
      const rest = prev.filter((row) => row.id !== (data as Booked).id);
      return [{ ...(data as Booked) }, ...rest];
    });
    setLastRemoved(null);
    setStatus("Wiederhergestellt.");
  }

  // Build enriched entries for grouping and display
  type Entry = {
    id: number;
    kind: "equipment" | "case";
    refId: number; // equipment_id or case_id
    articleId?: number | null;
    articleName?: string | null;
    articleType?: string | null;
    priceAmount?: number | null; // in smallest unit
    priceCurrency?: string | null;
  };

  const entries: Entry[] = useMemo(() => {
    const list: Entry[] = [];
    for (const r of rows) {
      if (r.equipment_id && r.equipments) {
        const eq = r.equipments as Tables<"equipments"> & { articles?: Tables<"articles"> | null };
        const art = eq.articles as Tables<"articles"> | null;
        const meta = (art?.metadata as unknown as ArticleMetadata | null) ?? null;
        list.push({
          id: r.id,
          kind: "equipment",
          refId: r.equipment_id,
          articleId: eq.article_id,
          articleName: art?.name ?? null,
          articleType: (meta?.type ?? null),
          priceAmount: meta?.dailyRentalRate?.amount ?? null,
          priceCurrency: meta?.dailyRentalRate?.currency ?? null,
        });
      } else if (r.case_id) {
        list.push({ id: r.id, kind: "case", refId: r.case_id, articleType: "Case" });
      }
    }
    return list;
  }, [rows]);

  // Simple search over name/id/type
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return entries;
    return entries.filter((e) => {
      const idMatch = String(e.refId).includes(term);
      const nameMatch = (e.articleName ?? "").toLowerCase().includes(term);
      const typeMatch = (e.articleType ?? "").toLowerCase().includes(term);
      return idMatch || nameMatch || typeMatch;
    });
  }, [entries, query]);

  // Group by articleType; put null/empty under "Ohne Typ" and Cases as their own group
  const groups = useMemo(() => {
    const map = new Map<string, Entry[]>();
    for (const e of filtered) {
      const key = e.kind === "case" ? "Cases" : (e.articleType && e.articleType.trim().length ? e.articleType : "Ohne Typ");
      const arr = map.get(key) ?? [];
      arr.push(e);
      map.set(key, arr);
    }
    // stable order: alphabetic but put Cases at bottom
    const keys = Array.from(map.keys()).sort((a, b) => {
      if (a === "Cases") return 1;
      if (b === "Cases") return -1;
      return a.localeCompare(b, "de-DE");
    });
    return keys.map((k) => ({ key: k, items: map.get(k)! }));
  }, [filtered]);

  function fmtCurrency(amount: number | null | undefined, currency: string | null | undefined): string | null {
    if (amount == null || currency == null) return null;
    return new Intl.NumberFormat("de-DE", { style: "currency", currency }).format(amount / 100);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <input
          className="h-9 w-full md:w-72 rounded-md border bg-background px-3 text-sm"
          placeholder="Suche (Typ, Artikel, ID)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <Button type="button" variant="outline" size="sm" onClick={() => setQuery("")}>Reset</Button>
        )}
      </div>

      {groups.length === 0 ? (
        <div className="text-xs text-muted-foreground">Keine Assets gebucht.</div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {groups.map((group) => (
            <div key={group.key}>
              <div className="mb-2 text-sm font-medium">{group.key}</div>
              <ul className="divide-y rounded-md border">
                {group.items.map((e) => (
                  <li key={e.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                    <div className="min-w-0 flex-1">
                      {e.kind === "equipment" ? (
                        <div className="truncate">
                          <Link className="underline-offset-2 hover:underline" href={`/management/equipments/${e.refId}`}>
                            {(e.articleName ?? (e.articleId ? `Artikel #${e.articleId}` : "Equipment")) + ` #${e.refId}`}
                          </Link>
                        </div>
                      ) : (
                        <div className="truncate">
                          <Link className="underline-offset-2 hover:underline" href={`/management/cases/${e.refId}`}>Case #{e.refId}</Link>
                        </div>
                      )}
                    </div>
                    <div className="shrink-0 text-xs text-muted-foreground">
                      {fmtCurrency(e.priceAmount ?? null, e.priceCurrency ?? null) ?? "—"}
                    </div>
                    <div className="shrink-0">
                      <Button type="button" variant="outline" size="sm" onClick={() => remove(e.id)}>Entfernen</Button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {(status || loading) && (
        <div className="text-xs text-muted-foreground flex items-center gap-2">
          {loading ? <span>Lädt…</span> : null}
          {status ? <span>{status}</span> : null}
          {!loading && lastRemoved ? (
            <Button type="button" variant="link" className="h-auto p-0" onClick={undo}>Rückgängig</Button>
          ) : null}
        </div>
      )}
    </div>
  );
}
