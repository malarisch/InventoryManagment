"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

type Props = {
  table: string;
  id: number;
  payload: Record<string, unknown>;
  redirectTo: string;
  label?: string;
};

export function DeleteWithUndo({ table, id, payload, redirectTo, label = "Löschen" }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [deleted, setDeleted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);

  async function onDelete() {
    setBusy(true);
    setError(null);
    const { error } = await supabase.from(table).delete().eq("id", id);
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    setDeleted(true);
    const t = setTimeout(() => {
      router.push(redirectTo);
    }, 4000);
    setTimer(t);
  }

  async function onUndo() {
    if (timer) clearTimeout(timer);
    setBusy(true);
    setError(null);
    const { error } = await supabase.from(table).insert(payload as any);
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    setDeleted(false);
    router.refresh();
  }

  if (deleted) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Gelöscht.</span>
        <Button type="button" variant="link" className="h-auto p-0" onClick={onUndo} disabled={busy}>Rückgängig</Button>
        {error && <span className="text-red-600">{error}</span>}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button type="button" variant="destructive" onClick={onDelete} disabled={busy}>{label}</Button>
      {error && <span className="text-sm text-red-600">{error}</span>}
    </div>
  );
}

