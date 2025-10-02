"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Tables, Json } from "@/database.types";
import { JobMetadataForm } from "@/components/forms/partials/job-metadata-form";
import { defaultJobMetadataDE, toPrettyJSON } from "@/lib/metadata/defaults";
import type { JobMetadata } from "@/components/metadataTypes.types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { safeParseDate } from "@/lib/dates";
import { DatePicker } from "@/components/ui/date-picker";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ContactFormDialog } from "@/components/forms/contacts/contact-form-dialog";

type Job = Tables<"jobs">;
type Customer = Tables<"customers">;
type Contact = Tables<"contacts">;

export function JobEditForm({ job }: { job: Job }) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [name, setName] = useState<string>(job.name ?? "");
  const [type, setType] = useState<string>(job.type ?? "");
  const [location, setLocation] = useState<string>(job.job_location ?? "");
  const [startDate, setStartDate] = useState<string>(() => formatDateForInput(job.startdate));
  const [endDate, setEndDate] = useState<string>(() => formatDateForInput(job.enddate));
  const [customerId, setCustomerId] = useState<number | "">(job.customer_id ?? "");
  const [contactId, setContactId] = useState<number | "">(job.contact_id ?? "");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [metaText, setMetaText] = useState<string>(() => {
    try {
      return job.meta ? JSON.stringify(job.meta, null, 2) : toPrettyJSON(defaultJobMetadataDE);
    } catch {
      return toPrettyJSON(defaultJobMetadataDE);
    }
  });
  const [metaObj, setMetaObj] = useState<JobMetadata>((job.meta as unknown as JobMetadata) ?? defaultJobMetadataDE);
  const [advanced, setAdvanced] = useState(false);
  const [wasAdvanced, setWasAdvanced] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadCustomers() {
      const { data } = await supabase
        .from("customers")
        .select("id, company_name, forename, surname")
        .order("company_name", { ascending: true });
      if (!active) return;
      setCustomers((data as Customer[]) ?? []);
    }
    loadCustomers();
    return () => {
      active = false;
    };
  }, [supabase]);

  useEffect(() => {
    let active = true;
    async function loadContacts() {
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .eq("company_id", job.company_id)
        .order("display_name", { ascending: true });
      if (!active) return;
      if (error) {
        console.error("Failed to load contacts", error);
        return;
      }
      setContacts((data as Contact[]) ?? []);
    }
    loadContacts();
    return () => {
      active = false;
    };
  }, [supabase, job.company_id]);

  useEffect(() => {
    if (advanced && !wasAdvanced) {
      try {
        setMetaText(JSON.stringify(metaObj, null, 2));
      } catch {
        // ignore serialization issues
      }
    }
    if (!advanced && wasAdvanced) {
      try {
        if (metaText.trim()) {
          const parsed = JSON.parse(metaText) as JobMetadata;
          setMetaObj(parsed);
        }
      } catch {
        // ignore parse errors
      }
    }
    setWasAdvanced(advanced);
  }, [advanced, wasAdvanced, metaObj, metaText]);

  const metadataCard = advanced ? (
    <Card>
      <CardHeader>
        <CardTitle>Job-Metadaten (JSON)</CardTitle>
        <CardDescription>Direktes Bearbeiten der JSON-Struktur</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2">
        <textarea
          id="meta"
          className="min-h-[120px] w-full rounded-md border bg-background p-2 text-sm font-mono"
          value={metaText}
          onChange={(event) => setMetaText(event.target.value)}
          spellCheck={false}
        />
      </CardContent>
    </Card>
  ) : (
    <JobMetadataForm value={metaObj} onChange={setMetaObj} />
  );

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    let meta: Json | null = null;
    if (advanced) {
      const mt = metaText.trim();
      if (mt.length) {
        try {
          meta = JSON.parse(mt) as Json;
        } catch {
          setSaving(false);
          setError("Ungültiges JSON in Meta");
          return;
        }
      }
    } else {
      meta = metaObj as unknown as Json;
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
        contact_id: contactId === "" ? null : Number(contactId),
        meta,
      })
      .eq("id", job.id);
    if (error) {
      setError(error.message);
    } else {
      setMessage("Gespeichert.");
      try {
        if (name.trim()) {
          const newName = name.trim();
          window.dispatchEvent(new CustomEvent("job:name:updated", { detail: { id: job.id, name: newName } }));
        }
      } catch {
        // ignore
      }
      try {
        router.refresh();
      } catch {
        // ignore
      }
    }
    setSaving(false);
  }

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-6">
      <Card className="md:col-span-5">
        <CardHeader>
          <CardTitle>Basisdaten</CardTitle>
          <CardDescription>Name, Typ, Ort</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Jobname" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="type">Typ</Label>
            <Input id="type" value={type} onChange={(event) => setType(event.target.value)} placeholder="z. B. Produktion, Service, …" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="job_location">Ort</Label>
            <Input id="job_location" value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Ort / Venue" />
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-4">
        <CardHeader>
          <CardTitle>Termine</CardTitle>
          <CardDescription>Start und Ende</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="startdate">Start</Label>
            <DatePicker id="startdate" name="startdate" value={startDate ?? ""} onChange={setStartDate} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="enddate">Ende</Label>
            <DatePicker id="enddate" name="enddate" value={endDate ?? ""} onChange={setEndDate} />
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-3">
        <CardHeader>
          <CardTitle>Kunde</CardTitle>
          <CardDescription>Optional</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            <Label htmlFor="customer_id">Kunde</Label>
            <select
              id="customer_id"
              className="h-9 rounded-md border bg-background px-3 text-sm"
              value={customerId}
              onChange={(event) => setCustomerId(event.target.value === "" ? "" : Number(event.target.value))}
            >
              <option value="">— Kein Kunde —</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.company_name || `${customer.forename ?? ""} ${customer.surname ?? ""}`.trim() || `#${customer.id}`}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-3">
        <CardHeader>
          <CardTitle>Kontakt</CardTitle>
          <CardDescription>Auftraggeber auswählen oder anlegen</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2">
            <Label htmlFor="contact_id">Kontakt</Label>
            <select
              id="contact_id"
              className="h-9 rounded-md border bg-background px-3 text-sm"
              value={contactId}
              onChange={(event) => setContactId(event.target.value === "" ? "" : Number(event.target.value))}
            >
              <option value="">— Kein Kontakt —</option>
              {contacts.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.display_name} {contact.contact_type ? `(${contact.contact_type})` : ""}
                </option>
              ))}
            </select>
          </div>
          <Button type="button" variant="secondary" onClick={() => setContactDialogOpen(true)}>
            Neuen Kontakt anlegen
          </Button>
        </CardContent>
      </Card>

      <Card className="md:col-span-4">
        <CardHeader>
          <CardTitle>Metadaten-Modus</CardTitle>
          <CardDescription>Zwischen Formular und JSON wechseln</CardDescription>
        </CardHeader>
        <CardContent>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={advanced} onChange={(event) => setAdvanced(event.target.checked)} />
            Expertenmodus (JSON bearbeiten)
          </label>
        </CardContent>
      </Card>

      <div className="md:col-span-12 grid grid-cols-1 gap-6">{metadataCard}</div>

      <div className="md:col-span-12 flex items-center gap-3 justify-end">
        <Button type="submit" disabled={saving}>{saving ? "Speichern…" : "Speichern"}</Button>
        {message && <span className="text-sm text-green-600">{message}</span>}
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>

      <ContactFormDialog
        open={contactDialogOpen}
        onOpenChange={setContactDialogOpen}
        companyId={job.company_id}
        defaultType="customer"
        onCreated={(contact) => {
          setContacts((prev) => [...prev, contact]);
          setContactId(contact.id);
        }}
      />
    </form>
  );
}

function formatDateForInput(value?: string | null): string {
  const parsed = safeParseDate(value ?? null);
  if (!parsed) return "";
  const iso = parsed.toISOString();
  return iso.slice(0, 10);
}
