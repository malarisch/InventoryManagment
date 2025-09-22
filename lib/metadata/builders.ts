import type { CustomerMetadata, EquipmentMetadata } from "@/components/metadataTypes.types";
import { defaultCustomerMetadataDE, defaultEquipmentMetadataDE } from "@/lib/metadata/defaults";

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

