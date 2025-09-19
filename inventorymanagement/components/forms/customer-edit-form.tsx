"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Tables, Json } from "@/database.types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type Customer = Tables<"customers">;

export function CustomerEditForm({ customer }: { customer: Customer }) {
  const supabase = useMemo(() => createClient(), []);
  const [type, setType] = useState<string>(customer.type ?? "");
  const [companyName, setCompanyName] = useState<string>(customer.company_name ?? "");
  const [forename, setForename] = useState<string>(customer.forename ?? "");
  const [surname, setSurname] = useState<string>(customer.surname ?? "");
  const [email, setEmail] = useState<string>(customer.email ?? "");
  const [address, setAddress] = useState<string>(customer.address ?? "");
  const [postalCode, setPostalCode] = useState<string>(customer.postal_code ?? "");
  const [country, setCountry] = useState<string>(customer.country ?? "");
  const [metaText, setMetaText] = useState<string>(() => {
    try { return customer.metadata ? JSON.stringify(customer.metadata, null, 2) : "{}"; } catch { return "{}"; }
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    let metadata: Json | null = null;
    const mt = metaText.trim();
    if (mt.length) {
      try { metadata = JSON.parse(mt) as Json; } catch { setSaving(false); setError("Ungültiges JSON in Metadata"); return; }
    }
    const { error } = await supabase
      .from("customers")
      .update({
        type: type.trim() || null,
        company_name: companyName.trim() || null,
        forename: forename.trim() || null,
        surname: surname.trim() || null,
        email: email.trim() || null,
        address: address.trim() || null,
        postal_code: postalCode.trim() || null,
        country: country.trim() || null,
        metadata,
      })
      .eq("id", customer.id);
    if (error) setError(error.message); else setMessage("Gespeichert.");
    setSaving(false);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="type">Typ</Label>
          <Input id="type" value={type} onChange={(e) => setType(e.target.value)} placeholder="Firma/Privat/..." />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">E-Mail</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="mail@example.com" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="company_name">Firma</Label>
          <Input id="company_name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Firmenname" />
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="forename">Vorname</Label>
            <Input id="forename" value={forename} onChange={(e) => setForename(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="surname">Nachname</Label>
            <Input id="surname" value={surname} onChange={(e) => setSurname(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor="address">Adresse</Label>
          <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Straße Hausnr, Stadt" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="postal_code">PLZ</Label>
          <Input id="postal_code" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="country">Land</Label>
        <Input id="country" value={country} onChange={(e) => setCountry(e.target.value)} />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="metadata">Metadata (JSON)</Label>
        <textarea
          id="metadata"
          className="min-h-[120px] w-full rounded-md border bg-background p-2 text-sm font-mono"
          value={metaText}
          onChange={(e) => setMetaText(e.target.value)}
          spellCheck={false}
        />
        <p className="text-xs text-muted-foreground">Beispiel: {`{"note": "VIP Kunde"}`}</p>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving}>{saving ? "Speichern…" : "Speichern"}</Button>
        {message && <span className="text-sm text-green-600">{message}</span>}
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
    </form>
  );
}

