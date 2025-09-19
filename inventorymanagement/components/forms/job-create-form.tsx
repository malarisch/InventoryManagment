"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Tables, Json } from "@/database.types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useCompany } from "@/app/management/_libs/companyHook";

type Customer = Tables<"customers">;

export function JobCreateForm() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const { company } = useCompany();
  const [name, setName] = useState<string>("");
  const [type, setType] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [customerId, setCustomerId] = useState<number | "">("");
  const [metaText, setMetaText] = useState<string>("{}");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [saving, setSaving] = useState(false);
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
    setError(null);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id ?? null;
      if (!company || !userId) throw new Error("Fehlende Company oder Nutzer");
      let meta: Json | null = null;
      const mt = metaText.trim();
      if (mt.length) {
        try { meta = JSON.parse(mt) as Json; } catch { throw new Error("Ungültiges JSON in Meta"); }
      }
      const { data, error } = await supabase
        .from("jobs")
        .insert({
          name: name.trim() || null,
          type: type.trim() || null,
          job_location: location.trim() || null,
          startdate: startDate || null,
          enddate: endDate || null,
          customer_id: customerId === "" ? null : Number(customerId),
          meta,
          company_id: company.id,
          created_by: userId,
        })
        .select("id")
        .single();
      if (error) throw error;
      const id = (data as Tables<"jobs">).id;
      router.push(`/management/jobs/${id}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
      setSaving(false);
    }
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
          <Input id="startdate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="enddate">Ende</Label>
          <Input id="enddate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
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
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving}>{saving ? "Erstellen…" : "Erstellen"}</Button>
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
    </form>
  );
}

