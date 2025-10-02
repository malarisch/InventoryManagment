"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Tables, Json } from "@/database.types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useCompany } from "@/app/management/_libs/companyHook";
import { DatePicker } from "@/components/ui/date-picker";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { defaultJobMetadataDE, toPrettyJSON } from "@/lib/metadata/defaults";
import { JobMetadataForm } from "@/components/forms/partials/job-metadata-form";
import { ContactFormDialog } from "@/components/forms/contacts/contact-form-dialog";

type Contact = Tables<"contacts">;

export function JobCreateForm() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const { company } = useCompany();
  const [name, setName] = useState<string>("");
  const [type, setType] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [contactId, setContactId] = useState<number | "">("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [metaText, setMetaText] = useState<string>(() => toPrettyJSON(defaultJobMetadataDE));
  const [metaObj, setMetaObj] = useState(defaultJobMetadataDE);
  const [advanced, setAdvanced] = useState(false);
  const [wasAdvanced, setWasAdvanced] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadContacts() {
      if (!company?.id) return;
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .eq("company_id", company.id)
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
  }, [supabase, company?.id]);

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
          const parsed = JSON.parse(metaText) as typeof metaObj;
          setMetaObj(parsed);
        }
      } catch {
        // ignore parse errors and keep previous structured state
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

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id ?? null;
      if (!company || !userId) throw new Error("Fehlende Company oder Nutzer");

      const formStartDate = startDate || null;
      const formEndDate = endDate || null;

      let meta: Json | null = null;
      if (!advanced) {
        meta = metaObj as unknown as Json;
      } else {
        if (metaText.trim()) {
          try {
            meta = JSON.parse(metaText) as Json;
          } catch {
            setError("Ungültiges JSON in Metadaten");
            setSaving(false);
            return;
          }
        }
      }

      const { data, error } = await supabase
        .from("jobs")
        .insert({
          name: name.trim() || null,
          type: type.trim() || null,
          job_location: location.trim() || null,
          startdate: formStartDate || null,
          enddate: formEndDate || null,
          contact_id: contactId === "" ? null : Number(contactId),
          meta,
          company_id: company.id,
          created_by: userId,
        })
        .select("id")
        .single();
      if (error) throw error;
      const id = (data as Tables<"jobs">).id;
      router.push(`/management/jobs/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setSaving(false);
    }
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
            <Input id="name" name="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Jobname" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="type">Typ</Label>
            <Input id="type" name="type" value={type} onChange={(event) => setType(event.target.value)} placeholder="z. B. Produktion, Service, …" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="job_location">Ort</Label>
            <Input id="job_location" name="job_location" value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Ort / Venue" />
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
            <DatePicker id="startdate" name="startdate" value={startDate} onChange={setStartDate} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="enddate">Ende</Label>
            <DatePicker id="enddate" name="enddate" value={endDate} onChange={setEndDate} />
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
              name="contact_id"
              className="h-9 rounded-md border bg-background px-3 text-sm"
              value={contactId}
              onChange={(event) => setContactId(event.target.value === "" ? "" : Number(event.target.value))}
            >
              <option value="">— Kein Kontakt —</option>
              {contacts
                .filter((contact) => contact.contact_type === "customer")
                .map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.display_name || contact.company_name || `${contact.first_name ?? ""} ${contact.last_name ?? ""}`.trim() || `#${contact.id}`}
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
        <Button type="submit" disabled={saving}>{saving ? "Erstellen…" : "Erstellen"}</Button>
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>

      <ContactFormDialog
        open={contactDialogOpen}
        onOpenChange={setContactDialogOpen}
        companyId={company?.id ?? null}
        defaultType="customer"
        onCreated={(contact) => {
          setContacts((prev) => [...prev, contact]);
          setContactId(contact.id);
        }}
      />
    </form>
  );
}
