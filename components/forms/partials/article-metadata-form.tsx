"use client";

import { useEffect, useMemo, useState } from "react";
import type { ArticleMetadata } from "@/components/metadataTypes.types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useCompany } from "@/app/management/_libs/companyHook";
import { normalizeAdminCompanyMetadata, powerPlaceholders } from "@/lib/metadata/inherit";
import { SearchPicker, type SearchItem } from "@/components/search/search-picker";

export function ArticleMetadataForm({
  value,
  onChange,
}: {
  value: ArticleMetadata;
  onChange: (val: ArticleMetadata) => void;
}) {
  const [local, setLocal] = useState<ArticleMetadata>(value);
  const { company } = useCompany();
  const defaults = useMemo(() => powerPlaceholders(normalizeAdminCompanyMetadata(company?.metadata ?? null)), [company]);

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

  function set<K extends keyof ArticleMetadata>(key: K, v: ArticleMetadata[K]) {
    setLocal((s) => ({ ...s, [key]: v }));
  }

  return (
    <div className="grid gap-6 rounded-md border p-4">
      <h3 className="text-lg font-medium">Allgemein</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label>Typ (erforderlich)</Label>
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
          <Label htmlFor="amf-manufacturer">Hersteller</Label>
          <Input id="amf-manufacturer" value={local.manufacturer ?? ""} onChange={(e) => set("manufacturer", e.target.value)} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="amf-model">Modell</Label>
          <Input id="amf-model" value={local.model ?? ""} onChange={(e) => set("model", e.target.value)} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="amf-mpn">Hersteller-Teilenummer</Label>
          <Input id="amf-mpn" value={local.manufacturerPartNumber ?? ""} onChange={(e) => set("manufacturerPartNumber", e.target.value)} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="amf-ean">EAN</Label>
          <Input id="amf-ean" value={local.EAN ?? ""} onChange={(e) => set("EAN", e.target.value)} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="amf-upc">UPC</Label>
          <Input id="amf-upc" value={local.UPC ?? ""} onChange={(e) => set("UPC", e.target.value)} />
        </div>
      </div>

      <h3 className="text-lg font-medium">Physische Eigenschaften</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex items-center space-x-2">
          <Checkbox id="amf-is-rack" checked={local.is19Inch} onCheckedChange={(checked) => set("is19Inch", !!checked)} />
          <Label htmlFor="amf-is-rack">19-Zoll Rackmontage</Label>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="amf-u">Höheneinheiten (U)</Label>
          <Input id="amf-u" type="number" min={0} value={local.heightUnits ?? ""} onChange={(e) => set("heightUnits", Number(e.target.value))} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="amf-weight">Gewicht (kg)</Label>
          <Input id="amf-weight" type="number" min={0} value={local.weightKg ?? ""} onChange={(e) => set("weightKg", Number(e.target.value))} />
        </div>
      </div>

      <h3 className="text-lg font-medium">Stromversorgung</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="grid gap-1.5">
          <Label htmlFor="amf-power-type">Stromtyp</Label>
          <select id="amf-power-type" className="h-9 rounded-md border bg-background px-3 text-sm"
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
          <Label htmlFor="amf-v">Spannung (V) {local.power?.voltageRangeV ? "" : `(Standard: ${defaults.voltageRangeV || ""})`}</Label>
          <Input id="amf-v" placeholder={local.power?.voltageRangeV ? undefined : defaults.voltageRangeV} value={local.power?.voltageRangeV ?? ""} onChange={(e) => set("power", { ...local.power, voltageRangeV: e.target.value })} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="amf-f">Frequenz (Hz) {local.power?.frequencyHz ? "" : `(Standard: ${defaults.frequencyHz || ""})`}</Label>
          <Input id="amf-f" placeholder={local.power?.frequencyHz ? undefined : defaults.frequencyHz} value={local.power?.frequencyHz ?? ""} onChange={(e) => set("power", { ...local.power, frequencyHz: e.target.value })} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="amf-pc">Anschlusstyp</Label>
          <Input id="amf-pc" value={local.power.powerConnectorType ?? ""} onChange={(e) => set("power", { ...local.power, powerConnectorType: e.target.value })} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="amf-max-power">Max. Leistung (W)</Label>
          <Input id="amf-max-power" type="number" min={0} value={local.power.maxPowerW ?? ""} onChange={(e) => set("power", { ...local.power, maxPowerW: Number(e.target.value) })} />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox id="amf-no-stock" checked={local.canBeBookedWithoutStock} onCheckedChange={(checked) => set("canBeBookedWithoutStock", !!checked)} />
        <Label htmlFor="amf-no-stock">Kann ohne Lagerbestand gebucht werden</Label>
      </div>

      {/* TODO: Implement UI for case, fitsInRestrictedCaseTypes, dimensionsCm, connectivity, interfaces, suppliers, dailyRentalRate */}

      <div className="grid gap-1.5">
        <Label htmlFor="amf-notes">Notizen</Label>
        <textarea id="amf-notes" className="min-h-[80px] w-full rounded-md border bg-background p-2 text-sm"
            value={local.notes ?? ""} onChange={(e) => set("notes", e.target.value)} />
      </div>
    </div>
  );
}

export default ArticleMetadataForm;
