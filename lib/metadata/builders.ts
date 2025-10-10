import type { CustomerMetadata, EquipmentMetadata, adminCompanyMetadata } from "@/components/metadataTypes.types";
import { defaultCustomerMetadataDE, defaultEquipmentMetadataDE, defaultAdminCompanyMetadataDE } from "@/lib/metadata/defaults";

/**
 * Merge provided partial customer metadata with project defaults.
 * 
 * Ensures stable shape and default values for downstream storage by filling
 * in any missing fields with defaults from defaultCustomerMetadataDE.
 * 
 * @param input - Partial customer metadata from form/user input
 * @returns Complete CustomerMetadata object with all fields populated
 */
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

/**
 * Merge provided partial equipment metadata with project defaults.
 * 
 * Preserves nested structures like power specs and case configuration while
 * ensuring typed return value. Handles null input gracefully.
 * 
 * @param input - Partial equipment metadata from form/user input
 * @returns Complete EquipmentMetadata object with all fields populated
 */
export function buildEquipmentMetadata(input: Partial<EquipmentMetadata>): EquipmentMetadata {
  // Handle null input
  const safeInput = input || {};
  return {
    ...defaultEquipmentMetadataDE,
    ...safeInput,
    power: { ...defaultEquipmentMetadataDE.power, ...(safeInput.power || {}) },
    is19InchRackmountable: safeInput.is19InchRackmountable ?? defaultEquipmentMetadataDE.is19InchRackmountable,
    heightUnits: safeInput.heightUnits ?? defaultEquipmentMetadataDE.heightUnits,
    case: safeInput.case
      ? {
          ...(defaultEquipmentMetadataDE.case ?? {}),
          ...safeInput.case,
        }
      : defaultEquipmentMetadataDE.case,
    type: safeInput.type ?? defaultEquipmentMetadataDE.type,
  } as EquipmentMetadata;
}

/**
 * Normalize and fill missing fields for company admin metadata using defaults.
 * 
 * Carefully merges nested `standardData` and `customTypes` while preserving
 * existing values. Ensures all required company settings fields are present.
 * 
 * @param input - Partial company metadata from form/user input
 * @returns Complete adminCompanyMetadata object with all fields populated
 */
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
      contactPersonId: input.standardData?.contactPersonId,
    },
    customTypes: input.customTypes ? {
      articleTypes: [...input.customTypes.articleTypes],
      caseTypes: [...input.customTypes.caseTypes],
      locationTypes: [...input.customTypes.locationTypes],
    } : base.customTypes,
  };
  return out;
}
