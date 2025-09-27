"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/database.types";
import type { adminCompanyMetadata } from "@/components/metadataTypes.types";
import { buildAssetTagCode } from "@/lib/asset-tags/code";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useCompany } from "@/app/management/_libs/companyHook";

type AssetTagTemplate = Tables<"asset_tag_templates">;

export function LocationCreateForm() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const { company } = useCompany();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [assetTagTemplateId, setAssetTagTemplateId] = useState<number | "">("");
  const [assetTagTemplates, setAssetTagTemplates] = useState<AssetTagTemplate[]>([]);
  const [companyMeta, setCompanyMeta] = useState<adminCompanyMetadata | null>(null);
  const [isWorkshop, setIsWorkshop] = useState<boolean>(false);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useMemo(() => {
    let active = true;
    async function loadTags() {
      const [{ data: tmplData }, { data: companyRow }] = await Promise.all([
        supabase.from("asset_tag_templates").select("id,template").order("created_at", { ascending: false }),
        supabase.from("companies").select("metadata").limit(1).maybeSingle(),
      ]);
      if (!active) return;
      setAssetTagTemplates((tmplData as AssetTagTemplate[]) ?? []);
      setCompanyMeta(companyRow?.metadata as unknown as adminCompanyMetadata || null);
  const metaPartial = companyRow?.metadata as Partial<adminCompanyMetadata> | undefined;
  const defId = metaPartial?.defaultLocationAssetTagTemplateId;
      if (defId) setAssetTagTemplateId(defId);
      setLoaded(true);
    }
    loadTags();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id ?? null;
      if (!company || !userId) throw new Error("Fehlende Company oder Nutzer");
      const { data, error } = await supabase
        .from("locations")
        .insert({
          name: name.trim(),
          description: description.trim() || null,
          company_id: company.id,
          created_by: userId,
          is_workshop: isWorkshop,
        })
        .select("id")
        .single();
      if (error) throw error;
      const id = (data as Tables<"locations">).id;
      if (assetTagTemplateId !== "") {
        const printed_code = companyMeta ? buildAssetTagCode(companyMeta, "location", id) : String(id);
        const { data: tag, error: tagErr } = await supabase
          .from("asset_tags")
          .insert({ printed_template: Number(assetTagTemplateId), printed_code, company_id: company.id, created_by: userId })
          .select("id")
          .single();
        if (tagErr) throw tagErr;
        const tagId = (tag as Tables<"asset_tags">).id;
        await supabase.from("locations").update({ asset_tag: tagId }).eq("id", id);
      }
      router.push(`/management/locations/${id}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="description">Beschreibung</Label>
        <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="flex items-center gap-2">
        <input id="is_workshop" type="checkbox" checked={isWorkshop} onChange={(e) => setIsWorkshop(e.target.checked)} />
        <Label htmlFor="is_workshop">Ist Werkstatt</Label>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="asset_tag_template">Asset Tag Template</Label>
        <select
          id="asset_tag_template"
          className="h-9 rounded-md border bg-background px-3 text-sm"
          value={assetTagTemplateId}
          onChange={(e) => setAssetTagTemplateId(e.target.value === "" ? "" : Number(e.target.value))}
          disabled={!loaded}
        >
          <option value="">— Keins —</option>
          {assetTagTemplates.map((t) => (
            <option key={t.id} value={t.id}>{`Template #${t.id}`}</option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving}>{saving ? "Erstellen…" : "Erstellen"}</Button>
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
    </form>
  );
}

