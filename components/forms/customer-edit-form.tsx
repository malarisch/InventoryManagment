"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Tables, Json } from "@/database.types";
import { CustomerMetadataForm } from "@/components/forms/partials/customer-metadata-form";
import { defaultCustomerMetadataDE, toPrettyJSON } from "@/lib/metadata/defaults";
import { buildCustomerMetadata } from "@/lib/metadata/builders";
import type { CustomerMetadata } from "@/components/metadataTypes.types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Customer = Tables<"customers">;

export function CustomerEditForm({ customer }: { customer: Customer }) {
  console.log('CustomerEditForm received customer:', JSON.stringify(customer, null, 2));
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [type, setType] = useState<string>(customer.type ?? "");
  const [companyName, setCompanyName] = useState<string>(customer.company_name ?? "");
  const [forename, setForename] = useState<string>(customer.forename ?? "");
  const [surname, setSurname] = useState<string>(customer.surname ?? "");
  const [email, setEmail] = useState<string>(customer.email ?? "");
  const [address, setAddress] = useState<string>(customer.address ?? "");
  const [postalCode, setPostalCode] = useState<string>(customer.postal_code ?? "");
  const [country, setCountry] = useState<string>(customer.country ?? "");
  const [metaText, setMetaText] = useState<string>(() => {
    try { return customer.metadata ? JSON.stringify(customer.metadata, null, 2) : toPrettyJSON(defaultCustomerMetadataDE); } catch { return toPrettyJSON(defaultCustomerMetadataDE); }
  });
  const [metaObj, setMetaObj] = useState<CustomerMetadata>((customer.metadata as unknown as CustomerMetadata) ?? defaultCustomerMetadataDE);
  const [advanced, setAdvanced] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Validation function
  function validateForm(): string | null {
    if (!type) {
      return "Bitte wählen Sie einen Typ aus (Unternehmen oder Privat)";
    }
    
    if (type === "company") {
      if (!companyName.trim()) {
        return "Firmenname ist für Unternehmen erforderlich";
      }
    } else if (type === "private") {
      if (!forename.trim() || !surname.trim()) {
        return "Vor- und Nachname sind für Privatkunden erforderlich";
      }
    }
    
    return null;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    
    // Validate form
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      setSaving(false);
      return;
    }
    
    let metadata: Json | null = null;
    if (advanced) {
      const mt = metaText.trim();
      if (mt.length) {
        try { metadata = JSON.parse(mt) as Json; } catch { setSaving(false); setError("Ungültiges JSON in Metadata"); return; }
      }
    } else {
      metadata = buildCustomerMetadata(metaObj) as unknown as Json;
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
    if (error) setError(error.message); else {
      setMessage("Gespeichert.");
      try { router.refresh(); } catch { /* noop */ }
    }
    setSaving(false);
  }

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-6">
      <Card className="md:col-span-8">
        <CardHeader>
          <CardTitle>Basisdaten</CardTitle>
          <CardDescription>Typ, Name und Kontakt</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            <Label className="text-base font-medium">Typ *</Label>
            <div className="flex space-x-4">
              <label className="flex items-center space-x-2">
                <input type="radio" value="company" checked={type === "company"} onChange={(e) => setType(e.target.value)} className="w-4 h-4" />
                <span>Unternehmen</span>
              </label>
              <label className="flex items-center space-x-2">
                <input type="radio" value="private" checked={type === "private"} onChange={(e) => setType(e.target.value)} className="w-4 h-4" />
                <span>Privat</span>
              </label>
            </div>
          </div>

          {type === "company" && (
            <div className="grid gap-2">
              <Label htmlFor="company_name">Firmenname *</Label>
              <Input id="company_name" name="company_name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Firmenname" />
            </div>
          )}

          {type === "private" && (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="forename">Vorname *</Label>
                <Input id="forename" name="forename" value={forename} onChange={(e) => setForename(e.target.value)} placeholder="Vorname" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="surname">Nachname *</Label>
                <Input id="surname" name="surname" value={surname} onChange={(e) => setSurname(e.target.value)} placeholder="Nachname" />
              </div>
            </div>
          )}

          {type && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="email">E-Mail</Label>
                <Input id="email" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="mail@example.com" />
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <div className="grid gap-2 sm:col-span-2">
                  <Label htmlFor="address">Adresse</Label>
                  <Input id="address" name="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Straße Hausnr, Stadt" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="postal_code">PLZ</Label>
                  <Input id="postal_code" name="postal_code" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="country">Land</Label>
                <Input id="country" name="country" value={country} onChange={(e) => setCountry(e.target.value)} />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="md:col-span-12">
        <CardHeader>
          <CardTitle>Kunden‑Metadaten</CardTitle>
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
              <textarea id="metadata" className="min-h-[120px] w-full rounded-md border bg-background p-2 text-sm font-mono" value={metaText} onChange={(e) => setMetaText(e.target.value)} spellCheck={false} />
            </div>
          ) : (
            <CustomerMetadataForm value={metaObj} onChange={setMetaObj} customerType={type as "company" | "private"} />
          )}
        </CardContent>
      </Card>

      <div className="md:col-span-12 flex items-center gap-3 justify-end">
        <Button type="submit" disabled={saving || !type}>{saving ? "Speichern…" : "Speichern"}</Button>
        {message && <span className="text-sm text-green-600">{message}</span>}
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
    </form>
  );
}
