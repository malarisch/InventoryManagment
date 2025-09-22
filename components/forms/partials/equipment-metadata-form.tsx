"use client";

import { useEffect, useState } from "react";
import type { EquipmentMetadata } from "@/components/metadataTypes.types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function EquipmentMetadataForm({
  value,
  onChange,
}: {
  value: EquipmentMetadata;
  onChange: (val: EquipmentMetadata) => void;
}) {
  const [local, setLocal] = useState<EquipmentMetadata>(value);

  useEffect(() => setLocal(value), [value]);
  useEffect(() => onChange(local), [local, onChange]);

  return (
    <div className="grid gap-3 rounded-md border p-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="grid gap-1">
          <Label htmlFor="emf-type">Typ</Label>
          <Input id="emf-type" value={local.type}
            onChange={(e) => setLocal((s) => ({ ...s, type: e.target.value }))} />
        </div>
        <div className="grid gap-1">
          <Label htmlFor="emf-serial">Seriennummer</Label>
          <Input id="emf-serial" value={local.serialNumber ?? ""}
            onChange={(e) => setLocal((s) => ({ ...s, serialNumber: e.target.value }))} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div className="grid gap-1">
          <Label htmlFor="emf-israck">19-inch Rack</Label>
          <select id="emf-israck" className="h-9 rounded-md border bg-background px-3 text-sm"
            value={local.is19Inch ? "yes" : "no"}
            onChange={(e) => setLocal((s) => ({ ...s, is19Inch: e.target.value === "yes" }))}
          >
            <option value="no">Nein</option>
            <option value="yes">Ja</option>
          </select>
        </div>
        <div className="grid gap-1">
          <Label htmlFor="emf-u">Höheneinheiten (U)</Label>
          <Input id="emf-u" type="number" min={0} value={String(local.heightUnits ?? 0)}
            onChange={(e) => setLocal((s) => ({ ...s, heightUnits: Number(e.target.value) || 0 }))} />
        </div>
        <div className="grid gap-1">
          <Label htmlFor="emf-leave">Darf Standort verlassen</Label>
          <select id="emf-leave" className="h-9 rounded-md border bg-background px-3 text-sm"
            value={local.canLeaveLocation ? "yes" : "no"}
            onChange={(e) => setLocal((s) => ({ ...s, canLeaveLocation: e.target.value === "yes" }))}
          >
            <option value="yes">Ja</option>
            <option value="no">Nein</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div className="grid gap-1">
          <Label htmlFor="emf-power-type">Stromtyp</Label>
          <select id="emf-power-type" className="h-9 rounded-md border bg-background px-3 text-sm"
            value={local.power.powerType}
            onChange={(e) => setLocal((s) => ({ ...s, power: { ...s.power, powerType: e.target.value as "AC" | "DC" | "PoE" | "Battery" | "Other" } }))}
          >
            <option>AC</option>
            <option>DC</option>
            <option>PoE</option>
            <option>Battery</option>
            <option>Other</option>
          </select>
        </div>
        <div className="grid gap-1">
          <Label htmlFor="emf-v">Spannung</Label>
          <Input id="emf-v" value={local.power.voltageRangeV ?? ""}
            onChange={(e) => setLocal((s) => ({ ...s, power: { ...s.power, voltageRangeV: e.target.value } }))} />
        </div>
        <div className="grid gap-1">
          <Label htmlFor="emf-f">Frequenz</Label>
          <Input id="emf-f" value={local.power.frequencyHz ?? ""}
            onChange={(e) => setLocal((s) => ({ ...s, power: { ...s.power, frequencyHz: e.target.value } }))} />
        </div>
      </div>
    </div>
  );
}

export default EquipmentMetadataForm;
