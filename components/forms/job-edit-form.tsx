"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Tables, Json } from "@/database.types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { safeParseDate } from "@/lib/dates";
import { DatePicker } from "@/components/ui/date-picker";

type Job = Tables<"jobs">;
type Customer = Tables<"customers">;

export function JobEditForm({ job }: { job: Job }) {
  const supabase = useMemo(() => createClient(), []);
  const [name, setName] = useState<string>(job.name ?? "");
  const [type, setType] = useState<string>(job.type ?? "");
  const [location, setLocation] = useState<string>(job.job_location ?? "");
  const [startDate, setStartDate] = useState<string>(() => formatDateForInput(job.startdate));
  const [endDate, setEndDate] = useState<string>(() => formatDateForInput(job.enddate));
  const [customerId, setCustomerId] = useState<number | "">(job.customer_id ?? "");
  const [metaText, setMetaText] = useState<string>(() => {
    try { return job.meta ? JSON.stringify(job.meta, null, 2) : "{}"; } catch { return "{}"; }
  });

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      const { data } = await supabase
        .from("customers")
        .select("id, company_name, forename, surname")
        .order("company_name", { ascending: true });
      if (!active) return;
      setCustomers((data as Customer[]) ?? []);
    }
    load();
    return () => { active = false; };
  }, [supabase]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    let meta: Json | null = null;
    const mt = metaText.trim();
    if (mt.length) {
      try { meta = JSON.parse(mt) as Json; } catch { setSaving(false); setError("Ungültiges JSON in Meta"); return; }
    }
    const { error } = await supabase
      .from("jobs")
      .update({
        name: name.trim() || null,
        type: type.trim() || null,
        job_location: location.trim() || null,
        startdate: startDate || null,
        enddate: endDate || null,
        customer_id: customerId === "" ? null : Number(customerId),
        meta,
      })
      .eq("id", job.id);
    if (error) setError(error.message); else setMessage("Gespeichert.");
    setSaving(false);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jobname" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="type">Typ</Label>
        <Input id="type" value={type} onChange={(e) => setType(e.target.value)} placeholder="z. B. Produktion, Service, …" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="job_location">Ort</Label>
        <Input id="job_location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Ort / Venue" />
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="startdate">Start</Label>
          <DatePicker id="startdate" name="startdate" value={startDate ?? ""} onChange={setStartDate} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="enddate">Ende</Label>
          <DatePicker id="enddate" name="enddate" value={endDate ?? ""} onChange={setEndDate} />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="customer_id">Kunde</Label>
        <select
          id="customer_id"
          className="h-9 rounded-md border bg-background px-3 text-sm"
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value === "" ? "" : Number(e.target.value))}
        >
          <option value="">— Kein Kunde —</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.company_name || `${c.forename ?? ""} ${c.surname ?? ""}`.trim() || `#${c.id}`}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="meta">Meta (JSON)</Label>
        <textarea
          id="meta"
          className="min-h-[120px] w-full rounded-md border bg-background p-2 text-sm font-mono"
          value={metaText}
          onChange={(e) => setMetaText(e.target.value)}
          spellCheck={false}
        />
        <p className="text-xs text-muted-foreground">Beispiel: {`{"note": "Backline prüfen"}`}</p>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving}>{saving ? "Speichern…" : "Speichern"}</Button>
        {message && <span className="text-sm text-green-600">{message}</span>}
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
    </form>
  );
}

function formatDateForInput(value?: string | null): string {
  const parsed = safeParseDate(value ?? null);
  if (!parsed) return "";
  const iso = parsed.toISOString();
  return iso.slice(0, 10);
}
