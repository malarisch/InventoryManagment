"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/database.types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ArticleMetadataForm } from "@/components/forms/partials/article-metadata-form";
import { ContactFormDialog } from "@/components/forms/contacts/contact-form-dialog";
import type { Json } from "@/database.types";
import type { ArticleMetadata, adminCompanyMetadata } from "@/components/metadataTypes.types";
import { defaultArticleMetadataDE, toPrettyJSON } from "@/lib/metadata/defaults";

type Article = Tables<"articles">;
type Location = Tables<"locations">;
type AssetTag = Tables<"asset_tags">;
type Contact = Tables<"contacts">;

export function ArticleEditForm({ article }: { article: Article }) {
  const supabase = useMemo(() => createClient(), []);
  const [name, setName] = useState<string>(article.name ?? "");
  const [defaultLocation, setDefaultLocation] = useState<number | "">(article.default_location ?? "");
  const [assetTagId, setAssetTagId] = useState<number | "">(article.asset_tag ?? "");
  const [locations, setLocations] = useState<Location[]>([]);
  const [assetTags, setAssetTags] = useState<AssetTag[]>([]);
  const [companyMeta, setCompanyMeta] = useState<adminCompanyMetadata | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [metaText, setMetaText] = useState<string>(() => {
    try {
      return article.metadata ? JSON.stringify(article.metadata, null, 2) : toPrettyJSON(defaultArticleMetadataDE);
    } catch {
      return toPrettyJSON(defaultArticleMetadataDE);
    }
  });
  const [metaObj, setMetaObj] = useState<ArticleMetadata>((article.metadata as unknown as ArticleMetadata) ?? defaultArticleMetadataDE);
  const [advanced, setAdvanced] = useState(false);
  const [wasAdvanced, setWasAdvanced] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadData() {
      const [{ data: locationsData }, { data: assetTagData }, { data: companyRow }] = await Promise.all([
        supabase.from("locations").select("id,name").order("name"),
        supabase.from("asset_tags").select("id, printed_code, printed_applied").order("created_at", { ascending: false }),
        supabase.from("companies").select("metadata").eq("id", article.company_id).maybeSingle(),
      ]);
      if (!active) return;
      setLocations((locationsData as Location[]) ?? []);
      setAssetTags((assetTagData as AssetTag[]) ?? []);
      setCompanyMeta(companyRow?.metadata ? (companyRow.metadata as unknown as adminCompanyMetadata) : null);
    }
    loadData();
    return () => {
      active = false;
    };
  }, [supabase, article.company_id]);

  useEffect(() => {
    let active = true;
    async function loadContacts() {
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .eq("company_id", article.company_id)
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
  }, [supabase, article.company_id]);

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
          const parsed = JSON.parse(metaText) as ArticleMetadata;
          setMetaObj(parsed);
        }
      } catch {
        // ignore parse errors and keep previous structured state
      }
    }
    setWasAdvanced(advanced);
  }, [advanced, wasAdvanced, metaObj, metaText]);

  const supplierContactOptions = useMemo(() => contacts.map((contact) => ({
    id: contact.id,
    label: contact.display_name,
    snapshot: {
      name: contact.display_name,
      email: contact.email ?? undefined,
      phone: contact.phone ?? undefined,
      has_signal: contact.has_signal ?? undefined,
      has_whatsapp: contact.has_whatsapp ?? undefined,
      has_telegram: contact.has_telegram ?? undefined,
      street: contact.street ?? undefined,
      zipCode: contact.zip_code ?? undefined,
      city: contact.city ?? undefined,
      country: contact.country ?? undefined,
    },
  })), [contacts]);

  const metadataCards = advanced ? (
    <Card>
      <CardHeader>
        <CardTitle>Artikel-Metadaten (JSON)</CardTitle>
        <CardDescription>Direktes Bearbeiten der JSON-Struktur</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2">
        <textarea
          id="metadata"
          className="min-h-[140px] w-full rounded-md border bg-background p-2 text-sm font-mono"
          value={metaText}
          onChange={(event) => setMetaText(event.target.value)}
          spellCheck={false}
        />
      </CardContent>
    </Card>
  ) : (
    <ArticleMetadataForm
      value={metaObj}
      onChange={setMetaObj}
      companyMetadata={companyMeta ?? undefined}
      supplierOptions={supplierContactOptions}
      onCreateSupplier={() => setContactDialogOpen(true)}
    />
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    let metadata: Json | null = null;
    if (advanced) {
      const mt = metaText.trim();
      if (mt.length) {
        try {
          metadata = JSON.parse(mt) as Json;
        } catch {
          setSaving(false);
          setError("Ungültiges JSON in Metadata");
          return;
        }
      }
    } else {
      metadata = metaObj as unknown as Json;
    }
    const { error } = await supabase
      .from("articles")
      .update({
        name: name.trim(),
        default_location: defaultLocation === "" ? null : Number(defaultLocation),
        asset_tag: assetTagId === "" ? null : Number(assetTagId),
        metadata,
      })
      .eq("id", article.id);
    if (error) {
      setError(error.message);
    } else {
      setMessage("Gespeichert.");
    }
    setSaving(false);
  }

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-6">
      <Card className="md:col-span-5">
        <CardHeader>
          <CardTitle>Basisdaten</CardTitle>
          <CardDescription>Name und Standort</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Artikelname" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="default_location">Default Location</Label>
            <select
              id="default_location"
              className="h-9 rounded-md border bg-background px-3 text-sm"
              value={defaultLocation}
              onChange={(event) => setDefaultLocation(event.target.value === "" ? "" : Number(event.target.value))}
            >
              <option value="">— Kein Standort —</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>{location.name}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-7">
        <CardHeader>
          <CardTitle>Asset Tag</CardTitle>
          <CardDescription>Vorhandenen Tag zuordnen</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            <Label htmlFor="asset_tag">Asset Tag</Label>
            <select
              id="asset_tag"
              className="h-9 rounded-md border bg-background px-3 text-sm"
              value={assetTagId}
              onChange={(event) => setAssetTagId(event.target.value === "" ? "" : Number(event.target.value))}
            >
              <option value="">— Kein Asset Tag —</option>
              {assetTags.map((tag) => (
                <option key={tag.id} value={tag.id}>
                  {tag.printed_code ?? `#${tag.id}`} {tag.printed_applied ? "(verwendet)" : ""}
                </option>
              ))}
            </select>
          </div>
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

      <div className="md:col-span-12 grid grid-cols-1 gap-6">{metadataCards}</div>

      <div className="md:col-span-12 flex items-center gap-3 justify-end">
        <Button type="submit" disabled={saving}>{saving ? "Speichern…" : "Speichern"}</Button>
        {message && <span className="text-sm text-green-600">{message}</span>}
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>

      <ContactFormDialog
        open={contactDialogOpen}
        onOpenChange={setContactDialogOpen}
        companyId={article.company_id}
        defaultType="supplier"
        onCreated={(contact) => {
          setContacts((prev) => [...prev, contact]);
        }}
      />
    </form>
  );
}
