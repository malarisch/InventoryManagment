"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/database.types";
import { buildAssetTagCode } from "@/lib/asset-tags/code";
import type { adminCompanyMetadata } from "@/components/metadataTypes.types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useCompany } from "@/app/management/_libs/companyHook";
import { ArticleMetadataForm } from "@/components/forms/partials/article-metadata-form";
import { defaultArticleMetadataDE, toPrettyJSON } from "@/lib/metadata/defaults";

type Location = Tables<"locations">;
import type { Json } from "@/database.types";
type AssetTagTemplate = { id: number; template: Json };

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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metaText, setMetaText] = useState<string>(() => toPrettyJSON(defaultArticleMetadataDE));
  const [metaObj, setMetaObj] = useState(defaultArticleMetadataDE);
  const [advanced, setAdvanced] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadData() {
      const [{ data: locationsData }, { data: tmplData }, { data: companyRow }] = await Promise.all([
        supabase.from("locations").select("id,name").order("name"),
        supabase.from("asset_tag_templates").select("id,template").order("created_at", { ascending: false }),
        supabase.from("companies").select("metadata").limit(1).maybeSingle(),
      ]);
      if (!active) return;
      setLocations((locationsData as Location[]) ?? []);
  setAssetTagTemplates(((tmplData as Tables<"asset_tag_templates">[]) ?? []).map(t => ({ id: t.id, template: t.template as Json })));
  setCompanyMeta(companyRow?.metadata ? companyRow.metadata as unknown as adminCompanyMetadata : null);
  // preselect default template id from metadata (loose cast for optional field presence)
  const metaAny = companyRow?.metadata as Partial<adminCompanyMetadata> | undefined;
  const defId = metaAny?.defaultArticleAssetTagTemplateId;
      if (defId) setAssetTagTemplateId(defId);
    }
    loadData();
    return () => { active = false; };
  }, [supabase]);

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
  const printed_code = companyMeta ? buildAssetTagCode(companyMeta, "article", id) : String(id);
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
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Artikelname" />
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
        <CardContent>
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
        </CardContent>
      </Card>

      <Card className="md:col-span-12">
        <CardHeader>
          <CardTitle>Artikel-Metadaten</CardTitle>
          <CardDescription>Strukturierte Felder oder JSON</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" checked={advanced} onChange={(e) => setAdvanced(e.target.checked)} />
            Expertenmodus (JSON bearbeiten)
          </label>
          {advanced ? (
            <div className="grid gap-2">
              <Label htmlFor="metadata">Metadata (JSON)</Label>
              <textarea
                id="metadata"
                className="min-h-[140px] w-full rounded-md border bg-background p-2 text-sm font-mono"
                value={metaText}
                onChange={(e) => setMetaText(e.target.value)}
                spellCheck={false}
              />
            </div>
          ) : (
            <ArticleMetadataForm value={metaObj} onChange={setMetaObj} />
          )}
        </CardContent>
      </Card>

      <div className="md:col-span-12 flex items-center gap-3 justify-end">
        <Button type="submit" disabled={saving}>{saving ? "Erstellen…" : "Erstellen"}</Button>
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
    </form>
  );
}
