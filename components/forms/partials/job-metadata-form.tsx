"use client";

import { useEffect, useState } from "react";
import type { JobMetadata } from "@/components/metadataTypes.types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function JobMetadataForm({
  value,
  onChange,
}: {
  value: JobMetadata;
  onChange: (val: JobMetadata) => void;
}) {
  const [local, setLocal] = useState<JobMetadata>(value);
  useEffect(() => {
    setLocal((prev) => (prev !== value ? value : prev));
  }, [value]);
  useEffect(() => {
    if (local === value) return;
    onChange(local);
  }, [local, value, onChange]);

  function set<K extends keyof JobMetadata>(key: K, v: JobMetadata[K]) {
    setLocal((s) => ({ ...s, [key]: v }));
  }

  return (
    <div className="grid gap-6 rounded-md border p-4">
      <h3 className="text-lg font-medium">Job-Details</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="jmf-location">Ort</Label>
          <Input id="jmf-location" value={local.location ?? ""} onChange={(e) => set("location", e.target.value)} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="jmf-prio">Priorität</Label>
          <select id="jmf-prio" className="h-9 rounded-md border bg-background px-3 text-sm"
            value={local.priority ?? "medium"}
            onChange={(e) => set("priority", e.target.value as "low" | "medium" | "high" | "urgent")}
          >
            <option value="low">Niedrig</option>
            <option value="medium">Mittel</option>
            <option value="high">Hoch</option>
            <option value="urgent">Dringend</option>
          </select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="jmf-status">Status</Label>
          <select id="jmf-status" className="h-9 rounded-md border bg-background px-3 text-sm"
            value={local.status ?? "open"}
            onChange={(e) => set("status", e.target.value as "open" | "in-progress" | "on-hold" | "completed" | "cancelled")}
          >
            <option value="open">Offen</option>
            <option value="in-progress">In Bearbeitung</option>
            <option value="on-hold">Angehalten</option>
            <option value="completed">Abgeschlossen</option>
            <option value="cancelled">Abgebrochen</option>
          </select>
        </div>
      </div>

      <h3 className="text-lg font-medium">Zeitplanung</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="jmf-actual-start">Tatsächlicher Beginn</Label>
          <Input id="jmf-actual-start" type="datetime-local" value={local.actualStart ?? ""} onChange={(e) => set("actualStart", e.target.value)} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="jmf-actual-end">Tatsächliches Ende</Label>
          <Input id="jmf-actual-end" type="datetime-local" value={local.actualEnd ?? ""} onChange={(e) => set("actualEnd", e.target.value)} />
        </div>
      </div>

      {/* TODO: Implement UI for assignedTo, reportedBy, customer, actualCost */}

      <div className="grid gap-1.5">
        <Label htmlFor="jmf-notes">Notizen</Label>
        <textarea id="jmf-notes" className="min-h-[80px] w-full rounded-md border bg-background p-2 text-sm"
            value={local.notes ?? ""} onChange={(e) => set("notes", e.target.value)} />
      </div>
    </div>
  );
}

export default JobMetadataForm;
