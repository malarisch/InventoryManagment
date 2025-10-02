"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/database.types";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { SearchPicker, type SearchItem } from "@/components/search/search-picker";

const CONTACT_TYPES = [
  { value: "general", label: "Allgemein" },
  { value: "person", label: "Person" },
  { value: "company", label: "Firma" },
  { value: "supplier", label: "Supplier" },
  { value: "customer", label: "Kunde" },
];

export interface ContactFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: number | null;
  onCreated: (contact: Tables<"contacts">) => void;
  defaultType?: string;
  contactOptions?: Array<{ id: number; display_name: string }>;
}

export function ContactFormDialog({ open, onOpenChange, companyId, onCreated, defaultType = "general", contactOptions = [] }: ContactFormDialogProps) {
  const supabase = useMemo(() => createClient(), []);
  const [displayName, setDisplayName] = useState("");
  const [contactType, setContactType] = useState(defaultType);
  const [contactPersonId, setContactPersonId] = useState<number | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [organization, setOrganization] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [notes, setNotes] = useState("");
  const [website, setWebsite] = useState("");
  const [hasSignal, setHasSignal] = useState(false);
  const [hasWhatsapp, setHasWhatsapp] = useState(false);
  const [hasTelegram, setHasTelegram] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetForm() {
    setDisplayName("");
    setContactType(defaultType);
    setContactPersonId(null);
    setFirstName("");
    setLastName("");
    setOrganization("");
    setEmail("");
    setPhone("");
    setStreet("");
    setZipCode("");
    setCity("");
    setCountry("");
    setNotes("");
    setWebsite("");
    setHasSignal(false);
    setHasWhatsapp(false);
    setHasTelegram(false);
    setError(null);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!companyId) {
      setError("Keine Firma ausgewählt");
      return;
    }
    if (!displayName.trim()) {
      setError("Anzeigename ist erforderlich");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        setError("Keine gültige Session");
        setSaving(false);
        return;
      }

      const { data, error } = await supabase
        .from("contacts")
        .insert({
          company_id: companyId,
          created_by: auth.user.id,
          contact_type: contactType,
          display_name: displayName.trim(),
          contact_person_id: contactType === 'company' ? contactPersonId : null,
          first_name: firstName.trim() || null,
          last_name: lastName.trim() || null,
          forename: firstName.trim() || null,
          surname: lastName.trim() || null,
          organization: organization.trim() || null,
          company_name: organization.trim() || null,
          customer_type: null,
          email: email.trim() || null,
          phone: phone.trim() || null,
          has_signal: hasSignal,
          has_whatsapp: hasWhatsapp,
          has_telegram: hasTelegram,
          role: null,
          street: street.trim() || null,
          zip_code: zipCode.trim() || null,
          city: city.trim() || null,
          country: country.trim() || null,
          notes: notes.trim() || null,
          website: website.trim() || null,
          files: null,
        })
        .select("*")
        .single<Tables<"contacts">>();

      if (error) {
        throw error;
      }

      if (data) {
        onCreated(data);
        resetForm();
        onOpenChange(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => {
      onOpenChange(next);
      if (!next) resetForm();
    }}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Kontakt anlegen</DialogTitle>
          <DialogDescription>Leg einen neuen Kontakt für diese Firma an.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="contact-display-name">Anzeigename *</Label>
            <Input
              id="contact-display-name"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              required
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="contact-type">Typ</Label>
            <select
              id="contact-type"
              className="h-9 rounded-md border bg-background px-3 text-sm"
              value={contactType}
              onChange={(event) => setContactType(event.target.value)}
            >
              {CONTACT_TYPES.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="contact-first-name">Vorname</Label>
              <Input id="contact-first-name" value={firstName} onChange={(event) => setFirstName(event.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="contact-last-name">Nachname</Label>
              <Input id="contact-last-name" value={lastName} onChange={(event) => setLastName(event.target.value)} />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="contact-organization">Firma / Organisation</Label>
            <Input id="contact-organization" value={organization} onChange={(event) => setOrganization(event.target.value)} />
          </div>
          {contactType === 'company' && contactOptions.length > 0 && (
            <div className="grid gap-1.5">
              <Label>Ansprechperson</Label>
              <SearchPicker
                items={contactOptions.map(c => ({
                  id: c.id.toString(),
                  category: "contact" as const,
                  title: c.display_name,
                  matchers: [{ value: c.display_name }],
                  data: c.id,
                }))}
                onSelect={(item) => setContactPersonId(item.data)}
                placeholder="Ansprechperson auswählen..."
                buttonLabel={
                  contactPersonId 
                    ? contactOptions.find(c => c.id === contactPersonId)?.display_name ?? "Ansprechperson auswählen"
                    : "Ansprechperson auswählen"
                }
                categoryLabels={{ contact: "Kontakte" }}
                resetOnSelect={false}
              />
            </div>
          )}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="contact-email">E-Mail</Label>
              <Input id="contact-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="contact-phone">Telefon</Label>
              <Input id="contact-phone" value={phone} onChange={(event) => setPhone(event.target.value)} />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={hasSignal} onCheckedChange={(checked) => setHasSignal(!!checked)} />
              Signal
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={hasWhatsapp} onCheckedChange={(checked) => setHasWhatsapp(!!checked)} />
              WhatsApp
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={hasTelegram} onCheckedChange={(checked) => setHasTelegram(!!checked)} />
              Telegram
            </label>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="contact-street">Straße</Label>
              <Input id="contact-street" value={street} onChange={(event) => setStreet(event.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="contact-zipcode">PLZ</Label>
              <Input id="contact-zipcode" value={zipCode} onChange={(event) => setZipCode(event.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="contact-city">Stadt</Label>
              <Input id="contact-city" value={city} onChange={(event) => setCity(event.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="contact-country">Land</Label>
              <Input id="contact-country" value={country} onChange={(event) => setCountry(event.target.value)} />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="contact-website">Website</Label>
            <Input id="contact-website" value={website} onChange={(event) => setWebsite(event.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="contact-notes">Notizen</Label>
            <Textarea id="contact-notes" rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={saving || !companyId}>
              {saving ? "Speichern…" : "Speichern"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
