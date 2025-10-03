"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { defaultCustomerMetadataDE, toPrettyJSON } from "@/lib/metadata/defaults";
import { CustomerMetadataForm } from "@/components/forms/partials/customer-metadata-form";
import { buildCustomerMetadata } from "@/lib/metadata/builders";
import type { Tables, Json } from "@/database.types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCompany } from "@/app/management/_libs/companyHook";

export function CustomerCreateForm() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const { company } = useCompany();
  const [customerType, setCustomerType] = useState<string>("");
  const [companyName, setCompanyName] = useState<string>("");
  const [forename, setForename] = useState<string>("");
  const [surname, setSurname] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [postalCode, setPostalCode] = useState<string>("");
  const [country, setCountry] = useState<string>("");
  const [metaText, setMetaText] = useState<string>(() => toPrettyJSON(defaultCustomerMetadataDE));
  const [metaObj, setMetaObj] = useState(defaultCustomerMetadataDE);
  const [advanced, setAdvanced] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validation function
  function validateForm(): string | null {
    if (!customerType) {
      return "Bitte wählen Sie einen Typ aus (Unternehmen oder Privat)";
    }

    if (customerType === "company") {
      if (!companyName.trim()) {
        return "Firmenname ist für Unternehmen erforderlich";
      }
    } else if (customerType === "private") {
      if (!forename.trim() || !surname.trim()) {
        return "Vor- und Nachname sind für Privatkunden erforderlich";
      }
    }
    
    return null;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    
    // Validate form
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      setSaving(false);
      return;
    }
    
    try {
      console.log('Form submission - state values:', { forename, surname, email, customerType, companyName });
      
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id ?? null;
      if (!company || !userId) throw new Error("Fehlende Company oder Nutzer");
      let metadata: Json | null = null;
      if (advanced) {
        const mt = metaText.trim();
        if (mt.length) {
          try { metadata = JSON.parse(mt) as Json; } catch { throw new Error("Ungültiges JSON in Metadata"); }
        }
      } else {
        metadata = buildCustomerMetadata(metaObj) as unknown as Json;
      }
      
      const contactInsert = {
        contact_type: "customer",
        customer_type: customerType.trim() || null,
        company_name: companyName.trim() || null,
        forename: forename.trim() || null,
        surname: surname.trim() || null,
        first_name: forename.trim() || null,
        last_name: surname.trim() || null,
        display_name: customerType === "company"
          ? companyName.trim() || "Unbenannte Firma"
          : `${forename} ${surname}`.trim() || "Unbenannter Kunde",
        email: email.trim() || null,
        address: address.trim() || null,
        street: address.trim() || null,
        postal_code: postalCode.trim() || null,
        zip_code: postalCode.trim() || null,
        country: country.trim() || null,
        metadata,
        files: null,
        company_id: company.id,
        created_by: userId,
      };
      console.log('Contact insert payload:', contactInsert);

      const { data, error } = await supabase
        .from("contacts")
        .insert(contactInsert)
        .select("*")
        .single();
      if (error) throw error;
      const contact = (data as Tables<"contacts">);
      console.log('Customer contact created:', contact);
      router.push(`/management/contacts/${contact.id}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
      setSaving(false);
    }
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
                <input
                  type="radio"
                  value="company"
                  checked={customerType === "company"}
                  onChange={(e) => setCustomerType(e.target.value)}
                  className="w-4 h-4"
                />
                <span>Unternehmen</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  value="private"
                  checked={customerType === "private"}
                  onChange={(e) => setCustomerType(e.target.value)}
                  className="w-4 h-4"
                />
                <span>Privat</span>
              </label>
            </div>
          </div>

          {customerType === "company" && (
            <div className="grid gap-2">
              <Label htmlFor="company_name">Firmenname *</Label>
              <Input id="company_name" name="company_name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Firmenname" />
            </div>
          )}

          {customerType === "private" && (
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

          {customerType && (
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
            <CustomerMetadataForm value={metaObj} onChange={setMetaObj} />
          )}
        </CardContent>
      </Card>

      <div className="md:col-span-12 flex items-center gap-3 justify-end">
        <Button type="submit" disabled={saving || !customerType}>{saving ? "Erstellen…" : "Erstellen"}</Button>
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
    </form>
  );
}
