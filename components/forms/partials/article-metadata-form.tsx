"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ArticleMetadata } from "@/components/metadataTypes.types";
import type { adminCompanyMetadata } from "@/components/metadataTypes.types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useCompany } from "@/app/management/_libs/companyHook";
import {
  normalizeAdminCompanyMetadata,
  powerPlaceholders,
} from "@/lib/metadata/inherit";
import {
  type SearchItem,
  SearchPicker,
} from "@/components/search/search-picker";
import { StringListInput } from "@/components/forms/metadata/string-list-input";
import { DimensionsFieldset } from "@/components/forms/metadata/dimensions-fieldset";
import {
  SupplierListEditor,
  type ContactOption,
} from "@/components/forms/metadata/supplier-list-editor";
import { PriceFields } from "@/components/forms/metadata/price-fields";

export interface ArticleMetadataFormProps {
  value: ArticleMetadata;
  onChange: (val: ArticleMetadata) => void;
  companyMetadata?: adminCompanyMetadata | null;
  supplierOptions?: ContactOption[];
  onCreateSupplier?: () => void;
}

type SectionId =
  | "general"
  | "physical"
  | "power"
  | "case"
  | "connectivity"
  | "suppliers"
  | "notes";

interface SectionDefinition {
  id: SectionId;
  title: string;
  description: string;
  defaultActive?: boolean;
}

const SECTION_DEFINITIONS: SectionDefinition[] = [
  {
    id: "general",
    title: "Allgemein",
    description: "Typ, Hersteller, Buchungsoptionen",
    defaultActive: true,
  },
  {
    id: "physical",
    title: "Physische Eigenschaften",
    description: "Gewicht, Maße und Rack-Optionen",
    defaultActive: false,
  },
  {
    id: "power",
    title: "Stromversorgung",
    description: "Spannung, Frequenz und Anschluss",
    defaultActive: false,
  },
  {
    id: "case",
    title: "Case Setup",
    description: "Rack Cases, Einschränkungen und Inhalt",
  },
  {
    id: "connectivity",
    title: "Konnektivität & Schnittstellen",
    description: "Netzwerk-Features und Ports",
  },
  {
    id: "suppliers",
    title: "Lieferanten & Preise",
    description: "Lieferanten, Preise und Konditionen",
  },
  { id: "notes", title: "Notizen", description: "Freitext für Besonderheiten" },
];

export function ArticleMetadataForm({
  value,
  onChange,
  companyMetadata,
  supplierOptions,
  onCreateSupplier,
}: ArticleMetadataFormProps) {
  const [local, setLocal] = useState<ArticleMetadata>(value);
  const { company } = useCompany();
  
  // Track whether the last change originated from user interaction
  const isInternalUpdateRef = useRef(false);

  const adminMeta = useMemo(
    () =>
      normalizeAdminCompanyMetadata(
        companyMetadata ?? company?.metadata ?? null
      ),
    [companyMetadata, company]
  );
  const powerDefaults = useMemo(
    () => powerPlaceholders(adminMeta),
    [adminMeta]
  );
  const currencyFallback = adminMeta.standardData.currency ?? "EUR";

  const articleTypeItems: SearchItem<"type", string>[] = useMemo(() => {
    const customTypes = normalizeAdminCompanyMetadata(
      company?.metadata ?? null
    ).customTypes;
    return customTypes.articleTypes.map((type) => ({
      id: type,
      category: "type",
      title: type,
      matchers: [{ value: type }],
      data: type,
    }));
  }, [company]);

  const [activeSections, setActiveSections] = useState<SectionId[]>(() => {
    const defaults = SECTION_DEFINITIONS.filter(
      (section) => section.defaultActive
    ).map((section) => section.id);
    return Array.from(new Set<SectionId>(["general", ...defaults]));
  });

  // Auto-activate Case section when incoming value already carries data
  useEffect(() => {
    if (hasCaseData(value) && !activeSections.includes("case")) {
      setActiveSections((prev) => [...prev, "case"]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  
  const [recentlyRemoved, setRecentlyRemoved] = useState<SectionId | null>(null);
  const [removedSectionBackup, setRemovedSectionBackup] = useState<Partial<ArticleMetadata> | null>(null);
  const [manuallyHidden, setManuallyHidden] = useState<Set<SectionId>>(new Set());

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

  function update(updater: (prev: ArticleMetadata) => ArticleMetadata) {
    isInternalUpdateRef.current = true;
    setLocal((prev) => updater(prev));
  }

  function removeSection(sectionId: SectionId) {
    // Keep "general" always visible
    if (sectionId === "general") return;
    
    // Backup data before clearing
    const backup: Partial<ArticleMetadata> = {};
    switch (sectionId) {
      case "physical":
        backup.weightKg = local.weightKg;
        backup.dimensionsCm = local.dimensionsCm;
        break;
      case "power":
        backup.power = local.power;
        break;
      case "case":
        backup.case = local.case;
        backup.is19InchRackmountable = local.is19InchRackmountable;
        backup.fitsInRestrictedCaseTypes = local.fitsInRestrictedCaseTypes;
        break;
      case "connectivity":
        backup.connectivity = local.connectivity;
        backup.interfaces = local.interfaces;
        break;
      case "suppliers":
        backup.suppliers = local.suppliers;
        backup.dailyRentalRate = local.dailyRentalRate;
        break;
      case "notes":
        backup.notes = local.notes;
        break;
    }
    setRemovedSectionBackup(backup);
    // Track manual hide to avoid auto re-adding from defaults
    setManuallyHidden((prev) => new Set<SectionId>(prev).add(sectionId));

    // Clear data for this section
    update((prev) => {
      const updated = { ...prev };
      switch (sectionId) {
        case "physical":
          updated.weightKg = undefined;
          updated.dimensionsCm = undefined;
          break;
        case "power":
          updated.power = undefined;
          break;
        case "case":
          updated.case = undefined;
          updated.is19InchRackmountable = undefined;
          updated.fitsInRestrictedCaseTypes = undefined;
          break;
        case "connectivity":
          updated.connectivity = undefined;
          updated.interfaces = undefined;
          break;
        case "suppliers":
          updated.suppliers = undefined;
          updated.dailyRentalRate = undefined;
          break;
        case "notes":
          updated.notes = undefined;
          break;
      }
      return updated;
    });
    
    setActiveSections((current) => current.filter((id) => id !== sectionId));
    setRecentlyRemoved(sectionId);
    
    // Auto-clear undo after 10 seconds
    setTimeout(() => {
      setRecentlyRemoved((current) => current === sectionId ? null : current);
      setRemovedSectionBackup(null);
    }, 10000);
  }

  function undoRemoveSection() {
    if (!recentlyRemoved || !removedSectionBackup) return;
    
    // Restore backed up data
    update((prev) => ({ ...prev, ...removedSectionBackup }));
    
    setActiveSections((current) => [...current, recentlyRemoved]);
    setRecentlyRemoved(null);
    setManuallyHidden((prev) => {
      const next = new Set(prev);
      next.delete(recentlyRemoved);
      return next;
    });
    setRemovedSectionBackup(null);
  }

  function canRemoveSection(sectionId: SectionId): boolean {
    return sectionId !== "general";
  }

  const ensureSectionActive = useCallback(
    (section: SectionId, hasData: boolean) => {
      if (!hasData) return;
      if (manuallyHidden.has(section)) return; // respect user's choice to hide
      setActiveSections((current) =>
        current.includes(section) ? current : [...current, section]
      );
    },
    [manuallyHidden]
  );

  // Auto-enable sections when metadata values appear from outside (e.g., JSON mode, inheritance)
  useEffect(() => {
    ensureSectionActive("physical", hasPhysicalData(local));
    ensureSectionActive(
      "power",
      hasPowerData(local)
    );
    ensureSectionActive("case", hasCaseData(local));
    ensureSectionActive("connectivity", hasConnectivityData(local));
    ensureSectionActive(
      "suppliers",
      (local.suppliers?.length ?? 0) > 0 || !!local.dailyRentalRate
    );
    ensureSectionActive("notes", !!local.notes);
  }, [local, adminMeta, ensureSectionActive]);

  function setTextField<K extends keyof ArticleMetadata>(key: K, raw: string, trim = true) {
    const trimmed = trim ? raw.trim() : raw;
    update((prev) => ({
      ...prev,
      [key]: trimmed.length === 0 ? undefined : trimmed,
    }));
  }

  function setNumberField(key: keyof ArticleMetadata, raw: string) {
    const trimmed = raw.trim();
    const parsed = trimmed.length === 0 ? undefined : Number(trimmed);
    update((prev) => ({
      ...prev,
      [key]: parsed,
    }));
  }

  function updatePower(
    partial: Partial<NonNullable<ArticleMetadata["power"]>>
  ) {
    update((prev) => {
      const nextPower = { ...(prev.power ?? {}) } as NonNullable<
        ArticleMetadata["power"]
      >;
      for (const [key, value] of Object.entries(partial)) {
        if (value === undefined) {
          delete nextPower[key as keyof typeof nextPower];
        } else {
          nextPower[key as keyof typeof nextPower] = value as never;
        }
      }
      const cleaned = Object.values(nextPower).every(
        (value) => value === undefined
      )
        ? undefined
        : nextPower;
      return {
        ...prev,
        power: cleaned,
      };
    });
  }

  function renderGeneralCard() {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Allgemein</CardTitle>
          <CardDescription>Typ, Hersteller und Identifikatoren</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label id="amf-type-label">Typ (erforderlich)</Label>
            <SearchPicker
              items={articleTypeItems}
              onSelect={(item) => setTextField("type", item.data)}
              placeholder="Typ auswählen..."
              buttonLabel={local.type ?? "Typ auswählen"}
              categoryLabels={{ type: "Artikeltypen" }}
              resetOnSelect={false}
              buttonProps={{ "aria-labelledby": "amf-type-label amf-type-button", id: "amf-type-button" }}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="amf-manufacturer">Hersteller</Label>
            <Input
              id="amf-manufacturer"
              value={local.manufacturer ?? ""}
              onChange={(event) =>
                setTextField("manufacturer", event.target.value)
              }
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="amf-model">Modell</Label>
            <Input
              id="amf-model"
              value={local.model ?? ""}
              onChange={(event) => setTextField("model", event.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="amf-mpn">Hersteller-Teilenummer</Label>
            <Input
              id="amf-mpn"
              value={local.manufacturerPartNumber ?? ""}
              onChange={(event) =>
                setTextField("manufacturerPartNumber", event.target.value)
              }
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="amf-ean">EAN</Label>
            <Input
              id="amf-ean"
              value={local.EAN ?? ""}
              onChange={(event) => setTextField("EAN", event.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="amf-upc">UPC</Label>
            <Input
              id="amf-upc"
              value={local.UPC ?? ""}
              onChange={(event) => setTextField("UPC", event.target.value)}
            />
          </div>
          <div className="col-span-full flex items-center gap-3 rounded-md border border-dashed p-3">
            <Checkbox
              id="amf-no-stock"
              checked={!!local.canBeBookedWithoutStock}
              onCheckedChange={(checked) =>
                update((prev) => ({
                  ...prev,
                  canBeBookedWithoutStock: !!checked,
                }))
              }
            />
            <Label htmlFor="amf-no-stock" className="text-sm">
              Kann ohne Lagerbestand gebucht werden
            </Label>
          </div>
        </CardContent>
      </Card>
    );
  }

  function renderPhysicalCard() {
    if (!activeSections.includes("physical")) return null;
    return (
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle>Physische Eigenschaften</CardTitle>
              <CardDescription>Gewicht und Maße</CardDescription>
            </div>
            {canRemoveSection("physical") && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeSection("physical")}
                className="h-8 w-8 p-0"
                title="Bereich entfernen"
              >
                ✕
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="amf-weight">Gewicht (kg)</Label>
              <Input
                id="amf-weight"
                type="number"
                min={0}
                step="0.1"
                value={local.weightKg ?? ""}
                onChange={(event) =>
                  setNumberField("weightKg", event.target.value)
                }
              />
            </div>
          </div>
          <DimensionsFieldset
            idPrefix="article-dimensions"
            value={local.dimensionsCm}
            onChange={(next) =>
              update((prev) => ({ ...prev, dimensionsCm: next }))
            }
          />
        </CardContent>
      </Card>
    );
  }

  function renderPowerCard() {
    if (!activeSections.includes("power")) return null;
    const power = local.power ?? {};
    const inherited = adminMeta.standardData.power;
    const connectorPlaceholder =
      inherited.powerConnectorType ??
      adminMeta.standardData.power.powerConnectorType ??
      undefined;
    return (
      <Card className="col-span-2">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle>Stromversorgung</CardTitle>
              <CardDescription>
                Geerbte Werte werden als Platzhalter angezeigt
              </CardDescription>
            </div>
            {canRemoveSection("power") && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeSection("power")}
                className="h-8 w-8 p-0"
                title="Bereich entfernen"
              >
                ✕
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-1 grid-flow-row-dense">
          <div className="grid gap-1.5 col-span-2 sm:col-span-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="amf-power-type">Stromtyp</Label>
              {inherited.powerType && (
                <IgnoreToggle
                  id="amf-power-type-ignore"
                  label="Ignorieren"
                  checked={power.powerType === null}
                  onChange={(checked) =>
                    updatePower({ powerType: checked ? null : undefined })
                  }
                />
              )}
            </div>
            
            <select
              id="amf-power-type"
              className="h-9 rounded-md border bg-background px-3 text-sm"
              value={power.powerType ?? inherited.powerType ?? "AC"}
              onChange={(event) =>
                updatePower({
                  powerType: event.target.value as
                    | "AC"
                    | "DC"
                    | "PoE"
                    | "Battery"
                    | "Other",
                })
              }
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
            id="amf-v"
            label="Spannung (V)"
            value={power.voltageRangeV ?? ""}
            placeholder={
              power.voltageRangeV ? undefined : powerDefaults.voltageRangeV
            }
            ignored={power.voltageRangeV === null}
            onIgnoreChange={(checked) =>
              updatePower({ voltageRangeV: checked ? null : undefined })
            }
            onChange={(raw) => updatePower({ voltageRangeV: raw })}
          />
          <PowerInput
            id="amf-f"
            label="Frequenz (Hz)"
            value={power.frequencyHz ?? ""}
            placeholder={
              power.frequencyHz ? undefined : powerDefaults.frequencyHz
            }
            ignored={power.frequencyHz === null}
            onIgnoreChange={(checked) =>
              updatePower({ frequencyHz: checked ? null : undefined })
            }
            onChange={(raw) => updatePower({ frequencyHz: raw })}
          />
          <PowerInput
            id="amf-pc"
            label="Anschlusstyp"
            value={power.powerConnectorType ?? ""}
            placeholder={connectorPlaceholder}
            ignored={power.powerConnectorType === null}
            onIgnoreChange={(checked) =>
              updatePower({ powerConnectorType: checked ? null : undefined })
            }
            onChange={(raw) => updatePower({ powerConnectorType: raw })}
          />
          <PowerNumberInput
            id="amf-max-power"
            label="Max. Leistung (W)"
            value={power.maxPowerW}
            ignored={power.maxPowerW === null}
            onIgnoreChange={(checked) =>
              updatePower({ maxPowerW: checked ? null : undefined })
            }
            onChange={(amount) => updatePower({ maxPowerW: amount })}
          />
        </CardContent>
      </Card>
    );
  }

  

  function renderCaseCard() {
    if (!activeSections.includes("case")) return null;
    const caseMeta = local.case ?? {};

    // Determine which mode: "none", "case-is-rack", or "equipment-is-rackmountable"
    const mode = caseMeta.is19InchRack
      ? "case-is-rack"
      : local.is19InchRackmountable
      ? "equipment-is-rackmountable"
      : "none";

    return (
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle>Case & Rack Setup</CardTitle>
              <CardDescription>
                Konfiguration für Cases und Rackmontage-Eigenschaften
              </CardDescription>
            </div>
            {canRemoveSection("case") && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeSection("case")}
                className="h-8 w-8 p-0"
                title="Bereich entfernen"
              >
                ✕
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="grid gap-4">
          {/* Mode Selection - Radio Buttons */}
          <div className="grid gap-3">
            <Label id="amf-rack-config-label" aria-label="Rack-Konfiguration">Rack-Konfiguration</Label>
            <div className="flex flex-col gap-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="case-mode-general"
                  checked={caseMeta.isGeneralCase ?? false}
                  onCheckedChange={() => {
                    update((prev) => {
                      const current = prev.case?.isGeneralCase ?? false;
                      return {
                        ...prev,
                        case: {
                          ...(prev.case ?? {}),
                          isGeneralCase: !current,
                        },
                      };
                    });
                  }}
                />

                <Label
                  htmlFor="case-mode-general"
                  className="font-normal cursor-pointer"
                >
                  Hat Case Eigenschaften
                </Label>
              </div>
            </div>
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
                      is19InchRackmountable: undefined,
                      heightUnits: undefined,
                      case: {
                        ...(prev.case ?? {}),
                        is19InchRack: undefined,
                        heightUnits: undefined,
                        maxDeviceDepthCm: undefined,
                      },
                    }));
                  }}
                />
                <Label
                  htmlFor="case-mode-none"
                  className="font-normal cursor-pointer"
                >
                  Keine 19&quot; Rack-Eigenschaften
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
                      is19InchRackmountable: null,
                      heightUnits: undefined,
                      case: { ...(prev.case ?? {}), is19InchRack: true },
                    }));
                  }}
                />
                <Label
                  htmlFor="case-mode-case-rack"
                  className="font-normal cursor-pointer"
                >
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
                      is19InchRackmountable: true,
                      case: {
                        ...(prev.case ?? {}),
                        is19InchRack: undefined,
                        heightUnits: undefined,
                        maxDeviceDepthCm: undefined,
                      },
                    }));
                  }}
                />
                <Label
                  htmlFor="case-mode-equipment-rack"
                  className="font-normal cursor-pointer"
                >
                  Equipment ist 19&quot; rackmontierbar
                </Label>
              </div>
            </div>
          </div>

          {/* Case is Rack Fields */}
          {mode === "case-is-rack" && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 border-l-4 border-blue-500 pl-4">
              <div className="grid gap-1.5">
                <Label htmlFor="case-height">Case Höheneinheiten (U)</Label>
                <Input
                  id="case-height"
                  type="number"
                  min={1}
                  value={caseMeta.heightUnits ?? ""}
                  onChange={(event) => {
                    const value = event.target.value.trim();
                    update((prev) => ({
                      ...prev,
                      case: {
                        ...(prev.case ?? {}),
                        heightUnits: value === "" ? undefined : Number(value),
                      },
                    }));
                  }}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="case-depth">Max. Gerätetiefe (cm)</Label>
                <Input
                  id="case-depth"
                  type="number"
                  min={0}
                  step="0.1"
                  value={caseMeta.maxDeviceDepthCm ?? ""}
                  onChange={(event) => {
                    const value = event.target.value.trim();
                    update((prev) => ({
                      ...prev,
                      case: {
                        ...(prev.case ?? {}),
                        maxDeviceDepthCm:
                          value === "" ? undefined : Number(value),
                      },
                    }));
                  }}
                />
              </div>
            </div>
          )}

          {/* Equipment is Rackmountable Fields */}
          {mode === "equipment-is-rackmountable" && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 border-l-4 border-green-500 pl-4">
              <div className="grid gap-1.5">
                <Label htmlFor="equipment-height">Höheneinheiten (U)</Label>
                <Input
                  id="equipment-height"
                  type="number"
                  min={1}
                  value={local.heightUnits ?? ""}
                  onChange={(event) =>
                    setNumberField("heightUnits", event.target.value)
                  }
                />
              </div>
            </div>
          )}

          {/* Common Case Fields (shown when case mode is active) */}
          {caseMeta.isGeneralCase && (
            <>
              <div className="grid gap-1.5">
                <Label id="amf-inner-dims-label" aria-label="Innenmaße (cm)">Innenmaße (cm)</Label>
                <div className="grid grid-cols-3 gap-3">
                  <div className="grid gap-1.5">
                    <Label htmlFor="case-inner-w" className="text-xs">
                      Breite
                    </Label>
                    <Input
                      id="case-inner-w"
                      type="number"
                      min={0}
                      step="0.1"
                      value={caseMeta.innerDimensionsCm?.width ?? ""}
                      onChange={(event) => {
                        const value = event.target.value.trim();
                        const existingDims = caseMeta.innerDimensionsCm ?? {
                          width: 0,
                          height: 0,
                        };
                        update((prev) => ({
                          ...prev,
                          case: {
                            ...(prev.case ?? {}),
                            innerDimensionsCm:
                              value === ""
                                ? undefined
                                : { ...existingDims, width: Number(value) },
                          },
                        }));
                      }}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="case-inner-h" className="text-xs">
                      Höhe
                    </Label>
                    <Input
                      id="case-inner-h"
                      type="number"
                      min={0}
                      step="0.1"
                      value={caseMeta.innerDimensionsCm?.height ?? ""}
                      onChange={(event) => {
                        const value = event.target.value.trim();
                        const existingDims = caseMeta.innerDimensionsCm ?? {
                          width: 0,
                          height: 0,
                        };
                        update((prev) => ({
                          ...prev,
                          case: {
                            ...(prev.case ?? {}),
                            innerDimensionsCm:
                              value === ""
                                ? undefined
                                : { ...existingDims, height: Number(value) },
                          },
                        }));
                      }}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="case-inner-d" className="text-xs">
                      Tiefe
                    </Label>
                    <Input
                      id="case-inner-d"
                      type="number"
                      min={0}
                      step="0.1"
                      value={caseMeta.innerDimensionsCm?.depth ?? ""}
                      onChange={(event) => {
                        const value = event.target.value.trim();
                        const existingDims = caseMeta.innerDimensionsCm ?? {
                          width: 0,
                          height: 0,
                        };
                        update((prev) => ({
                          ...prev,
                          case: {
                            ...(prev.case ?? {}),
                            innerDimensionsCm:
                              value === ""
                                ? undefined
                                : { ...existingDims, depth: Number(value) },
                          },
                        }));
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label htmlFor="case-content-weight">
                    Max. Inhaltgewicht (kg)
                  </Label>
                  <Input
                    id="case-content-weight"
                    type="number"
                    min={0}
                    step="0.1"
                    value={caseMeta.contentMaxWeightKg ?? ""}
                    onChange={(event) => {
                      const value = event.target.value.trim();
                      update((prev) => ({
                        ...prev,
                        case: {
                          ...(prev.case ?? {}),
                          contentMaxWeightKg:
                            value === "" ? undefined : Number(value),
                        },
                      }));
                    }}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="case-lock"
                    checked={!!caseMeta.hasLock}
                    onCheckedChange={(checked) =>
                      update((prev) => ({
                        ...prev,
                        case: {
                          ...(prev.case ?? {}),
                          hasLock: !!checked,
                        },
                      }))
                    }
                  />
                  <Label htmlFor="case-lock">Case hat Schloss</Label>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  function renderConnectivityCard() {
    if (!activeSections.includes("connectivity")) return null;
    return (
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle>Konnektivität & Schnittstellen</CardTitle>
              <CardDescription>Verfügbare Funkstandards und Ports</CardDescription>
            </div>
            {canRemoveSection("connectivity") && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeSection("connectivity")}
                className="h-8 w-8 p-0"
                title="Bereich entfernen"
              >
                ✕
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-1.5">
            <Label id="amf-connectivity-label">Konnektivität</Label>
            <StringListInput
              values={local.connectivity ?? []}
              onChange={(next) =>
                update((prev) => ({ ...prev, connectivity: next }))
              }
              placeholder="z. B. WiFi, Bluetooth"
            />
          </div>
          <div className="grid gap-1.5">
            <Label id="amf-interfaces-label">Schnittstellen</Label>
            <StringListInput
              values={local.interfaces ?? []}
              onChange={(next) =>
                update((prev) => ({ ...prev, interfaces: next }))
              }
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
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle>Lieferanten & Preise</CardTitle>
              <CardDescription>
                Lieferantenverwaltung, Preise und Konditionen
              </CardDescription>
            </div>
            {canRemoveSection("suppliers") && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeSection("suppliers")}
                className="h-8 w-8 p-0"
                title="Bereich entfernen"
              >
                ✕
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="grid gap-6">
          <SupplierListEditor
            suppliers={local.suppliers ?? []}
            onChange={(next) =>
              update((prev) => ({ ...prev, suppliers: next }))
            }
            contactOptions={supplierOptions}
            onCreateContact={onCreateSupplier}
            currencyFallback={currencyFallback}
          />
          <div className="grid gap-1.5">
            <Label>Tagessatz (Vermietung)</Label>
            <PriceFields
              value={local.dailyRentalRate}
              onChange={(next) =>
                update((prev) => ({ ...prev, dailyRentalRate: next }))
              }
              currencyFallback={currencyFallback}
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  function renderNotesCard() {
    if (!activeSections.includes("notes")) return null;
    return (
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle>Notizen</CardTitle>
              <CardDescription>
                Freitext für Besonderheiten und Hinweise
              </CardDescription>
            </div>
            {canRemoveSection("notes") && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeSection("notes")}
                className="h-8 w-8 p-0"
                title="Bereich entfernen"
              >
                ✕
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Textarea
            id="amf-notes"
            className="min-h-[120px]"
            value={local.notes ?? ""}
            onChange={(event) => setTextField("notes", event.target.value, false)}
            onBlur={(event) => setTextField("notes", event.target.value, true)}
          />
        </CardContent>
      </Card>
    );
  }

  function renderSectionAddCard() {
    const hiddenSections = SECTION_DEFINITIONS.filter(
      (section) => !activeSections.includes(section.id)
    );
    if (hiddenSections.length === 0) return null;
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>Weitere Metadaten hinzufügen</CardTitle>
          <CardDescription>
            Aktiviere zusätzliche Bereiche nach Bedarf
          </CardDescription>
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
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {/* General always spans full width on small screens; let it flow on larger */}
      <div className="col-span-full md:col-span-2 xl:col-span-3">{renderGeneralCard()}</div>

      {/* Undo Banner across the grid */}
      {recentlyRemoved && (
        <div className="col-span-full flex items-center justify-between rounded-md border border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20 px-4 py-3">
          <span className="text-sm">
            Bereich entfernt: <strong>{SECTION_DEFINITIONS.find(s => s.id === recentlyRemoved)?.title}</strong>
          </span>
          <Button type="button" variant="outline" size="sm" onClick={undoRemoveSection}>
            Rückgängig
          </Button>
        </div>
      )}

      {renderPhysicalCard()}
      {renderPowerCard()}
      {renderCaseCard()}
      {renderConnectivityCard()}
      {renderSuppliersCard()}
      {renderNotesCard()}
      <div className="col-span-full">{renderSectionAddCard()}</div>
    </div>
  );
}

function hasPhysicalData(metadata: ArticleMetadata) {
  return Boolean(
    metadata.is19InchRackmountable ||
      metadata.heightUnits ||
      metadata.weightKg ||
      metadata.dimensionsCm
  );
}

function hasPowerData(metadata: ArticleMetadata) {
  const power = metadata.power;
  if (!power) return false;
  return Object.values(power).some(
    (value) => value !== undefined && value !== null
  );
}

function hasCaseData(metadata: ArticleMetadata) {
  return Boolean(
    metadata.case?.is19InchRack ||
      metadata.case?.heightUnits ||
      metadata.case?.maxDeviceDepthCm ||
      metadata.case?.innerDimensionsCm ||
      metadata.case?.restrictedContentTypes?.length ||
      metadata.case?.contentMaxWeightKg ||
      metadata.fitsInRestrictedCaseTypes?.length ||
      metadata.case?.isGeneralCase
  );
}

function hasConnectivityData(metadata: ArticleMetadata) {
  return Boolean(
    (metadata.connectivity?.length ?? 0) > 0 ||
      (metadata.interfaces?.length ?? 0) > 0
  );
}

interface IgnoreToggleProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function IgnoreToggle({ id, label, checked, onChange }: IgnoreToggleProps) {
  return (
    <div className="flex col-span-2">
    <label
      className="flex items-center gap-2 text-xs text-muted-foreground"
      htmlFor={id}
    >
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(checkedValue) => onChange(!!checkedValue)}
      />
      {label}
    </label>
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

function PowerInput({
  id,
  label,
  value,
  placeholder,
  ignored,
  onIgnoreChange,
  onChange,
}: PowerInputProps) {
  return (
    <div className="grid gap-1.5 md:col-span-2 sm:col-span-4">
      <div className="items-center justify-between">
        <Label htmlFor={id}>{label}</Label>
        {(placeholder || ignored) && (
          <IgnoreToggle
            id={`${id}-ignore`}
            label="Ignorieren"
            checked={ignored}
            onChange={onIgnoreChange}
          />
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

function PowerNumberInput({
  id,
  label,
  value,
  ignored,
  onIgnoreChange,
  onChange,
}: PowerNumberInputProps) {
  return (
    <div className="grid gap-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor={id}>{label}</Label>
        <IgnoreToggle
          id={`${id}-ignore`}
          label="Ignorieren"
          checked={ignored}
          onChange={onIgnoreChange}
        />
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

export default ArticleMetadataForm;
