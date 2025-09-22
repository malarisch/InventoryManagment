import type { CustomerMetadata, EquipmentMetadata, adminCompanyMetadata } from "@/components/metadataTypes.types";
import { defaultCustomerMetadataDE, defaultEquipmentMetadataDE, defaultAdminCompanyMetadataDE } from "@/lib/metadata/defaults";

export function buildCustomerMetadata(input: Partial<CustomerMetadata>): CustomerMetadata {
  return {
    ...defaultCustomerMetadataDE,
    ...input,
    preferredContactMethod: input.preferredContactMethod ?? defaultCustomerMetadataDE.preferredContactMethod,
    firstName: input.firstName ?? defaultCustomerMetadataDE.firstName,
    lastName: input.lastName ?? defaultCustomerMetadataDE.lastName,
    name: input.name ?? defaultCustomerMetadataDE.name,
  } as CustomerMetadata;
}

export function buildEquipmentMetadata(input: Partial<EquipmentMetadata>): EquipmentMetadata {
  return {
    ...defaultEquipmentMetadataDE,
    ...input,
    power: { ...defaultEquipmentMetadataDE.power, ...(input.power ?? {}) },
    is19Inch: input.is19Inch ?? defaultEquipmentMetadataDE.is19Inch,
    heightUnits: input.heightUnits ?? defaultEquipmentMetadataDE.heightUnits,
    type: input.type ?? defaultEquipmentMetadataDE.type,
  } as EquipmentMetadata;
}

export function buildAdminCompanyMetadata(input: Partial<adminCompanyMetadata>): adminCompanyMetadata {
  const base = defaultAdminCompanyMetadataDE;
  const out: adminCompanyMetadata = {
    ...base,
    ...input,
    standardData: {
      ...base.standardData,
      ...(input.standardData ?? {}),
      taxRate: typeof input.standardData?.taxRate === "number" ? input.standardData.taxRate : base.standardData.taxRate,
      currency: input.standardData?.currency ? String(input.standardData.currency).toUpperCase() : base.standardData.currency,
      defaultLocationId: input.standardData?.defaultLocationId,
      power: { ...base.standardData.power, ...(input.standardData?.power ?? {}) },
      person: { ...base.standardData.person, ...(input.standardData?.person ?? {}) },
    },
    customTypes: input.customTypes ? {
      articleTypes: [...input.customTypes.articleTypes],
      caseTypes: [...input.customTypes.caseTypes],
      locationTypes: [...input.customTypes.locationTypes],
    } : base.customTypes,
  };
  return out;
}
