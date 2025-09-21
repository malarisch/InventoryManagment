"use client";

import { useMemo, useState } from "react";
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
    const payload: any = {
      company_id: lastRemoved.company_id,
      job_id: lastRemoved.job_id,
    };
    if (lastRemoved.equipment_id) payload.equipment_id = lastRemoved.equipment_id;
    if (lastRemoved.case_id) payload.case_id = lastRemoved.case_id;
    const { data, error } = await supabase
      .from("job_booked_assets")
      .insert(payload)
      .select("*, equipments:equipment_id(id, article_id, articles:article_id(name)), cases:case_id(id)")
      .single();
    if (error) {
      setStatus(error.message);
      return;
    }
    setRows((prev) => [{ ...(data as any) }, ...prev]);
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
      {status && (
        <div className="md:col-span-2 text-xs text-muted-foreground flex items-center gap-2">
          <span>{status}</span>
          {lastRemoved && (
            <Button type="button" variant="link" className="h-auto p-0" onClick={undo}>Rückgängig</Button>
          )}
        </div>
      )}
    </div>
  );
}
