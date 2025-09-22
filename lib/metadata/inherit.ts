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
      person: {
        ...base.standardData.person,
        ...(raw.standardData?.person ?? {}),
      },
    },
    customTypes: {
      ...base.customTypes,
      ...(raw.customTypes ?? {}),
    },
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

