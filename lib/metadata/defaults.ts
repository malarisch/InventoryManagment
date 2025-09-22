import type {
  adminCompanyMetadata,
  ArticleMetadata,
  EquipmentMetadata,
  CustomerMetadata,
  JobMetadata,
  Power,
} from "@/components/metadataTypes.types";

const powerDE: Power = {
  powerType: "AC",
  voltageRangeV: "220-240V",
  frequencyHz: "50Hz",
  powerConnectorType: "IEC C13",
};

export const defaultAdminCompanyMetadataDE: adminCompanyMetadata = {
  phone: "",
  website: "",
  logoUrl: "",
  contactInfo: [],
  standardData: {
    taxRate: 19,
    currency: "EUR",
    defaultLocationId: undefined,
    power: powerDE,
    person: {
      firstName: "",
      lastName: "",
      pronouns: "",
    },
  },
  customTypes: { articleTypes: [], caseTypes: [], locationTypes: [] },
  notes: "",
};

export const defaultArticleMetadataDE: ArticleMetadata = {
  type: "",
  is19Inch: false,
  heightUnits: 0,
  case: { is19Inch: false, heightUnits: 0 },
  power: powerDE,
};

export const defaultEquipmentMetadataDE: EquipmentMetadata = {
  ...defaultArticleMetadataDE,
  canLeaveLocation: true,
};

export const defaultCustomerMetadataDE: CustomerMetadata = {
  name: "",
  firstName: "",
  lastName: "",
  preferredContactMethod: "email",
};

export const defaultJobMetadataDE: JobMetadata = {
  type: "",
  priority: "medium",
  status: "open",
};

export const toPrettyJSON = (obj: unknown) => JSON.stringify(obj, null, 2);

