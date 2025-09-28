"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/database.types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Location = Tables<"locations">;
type AssetTag = Tables<"asset_tags">;

export function LocationEditForm({ location }: { location: Location }) {
  const supabase = useMemo(() => createClient(), []);
  const [name, setName] = useState<string>(location.name ?? "");
  const [description, setDescription] = useState<string>(location.description ?? "");
  const [assetTagId, setAssetTagId] = useState<number | "">(location.asset_tag ?? "");
  const [assetTags, setAssetTags] = useState<AssetTag[]>([]);
  const [isWorkshop, setIsWorkshop] = useState<boolean>((location as unknown as { is_workshop?: boolean }).is_workshop ?? false);
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
        is_workshop: isWorkshop,
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
    <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-6">
      <Card className="md:col-span-6">
        <CardHeader>
          <CardTitle>Basisdaten</CardTitle>
          <CardDescription>Name und Beschreibung</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="z.B. Lager A" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Beschreibung</Label>
            <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="optional" />
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-3">
        <CardHeader>
          <CardTitle>Asset Tag</CardTitle>
          <CardDescription>Vorhandenen Tag zuordnen</CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      <Card className="md:col-span-3">
        <CardHeader>
          <CardTitle>Werkstatt</CardTitle>
          <CardDescription>Optional</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <input id="is_workshop" type="checkbox" checked={isWorkshop} onChange={(e) => setIsWorkshop(e.target.checked)} />
            <Label htmlFor="is_workshop">Ist Werkstatt</Label>
          </div>
        </CardContent>
      </Card>

      <div className="md:col-span-12 flex flex-wrap items-center gap-3 justify-end">
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
