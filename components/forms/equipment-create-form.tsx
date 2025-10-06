"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Tables, Json, Database } from "@/database.types";
import type { adminCompanyMetadata, ArticleMetadata, EquipmentMetadata } from "@/components/metadataTypes.types";
import { buildAssetTagCode } from "@/lib/asset-tags/code";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useCompany } from "@/app/management/_libs/companyHook";
import { DatePicker } from "@/components/ui/date-picker";
import { defaultEquipmentMetadataDE, toPrettyJSON } from "@/lib/metadata/defaults";
import { EquipmentMetadataForm } from "@/components/forms/partials/equipment-metadata-form";
import { ContactFormDialog } from "@/components/forms/contacts/contact-form-dialog";
import { buildEquipmentMetadata } from "@/lib/metadata/builders";
type Article = Tables<"articles">;
type Location = Tables<"locations">;
type AssetTagTemplate = Tables<"asset_tag_templates">;
type Contact = Tables<"contacts">;

export function EquipmentCreateForm({ initialArticleId }: { initialArticleId?: number }) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const { company } = useCompany();
  const [assetTagTemplateId, setAssetTagTemplateId] = useState<number | "">("");
  const [articleId, setArticleId] = useState<number | "">(initialArticleId ?? "");
  
  const [articles, setArticles] = useState<Article[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [assetTagTemplates, setAssetTagTemplates] = useState<AssetTagTemplate[]>([]);
  const [companyMeta, setCompanyMeta] = useState<adminCompanyMetadata | null>(null);
  const [currentLocation, setCurrentLocation] = useState<number | "">("");
  const [addedAt, setAddedAt] = useState<string>(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  });
  const [metaText, setMetaText] = useState<string>(() => toPrettyJSON(defaultEquipmentMetadataDE));
  const [metaObj, setMetaObj] = useState(defaultEquipmentMetadataDE);
  const [advanced, setAdvanced] = useState(false);
  const [wasAdvanced, setWasAdvanced] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState<number>(1);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadData() {
      if (!company?.id) return;
      const [{ data: articlesData }, { data: locationsData }, { data: tmplData }, { data: companyRow }] = await Promise.all([
        supabase.from("articles").select("id,name,company_id,metadata,default_location").eq("company_id", company.id).order("name"),
        supabase.from("locations").select("id,name,company_id").eq("company_id", company.id).order("name"),
        supabase.from("asset_tag_templates").select("id,template,company_id").eq("company_id", company.id).order("created_at", { ascending: false }),
        supabase.from("companies").select("metadata").eq("id", company.id).limit(1).maybeSingle(),
      ]);
      if (!active) return;
      setArticles((articlesData as Article[]) ?? []);
      setLocations((locationsData as Location[]) ?? []);
      setAssetTagTemplates((tmplData as AssetTagTemplate[]) ?? []);
      setCompanyMeta(companyRow?.metadata ? (companyRow.metadata as unknown as adminCompanyMetadata) : null);
      const metaPartial = companyRow?.metadata as Partial<adminCompanyMetadata> | undefined;
      const defId = metaPartial?.defaultEquipmentAssetTagTemplateId;
      if (defId) setAssetTagTemplateId(defId);
    }
    loadData();
    return () => { active = false; };
  }, [supabase, company?.id]);

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
        // ignore parse error, keep previous structured values
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

  // If user selects an article and hasn't chosen a location yet, inherit the article's default_location
  useEffect(() => {
    if (articleId === "") return;
    const id = Number(articleId);
    const match = articles.find((a) => a.id === id) as (Article & { default_location?: number | null }) | undefined;
    if (!match) return;
    // Only set if user hasn't picked any location yet
    if (currentLocation === "" || currentLocation == null) {
      const def = match.default_location ?? null;
      if (typeof def === 'number') {
        setCurrentLocation(def);
      }
    }
  }, [articleId, articles, currentLocation]);

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
        <CardTitle>Equipment-Metadaten (JSON)</CardTitle>
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
    setError(null);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id ?? null;
      if (!company || !userId) throw new Error("Fehlende Company oder Nutzer");
      let metadata: Json | null = null;
      if (advanced) {
        const mt = metaText.trim();
        if (mt.length) {
          try { metadata = JSON.parse(mt) as Json; } catch { throw new Error("Ungültiges JSON in Metadata"); }
        }
      } else {
  metadata = buildEquipmentMetadata(metaObj) as unknown as Json;
      }
      // Defensive: ensure selected article (if any) belongs to this company
      if (articleId !== "") {
        const { data: art } = await supabase.from("articles").select("company_id").eq("id", Number(articleId)).maybeSingle();
        if (art && art.company_id !== company.id) {
          throw new Error("Der ausgewählte Artikel gehört nicht zur aktuellen Company.");
        }
      }

      // If no explicit current_location but article has a default_location, apply it as a safety net
      let inheritedLocation: number | null = null;
      if (articleId !== "") {
        const id = Number(articleId);
        const article = articles.find((a) => a.id === id) as (Article & { default_location?: number | null }) | undefined;
        if (article && typeof article.default_location === 'number') {
          inheritedLocation = article.default_location;
        }
      }

      const base: Database["public"]["Tables"]["equipments"]["Insert"] = {
        asset_tag: null,
        article_id: articleId === "" ? null : Number(articleId),
        current_location: currentLocation === "" ? (inheritedLocation ?? null) : Number(currentLocation),
        metadata,
        company_id: company.id,
        created_by: userId,
      };
      if (addedAt) base.added_to_inventory_at = addedAt;

      if (!Number.isFinite(count) || count < 1) throw new Error("Anzahl ungültig");
  if (count > 1 && assetTagTemplateId !== "") throw new Error("Bei Mehrfacherstellung derzeit kein automatischer Asset Tag je Einheit");

      if (count === 1) {
        const { data, error } = await supabase
          .from("equipments")
          .insert(base)
          .select("id")
          .single();
        if (error) throw error;
        const id = (data as Tables<"equipments">).id;
        if (assetTagTemplateId !== "") {
          const printed_code = companyMeta ? buildAssetTagCode(companyMeta, "equipment", id) : String(id);
            const { data: tag, error: tagErr } = await supabase
              .from("asset_tags")
              .insert({ printed_template: Number(assetTagTemplateId), printed_code, company_id: company.id, created_by: userId })
              .select("id")
              .single();
            if (tagErr) throw tagErr;
            const tagId = (tag as Tables<"asset_tags">).id;
            await supabase.from("equipments").update({ asset_tag: tagId }).eq("id", id);
        }
        router.push(`/management/equipments/${id}`);
      } else {
        const rows: Database["public"]["Tables"]["equipments"]["Insert"][] = Array.from({ length: count }, () => ({ ...base }));
        const { error } = await supabase.from("equipments").insert(rows);
        if (error) throw error;
        if (typeof initialArticleId === 'number') router.push(`/management/articles/${initialArticleId}`);
        else router.push(`/management/equipments`);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-6">
      <Card className="md:col-span-4">
        <CardHeader>
          <CardTitle>Asset Tag</CardTitle>
          <CardDescription>Optionales Template</CardDescription>
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
          <CardTitle>Zuordnung</CardTitle>
          <CardDescription>Artikel und Standort</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="article_id">Artikel</Label>
            <select
              id="article_id"
              className="h-9 rounded-md border bg-background px-3 text-sm"
              value={articleId}
              onChange={(e) => setArticleId(e.target.value === "" ? "" : Number(e.target.value))}
            >
              <option value="">— Kein Artikel —</option>
              {articles.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="current_location">Aktueller Standort</Label>
            <select
              id="current_location"
              className="h-9 rounded-md border bg-background px-3 text-sm"
              value={currentLocation}
              onChange={(e) => setCurrentLocation(e.target.value === "" ? "" : Number(e.target.value))}
            >
              <option value="">— Kein Standort —</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>{location.name}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-4">
        <CardHeader>
          <CardTitle>Inventar</CardTitle>
          <CardDescription>Datum & Anzahl</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="added">Im Lager seit</Label>
            <DatePicker id="added" name="added" value={addedAt} onChange={setAddedAt} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="count">Anzahl</Label>
            <Input id="count" type="number" min={1} value={String(count)} onChange={(e) => setCount(Math.max(1, Number(e.target.value) || 1))} />
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
