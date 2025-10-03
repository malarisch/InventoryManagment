"use client";

import { useEffect, useRef, useState } from "react";
import type { CustomerMetadata } from "@/components/metadataTypes.types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CustomerMetadataForm({
  value,
  onChange,
  customerType = "private", // Default to private if not specified
}: {
  value: CustomerMetadata;
  onChange: (val: CustomerMetadata) => void;
  customerType?: "company" | "private";
}) {
  const [local, setLocal] = useState<CustomerMetadata>(value);
  
  // Track whether the last change originated from user interaction
  const isInternalUpdateRef = useRef(false);

  // Sync from parent: only update local if change came from outside
  useEffect(() => {
    if (!isInternalUpdateRef.current) {
      setLocal(value);
    }
    isInternalUpdateRef.current = false;
  }, [value]);

  // Notify parent when local changes from user interaction
  useEffect(() => {
    if (isInternalUpdateRef.current) {
      onChange(local);
    }
  }, [local, onChange]);

  function set<K extends keyof CustomerMetadata>(key: K, v: CustomerMetadata[K]) {
    isInternalUpdateRef.current = true;
    setLocal((s) => ({ ...s, [key]: v }));
  }

  return (
    <div className="grid gap-6 rounded-md border p-4">
      {/* Personal Information - only for private customers */}
      {customerType === "private" && (
        <>
          <h3 className="text-lg font-medium">Persönliche Informationen</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="cmf-anrede">Anrede</Label>
              <Input id="cmf-anrede" value={local.anrede ?? ""} onChange={(e) => set("anrede", e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="cmf-pro">Pronomen</Label>
              <Input id="cmf-pro" value={local.pronouns ?? ""} onChange={(e) => set("pronouns", e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="cmf-birthday">Geburtstag</Label>
              <Input id="cmf-birthday" type="date" value={local.birthday ?? ""} onChange={(e) => set("birthday", e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="cmf-position">Position</Label>
              <Input id="cmf-position" value={local.position ?? ""} onChange={(e) => set("position", e.target.value)} />
            </div>
          </div>
        </>
      )}

      {/* Contact Person Information - only for company customers */}
      {customerType === "company" && (
        <>
          <h3 className="text-lg font-medium">Ansprechpartner</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="cmf-anrede">Anrede</Label>
              <Input id="cmf-anrede" value={local.anrede ?? ""} onChange={(e) => set("anrede", e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="cmf-pro">Pronomen</Label>
              <Input id="cmf-pro" value={local.pronouns ?? ""} onChange={(e) => set("pronouns", e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="cmf-position">Position</Label>
              <Input id="cmf-position" value={local.position ?? ""} onChange={(e) => set("position", e.target.value)} />
            </div>
          </div>
        </>
      )}

      {/* Company Information - only show for company type */}
      {customerType === "company" && (
        <>
          <h3 className="text-lg font-medium">Unternehmensinformationen</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="cmf-company-name">Firma</Label>
              <Input id="cmf-company-name" value={local.name ?? ""} onChange={(e) => set("name", e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="cmf-tax-id">Steuer-ID</Label>
              <Input id="cmf-tax-id" value={local.taxId ?? ""} onChange={(e) => set("taxId", e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="cmf-vat-id">USt-ID</Label>
              <Input id="cmf-vat-id" value={local.vatId ?? ""} onChange={(e) => set("vatId", e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="cmf-industry">Branche</Label>
              <Input id="cmf-industry" value={local.industry ?? ""} onChange={(e) => set("industry", e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="cmf-business-type">Rechtsform</Label>
              <Input id="cmf-business-type" value={local.businessType ?? ""} onChange={(e) => set("businessType", e.target.value)} />
            </div>
          </div>
        </>
      )}

      {/* Common sections for both customer types */}
      <h3 className="text-lg font-medium">Kontakteinstellungen</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="cmf-pref">Bevorzugter Kontakt</Label>
          <select id="cmf-pref" className="h-9 rounded-md border bg-background px-3 text-sm"
              value={local.preferredContactMethod ?? "email"}
              onChange={(e) => set("preferredContactMethod", e.target.value as "email" | "phone" | "mail")}
          >
            <option value="email">E-Mail</option>
            <option value="phone">Telefon</option>
            <option value="mail">Post</option>
          </select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="cmf-since">Kunde seit</Label>
          <Input id="cmf-since" type="date" value={local.customerSince ?? ""} onChange={(e) => set("customerSince", e.target.value)} />
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="cmf-notes">Notizen</Label>
        <textarea id="cmf-notes" className="min-h-[80px] w-full rounded-md border bg-background p-2 text-sm"
            value={local.notes ?? ""} onChange={(e) => set("notes", e.target.value)} />
      </div>
    </div>
  );
}

export default CustomerMetadataForm;
