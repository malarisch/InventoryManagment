"use client";

import { useEffect, useMemo, useState } from "react";
import type { ArticleMetadata } from "@/components/metadataTypes.types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCompany } from "@/app/management/_libs/companyHook";
import { normalizeAdminCompanyMetadata, powerPlaceholders } from "@/lib/metadata/inherit";

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

  useEffect(() => setLocal(value), [value]);
  useEffect(() => onChange(local), [local, onChange]);

  return (
    <div className="grid gap-3 rounded-md border p-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="grid gap-1">
          <Label htmlFor="amf-type">Typ (erforderlich)</Label>
          <Input id="amf-type" value={local.type}
            onChange={(e) => setLocal((s) => ({ ...s, type: e.target.value }))} required />
        </div>
        <div className="grid gap-1">
          <Label htmlFor="amf-israck">19-inch Rack</Label>
          <select id="amf-israck" className="h-9 rounded-md border bg-background px-3 text-sm"
            value={local.is19Inch ? "yes" : "no"}
            onChange={(e) => setLocal((s) => ({ ...s, is19Inch: e.target.value === "yes" }))}
          >
            <option value="no">Nein</option>
            <option value="yes">Ja</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div className="grid gap-1">
          <Label htmlFor="amf-u">Höheneinheiten (U)</Label>
          <Input id="amf-u" type="number" min={0} value={String(local.heightUnits ?? 0)}
            onChange={(e) => setLocal((s) => ({ ...s, heightUnits: Number(e.target.value) || 0 }))} />
        </div>
        <div className="grid gap-1">
          <Label htmlFor="amf-v">Spannung (V) {local.power?.voltageRangeV ? "" : `(Standard: ${defaults.voltageRangeV || ""})`}</Label>
          <Input id="amf-v" placeholder={local.power?.voltageRangeV ? undefined : defaults.voltageRangeV}
            value={local.power?.voltageRangeV ?? ""}
            onChange={(e) => setLocal((s) => ({ ...s, power: { ...s.power, voltageRangeV: e.target.value } }))} />
        </div>
        <div className="grid gap-1">
          <Label htmlFor="amf-f">Frequenz (Hz) {local.power?.frequencyHz ? "" : `(Standard: ${defaults.frequencyHz || ""})`}</Label>
          <Input id="amf-f" placeholder={local.power?.frequencyHz ? undefined : defaults.frequencyHz}
            value={local.power?.frequencyHz ?? ""}
            onChange={(e) => setLocal((s) => ({ ...s, power: { ...s.power, frequencyHz: e.target.value } }))} />
        </div>
      </div>
    </div>
  );
}

export default ArticleMetadataForm;

