"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/database.types";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type Equipment = Tables<"equipments">;
type Article = Tables<"articles">;
type Location = Tables<"locations">;
type AssetTag = Tables<"asset_tags">;

export function EquipmentEditForm({ equipment }: { equipment: Equipment }) {
  const supabase = useMemo(() => createClient(), []);
  const [assetTagId, setAssetTagId] = useState<number | "">(equipment.asset_tag ?? "");
  const [articleId, setArticleId] = useState<number | "">(equipment.article_id ?? "");
  
  const [articles, setArticles] = useState<Article[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [assetTags, setAssetTags] = useState<AssetTag[]>([]);
  const [currentLocation, setCurrentLocation] = useState<number | "">(equipment.current_location ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    setMessage(null);
    setError(null);
    const { error } = await supabase
      .from("equipments")
      .update({
        asset_tag: assetTagId === "" ? null : Number(assetTagId),
        article_id: articleId === "" ? null : Number(articleId),
        current_location: currentLocation === "" ? null : Number(currentLocation),
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
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving}>{saving ? "Speichern…" : "Speichern"}</Button>
        {message && <span className="text-sm text-green-600">{message}</span>}
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
    </form>
  );
}
