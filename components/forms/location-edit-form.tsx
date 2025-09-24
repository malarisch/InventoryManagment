"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/database.types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type Location = Tables<"locations">;
type AssetTag = Tables<"asset_tags">;

export function LocationEditForm({ location }: { location: Location }) {
  const supabase = useMemo(() => createClient(), []);
  const [name, setName] = useState<string>(location.name ?? "");
  const [description, setDescription] = useState<string>(location.description ?? "");
  const [assetTagId, setAssetTagId] = useState<number | "">(location.asset_tag ?? "");
  const [assetTags, setAssetTags] = useState<AssetTag[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function loadAssetTags() {
      const { data } = await supabase
        .from("asset_tags")
        .select("id, printed_code, printed_applied")
        .order("created_at", { ascending: false });
      if (!active) return;
      setAssetTags((data as AssetTag[]) ?? []);
    }
    loadAssetTags();
    return () => {
      active = false;
    };
  }, [supabase]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    const { error } = await supabase
      .from("locations")
      .update({
        name: name.trim(),
        description: description.trim() || null,
        asset_tag: assetTagId === "" ? null : Number(assetTagId),
      })
      .eq("id", location.id);
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
        <Label htmlFor="name">Name</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="z.B. Lager A" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="description">Beschreibung</Label>
        <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="optional" />
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
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={saving}>{saving ? "Speichern…" : "Speichern"}</Button>
        {location.asset_tag && (
          <Link
            href={`/api/asset-tags/${location.asset_tag}/render?format=svg`}
            target="_blank"
            className="text-sm underline underline-offset-2 text-blue-600 hover:text-blue-800"
          >
            Asset Tag anzeigen
          </Link>
        )}
        {message && <span className="text-sm text-green-600">{message}</span>}
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
    </form>
  );
}
