"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/database.types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useCompany } from "@/app/management/_libs/companyHook";

type AssetTag = Tables<"asset_tags">;

export function LocationCreateForm() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const { company } = useCompany();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [assetTagId, setAssetTagId] = useState<number | "">("");
  const [assetTags, setAssetTags] = useState<AssetTag[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useMemo(() => {
    let active = true;
    async function loadTags() {
      const { data } = await supabase
        .from("asset_tags")
        .select("id, printed_code, printed_applied")
        .order("created_at", { ascending: false });
      if (!active) return;
      setAssetTags((data as AssetTag[]) ?? []);
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
          asset_tag: assetTagId === "" ? null : Number(assetTagId),
          company_id: company.id,
          created_by: userId,
        })
        .select("id")
        .single();
      if (error) throw error;
      const id = (data as Tables<"locations">).id;
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
      <div className="grid gap-2">
        <Label htmlFor="asset_tag">Asset Tag</Label>
        <select
          id="asset_tag"
          className="h-9 rounded-md border bg-background px-3 text-sm"
          value={assetTagId}
          onChange={(e) => setAssetTagId(e.target.value === "" ? "" : Number(e.target.value))}
          disabled={!loaded}
        >
          <option value="">— Kein Asset Tag —</option>
          {assetTags.map((tag) => (
            <option key={tag.id} value={tag.id}>
              {tag.printed_code ?? `#${tag.id}`} {tag.printed_applied ? "(verwendet)" : ""}
            </option>
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

