"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type Booked = {
  id: number;
  job_id: number;
  company_id: number;
  equipment_id: number | null;
  case_id: number | null;
  equipments?: { id: number; article_id: number | null; articles?: { name: string | null } | null } | null;
  cases?: { id: number } | null;
};

export function JobBookedAssetsList({ jobId, initial }: { jobId: number; initial: Booked[] }) {
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<Booked[]>(() => initial);
  const [status, setStatus] = useState<string | null>(null);
  const [lastRemoved, setLastRemoved] = useState<Booked | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadLatest() {
      setLoading(true);
      const { data, error } = await supabase
        .from("job_booked_assets")
        .select("*, equipments:equipment_id(id, article_id, articles:article_id(name)), cases:case_id(id)")
        .eq("job_id", jobId)
        .order("created_at", { ascending: false });
      if (!active) return;
      if (!error && Array.isArray(data)) {
        setRows(data as Booked[]);
      }
      setLoading(false);
    }

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
            .select("*, equipments:equipment_id(id, article_id, articles:article_id(name)), cases:case_id(id)")
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
            .select("*, equipments:equipment_id(id, article_id, articles:article_id(name)), cases:case_id(id)")
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

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [supabase, jobId]);

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
      .select("*, equipments:equipment_id(id, article_id, articles:article_id(name)), cases:case_id(id)")
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

  const equipments = rows.filter((r) => r.equipment_id !== null);
  const cases = rows.filter((r) => r.case_id !== null);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div>
        <div className="mb-2 text-sm font-medium">Equipments</div>
        {equipments.length ? (
          <ul className="list-disc pl-5 text-sm space-y-1">
            {equipments.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-2">
                <div>
                  <Link className="underline-offset-2 hover:underline" href={`/management/equipments/${r.equipment_id}`}>Equipment #{r.equipment_id}</Link>
                  {" • "}{r.equipments?.articles?.name ?? (r.equipments?.article_id ? `Artikel #${r.equipments.article_id}` : "—")}
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => remove(r.id)}>Entfernen</Button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-xs text-muted-foreground">Keine Equipments gebucht.</div>
        )}
      </div>
      <div>
        <div className="mb-2 text-sm font-medium">Cases</div>
        {cases.length ? (
          <ul className="list-disc pl-5 text-sm space-y-1">
            {cases.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-2">
                <div>
                  <Link className="underline-offset-2 hover:underline" href={`/management/cases/${r.case_id}`}>Case #{r.case_id}</Link>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => remove(r.id)}>Entfernen</Button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-xs text-muted-foreground">Keine Cases gebucht.</div>
        )}
      </div>
      {(status || loading) && (
        <div className="md:col-span-2 text-xs text-muted-foreground flex items-center gap-2">
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
