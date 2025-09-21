"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Tables, Json } from "@/database.types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type Company = Tables<"companies">;

export function CompanySettingsForm() {
  const supabase = useMemo(() => createClient(), []);
  const [company, setCompany] = useState<Company | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [metadataText, setMetadataText] = useState("{}");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [dumpStatus, setDumpStatus] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError(null);
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) {
        setError("Nicht angemeldet");
        setLoading(false);
        return;
      }
      const { data: membership, error: membershipError } = await supabase
        .from("users_companies")
        .select("companies(*)")
        .eq("user_id", userId)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (!active) return;

      let targetCompany: Company | null = null;
      if (membershipError && membershipError.code !== "PGRST116") {
        setError(membershipError.message);
      } else if (membership?.companies) {
        const comp = (membership as any).companies as unknown;
        targetCompany = (Array.isArray(comp) ? comp[0] : comp) as Company | null;
      }

      if (!targetCompany) {
        const { data: owned, error: ownedError } = await supabase
          .from("companies")
          .select("*")
          .eq("owner_user_id", userId)
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle();
        if (ownedError && ownedError.code !== "PGRST116") {
          setError(ownedError.message);
        } else if (owned) {
          targetCompany = owned as Company;
        }
      }

      if (targetCompany) {
        setCompany(targetCompany);
        setName(targetCompany.name ?? "");
        setDescription(targetCompany.description ?? "");
        try {
          setMetadataText(targetCompany.metadata ? JSON.stringify(targetCompany.metadata, null, 2) : "{}");
        } catch {
          setMetadataText("{}");
        }
      } else if (!membershipError) {
        setError("Keine Company gefunden");
      }
      setLoading(false);
    }
    load();
    return () => { active = false; };
  }, [supabase]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!company) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    let metadata: Json | null = null;
    if (metadataText.trim().length) {
      try {
        metadata = JSON.parse(metadataText) as Json;
      } catch {
        setSaving(false);
        setError("Ungültiges JSON in Metadata");
        return;
      }
    }
    const { error } = await supabase
      .from("companies")
      .update({
        name: name.trim(),
        description: description.trim() || null,
        metadata,
      })
      .eq("id", company.id);
    if (error) setError(error.message); else setMessage("Gespeichert.");
    setSaving(false);
  }

  async function createSeedDump() {
    setDumpStatus("Erstelle Dump…");
    try {
      const res = await fetch("/api/admin/dump-seed", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setDumpStatus(`Fehler: ${data?.error ?? res.status}`);
      } else {
        setDumpStatus(`OK: gespeichert unter ${data.path} (${data.bytes} Bytes)`);
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      setDumpStatus(`Fehler: ${message}`);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Company Settings</CardTitle>
        <CardDescription>Namen, Beschreibung und Metadaten bearbeiten</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-sm text-muted-foreground">Lädt…</div>
        ) : company ? (
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
              <Label htmlFor="metadata">Metadata (JSON)</Label>
              <textarea
                id="metadata"
                className="min-h-[140px] w-full rounded-md border bg-background p-2 text-sm font-mono"
                value={metadataText}
                onChange={(e) => setMetadataText(e.target.value)}
                spellCheck={false}
              />
              <p className="text-xs text-muted-foreground">Beispiel: {`{"branding": {"primaryColor": "#22c55e"}}`}</p>
            </div>
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={saving}>{saving ? "Speichern…" : "Speichern"}</Button>
              {message && <span className="text-sm text-green-600">{message}</span>}
              {error && <span className="text-sm text-red-600">{error}</span>}
            </div>
          </form>
        ) : (
          <div className="text-sm text-red-600">Keine Company gefunden.</div>
        )}
        <div className="mt-4 border-t pt-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium">Seed Dump</div>
              <div className="text-xs text-muted-foreground">Dump public + auth Daten nach supabase/seed.sql</div>
            </div>
            <Button type="button" variant="outline" onClick={createSeedDump}>Seed-Dump erstellen</Button>
          </div>
          {dumpStatus && <div className="mt-2 text-xs text-muted-foreground">{dumpStatus}</div>}
        </div>
      </CardContent>
    </Card>
  );
}
