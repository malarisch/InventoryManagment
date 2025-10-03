"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Json, Tables } from "@/database.types";
import type { CompanyRecord } from "@/lib/companies";
import type { adminCompanyMetadata } from "@/components/metadataTypes.types";
import { defaultAdminCompanyMetadataDE, toPrettyJSON } from "@/lib/metadata/defaults";
import { CompanyMetadataForm } from "@/components/forms/partials/company-metadata-form";
import { buildAdminCompanyMetadata } from "@/lib/metadata/builders";
import { normalizeCompanyRelation } from "@/lib/companies";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ContactFormDialog } from "@/components/forms/contacts/contact-form-dialog";
import React from "react";

type Contact = Tables<"contacts">;

// Memoized wrapper to prevent re-renders when parent state changes
const MemoizedCompanyMetadataForm = React.memo(CompanyMetadataForm);

export function CompanySettingsForm() {
  const supabase = useMemo(() => createClient(), []);
  const [company, setCompany] = useState<CompanyRecord | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [metadataText, setMetadataText] = useState("{}");
  const [metaObj, setMetaObj] = useState(defaultAdminCompanyMetadataDE);
  const [advanced, setAdvanced] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [dumpStatus, setDumpStatus] = useState<string | null>(null);
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);

  // Memoize the metadata form onChange to prevent re-renders
  const handleMetaObjChange = useCallback((val: adminCompanyMetadata) => {
    setMetaObj(val);
  }, []);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError(null);
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) {
        setError("Nicht angemeldet");
        setLoading(false);
        return;
      }
      type MembershipRow = { companies: CompanyRecord | CompanyRecord[] | null };
      const { data: membership, error: membershipError } = await supabase
        .from("users_companies")
        .select("companies(*)")
        .eq("user_id", userId)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle<MembershipRow>();

      if (!active) return;

      let targetCompany: CompanyRecord | null = null;
      if (membershipError && membershipError.code !== "PGRST116") {
        setError(membershipError.message);
      } else if (membership?.companies) {
        targetCompany = normalizeCompanyRelation(membership.companies);
      }

      if (!targetCompany) {
        const { data: owned, error: ownedError } = await supabase
          .from("companies")
          .select("*")
          .eq("owner_user_id", userId)
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle<CompanyRecord>();
        if (ownedError && ownedError.code !== "PGRST116") {
          setError(ownedError.message);
        } else if (owned) {
          targetCompany = owned;
        }
      }

      if (targetCompany) {
        setCompany(targetCompany);
        setName(targetCompany.name ?? "");
        setDescription(targetCompany.description ?? "");
        try {
          setMetadataText(
            targetCompany.metadata
              ? JSON.stringify(targetCompany.metadata, null, 2)
              : toPrettyJSON(defaultAdminCompanyMetadataDE)
          );
          setMetaObj(buildAdminCompanyMetadata(targetCompany.metadata as unknown as Partial<adminCompanyMetadata> ?? {}));
        } catch {
          setMetadataText(toPrettyJSON(defaultAdminCompanyMetadataDE));
          setMetaObj(defaultAdminCompanyMetadataDE);
        }
      } else if (!membershipError) {
        setError("Keine Company gefunden");
      }
      setLoading(false);
    }
    load();
    return () => { active = false; };
  }, [supabase]);

  useEffect(() => {
    let active = true;
    async function loadContacts() {
      if (!company) return;
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
    return () => { active = false; };
  }, [supabase, company]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!company) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    let metadata: Json | null = null;
    if (advanced) {
      if (metadataText.trim().length) {
        try {
          metadata = JSON.parse(metadataText) as Json;
        } catch {
          setSaving(false);
          setError("Ungültiges JSON in Metadata");
          return;
        }
      }
    } else {
      metadata = buildAdminCompanyMetadata(metaObj) as unknown as Json;
    }
    const { error } = await supabase
      .from("companies")
      .update({
        name: name.trim(),
        description: description.trim() || null,
        metadata,
      })
      .eq("id", company.id);
    if (error) {
      setError(error.message);
    } else {
      setMessage("Gespeichert.");
      // Reload company data to reflect changes in UI
      const { data: updated } = await supabase
        .from("companies")
        .select("*")
        .eq("id", company.id)
        .single<CompanyRecord>();
      if (updated) {
        setCompany(updated);
        setName(updated.name ?? "");
        setDescription(updated.description ?? "");
        try {
          const meta = (updated.metadata ?? null) as adminCompanyMetadata | null;
          const resolved = meta ?? defaultAdminCompanyMetadataDE;
          setMetaObj(resolved);
          setMetadataText(toPrettyJSON(meta ?? {}));
        } catch {
          setMetaObj(defaultAdminCompanyMetadataDE);
          setMetadataText(toPrettyJSON({}));
        }
      }
      // Trigger a page reload to update header/company picker
      window.location.reload();
    }
    setSaving(false);
  }

  async function createSeedDump() {
    setDumpStatus("Erstelle Dump…");
    try {
      const res = await fetch("/api/admin/dump-seed", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setDumpStatus(`Fehler: ${data?.error ?? res.status}`);
      } else {
        setDumpStatus(`OK: gespeichert unter ${data.path} (${data.bytes} Bytes)`);
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      setDumpStatus(`Fehler: ${message}`);
    }
  }

  async function exportCompany() {
    if (!company) return;
    setExportStatus("Exportiere Company…");
    try {
      const res = await fetch(`/api/company/dump-company?companyId=${company.id}`);
      const data = await res.json();
      
      if (!res.ok) {
        setExportStatus(`Fehler: ${data?.error ?? res.status}`);
        return;
      }

      // Download as JSON file
      const blob = new Blob([JSON.stringify(data.company, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${company.name.replace(/[^a-z0-9]/gi, '_')}_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setExportStatus("Export erfolgreich heruntergeladen!");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      setExportStatus(`Fehler: ${message}`);
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
      <Card className="md:col-span-12">
        <CardHeader>
          <CardTitle>Company Settings</CardTitle>
          <CardDescription>Basisdaten der Company</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground">Lädt…</div>
          ) : company ? (
            <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Beschreibung</Label>
                <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              
              <div className="md:col-span-2 flex items-center gap-3 mt-4">
                <Button type="submit" disabled={saving}>{saving ? "Speichern…" : "Speichern"}</Button>
                {message && <span className="text-sm text-green-600">{message}</span>}
                {error && <span className="text-sm text-red-600">{error}</span>}
              </div>

              <div className="md:col-span-2 border-t pt-4 mt-2">
                <label className="flex items-center gap-2 text-xs mb-3">
                  <input type="checkbox" checked={advanced} onChange={(e) => setAdvanced(e.target.checked)} />
                  Metadaten im Expertenmodus (JSON) bearbeiten
                </label>
                {advanced && (
                  <div className="grid gap-2">
                    <Label htmlFor="metadata">Metadata (JSON)</Label>
                    <textarea
                      id="metadata"
                      className="min-h-[200px] w-full rounded-md border bg-background p-2 text-sm font-mono"
                      value={metadataText}
                      onChange={(e) => setMetadataText(e.target.value)}
                      spellCheck={false}
                    />
                  </div>
                )}
              </div>
            </form>
          ) : (
            <div className="text-sm text-red-600">Keine Company gefunden.</div>
          )}
        </CardContent>
      </Card>

      {!advanced && !loading && company && (
        <MemoizedCompanyMetadataForm 
          value={metaObj} 
          onChange={handleMetaObjChange}
          contacts={contacts}
          onCreateContact={() => setContactDialogOpen(true)}
        />
      )}

      <ContactFormDialog
        open={contactDialogOpen}
        onOpenChange={setContactDialogOpen}
        companyId={company?.id ?? null}
        onCreated={(contact) => {
          setContacts((prev) => [...prev, contact]);
        }}
      />

      <Card className="md:col-span-12">
        <CardHeader>
          <CardTitle>Company Export</CardTitle>
          <CardDescription>Exportiere alle Company-Daten als JSON für Backup oder Migration</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm">Exportiert alle Daten dieser Company (Artikel, Equipment, Kontakte, Jobs, etc.) als JSON-Datei zum Download.</div>
            <Button type="button" variant="outline" onClick={exportCompany} disabled={!company}>Company exportieren</Button>
          </div>
          {exportStatus && <div className="mt-2 text-xs text-muted-foreground">{exportStatus}</div>}
        </CardContent>
      </Card>

      <Card className="md:col-span-12">
        <CardHeader>
          <CardTitle>Seed Dump</CardTitle>
          <CardDescription>Dump public + auth Daten nach supabase/seed.sql</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm">Exportiert aktuelle Datenstände der Company.</div>
            <Button type="button" variant="outline" onClick={createSeedDump}>Seed-Dump erstellen</Button>
          </div>
          {dumpStatus && <div className="mt-2 text-xs text-muted-foreground">{dumpStatus}</div>}
        </CardContent>
      </Card>
    </div>
  );
}
