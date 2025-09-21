"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/database.types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useCompany } from "@/app/management/_libs/companyHook";

type Location = Tables<"locations">;
type AssetTag = Tables<"asset_tags">;

export function ArticleCreateForm() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const { company } = useCompany();
  const [name, setName] = useState<string>("");
  const [defaultLocation, setDefaultLocation] = useState<number | "">("");
  const [assetTagId, setAssetTagId] = useState<number | "">("");
  const [locations, setLocations] = useState<Location[]>([]);
  const [assetTags, setAssetTags] = useState<AssetTag[]>([]);
  const [saving, setSaving] = useState(false);
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
    setError(null);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id ?? null;
      if (!company || !userId) {
        setError("Fehlende Company oder Nutzer");
        setSaving(false);
        return;
      }
      const { data, error } = await supabase
        .from("articles")
        .insert({
          name: name.trim(),
          default_location: defaultLocation === "" ? null : Number(defaultLocation),
          asset_tag: assetTagId === "" ? null : Number(assetTagId),
          company_id: company.id,
          created_by: userId,
        })
        .select("id")
        .single();
      if (error) throw error;
      const id = (data as Tables<"articles">).id;
      router.push(`/management/articles/${id}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Artikelname" />
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
        <Button type="submit" disabled={saving}>{saving ? "Erstellen…" : "Erstellen"}</Button>
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
    </form>
  );
}

