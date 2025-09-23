"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Tables, Json, Database } from "@/database.types";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useCompany } from "@/app/management/_libs/companyHook";
import { DatePicker } from "@/components/ui/date-picker";
import { defaultEquipmentMetadataDE, toPrettyJSON } from "@/lib/metadata/defaults";
import { EquipmentMetadataForm } from "@/components/forms/partials/equipment-metadata-form";
import { buildEquipmentMetadata } from "@/lib/metadata/builders";
type Article = Tables<"articles">;
type Location = Tables<"locations">;
type AssetTag = Tables<"asset_tags">;

export function EquipmentCreateForm({ initialArticleId }: { initialArticleId?: number }) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const { company } = useCompany();
  const [assetTagId, setAssetTagId] = useState<number | "">("");
  const [articleId, setArticleId] = useState<number | "">(initialArticleId ?? "");
  
  const [articles, setArticles] = useState<Article[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [assetTags, setAssetTags] = useState<AssetTag[]>([]);
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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState<number>(1);

  useEffect(() => {
    let active = true;
    async function loadData() {
      const [{ data: articlesData }, { data: locationsData }, { data: assetTagData }] = await Promise.all([
        supabase.from("articles").select("id,name").order("name"),
        supabase.from("locations").select("id,name").order("name"),
        supabase.from("asset_tags").select("id, printed_code, printed_applied").order("created_at", { ascending: false }),
      ]);
      if (!active) return;
      setArticles((articlesData as Article[]) ?? []);
      setLocations((locationsData as Location[]) ?? []);
      setAssetTags((assetTagData as AssetTag[]) ?? []);
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
      const base: Database["public"]["Tables"]["equipments"]["Insert"] = {
        asset_tag: assetTagId === "" ? null : Number(assetTagId),
        article_id: articleId === "" ? null : Number(articleId),
        current_location: currentLocation === "" ? null : Number(currentLocation),
        metadata,
        company_id: company.id,
        created_by: userId,
      };
      if (addedAt) base.added_to_inventory_at = addedAt;

      if (!Number.isFinite(count) || count < 1) throw new Error("Anzahl ungültig");
      if (count > 1 && assetTagId !== "") throw new Error("Bei Mehrfacherstellung darf kein Asset Tag gewählt werden");

      if (count === 1) {
        const { data, error } = await supabase
          .from("equipments")
          .insert(base)
          .select("id")
          .single();
        if (error) throw error;
        const id = (data as Tables<"equipments">).id;
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
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="asset_tag">Asset Tag</Label>
        <select
          id="asset_tag"
          className="h-9 rounded-md border bg-background px-3 text-sm"
          value={assetTagId}
          onChange={(e) => setAssetTagId(e.target.value === "" ? "" : Number(e.target.value))}
        >
          <option value="">— Kein Asset Tag —</option>
          {assetTags.map((tag) => (
            <option key={tag.id} value={tag.id}>
              {tag.printed_code ?? `#${tag.id}`} {tag.printed_applied ? "(verwendet)" : ""}
            </option>
          ))}
        </select>
      </div>
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
      
      <div className="grid gap-2">
        <Label htmlFor="added">Im Lager seit</Label>
        <DatePicker id="added" name="added" value={addedAt} onChange={setAddedAt} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="count">Anzahl</Label>
        <Input id="count" type="number" min={1} value={String(count)} onChange={(e) => setCount(Math.max(1, Number(e.target.value) || 1))} />
      </div>
      <div className="grid gap-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">Equipment-Metadaten</div>
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" checked={advanced} onChange={(e) => setAdvanced(e.target.checked)} />
            Expertenmodus (JSON bearbeiten)
          </label>
        </div>
        {advanced ? (
          <div className="grid gap-2">
            <Label htmlFor="metadata">Metadata (JSON)</Label>
            <textarea
              id="metadata"
              className="min-h-[120px] w-full rounded-md border bg-background p-2 text-sm font-mono"
              value={metaText}
              onChange={(e) => setMetaText(e.target.value)}
              spellCheck={false}
            />
          </div>
        ) : (
          <EquipmentMetadataForm value={metaObj} onChange={v => setMetaObj(buildEquipmentMetadata(v))} />
        )}
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving}>{saving ? "Erstellen…" : "Erstellen"}</Button>
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
    </form>
  );
}
