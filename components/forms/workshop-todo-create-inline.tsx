"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function WorkshopTodoCreateInline({ companyId, equipmentId, caseId }: { companyId: number; equipmentId?: number; caseId?: number }) {
  const supabase = createClient();
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createTodo(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) throw new Error("Nicht angemeldet");
      const payload: { company_id: number; created_by: string; title: string; status: string; equipment_id?: number; case_id?: number } = { company_id: companyId, created_by: userId, title: title.trim(), status: 'open' };
      if (equipmentId) payload.equipment_id = equipmentId;
      if (caseId) payload.case_id = caseId;
      const { error } = await supabase.from('workshop_todos').insert(payload);
      if (error) throw error;
      setTitle("");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={createTodo} className="flex items-center gap-2">
      <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Werkstatt-Task hinzufügen…" className="max-w-xs" />
      <Button type="submit" disabled={saving || !title.trim().length}>Hinzufügen</Button>
      {error && <span className="text-sm text-red-600">{error}</span>}
    </form>
  );
}
