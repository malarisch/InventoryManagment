"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

type WorkshopTodoLite = { id: number; title: string; status: string };

function toLocalDateTimeInputValue(date: Date): string {
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  const local = new Date(date.getTime() - offsetMs);
  return local.toISOString().slice(0, 16);
}

interface MaintenanceLogCreateInlineProps {
  companyId: number;
  equipmentId?: number;
  caseId?: number;
}

export function MaintenanceLogCreateInline({ companyId, equipmentId, caseId }: MaintenanceLogCreateInlineProps) {
  const router = useRouter();
  const supabase = createClient();
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [performedAt, setPerformedAt] = useState(() => toLocalDateTimeInputValue(new Date()));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [todos, setTodos] = useState<WorkshopTodoLite[]>([]);
  const [completeIds, setCompleteIds] = useState<number[]>([]);

  useEffect(() => {
    let active = true;
    async function loadTodos() {
      const filters: Record<string, unknown> = { company_id: companyId };
      let q = supabase.from('workshop_todos').select('id, title, status').eq('company_id', companyId);
      if (equipmentId) q = q.eq('equipment_id', equipmentId);
      if (caseId) q = q.eq('case_id', caseId);
      const { data, error } = await q.in('status', ['open', 'in_progress']).order('created_at', { ascending: false });
      if (!active) return;
      if (error) return;
      setTodos((data as WorkshopTodoLite[] | null) ?? []);
    }
    loadTodos();
    return () => { active = false; };
  }, [supabase, companyId, equipmentId, caseId]);

  function toggleComplete(id: number) {
    setCompleteIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) {
      setError("Titel darf nicht leer sein.");
      return;
    }
    if (!equipmentId && !caseId) {
      setError("Interner Fehler: kein Ziel für das Wartungslog.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const performedAtIso = performedAt ? new Date(performedAt).toISOString() : new Date().toISOString();
      const payload: {
        company_id: number;
        title: string;
        notes?: string;
        performed_at: string;
        equipment_id?: number;
        case_id?: number;
      } = {
        company_id: companyId,
        title: title.trim(),
        performed_at: performedAtIso,
      };
      if (notes.trim().length > 0) payload.notes = notes.trim();
      if (typeof equipmentId === "number") payload.equipment_id = equipmentId;
      if (typeof caseId === "number") payload.case_id = caseId;

      const { error } = await supabase.from("maintenance_logs").insert(payload);
      if (error) throw error;

      // Optionally mark selected workshop todos as done
      if (completeIds.length > 0) {
        const nowIso = new Date().toISOString();
        await supabase
          .from('workshop_todos')
          .update({ status: 'done', closed_at: nowIso })
          .in('id', completeIds);
      }

      setTitle("");
      setNotes("");
      setPerformedAt(toLocalDateTimeInputValue(new Date()));
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="grid gap-2">
        <label htmlFor="maintenance-title" className="text-sm font-medium">
          Titel
        </label>
        <Input
          id="maintenance-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="z. B. Reinigung Lüfter"
          disabled={saving}
        />
      </div>
      <div className="grid gap-2">
        <label htmlFor="maintenance-notes" className="text-sm font-medium">
          Notizen (optional)
        </label>
        <Textarea
          id="maintenance-notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={3}
          placeholder="Beschreibung der durchgeführten Arbeiten"
          disabled={saving}
        />
      </div>
      <div className="grid gap-2">
        <label htmlFor="maintenance-performed-at" className="text-sm font-medium">
          Ausgeführt am
        </label>
        <Input
          id="maintenance-performed-at"
          type="datetime-local"
          value={performedAt}
          onChange={(event) => setPerformedAt(event.target.value)}
          disabled={saving}
        />
      </div>
      {todos.length > 0 && (
        <div className="grid gap-2">
          <div className="text-sm font-medium">Werkstatt‑Jobs abschließen (optional)</div>
          <div className="rounded-md border">
            {todos.map((t) => (
              <label key={t.id} className="flex items-center gap-2 px-3 py-2 text-sm border-b last:border-b-0">
                <input
                  type="checkbox"
                  checked={completeIds.includes(t.id)}
                  onChange={() => toggleComplete(t.id)}
                />
                <span className="truncate">{t.title}</span>
                <span className="ml-auto text-xs text-muted-foreground">#{t.id}</span>
              </label>
            ))}
          </div>
        </div>
      )}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving || !title.trim()}>
          Speichern
        </Button>
        {error ? <span className="text-sm text-destructive">{error}</span> : null}
      </div>
    </form>
  );
}
