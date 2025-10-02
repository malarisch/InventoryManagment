"use client";

import { useMemo, useState, useEffect } from "react";

/**
 * CompanyMetadataForm
 *
 * Renders the company metadata form, including custom type textareas for Locations, Cases, Articles.
 * Handles fetching location data and updating metadata state.
 *
 * Props:
 * - value: adminCompanyMetadata (current metadata object)
 * - onChange: function to update metadata
 */
import type { adminCompanyMetadata, Person, ContactInfo } from "@/components/metadataTypes.types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { useCompany } from "@/app/management/_libs/companyHook";
import { SearchPicker, type SearchItem } from "@/components/search/search-picker";
import { Textarea } from "@/components/ui/textarea";

export function CompanyMetadataForm({
  value,
  onChange,
}: {
  value: adminCompanyMetadata;
  onChange: (val: adminCompanyMetadata) => void;
}) {
  const supabase = useMemo(() => createClient(), []);
  const { company } = useCompany();
  const [locationItems, setLocationItems] = useState<SearchItem<"location", number>[]>([]);

  useEffect(() => {
    async function fetchLocations() {
      if (!company) return;
      const { data, error } = await supabase
        .from("locations")
        .select("id, name, description")
        .eq("company_id", company.id)
        .order("name");

      if (error) {
        console.error("Error fetching locations:", error);
        return;
      }

      const items: SearchItem<"location", number>[] = data.map((loc) => ({
        id: String(loc.id),
        category: "location",
        title: loc.name,
        description: loc.description ?? undefined,
        matchers: [{ value: loc.name }, { value: String(loc.id) }],
        data: loc.id,
      }));
      setLocationItems(items);
    }
    fetchLocations();
  }, [supabase, company]);

  function set<K extends keyof adminCompanyMetadata>(key: K, v: adminCompanyMetadata[K]) {
    onChange({ ...value, [key]: v });
  }

  function setStandard<K extends keyof adminCompanyMetadata["standardData"]>(key: K, v: adminCompanyMetadata["standardData"][K]) {
    onChange({ ...value, standardData: { ...value.standardData, [key]: v } });
  }

  function setPerson<K extends keyof Person>(key: K, v: Person[K]) {
    const newPerson = { ...value.standardData.person, [key]: v };
    onChange({ ...value, standardData: { ...value.standardData, person: newPerson } });
  }

  function setContactInfo(v: Partial<ContactInfo>) {
    const existing = value.standardData.person.contactInfo?.[0] ?? {};
    const newContactInfo = [{ ...existing, ...v }];
    setPerson("contactInfo", newContactInfo);
  }

  const selectedLocation = locationItems.find(it => it.id === String(value.standardData.defaultLocationId));

  // Local textareas state to preserve newlines and caret during typing
  const [articleTypesText, setArticleTypesText] = useState<string>(value.customTypes.articleTypes.join("\n"));
  const [caseTypesText, setCaseTypesText] = useState<string>(value.customTypes.caseTypes.join("\n"));
  const [locationTypesText, setLocationTypesText] = useState<string>(value.customTypes.locationTypes.join("\n"));

  // Keep local state in sync if parent value changes (e.g., after load/save)
  useEffect(() => {
    setArticleTypesText(value.customTypes.articleTypes.join("\n"));
    setCaseTypesText(value.customTypes.caseTypes.join("\n"));
    setLocationTypesText(value.customTypes.locationTypes.join("\n"));
  }, [value.customTypes.articleTypes, value.customTypes.caseTypes, value.customTypes.locationTypes]);

  return (
    <div className="grid gap-6 rounded-md border p-4">
      <h3 className="text-lg font-medium">Allgemein</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="cmf-phone">Telefon</Label>
          <Input id="cmf-phone" value={value.phone ?? ""} onChange={(e) => set("phone", e.target.value)} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="cmf-website">Webseite</Label>
          <Input id="cmf-website" type="url" value={value.website ?? ""} onChange={(e) => set("website", e.target.value)} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="cmf-logo">Logo URL</Label>
          <Input id="cmf-logo" type="url" value={value.logoUrl ?? ""} onChange={(e) => set("logoUrl", e.target.value)} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="cmf-address">Adresse</Label>
          <Input id="cmf-address" value={value.address ?? ""} onChange={(e) => set("address", e.target.value)} />
        </div>
      </div>

      <h3 className="text-lg font-medium">Steuer & Finanzen</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="cmf-tax-number">Steuernummer</Label>
          <Input id="cmf-tax-number" value={value.taxNumber ?? ""} onChange={(e) => set("taxNumber", e.target.value)} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="cmf-tax">Standard MwSt. (%)</Label>
          <Input id="cmf-tax" type="number" min={0} max={100}
            value={String(value.standardData.taxRate)}
            onChange={(e) => setStandard("taxRate", Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="cmf-curr">Standard Währung (ISO 4217)</Label>
          <Input id="cmf-curr" value={value.standardData.currency}
            onChange={(e) => setStandard("currency", e.target.value.toUpperCase())} />
        </div>
      </div>

      <h3 className="text-lg font-medium">Unternehmen</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="cmf-industry">Branche</Label>
          <Input id="cmf-industry" value={value.industry ?? ""} onChange={(e) => set("industry", e.target.value)} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="cmf-employees">Anzahl Mitarbeiter</Label>
          <Input id="cmf-employees" type="number" min={0} value={value.numberOfEmployees ?? ""} onChange={(e) => set("numberOfEmployees", Number(e.target.value))} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="cmf-year">Gründungsjahr</Label>
          <Input id="cmf-year" type="number" min={1800} max={new Date().getFullYear()} value={value.establishedYear ?? ""} onChange={(e) => set("establishedYear", Number(e.target.value))} />
        </div>
      </div>

      <h3 className="text-lg font-medium">Benutzerdefinierte Typen</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="grid gap-1.5">
          <Label htmlFor="cmf-article-types">Artikeltypen</Label>
          <Textarea id="cmf-article-types" className="min-h-[80px] w-full rounded-md border bg-background p-2 text-sm"
            placeholder="Jeder Typ in einer neuen Zeile"
            value={articleTypesText}
            onChange={(e) => {
              const t = e.target.value;
              setArticleTypesText(t);
              set("customTypes", { ...value.customTypes, articleTypes: t.split("\n").map(s => s.trim()).filter(s => s.length > 0) });
            }} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="cmf-case-types">Case-Typen</Label>
          <Textarea id="cmf-case-types" className="min-h-[80px] w-full rounded-md border bg-background p-2 text-sm"
            placeholder="Jeder Typ in einer neuen Zeile"
            value={caseTypesText}
            onChange={(e) => {
              const t = e.target.value;
              setCaseTypesText(t);
              set("customTypes", { ...value.customTypes, caseTypes: t.split("\n").map(s => s.trim()).filter(s => s.length > 0) });
            }} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="cmf-location-types">Location-Typen</Label>
          <Textarea id="cmf-location-types" className="min-h-[80px] w-full rounded-md border bg-background p-2 text-sm"
            placeholder="Jeder Typ in einer neuen Zeile"
            value={locationTypesText}
            onChange={(e) => {
              const t = e.target.value;
              setLocationTypesText(t);
              set("customTypes", { ...value.customTypes, locationTypes: t.split("\n").map(s => s.trim()).filter(s => s.length > 0) });
            }} />
        </div>
      </div>

      <h3 className="text-lg font-medium">Standardwerte</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label>Default Location</Label>
          <SearchPicker
            items={locationItems}
            onSelect={(item) => setStandard("defaultLocationId", item.data)}
            placeholder="Location auswählen..."
            buttonLabel={selectedLocation?.title}
            categoryLabels={{ location: "Locations" }}
            resetOnSelect={false}
          />
        </div>
      </div>

      <h4 className="font-medium">Standard Stromversorgung</h4>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="grid gap-1.5">
          <Label htmlFor="cmf-p-type">Stromtyp</Label>
          <select id="cmf-p-type" className="h-9 rounded-md border bg-background px-3 text-sm"
            value={value.standardData.power.powerType ?? "AC"}
            onChange={(e) => setStandard("power", { ...value.standardData.power, powerType: e.target.value as "AC" | "DC" | "PoE" | "Battery" | "Other" })}
          >
            <option>AC</option>
            <option>DC</option>
            <option>PoE</option>
            <option>Battery</option>
            <option>Other</option>
          </select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="cmf-p-v">Spannung</Label>
          <Input id="cmf-p-v" value={value.standardData.power.voltageRangeV ?? ""}
            onChange={(e) => setStandard("power", { ...value.standardData.power, voltageRangeV: e.target.value })} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="cmf-p-f">Frequenz</Label>
          <Input id="cmf-p-f" value={value.standardData.power.frequencyHz ?? ""}
            onChange={(e) => setStandard("power", { ...value.standardData.power, frequencyHz: e.target.value })} />
        </div>
      </div>

      <h4 className="font-medium">Standard Ansprechpartner</h4>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="cmf-first">Vorname</Label>
          <Input id="cmf-first" value={value.standardData.person.firstName} onChange={(e) => setPerson("firstName", e.target.value)} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="cmf-last">Nachname</Label>
          <Input id="cmf-last" value={value.standardData.person.lastName} onChange={(e) => setPerson("lastName", e.target.value)} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="cmf-pro">Pronomen</Label>
          <Input id="cmf-pro" value={value.standardData.person.pronouns ?? ""} onChange={(e) => setPerson("pronouns", e.target.value)} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="cmf-position">Position</Label>
          <Input id="cmf-position" value={value.standardData.person.position ?? ""} onChange={(e) => setPerson("position", e.target.value)} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="cmf-email">Email</Label>
          <Input id="cmf-email" type="email" value={value.standardData.person.contactInfo?.[0]?.email ?? ""} onChange={(e) => setContactInfo({ email: e.target.value })} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="cmf-phone-person">Telefon</Label>
          <Input id="cmf-phone-person" value={value.standardData.person.contactInfo?.[0]?.phone ?? ""} onChange={(e) => setContactInfo({ phone: e.target.value })} />
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="cmf-notes">Notizen</Label>
        <Textarea id="cmf-notes" className="min-h-[80px] w-full rounded-md border bg-background p-2 text-sm"
            value={value.notes ?? ""} 
            onChange={(e) => set("notes", e.target.value)} />
      </div>
      <h3 className="text-lg font-medium">Asset Tag Einstellungen</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="grid gap-1.5">
          <Label htmlFor="cmf-at-company-prefix">Globaler Prefix</Label>
          <Input id="cmf-at-company-prefix" value={value.companyWidePrefix ?? ""} onChange={(e) => set("companyWidePrefix", e.target.value)} placeholder="z.B. ACME" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="cmf-at-article-prefix">Artikel-Prefix</Label>
          <Input id="cmf-at-article-prefix" value={value.assetTagArticlePrefix ?? ""} onChange={(e) => set("assetTagArticlePrefix", e.target.value)} placeholder="ART" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="cmf-at-equipment-prefix">Equipment-Prefix</Label>
          <Input id="cmf-at-equipment-prefix" value={value.assetTagEquipmentPrefix ?? ""} onChange={(e) => set("assetTagEquipmentPrefix", e.target.value)} placeholder="EQ" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="cmf-at-case-prefix">Case-Prefix</Label>
          <Input id="cmf-at-case-prefix" value={value.assetTagCasePrefix ?? ""} onChange={(e) => set("assetTagCasePrefix", e.target.value)} placeholder="CASE" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="cmf-at-location-prefix">Location-Prefix</Label>
          <Input id="cmf-at-location-prefix" value={value.assetTagLocationPrefix ?? ""} onChange={(e) => set("assetTagLocationPrefix", e.target.value)} placeholder="LOC" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="grid gap-1.5">
          <Label htmlFor="cmf-at-article-template">Default Artikel Template ID</Label>
          <Input id="cmf-at-article-template" type="number" min={0} value={value.defaultArticleAssetTagTemplateId ?? ""} onChange={(e) => set("defaultArticleAssetTagTemplateId", e.target.value ? Number(e.target.value) : undefined)} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="cmf-at-equipment-template">Default Equipment Template ID</Label>
          <Input id="cmf-at-equipment-template" type="number" min={0} value={value.defaultEquipmentAssetTagTemplateId ?? ""} onChange={(e) => set("defaultEquipmentAssetTagTemplateId", e.target.value ? Number(e.target.value) : undefined)} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="cmf-at-case-template">Default Case Template ID</Label>
          <Input id="cmf-at-case-template" type="number" min={0} value={value.defaultCaseAssetTagTemplateId ?? ""} onChange={(e) => set("defaultCaseAssetTagTemplateId", e.target.value ? Number(e.target.value) : undefined)} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="cmf-at-location-template">Default Location Template ID</Label>
          <Input id="cmf-at-location-template" type="number" min={0} value={value.defaultLocationAssetTagTemplateId ?? ""} onChange={(e) => set("defaultLocationAssetTagTemplateId", e.target.value ? Number(e.target.value) : undefined)} />
        </div>
      </div>
    </div>
  );
}

export default CompanyMetadataForm;
