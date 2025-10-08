"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/database.types";
import { buildAssetTagCode } from "@/lib/asset-tags/code";
import type { adminCompanyMetadata, asset_tag_template_print } from "@/components/metadataTypes.types";
import type { ArticleMetadata } from "@/components/metadataTypes.types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useCompany } from "@/app/management/_libs/companyHook";
import { ArticleMetadataForm } from "@/components/forms/partials/article-metadata-form";
import { ContactFormDialog } from "@/components/forms/contacts/contact-form-dialog";
import { defaultArticleMetadataDE, toPrettyJSON } from "@/lib/metadata/defaults";

type Location = Tables<"locations">;
import type { Json } from "@/database.types";
type AssetTagTemplate = { id: number; template: Json };
type Contact = Tables<"contacts">;

export function ArticleCreateForm() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const { company } = useCompany();
  const [name, setName] = useState<string>("");
  const [defaultLocation, setDefaultLocation] = useState<number | "">("");
  const [assetTagTemplateId, setAssetTagTemplateId] = useState<number | "">("");
  const [locations, setLocations] = useState<Location[]>([]);
  const [assetTagTemplates, setAssetTagTemplates] = useState<AssetTagTemplate[]>([]);
  const [companyMeta, setCompanyMeta] = useState<adminCompanyMetadata | null>(null);
  const [companyName, setCompanyName] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metaText, setMetaText] = useState<string>(() => toPrettyJSON(defaultArticleMetadataDE));
  const [metaObj, setMetaObj] = useState(defaultArticleMetadataDE);
  const [advanced, setAdvanced] = useState(false);
  const [wasAdvanced, setWasAdvanced] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadData() {
      const [{ data: locationsData }, { data: tmplData }, { data: companyRow }] = await Promise.all([
        supabase.from("locations").select("id,name").order("name"),
        supabase.from("asset_tag_templates").select("id,template").order("created_at", { ascending: false }),
        supabase.from("companies").select("name,metadata").limit(1).maybeSingle(),
      ]);
      if (!active) return;
      setLocations((locationsData as Location[]) ?? []);
  setAssetTagTemplates(((tmplData as Tables<"asset_tag_templates">[]) ?? []).map(t => ({ id: t.id, template: t.template as Json })));
  setCompanyMeta(companyRow?.metadata ? companyRow.metadata as unknown as adminCompanyMetadata : null);
  setCompanyName((companyRow?.name as string) ?? "");
  // preselect default template id from metadata (loose cast for optional field presence)
  const metaAny = companyRow?.metadata as Partial<adminCompanyMetadata> | undefined;
  const defId = metaAny?.defaultArticleAssetTagTemplateId;
      if (defId) setAssetTagTemplateId(defId);
    }
    loadData();
    return () => { active = false; };
  }, [supabase]);

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
    return () => { active = false; };
  }, [supabase, company?.id]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id ?? null;
      if (!company || !userId) {
        setError("Fehlende Company oder Nutzer");
        setSaving(false);
        return;
      }
      let metadata: Json | null = null;
      if (advanced) {
        const mt = metaText.trim();
        if (mt.length) {
          try { metadata = JSON.parse(mt) as Json; } catch { throw new Error("Ungültiges JSON in Metadata"); }
        }
      } else {
        metadata = metaObj as unknown as Json;
      }
      
      // Validate: Name OR (Manufacturer AND Model) must be provided
      const trimmedName = name.trim();
      const manufacturer = (metaObj.manufacturer ?? "").trim();
      const model = (metaObj.model ?? "").trim();
      
      const hasName = trimmedName.length > 0;
      const hasManufacturerAndModel = manufacturer.length > 0 && model.length > 0;
      
      if (!hasName && !hasManufacturerAndModel) {
        setError("Bitte 'Name' ODER 'Hersteller + Modell' angeben");
        setSaving(false);
        return;
      }
      const { data, error } = await supabase
        .from("articles")
        .insert({
          name: name.trim(),
          default_location: defaultLocation === "" ? null : Number(defaultLocation),
          company_id: company.id,
          created_by: userId,
          metadata,
        })
        .select("id")
        .single();
      if (error) throw error;
      const id = (data as Tables<"articles">).id;
      // auto create asset tag if template selected
      if (assetTagTemplateId !== "") {
        // Build printed code using selected template (supports placeholders like {company_name})
        const chosen = assetTagTemplates.find((t) => t.id === Number(assetTagTemplateId));
        const templateData = chosen?.template as Record<string, unknown> | undefined;
        const templatePrint: asset_tag_template_print | undefined = templateData ? {
          name: String(templateData.name || ''),
          description: String(templateData.description || ''),
          prefix: String(templateData.prefix || ''),
          suffix: String(templateData.suffix || ''),
          numberLength: Number(templateData.numberLength || 0),
          numberingScheme: (templateData.numberingScheme === 'random' ? 'random' : 'sequential'),
          stringTemplate: String(templateData.stringTemplate || '{prefix}-{code}'),
          codeType: (templateData.codeType === 'Barcode' ? 'Barcode' : templateData.codeType === 'None' ? 'None' : 'QR'),
        } : undefined;
        const printed_code = companyMeta
          ? buildAssetTagCode(companyMeta, "article", id, templatePrint, { company_name: companyName })
          : String(id);
        const { data: tagData, error: tagErr } = await supabase
          .from("asset_tags")
          .insert({
            printed_template: Number(assetTagTemplateId),
            printed_code,
            company_id: company.id,
            created_by: userId,
          })
          .select("id")
          .single();
        if (tagErr) throw tagErr;
        const tagId = (tagData as Tables<"asset_tags">).id;
        await supabase.from("articles").update({ asset_tag: tagId }).eq("id", id);
      }
      router.push(`/management/articles/${id}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
      setSaving(false);
    }
  }

  useEffect(() => {
    if (advanced && !wasAdvanced) {
      try {
        setMetaText(JSON.stringify(metaObj, null, 2));
      } catch {
        // ignore serialization errors
      }
    }
    if (!advanced && wasAdvanced) {
      try {
        if (metaText.trim().length > 0) {
          const parsed = JSON.parse(metaText) as ArticleMetadata;
          setMetaObj(parsed);
        }
      } catch {
        // ignore parse error, keep previous state
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
          onChange={(e) => setMetaText(e.target.value)}
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

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-6">
      <Card className="md:col-span-5">
        <CardHeader>
          <CardTitle>Basisdaten</CardTitle>
          <CardDescription>Name und Standort</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Artikelname" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="default_location">Default Location</Label>
            <select
              id="default_location"
              className="h-9 rounded-md border bg-background px-3 text-sm"
              value={defaultLocation}
              onChange={(e) => setDefaultLocation(e.target.value === "" ? "" : Number(e.target.value))}
            >
              <option value="">— Kein Standort —</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-7">
        <CardHeader>
          <CardTitle>Asset Tag</CardTitle>
          <CardDescription>Optional direkt ein Template auswählen</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="asset_tag_template">Asset Tag Template</Label>
            <select
              id="asset_tag_template"
              className="h-9 rounded-md border bg-background px-3 text-sm"
              value={assetTagTemplateId}
              onChange={(e) => setAssetTagTemplateId(e.target.value === "" ? "" : Number(e.target.value))}
            >
              <option value="">— Keins —</option>
              {assetTagTemplates.map((t) => (
                <option key={t.id} value={t.id}>{`Template #${t.id}`}</option>
              ))}
            </select>
          </div>
          <div className="hidden sm:block" />
        </CardContent>
      </Card>

      <Card className="md:col-span-4">
        <CardHeader>
          <CardTitle>Metadaten-Modus</CardTitle>
          <CardDescription>Zwischen Formular und JSON wechseln</CardDescription>
        </CardHeader>
        <CardContent>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={advanced} onChange={(e) => setAdvanced(e.target.checked)} />
            Expertenmodus (JSON bearbeiten)
          </label>
        </CardContent>
      </Card>

      <div className="col-span-full">{metadataCards}</div>

      <div className="col-span-full flex items-center gap-3 justify-end">
        <Button type="submit" disabled={saving}>{saving ? "Erstellen…" : "Erstellen"}</Button>
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>

      <ContactFormDialog
        open={contactDialogOpen}
        onOpenChange={setContactDialogOpen}
        companyId={company?.id ?? null}
        defaultType="supplier"
        onCreated={(contact) => {
          setContacts((prev) => [...prev, contact]);
        }}
      />
    </form>
  );
}
