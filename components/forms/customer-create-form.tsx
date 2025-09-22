"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { defaultCustomerMetadataDE, toPrettyJSON } from "@/lib/metadata/defaults";
import type { Tables, Json } from "@/database.types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useCompany } from "@/app/management/_libs/companyHook";

export function CustomerCreateForm() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const { company } = useCompany();
  const [type, setType] = useState<string>("");
  const [companyName, setCompanyName] = useState<string>("");
  const [forename, setForename] = useState<string>("");
  const [surname, setSurname] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [postalCode, setPostalCode] = useState<string>("");
  const [country, setCountry] = useState<string>("");
  const [metaText, setMetaText] = useState<string>(() => toPrettyJSON(defaultCustomerMetadataDE));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id ?? null;
      if (!company || !userId) throw new Error("Fehlende Company oder Nutzer");
      let metadata: Json | null = null;
      const mt = metaText.trim();
      if (mt.length) {
        try { metadata = JSON.parse(mt) as Json; } catch { throw new Error("Ungültiges JSON in Metadata"); }
      }
      const { data, error } = await supabase
        .from("customers")
        .insert({
          type: type.trim() || null,
          company_name: companyName.trim() || null,
          forename: forename.trim() || null,
          surname: surname.trim() || null,
          email: email.trim() || null,
          address: address.trim() || null,
          postal_code: postalCode.trim() || null,
          country: country.trim() || null,
          metadata,
          company_id: company.id,
          created_by: userId,
        })
        .select("id")
        .single();
      if (error) throw error;
      const id = (data as Tables<"customers">).id;
      router.push(`/management/customers/${id}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
      setSaving(false);
    }
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
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving}>{saving ? "Erstellen…" : "Erstellen"}</Button>
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
    </form>
  );
}
