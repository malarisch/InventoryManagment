"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ArticleMetadata, EquipmentMetadata, Person } from "@/components/metadataTypes.types";
import type { adminCompanyMetadata } from "@/components/metadataTypes.types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useCompany } from "@/app/management/_libs/companyHook";
import { normalizeAdminCompanyMetadata, powerPlaceholders } from "@/lib/metadata/inherit";
import { type SearchItem, SearchPicker } from "@/components/search/search-picker";
import { StringListInput } from "@/components/forms/metadata/string-list-input";
import { DimensionsFieldset } from "@/components/forms/metadata/dimensions-fieldset";
import { SupplierListEditor, type ContactOption } from "@/components/forms/metadata/supplier-list-editor";

export interface EquipmentMetadataFormProps {
  value: EquipmentMetadata;
  onChange: (val: EquipmentMetadata) => void;
  articleMetadata?: ArticleMetadata | null;
  companyMetadata?: adminCompanyMetadata | null;
  supplierOptions?: ContactOption[];
  onCreateSupplier?: () => void;
}

type SectionId =
  | "general"
  | "physical"
  | "power"
  | "case"
  | "lifecycle"
  | "connectivity"
  | "suppliers"
  | "assignment"
  | "notes";

interface SectionDefinition {
  id: SectionId;
  title: string;
  description: string;
  defaultActive?: boolean;
}

const SECTION_DEFINITIONS: SectionDefinition[] = [
  { id: "general", title: "Allgemein", description: "Typ, Seriennummer und Hersteller", defaultActive: true },
  { id: "physical", title: "Physische Eigenschaften", description: "Rack, Gewicht und Maße", defaultActive: true },
  { id: "power", title: "Stromversorgung", description: "Spannung, Frequenz und Anschluss", defaultActive: true },
  { id: "case", title: "Case Setup", description: "Rack-Koffer und innere Abmessungen" },
  { id: "lifecycle", title: "Lebenszyklus", description: "Kauf, Garantie und Wartung", defaultActive: true },
  { id: "connectivity", title: "Konnektivität & Schnittstellen", description: "Netzwerk und Ports" },
  { id: "suppliers", title: "Lieferanten & Preise", description: "Lieferanten und Konditionen" },
  { id: "assignment", title: "Zuweisung", description: "Verantwortliche Person" },
  { id: "notes", title: "Notizen", description: "Freitext" },
];

export function EquipmentMetadataForm({
  value,
  onChange,
  articleMetadata,
  companyMetadata,
  supplierOptions,
  onCreateSupplier,
}: EquipmentMetadataFormProps) {
  const [local, setLocal] = useState<EquipmentMetadata>(value);
  const { company } = useCompany();
  const onChangeRef = useRef(onChange);

  // Keep onChange ref updated
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const adminMeta = useMemo(() => normalizeAdminCompanyMetadata(companyMetadata ?? company?.metadata ?? null), [companyMetadata, company]);
  const powerDefaults = useMemo(() => powerPlaceholders(adminMeta), [adminMeta]);
  const currencyFallback = adminMeta.standardData.currency ?? "EUR";
  const inheritedArticle = articleMetadata ?? null;

  const articleTypeItems: SearchItem<"type", string>[] = useMemo(() => {
    const customTypes = normalizeAdminCompanyMetadata(company?.metadata ?? null).customTypes;
    return customTypes.articleTypes.map((type) => ({
      id: type,
      category: "type",
      title: type,
      matchers: [{ value: type }],
      data: type,
    }));
  }, [company]);

  const [activeSections, setActiveSections] = useState<SectionId[]>(() => SECTION_DEFINITIONS.filter((section) => section.defaultActive).map((section) => section.id));

  // Sync from parent value to local state when value prop changes
  useEffect(() => {
    setLocal(value);
  }, [value]);

  function update(updater: (prev: EquipmentMetadata) => EquipmentMetadata) {
    setLocal((prev) => {
      const updated = updater(prev);
      // Call onChange immediately with the new value
      onChangeRef.current(updated);
      return updated;
    });
  }

  function ensureSectionActive(section: SectionId, hasData: boolean) {
    if (!hasData) return;
    setActiveSections((current) => (current.includes(section) ? current : [...current, section]));
  }

  useEffect(() => {
    ensureSectionActive("connectivity", hasConnectivityData(local));
    ensureSectionActive("suppliers", (local.suppliers?.length ?? 0) > 0);
    ensureSectionActive("assignment", !!local.assignedTo);
    ensureSectionActive("notes", !!local.notes);
  }, [local]);

  function setTextField<K extends keyof EquipmentMetadata>(key: K, raw: string) {
    const trimmed = raw.trim();
    update((prev) => ({
      ...prev,
      [key]: trimmed.length === 0 ? undefined : trimmed,
    }));
  }

  function setNumberField<K extends keyof EquipmentMetadata>(key: K, raw: string) {
    const trimmed = raw.trim();
    const parsed = trimmed.length === 0 ? undefined : Number(trimmed);
    update((prev) => ({
      ...prev,
      [key]: parsed,
    }));
  }

  function updatePower(partial: Partial<NonNullable<EquipmentMetadata["power"]>>) {
    update((prev) => {
      const nextPower = { ...(prev.power ?? {}) } as NonNullable<EquipmentMetadata["power"]>;
      for (const [key, value] of Object.entries(partial)) {
        if (value === undefined) {
          delete nextPower[key as keyof typeof nextPower];
        } else {
          nextPower[key as keyof typeof nextPower] = value as never;
        }
      }
      const cleaned = Object.values(nextPower).every((value) => value === undefined)
        ? undefined
        : nextPower;
      return {
        ...prev,
        power: cleaned,
      };
    });
  }

  function setInheritedTextField(
    key: keyof EquipmentMetadata,
    raw: string,
  ) {
    const trimmed = raw.trim();
    update((prev) => ({
      ...prev,
      [key]: trimmed.length === 0 ? undefined : trimmed,
    }));
  }

  function renderGeneralCard() {
    if (!activeSections.includes("general")) return null;
    const articleType = inheritedArticle?.type;
    return (
      <Card>
        <CardHeader>
          <CardTitle>Allgemein</CardTitle>
          <CardDescription>Typ, Seriennummer und Hersteller</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-1.5">
            <div className="flex items-center justify-between">
              <Label>Typ</Label>
              {articleType && (
                <IgnoreToggle
                  id="emf-type-ignore"
                  label="Ignorieren"
                  checked={local.type === null}
                  onChange={(checked) => update((prev) => ({ ...prev, type: checked ? null : undefined }))}
                />
              )}
            </div>
            <SearchPicker
              items={articleTypeItems}
              onSelect={(item) => setInheritedTextField("type", item.data)}
              placeholder="Typ auswählen..."
              buttonLabel={local.type && local.type !== null ? local.type : articleType ?? "Typ auswählen"}
              categoryLabels={{ type: "Artikeltypen" }}
              resetOnSelect={false}
              disabled={local.type === null}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="emf-serial">Seriennummer</Label>
            <Input
              id="emf-serial"
              value={local.serialNumber ?? ""}
              onChange={(event) => setTextField("serialNumber", event.target.value)}
            />
          </div>
          <InheritedTextField
            id="emf-manufacturer"
            label="Hersteller"
            value={local.manufacturer ?? ""}
            placeholder={inheritedArticle?.manufacturer ?? undefined}
            ignored={local.manufacturer === null}
            onIgnoreChange={(checked) => update((prev) => ({ ...prev, manufacturer: checked ? null : undefined }))}
            onChange={(value) => setInheritedTextField("manufacturer", value ?? "")}
          />
          <InheritedTextField
            id="emf-model"
            label="Modell"
            value={local.model ?? ""}
            placeholder={inheritedArticle?.model ?? undefined}
            ignored={local.model === null}
            onIgnoreChange={(checked) => update((prev) => ({ ...prev, model: checked ? null : undefined }))}
            onChange={(value) => setInheritedTextField("model", value ?? "")}
          />
        </CardContent>
      </Card>
    );
  }

  function renderPhysicalCard() {
    if (!activeSections.includes("physical")) return null;
    return (
      <Card>
        <CardHeader>
          <CardTitle>Physische Eigenschaften</CardTitle>
          <CardDescription>Gewicht und Maße</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <InheritedNumberField
              id="emf-weight"
              label="Gewicht (kg)"
              step="0.1"
              value={local.weightKg}
              placeholder={inheritedArticle?.weightKg ?? undefined}
              ignored={local.weightKg === null}
              onIgnoreChange={(checked) => update((prev) => ({ ...prev, weightKg: checked ? null : undefined }))}
              onChange={(value) => update((prev) => ({ ...prev, weightKg: value }))}
            />
          </div>
          <DimensionsFieldset
            value={local.dimensionsCm}
            onChange={(next) => update((prev) => ({ ...prev, dimensionsCm: next }))}
          />
        </CardContent>
      </Card>
    );
  }

  function renderPowerCard() {
    if (!activeSections.includes("power")) return null;
    const power = local.power ?? {};
    const inherited = inheritedArticle?.power ?? adminMeta.standardData.power;
    const placeholderPower = {
      powerType: inherited.powerType ?? adminMeta.standardData.power.powerType,
      voltageRangeV: inherited.voltageRangeV ?? powerDefaults.voltageRangeV,
      frequencyHz: inherited.frequencyHz ?? powerDefaults.frequencyHz,
      powerConnectorType: inherited.powerConnectorType ?? adminMeta.standardData.power.powerConnectorType,
      maxPowerW: inherited.maxPowerW ?? undefined,
    };
    return (
      <Card>
        <CardHeader>
          <CardTitle>Stromversorgung</CardTitle>
          <CardDescription>Geerbte Werte werden als Platzhalter angezeigt</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="grid gap-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="emf-power-type">Stromtyp</Label>
              {(placeholderPower.powerType || power.powerType === null) && (
                <IgnoreToggle
                  id="emf-power-type-ignore"
                  label="Ignorieren"
                  checked={power.powerType === null}
                  onChange={(checked) => updatePower({ powerType: checked ? null : undefined })}
                />
              )}
            </div>
            <select
              id="emf-power-type"
              className="h-9 rounded-md border bg-background px-3 text-sm"
              value={power.powerType ?? placeholderPower.powerType ?? "AC"}
              onChange={(event) => updatePower({ powerType: event.target.value as "AC" | "DC" | "PoE" | "Battery" | "Other" })}
              disabled={power.powerType === null}
            >
              <option>AC</option>
              <option>DC</option>
              <option>PoE</option>
              <option>Battery</option>
              <option>Other</option>
            </select>
          </div>
          <PowerInput
            id="emf-v"
            label="Spannung (V)"
            value={power.voltageRangeV ?? ""}
            placeholder={placeholderPower.voltageRangeV}
            ignored={power.voltageRangeV === null}
            onIgnoreChange={(checked) => updatePower({ voltageRangeV: checked ? null : undefined })}
            onChange={(raw) => updatePower({ voltageRangeV: raw })}
          />
          <PowerInput
            id="emf-f"
            label="Frequenz (Hz)"
            value={power.frequencyHz ?? ""}
            placeholder={placeholderPower.frequencyHz}
            ignored={power.frequencyHz === null}
            onIgnoreChange={(checked) => updatePower({ frequencyHz: checked ? null : undefined })}
            onChange={(raw) => updatePower({ frequencyHz: raw })}
          />
          <PowerInput
            id="emf-pc"
            label="Anschlusstyp"
            value={power.powerConnectorType ?? ""}
            placeholder={placeholderPower.powerConnectorType ?? undefined}
            ignored={power.powerConnectorType === null}
            onIgnoreChange={(checked) => updatePower({ powerConnectorType: checked ? null : undefined })}
            onChange={(raw) => updatePower({ powerConnectorType: raw })}
          />
          <PowerNumberInput
            id="emf-max-power"
            label="Max. Leistung (W)"
            value={power.maxPowerW}
            ignored={power.maxPowerW === null}
            onIgnoreChange={(checked) => updatePower({ maxPowerW: checked ? null : undefined })}
            onChange={(amount) => updatePower({ maxPowerW: amount })}
          />
        </CardContent>
      </Card>
    );
  }

  function renderCaseCard() {
    if (!activeSections.includes("case")) return null;
    const caseData = local.case ?? {};
    const inherited = inheritedArticle?.case ?? {};
    
    // Determine which mode based on inherited or current values
    const caseIsRack = caseData.is19Inch ?? inherited.is19Inch ?? false;
    const equipmentIsRackmountable = local.is19Inch ?? inheritedArticle?.is19Inch ?? false;
    const mode = caseIsRack ? "case-is-rack" : equipmentIsRackmountable ? "equipment-is-rackmountable" : "none";
    
    return (
      <Card>
        <CardHeader>
          <CardTitle>Case & Rack Setup</CardTitle>
          <CardDescription>Konfiguration für Cases und Rackmontage-Eigenschaften. Geerbte Werte werden als Platzhalter angezeigt</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {/* Mode Selection - Radio Buttons */}
          <div className="grid gap-3">
            <Label>Rack-Konfiguration</Label>
            <div className="flex flex-col gap-2">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="case-mode-none"
                  name="case-mode"
                  checked={mode === "none"}
                  onChange={() => {
                    update((prev) => ({
                      ...prev,
                      is19Inch: null,
                      heightUnits: undefined,
                      case: { ...prev.case, is19Inch: undefined, heightUnits: undefined, maxDeviceDepthCm: undefined },
                    }));
                  }}
                />
                <Label htmlFor="case-mode-none" className="font-normal cursor-pointer">
                  Keine Rack-Eigenschaften
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="case-mode-case-rack"
                  name="case-mode"
                  checked={mode === "case-is-rack"}
                  onChange={() => {
                    update((prev) => ({
                      ...prev,
                      is19Inch: null,
                      heightUnits: undefined,
                      case: { ...prev.case, is19Inch: true },
                    }));
                  }}
                />
                <Label htmlFor="case-mode-case-rack" className="font-normal cursor-pointer">
                  Case ist 19&quot; Rack
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="case-mode-equipment-rack"
                  name="case-mode"
                  checked={mode === "equipment-is-rackmountable"}
                  onChange={() => {
                    update((prev) => ({
                      ...prev,
                      is19Inch: true,
                      case: { ...prev.case, is19Inch: undefined, heightUnits: undefined, maxDeviceDepthCm: undefined },
                    }));
                  }}
                />
                <Label htmlFor="case-mode-equipment-rack" className="font-normal cursor-pointer">
                  Equipment ist 19&quot; rackmontierbar
                </Label>
              </div>
            </div>
          </div>

          {/* Case is Rack Fields */}
          {mode === "case-is-rack" && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 border-l-4 border-blue-500 pl-4">
              <InheritedNumberField
                id="emf-case-hu"
                label="Höheneinheiten (U)"
                value={caseData.heightUnits}
                placeholder={inherited.heightUnits ?? undefined}
                ignored={caseData.heightUnits === null}
                onIgnoreChange={(checked) => {
                  update((prev) => ({ ...prev, case: { ...prev.case, heightUnits: checked ? null : undefined } }));
                }}
                onChange={(val) => {
                  update((prev) => ({ ...prev, case: { ...prev.case, heightUnits: val } }));
                }}
              />
              <InheritedNumberField
                id="emf-case-depth"
                label="Max. Gerätetiefe (cm)"
                step="0.1"
                value={caseData.maxDeviceDepthCm}
                placeholder={inherited.maxDeviceDepthCm ?? undefined}
                ignored={caseData.maxDeviceDepthCm === null}
                onIgnoreChange={(checked) => {
                  update((prev) => ({ ...prev, case: { ...prev.case, maxDeviceDepthCm: checked ? null : undefined } }));
                }}
                onChange={(val) => {
                  update((prev) => ({ ...prev, case: { ...prev.case, maxDeviceDepthCm: val } }));
                }}
              />
            </div>
          )}

          {/* Equipment is Rackmountable Fields */}
          {mode === "equipment-is-rackmountable" && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 border-l-4 border-green-500 pl-4">
              <InheritedNumberField
                id="emf-equipment-height"
                label="Höheneinheiten (U)"
                value={local.heightUnits}
                placeholder={inheritedArticle?.heightUnits ?? undefined}
                ignored={local.heightUnits === null}
                onIgnoreChange={(checked) => {
                  update((prev) => ({ ...prev, heightUnits: checked ? null : undefined }));
                }}
                onChange={(val) => {
                  update((prev) => ({ ...prev, heightUnits: val }));
                }}
              />
            </div>
          )}

          {/* Common Case Fields (shown when case mode is active) */}
          {mode === "case-is-rack" && (
            <>
              <div className="space-y-2">
                <Label>Innenmaße (cm)</Label>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="grid gap-1.5">
                    <Label htmlFor="emf-case-inner-w">Breite</Label>
                    <Input
                      id="emf-case-inner-w"
                      type="number"
                      step="0.1"
                      placeholder={String(inherited.innerDimensionsCm?.width ?? "")}
                      value={caseData.innerDimensionsCm?.width ?? ""}
                      onChange={(e) => {
                        const val = e.target.value === "" ? undefined : Number(e.target.value);
                        if (val === undefined) {
                          update((prev) => ({ ...prev, case: { ...prev.case, innerDimensionsCm: undefined } }));
                          return;
                        }
                        update((prev) => {
                          const existingDims = prev.case?.innerDimensionsCm ?? inherited.innerDimensionsCm ?? { width: 0, height: 0 };
                          return { ...prev, case: { ...prev.case, innerDimensionsCm: { ...existingDims, width: val } } };
                        });
                      }}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="emf-case-inner-h">Höhe</Label>
                    <Input
                      id="emf-case-inner-h"
                      type="number"
                      step="0.1"
                      placeholder={String(inherited.innerDimensionsCm?.height ?? "")}
                      value={caseData.innerDimensionsCm?.height ?? ""}
                      onChange={(e) => {
                        const val = e.target.value === "" ? undefined : Number(e.target.value);
                        if (val === undefined) {
                          update((prev) => ({ ...prev, case: { ...prev.case, innerDimensionsCm: undefined } }));
                          return;
                        }
                        update((prev) => {
                          const existingDims = prev.case?.innerDimensionsCm ?? inherited.innerDimensionsCm ?? { width: 0, height: 0 };
                          return { ...prev, case: { ...prev.case, innerDimensionsCm: { ...existingDims, height: val } } };
                        });
                      }}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="emf-case-inner-d">Tiefe</Label>
                    <Input
                      id="emf-case-inner-d"
                      type="number"
                      step="0.1"
                      placeholder={String(inherited.innerDimensionsCm?.depth ?? "")}
                      value={caseData.innerDimensionsCm?.depth ?? ""}
                      onChange={(e) => {
                        const val = e.target.value === "" ? undefined : Number(e.target.value);
                        if (val === undefined) {
                          update((prev) => ({ ...prev, case: { ...prev.case, innerDimensionsCm: undefined } }));
                          return;
                        }
                        update((prev) => {
                          const existingDims = prev.case?.innerDimensionsCm ?? inherited.innerDimensionsCm ?? { width: 0, height: 0 };
                          return { ...prev, case: { ...prev.case, innerDimensionsCm: { ...existingDims, depth: val } } };
                        });
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <InheritedNumberField
                  id="emf-case-max-weight"
                  label="Maximales Inhaltsgewicht (kg)"
                  step="0.1"
                  value={caseData.contentMaxWeightKg}
                  placeholder={inherited.contentMaxWeightKg ?? undefined}
                  ignored={caseData.contentMaxWeightKg === null}
                  onIgnoreChange={(checked) => {
                    update((prev) => ({ ...prev, case: { ...prev.case, contentMaxWeightKg: checked ? null : undefined } }));
                  }}
                  onChange={(val) => {
                    update((prev) => ({ ...prev, case: { ...prev.case, contentMaxWeightKg: val } }));
                  }}
                />
                <InheritedCheckbox
                  id="emf-case-lock"
                  label="Case hat Schloss"
                  checked={!!caseData.hasLock}
                  placeholder={!!inherited.hasLock}
                  ignored={caseData.hasLock === null}
                  onIgnoreChange={(checked) => {
                    update((prev) => ({ ...prev, case: { ...prev.case, hasLock: checked ? null : undefined } }));
                  }}
                  onChange={(checked) => {
                    update((prev) => ({ ...prev, case: { ...prev.case, hasLock: checked } }));
                  }}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  function renderLifecycleCard() {
    if (!activeSections.includes("lifecycle")) return null;
    return (
      <Card>
        <CardHeader>
          <CardTitle>Lebenszyklus</CardTitle>
          <CardDescription>Kaufdatum, Garantie und Wartung</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <DateField
            id="emf-purchase-date"
            label="Kaufdatum"
            value={local.purchaseDate ?? ""}
            onChange={(value) => setTextField("purchaseDate", value)}
          />
          <DateField
            id="emf-warranty"
            label="Garantie bis"
            value={local.warrantyExpiry ?? ""}
            onChange={(value) => setTextField("warrantyExpiry", value)}
          />
          <div className="grid gap-1.5">
            <Label htmlFor="emf-maintenance">Wartungsintervall</Label>
            <Input
              id="emf-maintenance"
              value={local.maintenanceSchedule ?? ""}
              placeholder="z. B. alle 6 Monate"
              onChange={(event) => setTextField("maintenanceSchedule", event.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="emf-can-leave"
              checked={local.canLeaveLocation ?? true}
              onCheckedChange={(checked) => update((prev) => ({ ...prev, canLeaveLocation: !!checked }))}
            />
            <Label htmlFor="emf-can-leave">Darf den Standort verlassen</Label>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="emf-depreciation-method">Abschreibungsmethode</Label>
            <select
              id="emf-depreciation-method"
              className="h-9 rounded-md border bg-background px-3 text-sm"
              value={local.depreciationMethod ?? ""}
              onChange={(event) => setTextField("depreciationMethod", event.target.value)}
            >
              <option value="">– Keine –</option>
              <option value="straight-line">Lineare Abschreibung</option>
              <option value="declining-balance">Degressive Abschreibung</option>
              <option value="sum-of-the-years-digits">Digit-Summe</option>
            </select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="emf-depreciation-period">Abschreibungsdauer (Monate)</Label>
            <Input
              id="emf-depreciation-period"
              type="number"
              min={0}
              value={local.depreciationPeriodMonths ?? ""}
              onChange={(event) => setNumberField("depreciationPeriodMonths", event.target.value)}
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  function renderConnectivityCard() {
    if (!activeSections.includes("connectivity")) return null;
    return (
      <Card>
        <CardHeader>
          <CardTitle>Konnektivität & Schnittstellen</CardTitle>
          <CardDescription>Netzwerk-Features und Ports</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-1.5">
            <Label>Konnektivität</Label>
            <StringListInput
              values={local.connectivity ?? []}
              onChange={(next) => update((prev) => ({ ...prev, connectivity: next }))}
              placeholder="z. B. WiFi, Bluetooth"
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Schnittstellen</Label>
            <StringListInput
              values={local.interfaces ?? []}
              onChange={(next) => update((prev) => ({ ...prev, interfaces: next }))}
              placeholder="z. B. USB-C, HDMI"
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  function renderSuppliersCard() {
    if (!activeSections.includes("suppliers")) return null;
    return (
      <Card>
        <CardHeader>
          <CardTitle>Lieferanten & Preise</CardTitle>
          <CardDescription>Lieferantenverwaltung, Preise und Konditionen</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <SupplierListEditor
            suppliers={local.suppliers ?? []}
            onChange={(next) => update((prev) => ({ ...prev, suppliers: next }))}
            contactOptions={supplierOptions}
            onCreateContact={onCreateSupplier}
            currencyFallback={currencyFallback}
          />
        </CardContent>
      </Card>
    );
  }

  function renderAssignmentCard() {
    if (!activeSections.includes("assignment")) return null;
    const person = local.assignedTo ?? ({} as Person);
    return (
      <Card>
        <CardHeader>
          <CardTitle>Zuweisung</CardTitle>
          <CardDescription>Verantwortung für dieses Equipment</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="assigned-first-name">Vorname</Label>
            <Input
              id="assigned-first-name"
              value={person.firstName ?? ""}
              onChange={(event) => update((prev) => ({
                ...prev,
                assignedTo: { ...(prev.assignedTo ?? {}), firstName: event.target.value },
              }))}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="assigned-last-name">Nachname</Label>
            <Input
              id="assigned-last-name"
              value={person.lastName ?? ""}
              onChange={(event) => update((prev) => ({
                ...prev,
                assignedTo: { ...(prev.assignedTo ?? {}), lastName: event.target.value },
              }))}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="assigned-position">Rolle</Label>
            <Input
              id="assigned-position"
              value={person.position ?? ""}
              onChange={(event) => update((prev) => ({
                ...prev,
                assignedTo: { ...(prev.assignedTo ?? {}), position: event.target.value },
              }))}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="assigned-notes">Notizen</Label>
            <Textarea
              id="assigned-notes"
              value={person.notes ?? ""}
              onChange={(event) => update((prev) => ({
                ...prev,
                assignedTo: { ...(prev.assignedTo ?? {}), notes: event.target.value },
              }))}
              rows={3}
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            className="col-span-full justify-start"
            onClick={() => update((prev) => ({ ...prev, assignedTo: undefined }))}
          >
            Zuweisung entfernen
          </Button>
        </CardContent>
      </Card>
    );
  }

  function renderNotesCard() {
    if (!activeSections.includes("notes")) return null;
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notizen</CardTitle>
          <CardDescription>Freitext für Hinweise</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            id="emf-notes"
            className="min-h-[120px]"
            value={local.notes ?? ""}
            onChange={(event) => setTextField("notes", event.target.value)}
          />
        </CardContent>
      </Card>
    );
  }

  function renderSectionAddCard() {
    const hiddenSections = SECTION_DEFINITIONS.filter((section) => !activeSections.includes(section.id));
    if (hiddenSections.length === 0) return null;
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>Weitere Metadaten hinzufügen</CardTitle>
          <CardDescription>Aktiviere zusätzliche Bereiche nach Bedarf</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {hiddenSections.map((section) => (
            <Button
              key={section.id}
              type="button"
              variant="secondary"
              onClick={() => setActiveSections((prev) => [...prev, section.id])}
            >
              {section.title}
            </Button>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {renderGeneralCard()}
      {renderPhysicalCard()}
      {renderPowerCard()}
      {renderCaseCard()}
      {renderLifecycleCard()}
      {renderConnectivityCard()}
      {renderSuppliersCard()}
      {renderAssignmentCard()}
      {renderNotesCard()}
      {renderSectionAddCard()}
    </>
  );
}

function hasConnectivityData(metadata: EquipmentMetadata) {
  return Boolean((metadata.connectivity?.length ?? 0) > 0 || (metadata.interfaces?.length ?? 0) > 0);
}

interface IgnoreToggleProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function IgnoreToggle({ id, label, checked, onChange }: IgnoreToggleProps) {
  return (
    <label className="flex items-center gap-2 text-xs text-muted-foreground" htmlFor={id}>
      <Checkbox id={id} checked={checked} onCheckedChange={(value) => onChange(!!value)} />
      {label}
    </label>
  );
}

interface InheritedTextFieldProps {
  id: string;
  label: string;
  value: string;
  placeholder?: string;
  ignored: boolean;
  onIgnoreChange: (checked: boolean) => void;
  onChange: (value: string | undefined) => void;
}

function InheritedTextField({ id, label, value, placeholder, ignored, onIgnoreChange, onChange }: InheritedTextFieldProps) {
  return (
    <div className="grid gap-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor={id}>{label}</Label>
        {(placeholder || ignored) && (
          <IgnoreToggle id={`${id}-ignore`} label="Ignorieren" checked={ignored} onChange={onIgnoreChange} />
        )}
      </div>
      <Input
        id={id}
        value={value ?? ""}
        placeholder={ignored ? undefined : placeholder}
        disabled={ignored}
        onChange={(event) => {
          const raw = event.target.value;
          onChange(raw.trim().length === 0 ? undefined : raw);
        }}
      />
    </div>
  );
}

interface InheritedNumberFieldProps {
  id: string;
  label: string;
  value: number | undefined | null;
  placeholder?: number;
  step?: string;
  ignored: boolean;
  onIgnoreChange: (checked: boolean) => void;
  onChange: (value: number | undefined) => void;
}

function InheritedNumberField({ id, label, value, placeholder, step = "1", ignored, onIgnoreChange, onChange }: InheritedNumberFieldProps) {
  return (
    <div className="grid gap-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor={id}>{label}</Label>
        {(placeholder !== undefined || ignored) && (
          <IgnoreToggle id={`${id}-ignore`} label="Ignorieren" checked={ignored} onChange={onIgnoreChange} />
        )}
      </div>
      <Input
        id={id}
        type="number"
        min={0}
        step={step}
        value={value ?? ""}
        placeholder={ignored ? undefined : placeholder?.toString()}
        disabled={ignored}
        onChange={(event) => {
          const raw = event.target.value.trim();
          onChange(raw === "" ? undefined : Number(raw));
        }}
      />
    </div>
  );
}

interface InheritedCheckboxProps {
  id: string;
  label: string;
  checked: boolean;
  placeholder?: boolean;
  ignored: boolean;
  onIgnoreChange: (checked: boolean) => void;
  onChange: (checked: boolean) => void;
}

function InheritedCheckbox({ id, label, checked, placeholder, ignored, onIgnoreChange, onChange }: InheritedCheckboxProps) {
  return (
    <div className="flex items-center gap-2">
      {(placeholder !== undefined || ignored) && (
        <IgnoreToggle id={`${id}-ignore`} label="Ignorieren" checked={ignored} onChange={onIgnoreChange} />
      )}
      <Checkbox
        id={id}
        checked={ignored ? !!placeholder : checked}
        onCheckedChange={(value) => onChange(!!value)}
        disabled={ignored}
      />
      <Label htmlFor={id}>{label}</Label>
    </div>
  );
}

interface PowerInputProps {
  id: string;
  label: string;
  value: string;
  placeholder?: string;
  ignored: boolean;
  onIgnoreChange: (checked: boolean) => void;
  onChange: (value: string | undefined) => void;
}

function PowerInput({ id, label, value, placeholder, ignored, onIgnoreChange, onChange }: PowerInputProps) {
  return (
    <div className="grid gap-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor={id}>{label}</Label>
        {(placeholder || ignored) && (
          <IgnoreToggle id={`${id}-ignore`} label="Ignorieren" checked={ignored} onChange={onIgnoreChange} />
        )}
      </div>
      <Input
        id={id}
        value={value ?? ""}
        placeholder={ignored ? undefined : placeholder}
        disabled={ignored}
        onChange={(event) => {
          const raw = event.target.value;
          onChange(raw.trim().length === 0 ? undefined : raw);
        }}
      />
    </div>
  );
}

interface PowerNumberInputProps {
  id: string;
  label: string;
  value: number | undefined | null;
  ignored: boolean;
  onIgnoreChange: (checked: boolean) => void;
  onChange: (value: number | undefined) => void;
}

function PowerNumberInput({ id, label, value, ignored, onIgnoreChange, onChange }: PowerNumberInputProps) {
  return (
    <div className="grid gap-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor={id}>{label}</Label>
        <IgnoreToggle id={`${id}-ignore`} label="Ignorieren" checked={ignored} onChange={onIgnoreChange} />
      </div>
      <Input
        id={id}
        type="number"
        min={0}
        step="0.1"
        value={value ?? ""}
        onChange={(event) => {
          const raw = event.target.value.trim();
          onChange(raw === "" ? undefined : Number(raw));
        }}
        disabled={ignored}
      />
    </div>
  );
}

interface DateFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}

function DateField({ id, label, value, onChange }: DateFieldProps) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

export default EquipmentMetadataForm;
