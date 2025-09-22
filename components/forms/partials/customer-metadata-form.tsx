"use client";

import { useEffect, useState } from "react";
import type { CustomerMetadata } from "@/components/metadataTypes.types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Preferred = "email" | "phone" | "mail";

export function CustomerMetadataForm({
  value,
  onChange,
}: {
  value: CustomerMetadata;
  onChange: (val: CustomerMetadata) => void;
}) {
  const [local, setLocal] = useState<CustomerMetadata>(value);

  useEffect(() => setLocal(value), [value]);
  useEffect(() => onChange(local), [local, onChange]);

  return (
    <div className="grid gap-3 rounded-md border p-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="grid gap-1">
          <Label htmlFor="cmf-first">Vorname</Label>
          <Input id="cmf-first" value={local.firstName}
            onChange={(e) => setLocal((s) => ({ ...s, firstName: e.target.value }))} />
        </div>
        <div className="grid gap-1">
          <Label htmlFor="cmf-last">Nachname</Label>
          <Input id="cmf-last" value={local.lastName}
            onChange={(e) => setLocal((s) => ({ ...s, lastName: e.target.value }))} />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="grid gap-1">
          <Label htmlFor="cmf-company">Firma</Label>
          <Input id="cmf-company" value={local.name ?? ""}
            onChange={(e) => setLocal((s) => ({ ...s, name: e.target.value }))} />
        </div>
        <div className="grid gap-1">
          <Label htmlFor="cmf-pref">Bevorzugter Kontakt</Label>
          <select id="cmf-pref" className="h-9 rounded-md border bg-background px-3 text-sm"
            value={local.preferredContactMethod ?? "email"}
            onChange={(e) => setLocal((s) => ({ ...s, preferredContactMethod: e.target.value as Preferred }))}
          >
            <option value="email">E-Mail</option>
            <option value="phone">Telefon</option>
            <option value="mail">Post</option>
          </select>
        </div>
      </div>
    </div>
  );
}

export default CustomerMetadataForm;
