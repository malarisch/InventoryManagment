/**
 * Company metadata inheritance utilities.
 * 
 * Normalizes and validates company metadata structures, ensuring they conform to
 * expected types and contain default values. Used when loading company settings
 * to provide stable metadata shapes for downstream consumers.
 * 
 * @module lib/metadata/inherit
 */
import type { adminCompanyMetadata, Power } from "@/components/metadataTypes.types";
import { defaultAdminCompanyMetadataDE } from "@/lib/metadata/defaults";

export function normalizeAdminCompanyMetadata(input: unknown): adminCompanyMetadata {
  const base = structuredClone(defaultAdminCompanyMetadataDE);
  if (!input || typeof input !== "object") return base;
  const raw = input as Partial<adminCompanyMetadata>;
  const out: adminCompanyMetadata = {
    ...base,
    ...raw,
    standardData: {
      ...base.standardData,
      ...(raw.standardData ?? {}),
      power: {
        ...base.standardData.power,
        ...(raw.standardData?.power as Power | undefined ?? {}),
      },
      contactPersonId: raw.standardData?.contactPersonId,
    },
    customTypes: {
      ...base.customTypes,
      ...(raw.customTypes ?? {}),
    },
      companyWidePrefix: raw.companyWidePrefix ?? base.companyWidePrefix,
      assetTagArticlePrefix: raw.assetTagArticlePrefix ?? base.assetTagArticlePrefix,
      assetTagEquipmentPrefix: raw.assetTagEquipmentPrefix ?? base.assetTagEquipmentPrefix,
      assetTagCasePrefix: raw.assetTagCasePrefix ?? base.assetTagCasePrefix,
      assetTagLocationPrefix: raw.assetTagLocationPrefix ?? base.assetTagLocationPrefix,
      defaultArticleAssetTagTemplateId: raw.defaultArticleAssetTagTemplateId ?? base.defaultArticleAssetTagTemplateId,
      defaultEquipmentAssetTagTemplateId: raw.defaultEquipmentAssetTagTemplateId ?? base.defaultEquipmentAssetTagTemplateId,
      defaultCaseAssetTagTemplateId: raw.defaultCaseAssetTagTemplateId ?? base.defaultCaseAssetTagTemplateId,
      defaultLocationAssetTagTemplateId: raw.defaultLocationAssetTagTemplateId ?? base.defaultLocationAssetTagTemplateId,
  };
  return out;
}

export function powerPlaceholders(admin: adminCompanyMetadata) {
  return {
    voltageRangeV: admin.standardData.power.voltageRangeV ?? "",
    frequencyHz: admin.standardData.power.frequencyHz ?? "",
    powerType: admin.standardData.power.powerType ?? "AC",
  } as const;
}

