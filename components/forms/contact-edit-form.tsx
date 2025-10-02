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

type Contact = Tables<"contacts">;

const CONTACT_TYPES = ["general", "person", "company", "supplier", "customer"];

export function ContactEditForm({ contact }: { contact: Contact }) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  
  // Unified state - no parallel structures
  const [contactType, setContactType] = useState<string>(contact.contact_type ?? "general");
  const [displayName, setDisplayName] = useState<string>(contact.display_name ?? "");
  const [firstName, setFirstName] = useState<string>(contact.first_name ?? "");
  const [lastName, setLastName] = useState<string>(contact.last_name ?? "");
  const [organization, setOrganization] = useState<string>(contact.organization ?? "");
  const [email, setEmail] = useState<string>(contact.email ?? "");
  const [phone, setPhone] = useState<string>(contact.phone ?? "");
  const [street, setStreet] = useState<string>(contact.street ?? "");
  const [zipCode, setZipCode] = useState<string>(contact.zip_code ?? "");
  const [city, setCity] = useState<string>(contact.city ?? "");
  const [country, setCountry] = useState<string>(contact.country ?? "");
  const [website, setWebsite] = useState<string>(contact.website ?? "");
  const [notes, setNotes] = useState<string>(contact.notes ?? "");
  const [metaText, setMetaText] = useState<string>(() => {
    try { return contact.metadata ? JSON.stringify(contact.metadata, null, 2) : toPrettyJSON(defaultCustomerMetadataDE); } catch { return toPrettyJSON(defaultCustomerMetadataDE); }
  });
  const [metaObj, setMetaObj] = useState<CustomerMetadata>((contact.metadata as unknown as CustomerMetadata) ?? defaultCustomerMetadataDE);
  const [advanced, setAdvanced] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Validation function
  function validateForm(): string | null {
    if (!displayName.trim()) {
      return "Anzeigename ist erforderlich";
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
      // Only build metadata for customer types
      if (contactType === 'customer') {
        metadata = buildCustomerMetadata(metaObj) as unknown as Json;
      }
    }
    const { error } = await supabase
      .from("contacts")
      .update({
        contact_type: contactType,
        display_name: displayName.trim(),
        first_name: firstName.trim() || null,
        last_name: lastName.trim() || null,
        organization: organization.trim() || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
        street: street.trim() || null,
        zip_code: zipCode.trim() || null,
        city: city.trim() || null,
        country: country.trim() || null,
        website: website.trim() || null,
        notes: notes.trim() || null,
        metadata,
      })
      .eq("id", contact.id);
    if (error) setError(error.message); else {
      setMessage("Gespeichert.");
      try { router.refresh(); } catch { /* noop */ }
    }
    setSaving(false);
  }

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-6">
      <Card className="md:col-span-12">
        <CardHeader>
          <CardTitle>Basisdaten</CardTitle>
          <CardDescription>Kontakttyp, Name und Kontaktinformationen</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="contact_type">Kontakttyp *</Label>
            <select id="contact_type" value={contactType} onChange={(e) => setContactType(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2">
              <option value="">-- Bitte wählen --</option>
              {CONTACT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="display_name">Anzeigename *</Label>
            <Input id="display_name" name="display_name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Name, der angezeigt wird" />
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="first_name">Vorname</Label>
              <Input id="first_name" name="first_name" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Vorname" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="last_name">Nachname</Label>
              <Input id="last_name" name="last_name" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Nachname" />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="organization">Organisation / Firma</Label>
            <Input id="organization" name="organization" value={organization} onChange={(e) => setOrganization(e.target.value)} placeholder="Firmenname" />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email">E-Mail</Label>
            <Input id="email" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="mail@example.com" />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="phone">Telefon</Label>
            <Input id="phone" name="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+49 123 456789" />
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="street">Straße</Label>
              <Input id="street" name="street" value={street} onChange={(e) => setStreet(e.target.value)} placeholder="Straße Hausnr" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="zip_code">PLZ</Label>
              <Input id="zip_code" name="zip_code" value={zipCode} onChange={(e) => setZipCode(e.target.value)} placeholder="12345" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="city">Stadt</Label>
              <Input id="city" name="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Stadt" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="country">Land</Label>
              <Input id="country" name="country" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Deutschland" />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="website">Website</Label>
            <Input id="website" name="website" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://example.com" />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Notizen</Label>
            <textarea id="notes" name="notes" className="min-h-[80px] w-full rounded-md border bg-background p-2 text-sm" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Interne Notizen..." />
          </div>
        </CardContent>
      </Card>

      {contactType === 'customer' && (
        <Card className="md:col-span-12">
          <CardHeader>
            <CardTitle>Kunden‑Metadaten</CardTitle>
            <CardDescription>Strukturierte Felder oder JSON (nur für Kunden)</CardDescription>
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
              <CustomerMetadataForm value={metaObj} onChange={setMetaObj} customerType="company" />
            )}
          </CardContent>
        </Card>
      )}

      <div className="md:col-span-12 flex items-center gap-3 justify-end">
        <Button type="submit" disabled={saving || !contactType}>{saving ? "Speichern…" : "Speichern"}</Button>
        {message && <span className="text-sm text-green-600">{message}</span>}
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
    </form>
  );
}
