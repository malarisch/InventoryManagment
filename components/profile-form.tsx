"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function ProfileForm() {
  const supabase = useMemo(() => createClient(), []);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [pronouns, setPronouns] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      const uid = user?.id;
      if (!uid) {
        setError("Nicht angemeldet");
        setLoading(false);
        return;
      }
      if (!active) return;
      const meta = (user?.user_metadata ?? {}) as Record<string, unknown>;
      const resolveMetaString = (...keys: string[]) => {
        for (const key of keys) {
          const value = meta[key];
          if (typeof value === "string" && value.trim().length > 0) {
            return value;
          }
        }
        return "";
      };
      setDisplayName(resolveMetaString("display_name", "name", "full_name", "user_name", "nickname"));
      setEmail(typeof user?.email === "string" ? user.email : "");
      setPronouns(typeof meta.pronouns === "string" ? meta.pronouns : "");
      setLoading(false);
    }
    load();
    return () => { active = false; };
  }, [supabase]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;
    if (!uid) {
      setError("Nicht angemeldet");
      setSaving(false);
      return;
    }
    const update: Parameters<typeof supabase.auth.updateUser>[0] = {
      data: {
        display_name: displayName.trim() || null,
        pronouns: pronouns.trim() || null,
      },
    };
    if (email.trim()) {
      update.email = email.trim();
    }
    const { error } = await supabase.auth.updateUser(update);
    if (error) setError(error.message); else setMessage(email ? "Gespeichert. Prüfe ggf. deine E-Mail zur Bestätigung." : "Gespeichert.");
    setSaving(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profil</CardTitle>
        <CardDescription>Anzeigename, E-Mail und Pronomen bearbeiten</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-sm text-muted-foreground">Lädt…</div>
        ) : (
          <form onSubmit={save} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="display_name">Anzeigename</Label>
              <Input id="display_name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">E-Mail</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <p className="text-xs text-muted-foreground">Hinweis: Diese E-Mail ist nur innerhalb der App sichtbar (authenticated).</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pronouns">Pronomen</Label>
              <Input id="pronouns" value={pronouns} onChange={(e) => setPronouns(e.target.value)} placeholder="z. B. sie/ihr, er/ihm, they/them" />
            </div>
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={saving}>{saving ? "Speichern…" : "Speichern"}</Button>
              {message && <span className="text-sm text-green-600">{message}</span>}
              {error && <span className="text-sm text-red-600">{error}</span>}
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
