/**
 * Type definitions for JSON metadata fields used across the app.
 *
 * The shapes model common attributes for companies, articles, equipment, cases,
 * locations, customers, jobs and related entities. When a field is omitted on a
 * lower-level record, the UI may infer sensible defaults from the company level
 * (e.g. tax rate, currency, power specs).
 *
 * All measurements use metric units unless stated otherwise.
 */


/** Dimensions (centimeters). */
export type DimensionsCm = {
  /** Width in centimeters. */
  width: number;
  /** Height in centimeters. */
  height: number;
  /** Depth in centimeters; optional for small places (shelf/desk). */
  depth?: number;
};
/** Monetary value in company currency. */
export type Price = {
  /** Amount in smallest relevant unit; tax inclusion per `grossNet`. */
  amount: number;
  /** Whether `amount` includes tax (gross) or not (net). */
  grossNet: "gross" | "net";
  /** ISO 4217 currency code (e.g., EUR, CHF). */
  currency: string;
  /** Tax rate in percent (e.g., 19 for 19%). */
  taxRate: number;
  /** Optional discount in percent. */
  discount?: number;
};
/** Electrical power characteristics. */
export type Power = {
  /** Maximum continuous power in watts. */
  maxPowerW?: number;
  /** Source/type of power. */
  powerType: "AC" | "DC" | "PoE" | "Battery" | "Other";
  /** Voltage range, e.g., "220–240V". */
  voltageRangeV?: string;
  /** Frequency, e.g., "50Hz" or "50/60Hz". */
  frequencyHz?: string;
  /** Connector type, e.g., "IEC C13". */
  powerConnectorType?: string;
};
/** Contact method and address information. */
export type ContactInfo = {
  name?: string;
  email?: string;
  phone?: string;
  /** Whether this number supports Signal. */
  has_signal?: boolean;
  /** Whether this number supports WhatsApp. */
  has_whatsapp?: boolean;
  /** Whether this number supports Telegram. */
  has_telegram?: boolean;
  /** Role of this contact (Primary/Billing/Technical). */
  role?: string;
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  /** Freeform notes. */
  notes?: string;
  /** Personal or company website. */
  website?: string;
};
/** Simple external link with description. */
export type Website = {
  url: string;
  /** e.g., "Company Homepage", "Portfolio". */
  description?: string;
};

/** Individual person related to customers/jobs/companies. */
export interface Person {
  firstName: string;
  lastName: string;
  /** Associated company IDs. */
  companyId?: number[];
  /** Job title/role. */
  position?: string;
  /** Preferred pronouns (e.g., "she/her"). */
  pronouns?: string;
  /** ISO-8601 date string. */
  birthday?: string;
  /** German salutation (e.g., "Herr", "Frau"), optional. */
  anrede?: string;
  /** Freeform notes about the person. */
  notes?: string;
  /** Contact methods. */
  contactInfo?: ContactInfo[];
}

/** Company-level administrative metadata and defaults. */
export interface adminCompanyMetadata {
  phone?: string;
  website?: string;
  logoUrl?: string;
  contactInfo?: ContactInfo[];
  standardData: {
    /** Default VAT/GST rate for the company. */
    taxRate: number;
    /** Default currency (ISO 4217). */
    currency: string;
    /** Default location ID for newly created records. */
    defaultLocationId?: number;
    /** Default power specs for equipment/locations. */
    power: Power;
    person: Person;
  };
  customTypes: { articleTypes: string[], caseTypes: string[], locationTypes: string[] };
  taxNumber?: string;
  address?: string;
  industry?: string; // e.g., "IT Services", "Manufacturing"
  numberOfEmployees?: number;
  establishedYear?: number;
  notes?: string;
}

/**
 * Details for a business entity that may also appear in customer metadata.
 * This is not the DB table; it models embedded JSON metadata only.
 */
export interface Company {
    name: string;
  discountRate?: number;
  taxId?: string;
  vatId?: string;
  preferredContactMethod?: "email" | "phone" | "mail";
  contactInfo?: ContactInfo[];
  /** Employees with optional positions; structure may evolve. */
  employees?: [Person[], ...{position: string}[]];
  industry?: string; // e.g., "Retail", "Healthcare"
  businessType?: string; // e.g., "LLC", "Corporation", "Sole Proprietorship"
  establishedYear?: number;
  numberOfEmployees?: number;
  annualRevenue?: number; // in the company's currency
  socialMediaHandles?: { platform: string; handle: string }[]; // e.g., [{ platform: "Twitter", handle: "@company" }]
  notes?: string; // Additional notes about the company
}

/** Additional descriptors for an article (product). */
export interface ArticleMetadata {
    /** Custom article type string (company-defined). */
    type: string;
  manufacturer?: string;
  model?: string;
  manufacturerPartNumber?: string; // Part Number (MPN)
  EAN?: string; // European Article Number
  UPC?: string; // Universal Product Code
  canBeBookedWithoutStock?: boolean; // e.g., for consumables
  image?: string;
  case: {
    /** Whether the case is 19" rack based. */
    is19Inch: boolean;
    /** Height in rack units (U) if rack-based. */
    heightUnits: number;
    maxDeviceDepthCm?: number; // in cm
    hasLock?: boolean;
    innerDimensionsCm?: DimensionsCm;
    contentMaxWeightKg?: number; // in kg
    restrictedContentTypes?: string[]; // e.g., ["Electronics", "Cables"]; can also be used for expansion card slots!
  };
  fitsInRestrictedCaseTypes?: string[]; // e.g., "YAMAHA MINI Expansion Slot"
  /** Whether article itself is 19" rack mountable. */
  is19Inch: boolean;
  /** Height in rack units (U) if rack-mountable. */
  heightUnits: number;
  dimensionsCm?: DimensionsCm;
  weightKg?: number; // in kg
  connectivity?: string[]; // e.g., ["WiFi", "Bluetooth", "Ethernet"]
  interfaces?: string[]; // e.g., ["USB-C", "HDMI", "DisplayPort"]
  power: Power;
  /** Array of supplier tuples with optional price and website. */
  suppliers?: [(Company | Person), Price?, Website?][];
  dailyRentalRate?: Price; // in the company's currency
  notes?: string; // Additional notes about the article

}

/** Extra per-unit details for a physical equipment item. */
export interface EquipmentMetadata extends ArticleMetadata {
  serialNumber?: string;
  purchaseDate?: string; // ISO date string
  warrantyExpiry?: string; // ISO date string
  canLeaveLocation?: boolean; // e.g., for portable equipment
  maintenanceSchedule?: string; // e.g., "Every 6 months"
  supplier?: [(Company | Person), Price?, Website?];
  depreciationMethod?: "straight-line" | "declining-balance" | "sum-of-the-years-digits";
  depreciationPeriodMonths?: number; // in months
  assignedTo?: Person; // Person responsible for the equipment
    notes?: string; // Additional notes about the equipment
}

/** Optional notes for a case object. */
export interface CaseMetadata{
    /** Additional notes about the case. */
    note?: string;
}
/** Environmental and capacity descriptors for a location. */
export interface LocationMetadata {
  owner?: Company | Person; // Owner of the location
  isWorkshop?: boolean; //workshop locations can be used for repairs and maintenance
  maxWeightCapacityKg?: number; // in kg
  personCapacity?: number; // max number of people allowed
  hasClimateControl?: boolean;
  powerOutlets?: number; // number of available power outlets
  power?: Power[]; // available power specifications at the location
  dimensionsCm?: DimensionsCm; // overall dimensions of the location
}

/** Combined person/company fields for a customer entity. */
export type CustomerMetadata = Person & Company & {
  preferredContactMethod?: "email" | "phone" | "mail";
  customerSince?: string; // ISO date string
  }
/** Freeform job metadata stored under `jobs.meta`. */
export interface JobMetadata {
    /** Company-specific job type string. */
    type: string; //should be one of the company customTypes.jobTypes
  priority?: "low" | "medium" | "high" | "urgent";
  status?: "open" | "in-progress" | "on-hold" | "completed" | "cancelled";
  assignedTo?: Person[]; // Array of persons assigned to the job
  reportedBy?: Person; // Person who reported/created the job
  customer?: CustomerMetadata; // Customer related to the job
  location?: string; // Location where the job is to be performed
  actualStart?: string; // ISO date string
  actualEnd?: string; // ISO date string
    actualCost?: Price; // Actual cost incurred
    notes?: string; // Additional notes about the job
}
export type codeType = "QR" | "Barcode" | "None";
/** Prefix keys used for asset tag generation per entity type. */
export interface asset_tag_prefixes {
    [key: string]: string; // e.g., "EQP": "Equipment", "ART": "Article"
    case: "CA";
    location: "LO";
    customer: "CU";
    job: "JO";
    person: "PE";
    company: "CO";
    equipment: "EQ";
    article: "AR";
}
/** Printing template settings for asset tags/labels. */
export interface asset_tag_template_print {
    name: string; // Name of the tag template, e.g., "Standard Equipment Tag"
    description: string; // Description of the tag template
  prefix: asset_tag_prefixes; // Prefix for the asset tag, e.g., "EQP" for equipment
  numberLength: number; // Total length of the numeric part, e.g., 5 for "00001"
  suffix?: string; // Optional suffix for the asset tag, e.g., "A" for versioning
  numberingScheme: "sequential" | "random"; // Scheme for generating the numeric part
    stringTemplate: string; // Template string for generating tags, e.g., "{prefix}-{number}-{suffix}"
    svgFileId?: string; // ID of the SVG file for printing tags
    codeType: codeType; // Type of code to include on the tag
    codeSizeMm?: number; // Size of the code in mm, e.g., 20 for 20x20mm
    textSizePt?: number; // Font size for the text in points, e.g., 12pt
    tagWidthMm?: number; // Width of the tag in mm, e.g., 50mm
    tagHeightMm?: number; // Height of the tag in mm, e.g., 25mm
    marginMm?: number; // Margin around the tag content in mm, e.g., 2mm
    backgroundColor?: string; // Background color of the tag, e.g., "#FFFFFF" for white
    textColor?: string; // Text color of the tag, e.g., "#000000" for black
    borderColor?: string; // Border color of the tag, e.g., "#000000" for black
    borderWidthMm?: number; // Border width in mm, e.g
    generatorURL?: string; // URL of the tag generator service
    placeholders?: { [key: string]: string, tag: "tag", codeType: codeType,  }; // Placeholders for dynamic values in the generator URL and SVG
    isMonochrome?: boolean; // Whether the tag is monochrome (black and white) for printing
}
