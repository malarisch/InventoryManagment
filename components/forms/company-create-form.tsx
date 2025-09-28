"use client";

import { useMemo, useState } from "react";

/**
 * CompanyCreateForm
 *
 * Form for creating a new company. Handles metadata input (structured or advanced JSON),
 * validates and submits to Supabase, and adds the user to the new company.
 */
import { createClient } from "@/lib/supabase/client";
import { defaultAdminCompanyMetadataDE, toPrettyJSON } from "@/lib/metadata/defaults";
import { CompanyMetadataForm } from "@/components/forms/partials/company-metadata-form";
import { buildAdminCompanyMetadata } from "@/lib/metadata/builders";
import type { Tables, Json as DBJson } from "@/database.types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";

export function CompanyCreateForm() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [metadataText, setMetadataText] = useState(() => toPrettyJSON(defaultAdminCompanyMetadataDE));
  const [metaObj, setMetaObj] = useState(defaultAdminCompanyMetadataDE);
  const [advanced, setAdvanced] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
  let metadata: DBJson | null = null;
      if (advanced) {
        const mt = metadataText.trim();
        if (mt.length) {
          try { metadata = JSON.parse(mt) as DBJson; } catch { throw new Error("Ungültiges JSON in Metadata"); }
        }
      } else {
        metadata = buildAdminCompanyMetadata(metaObj) as unknown as DBJson;
      }
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) throw new Error("Nicht angemeldet");
      const { data, error } = await supabase
        .from("companies")
        .insert({ name: name.trim(), description: description.trim() || null, metadata, owner_user_id: userId })
        .select("id")
        .single();
      if (error) throw error;
      const id = (data as Tables<"companies">).id;
      await supabase.from("users_companies").insert({ user_id: userId, company_id: id });
      router.push("/management/company-settings");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
      setSaving(false);
    }
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
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Beschreibung</Label>
            <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-12">
        <CardHeader>
          <CardTitle>Company‑Metadaten</CardTitle>
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
              <textarea id="metadata" className="min-h-[120px] w-full rounded-md border bg-background p-2 text-sm font-mono" value={metadataText} onChange={(e) => setMetadataText(e.target.value)} spellCheck={false} />
            </div>
          ) : (
            <CompanyMetadataForm value={metaObj} onChange={setMetaObj} />
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
