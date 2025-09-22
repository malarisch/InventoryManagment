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
  useEffect(() => setLocal(value), [value]);
  useEffect(() => onChange(local), [local, onChange]);

  return (
    <div className="grid gap-3 rounded-md border p-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div className="grid gap-1">
          <Label htmlFor="jmf-type">Typ (erforderlich)</Label>
          <Input id="jmf-type" value={local.type}
            onChange={(e) => setLocal((s) => ({ ...s, type: e.target.value }))} required />
        </div>
        <div className="grid gap-1">
          <Label htmlFor="jmf-prio">Priorität</Label>
          <select id="jmf-prio" className="h-9 rounded-md border bg-background px-3 text-sm"
            value={local.priority ?? "medium"}
            onChange={(e) => setLocal((s) => ({ ...s, priority: e.target.value as "low" | "medium" | "high" | "urgent" }))}
          >
            <option>low</option>
            <option>medium</option>
            <option>high</option>
            <option>urgent</option>
          </select>
        </div>
        <div className="grid gap-1">
          <Label htmlFor="jmf-status">Status</Label>
          <select id="jmf-status" className="h-9 rounded-md border bg-background px-3 text-sm"
            value={local.status ?? "open"}
            onChange={(e) => setLocal((s) => ({ ...s, status: e.target.value as "open" | "in-progress" | "on-hold" | "completed" | "cancelled" }))}
          >
            <option>open</option>
            <option>in-progress</option>
            <option>on-hold</option>
            <option>completed</option>
            <option>cancelled</option>
          </select>
        </div>
      </div>
    </div>
  );
}

export default JobMetadataForm;
