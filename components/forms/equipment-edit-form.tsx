"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/database.types";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Json } from "@/database.types";
import { EquipmentMetadataForm } from "@/components/forms/partials/equipment-metadata-form";
import { ContactFormDialog } from "@/components/forms/contacts/contact-form-dialog";
import { defaultEquipmentMetadataDE, toPrettyJSON } from "@/lib/metadata/defaults";
import type { EquipmentMetadata, ArticleMetadata, adminCompanyMetadata } from "@/components/metadataTypes.types";
import { buildEquipmentMetadata } from "@/lib/metadata/builders";
import Link from "next/link";

type Equipment = Tables<"equipments">;
type Article = Tables<"articles">;
type Location = Tables<"locations">;
type AssetTag = Tables<"asset_tags">;
type Contact = Tables<"contacts">;

export function EquipmentEditForm({ equipment }: { equipment: Equipment }) {
  const supabase = useMemo(() => createClient(), []);
  const [assetTagId, setAssetTagId] = useState<number | "">(equipment.asset_tag ?? "");
  const [articleId, setArticleId] = useState<number | "">(equipment.article_id ?? "");
  const [articles, setArticles] = useState<Article[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [assetTags, setAssetTags] = useState<AssetTag[]>([]);
  const [companyMeta, setCompanyMeta] = useState<adminCompanyMetadata | null>(null);
  const [currentLocation, setCurrentLocation] = useState<number | "">(equipment.current_location ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [metaText, setMetaText] = useState<string>(() => {
    try {
      return equipment.metadata ? JSON.stringify(equipment.metadata, null, 2) : toPrettyJSON(defaultEquipmentMetadataDE);
    } catch {
      return toPrettyJSON(defaultEquipmentMetadataDE);
    }
  });
  const [metaObj, setMetaObj] = useState<EquipmentMetadata>(buildEquipmentMetadata(equipment.metadata as unknown as EquipmentMetadata));
  const [advanced, setAdvanced] = useState(false);
  const [wasAdvanced, setWasAdvanced] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadData() {
      const [{ data: articlesData }, { data: locationsData }, { data: assetTagData }, { data: companyRow }] = await Promise.all([
        supabase.from("articles").select("id,name,company_id,metadata").eq("company_id", equipment.company_id).order("name"),
        supabase.from("locations").select("id,name,company_id").eq("company_id", equipment.company_id).order("name"),
        supabase.from("asset_tags").select("id, printed_code, printed_applied, company_id").eq("company_id", equipment.company_id).order("created_at", { ascending: false }),
        supabase.from("companies").select("metadata").eq("id", equipment.company_id).maybeSingle(),
      ]);
      if (!active) return;
      setArticles((articlesData as Article[]) ?? []);
      setLocations((locationsData as Location[]) ?? []);
      setAssetTags((assetTagData as AssetTag[]) ?? []);
      setCompanyMeta(companyRow?.metadata ? (companyRow.metadata as unknown as adminCompanyMetadata) : null);
    }
    loadData();
    return () => {
      active = false;
    };
  }, [supabase, equipment.company_id]);

  useEffect(() => {
    let active = true;
    async function loadContacts() {
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .eq("company_id", equipment.company_id)
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
  }, [supabase, equipment.company_id]);

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
          const parsed = JSON.parse(metaText) as EquipmentMetadata;
          setMetaObj(buildEquipmentMetadata(parsed));
        }
      } catch {
        // ignore parse errors
      }
    }
    setWasAdvanced(advanced);
  }, [advanced, wasAdvanced, metaObj, metaText]);

  const selectedArticleMetadata = useMemo(() => {
    if (articleId === "") return null;
    const id = Number(articleId);
    const match = articles.find((article) => article.id === id);
    return (match?.metadata ?? null) as unknown as ArticleMetadata | null;
  }, [articleId, articles]);

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
      <CardHeader className="pb-3 px-4 pt-4">
        <CardTitle className="text-base">Equipment-Metadaten (JSON)</CardTitle>
        <CardDescription className="text-xs">Direktes Bearbeiten der JSON-Struktur</CardDescription>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <textarea
          id="metadata"
          className="min-h-[140px] w-full rounded-md border bg-background p-2 text-xs font-mono"
          value={metaText}
          onChange={(event) => setMetaText(event.target.value)}
          spellCheck={false}
        />
      </CardContent>
    </Card>
  ) : (
    <EquipmentMetadataForm
      value={metaObj}
      onChange={(value) => setMetaObj(buildEquipmentMetadata(value))}
      articleMetadata={selectedArticleMetadata ?? undefined}
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
    if (articleId !== "") {
      const { data: art } = await supabase.from("articles").select("company_id").eq("id", Number(articleId)).maybeSingle();
      if (art && art.company_id !== equipment.company_id) {
        setSaving(false);
        setError("Der ausgewählte Artikel gehört nicht zur aktuellen Company.");
        return;
      }
    }

    const { error } = await supabase
      .from("equipments")
      .update({
        asset_tag: assetTagId === "" ? null : Number(assetTagId),
        article_id: articleId === "" ? null : Number(articleId),
        current_location: currentLocation === "" ? null : Number(currentLocation),
        metadata,
      })
      .eq("id", equipment.id);
    if (error) {
      setError(error.message);
    } else {
      setMessage("Gespeichert.");
    }
    setSaving(false);
  }

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="pb-3 px-4 pt-4">
          <CardTitle className="text-base">Asset Tag</CardTitle>
          <CardDescription className="text-xs">Vorhandenen Tag zuordnen</CardDescription>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="grid gap-2">
            <Label htmlFor="asset_tag" className="text-sm">Asset Tag</Label>
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

      <Card>
        <CardHeader className="pb-3 px-4 pt-4">
          <CardTitle className="text-base">Zuordnung</CardTitle>
          <CardDescription className="text-xs">Artikel und Standort</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 px-4 pb-4">
          <div className="grid gap-2">
            <Label htmlFor="article_id" className="text-sm">Artikel</Label>
            <select
              id="article_id"
              className="h-9 rounded-md border bg-background px-3 text-sm"
              value={articleId}
              onChange={(event) => setArticleId(event.target.value === "" ? "" : Number(event.target.value))}
            >
              <option value="">— Kein Artikel —</option>
              {articles.map((article) => (
                <option key={article.id} value={article.id}>{article.name}</option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="current_location" className="text-sm">Aktueller Standort</Label>
            <select
              id="current_location"
              className="h-9 rounded-md border bg-background px-3 text-sm"
              value={currentLocation}
              onChange={(event) => setCurrentLocation(event.target.value === "" ? "" : Number(event.target.value))}
            >
              <option value="">— Kein Standort —</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>{location.name}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3 px-4 pt-4">
          <CardTitle className="text-base">Metadaten-Modus</CardTitle>
          <CardDescription className="text-xs">Zwischen Formular und JSON wechseln</CardDescription>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={advanced} onChange={(event) => setAdvanced(event.target.checked)} />
            Expertenmodus (JSON bearbeiten)
          </label>
        </CardContent>
      </Card>

      <div className="md:col-span-2 lg:col-span-3 grid grid-cols-1 gap-4">{metadataCards}</div>

      <div className="md:col-span-2 lg:col-span-3 flex flex-wrap items-center gap-3 justify-end">
        <Button type="submit" disabled={saving}>{saving ? "Speichern…" : "Speichern"}</Button>
        {equipment.asset_tag && (
          <Link
            href={`/api/asset-tags/${equipment.asset_tag}/render?format=svg`}
            target="_blank"
            className="text-sm underline underline-offset-2 text-blue-600 hover:text-blue-800"
          >
            Asset Tag anzeigen
          </Link>
        )}
        {message && <span className="text-sm text-green-600">{message}</span>}
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>

      <ContactFormDialog
        open={contactDialogOpen}
        onOpenChange={setContactDialogOpen}
        companyId={equipment.company_id}
        defaultType="supplier"
        onCreated={(contact) => {
          setContacts((prev) => [...prev, contact]);
        }}
      />
    </form>
  );
}
