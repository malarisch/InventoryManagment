"use client";

import { useEffect, useState } from "react";
import type { adminCompanyMetadata } from "@/components/metadataTypes.types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CompanyMetadataForm({
  value,
  onChange,
}: {
  value: adminCompanyMetadata;
  onChange: (val: adminCompanyMetadata) => void;
}) {
  const [local, setLocal] = useState<adminCompanyMetadata>(value);
  useEffect(() => setLocal(value), [value]);
  useEffect(() => onChange(local), [local, onChange]);

  function setStandard<K extends keyof adminCompanyMetadata["standardData"]>(key: K, v: adminCompanyMetadata["standardData"][K]) {
    setLocal((s) => ({ ...s, standardData: { ...s.standardData, [key]: v } }));
  }

  return (
    <div className="grid gap-4 rounded-md border p-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div className="grid gap-1">
          <Label htmlFor="cmf-tax">MwSt. (%)</Label>
          <Input id="cmf-tax" type="number" min={0} max={100}
            value={String(local.standardData.taxRate)}
            onChange={(e) => setStandard("taxRate", Math.max(0, Math.min(100, Number(e.target.value) || 0)))} />
        </div>
        <div className="grid gap-1">
          <Label htmlFor="cmf-curr">Währung (ISO 4217)</Label>
          <Input id="cmf-curr" value={local.standardData.currency}
            onChange={(e) => setStandard("currency", e.target.value.toUpperCase())} />
        </div>
        <div className="grid gap-1">
          <Label htmlFor="cmf-loc">Default Location-ID</Label>
          <Input id="cmf-loc" type="number" min={1}
            placeholder="optional"
            value={local.standardData.defaultLocationId ?? ""}
            onChange={(e) => setStandard("defaultLocationId", e.target.value === "" ? undefined : Number(e.target.value))} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div className="grid gap-1">
          <Label htmlFor="cmf-p-type">Stromtyp</Label>
          <select id="cmf-p-type" className="h-9 rounded-md border bg-background px-3 text-sm"
            value={local.standardData.power.powerType}
            onChange={(e) => setStandard("power", { ...local.standardData.power, powerType: e.target.value as "AC" | "DC" | "PoE" | "Battery" | "Other" })}
          >
            <option>AC</option>
            <option>DC</option>
            <option>PoE</option>
            <option>Battery</option>
            <option>Other</option>
          </select>
        </div>
        <div className="grid gap-1">
          <Label htmlFor="cmf-p-v">Spannung</Label>
          <Input id="cmf-p-v" value={local.standardData.power.voltageRangeV ?? ""}
            onChange={(e) => setStandard("power", { ...local.standardData.power, voltageRangeV: e.target.value })} />
        </div>
        <div className="grid gap-1">
          <Label htmlFor="cmf-p-f">Frequenz</Label>
          <Input id="cmf-p-f" value={local.standardData.power.frequencyHz ?? ""}
            onChange={(e) => setStandard("power", { ...local.standardData.power, frequencyHz: e.target.value })} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div className="grid gap-1">
          <Label htmlFor="cmf-first">Admin Vorname</Label>
          <Input id="cmf-first" value={local.standardData.person.firstName}
            onChange={(e) => setStandard("person", { ...local.standardData.person, firstName: e.target.value })} />
        </div>
        <div className="grid gap-1">
          <Label htmlFor="cmf-last">Admin Nachname</Label>
          <Input id="cmf-last" value={local.standardData.person.lastName}
            onChange={(e) => setStandard("person", { ...local.standardData.person, lastName: e.target.value })} />
        </div>
        <div className="grid gap-1">
          <Label htmlFor="cmf-pro">Pronomen</Label>
          <Input id="cmf-pro" value={local.standardData.person.pronouns ?? ""}
            onChange={(e) => setStandard("person", { ...local.standardData.person, pronouns: e.target.value })} />
        </div>
      </div>
    </div>
  );
}

export default CompanyMetadataForm;

