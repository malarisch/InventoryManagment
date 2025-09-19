"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/database.types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type Article = Tables<"articles">;
type Location = Tables<"locations">;
type AssetTag = Tables<"asset_tags">;

export function ArticleEditForm({ article }: { article: Article }) {
  const supabase = useMemo(() => createClient(), []);
  const [name, setName] = useState<string>(article.name ?? "");
  const [defaultLocation, setDefaultLocation] = useState<number | "">(article.default_location ?? "");
  const [assetTagId, setAssetTagId] = useState<number | "">(article.asset_tag ?? "");
  const [locations, setLocations] = useState<Location[]>([]);
  const [assetTags, setAssetTags] = useState<AssetTag[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function loadData() {
      const [{ data: locationsData }, { data: assetTagData }] = await Promise.all([
        supabase.from("locations").select("id,name").order("name"),
        supabase.from("asset_tags").select("id, printed_code, printed_applied").order("created_at", { ascending: false }),
      ]);
      if (!active) return;
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
      .from("articles")
      .update({
        name: name.trim(),
        default_location: defaultLocation === "" ? null : Number(defaultLocation),
        asset_tag: assetTagId === "" ? null : Number(assetTagId),
      })
      .eq("id", article.id);
    if (error) setError(error.message); else setMessage("Gespeichert.");
    setSaving(false);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Artikelname" />
      </div>
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
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving}>{saving ? "Speichern…" : "Speichern"}</Button>
        {message && <span className="text-sm text-green-600">{message}</span>}
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
    </form>
  );
}
