"use client";

import { useEffect, useMemo, useState } from "react";
import type { EquipmentMetadata } from "@/components/metadataTypes.types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useCompany } from "@/app/management/_libs/companyHook";
import { normalizeAdminCompanyMetadata } from "@/lib/metadata/inherit";
import { SearchPicker, type SearchItem } from "@/components/search/search-picker";

export function EquipmentMetadataForm({
  value,
  onChange,
}: {
  value: EquipmentMetadata;
  onChange: (val: EquipmentMetadata) => void;
}) {
  const [local, setLocal] = useState<EquipmentMetadata>(value);
  const { company } = useCompany();

  const articleTypeItems: SearchItem<"type", string>[] = useMemo(() => {
    const customTypes = normalizeAdminCompanyMetadata(company?.metadata ?? null).customTypes;
    return customTypes.articleTypes.map(type => ({
      id: type,
      category: "type",
      title: type,
      matchers: [{ value: type }],
      data: type,
    }));
  }, [company]);

  useEffect(() => setLocal(value), [value]);
  useEffect(() => onChange(local), [local, onChange]);

  function set<K extends keyof EquipmentMetadata>(key: K, v: EquipmentMetadata[K]) {
    setLocal((s) => ({ ...s, [key]: v }));
  }

  return (
    <div className="grid gap-6 rounded-md border p-4">
      <h3 className="text-lg font-medium">Allgemein</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label>Typ</Label>
          <SearchPicker
            items={articleTypeItems}
            onSelect={(item) => set("type", item.data)}
            placeholder="Typ auswählen..."
            buttonLabel={local.type}
            categoryLabels={{ type: "Artikeltypen" }}
            resetOnSelect={false}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="emf-serial">Seriennummer</Label>
          <Input id="emf-serial" value={local.serialNumber ?? ""} onChange={(e) => set("serialNumber", e.target.value)} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="emf-manufacturer">Hersteller</Label>
          <Input id="emf-manufacturer" value={local.manufacturer ?? ""} onChange={(e) => set("manufacturer", e.target.value)} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="emf-model">Modell</Label>
          <Input id="emf-model" value={local.model ?? ""} onChange={(e) => set("model", e.target.value)} />
        </div>
      </div>

      <h3 className="text-lg font-medium">Physische Eigenschaften</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex items-center space-x-2">
          <Checkbox id="emf-is-rack" checked={local.is19Inch} onCheckedChange={(checked) => set("is19Inch", !!checked)} />
          <Label htmlFor="emf-is-rack">19-Zoll Rackmontage</Label>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="emf-u">Höheneinheiten (U)</Label>
          <Input id="emf-u" type="number" min={0} value={local.heightUnits ?? ""} onChange={(e) => set("heightUnits", Number(e.target.value))} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="emf-weight">Gewicht (kg)</Label>
          <Input id="emf-weight" type="number" min={0} value={local.weightKg ?? ""} onChange={(e) => set("weightKg", Number(e.target.value))} />
        </div>
      </div>

      <h3 className="text-lg font-medium">Stromversorgung</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="grid gap-1.5">
          <Label htmlFor="emf-power-type">Stromtyp</Label>
          <select id="emf-power-type" className="h-9 rounded-md border bg-background px-3 text-sm"
            value={local.power.powerType}
            onChange={(e) => set("power", { ...local.power, powerType: e.target.value as "AC" | "DC" | "PoE" | "Battery" | "Other" })}
          >
            <option>AC</option>
            <option>DC</option>
            <option>PoE</option>
            <option>Battery</option>
            <option>Other</option>
          </select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="emf-v">Spannung</Label>
          <Input id="emf-v" value={local.power.voltageRangeV ?? ""} onChange={(e) => set("power", { ...local.power, voltageRangeV: e.target.value })} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="emf-f">Frequenz</Label>
          <Input id="emf-f" value={local.power.frequencyHz ?? ""} onChange={(e) => set("power", { ...local.power, frequencyHz: e.target.value })} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="emf-pc">Anschlusstyp</Label>
          <Input id="emf-pc" value={local.power.powerConnectorType ?? ""} onChange={(e) => set("power", { ...local.power, powerConnectorType: e.target.value })} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="emf-max-power">Max. Leistung (W)</Label>
          <Input id="emf-max-power" type="number" min={0} value={local.power.maxPowerW ?? ""} onChange={(e) => set("power", { ...local.power, maxPowerW: Number(e.target.value) })} />
        </div>
      </div>

      <h3 className="text-lg font-medium">Anschaffung & Wartung</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="emf-purchase-date">Kaufdatum</Label>
          <Input id="emf-purchase-date" type="date" value={local.purchaseDate ?? ""} onChange={(e) => set("purchaseDate", e.target.value)} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="emf-warranty">Garantie bis</Label>
          <Input id="emf-warranty" type="date" value={local.warrantyExpiry ?? ""} onChange={(e) => set("warrantyExpiry", e.target.value)} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="emf-maintenance">Wartungsintervall</Label>
          <Input id="emf-maintenance" value={local.maintenanceSchedule ?? ""} onChange={(e) => set("maintenanceSchedule", e.target.value)} />
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox id="emf-can-leave" checked={local.canLeaveLocation} onCheckedChange={(checked) => set("canLeaveLocation", !!checked)} />
          <Label htmlFor="emf-can-leave">Darf den Standort verlassen</Label>
        </div>
      </div>

      {/* TODO: Implement UI for dimensionsCm, connectivity, interfaces, suppliers, dailyRentalRate, assignedTo */}

      <div className="grid gap-1.5">
        <Label htmlFor="emf-notes">Notizen</Label>
        <textarea id="emf-notes" className="min-h-[80px] w-full rounded-md border bg-background p-2 text-sm"
            value={local.notes ?? ""} onChange={(e) => set("notes", e.target.value)} />
      </div>
    </div>
  );
}

export default EquipmentMetadataForm;
