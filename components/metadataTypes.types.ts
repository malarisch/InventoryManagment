// In this file, we define TypeScript types and interfaces for various metadata structures used in the inventory management system.
// These types help ensure consistent data representation across the application.
// Fields that are not set shall be inferred from higher entities in the hierarchy, e.g., Company defaults for Articles, Equipment, Locations, Cases, Customers, Jobs, Persons.

// Note: All dimensions are in metric units (cm, kg, etc.) for consistency.


type DimensionsCm = {
  width: number; // in cm
  height: number; // in cm
  depth?: number; // in cm; optional for small Locations like shelves or desks.
};
type Price = {
  amount: number; // in the company's currency without Taxes
  grossNet: "gross" | "net"; // indicates if the amount is gross (with tax) or net (without tax)
  currency: string; // ISO 4217 currency code, e.g., "USD", "EUR"
  taxRate: number; // in percentage, e.g., 19 for 19%
  discount?: number; // in percentage, e.g., 10 for 10%
};
type Power = {
  maxPowerW?: number; // in Watts
  powerType: "AC" | "DC" | "PoE" | "Battery" | "Other";
  voltageRangeV?: string; // e.g., "100-240V"
  frequencyHz?: string; // e.g., "50/60Hz"
  powerConnectorType?: string; // e.g., "IEC C13", "NEMA 5-15"
};
type contactInfo = {
  name?: string;
  email?: string;
  phone?: string;
  has_signal?: boolean; // for phone numbers
  has_whatsapp?: boolean; // for phone numbers
  has_telegram?: boolean; // for phone numbers
  role?: string; // e.g., "Primary", "Billing", "Technical"
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
    notes?: string; // Additional notes about the contact method
    website?: string; // e.g., personal or company website
};
type Website = {
  url: string;
  description?: string; // e.g., "Company Homepage", "Portfolio"
};

export interface Person {
  firstName: string;
  lastName: string;
  companyId?: number[]; // ID of the associated company
  position?: string; // e.g., "Manager", "Technician"
  pronouns?: string; // e.g., "he/him", "she/her", "they/them"
  birthday?: string; // ISO date string
  anrede?: string; // e.g., "Mr.", "Ms.", "Dr."
  notes?: string; // Additional notes about the person
  contactInfo?: contactInfo[]; // Array of contact information objects
}

export interface adminCompanyMetadata {
  phone?: string;
  website?: string;
  logoUrl?: string;
  contactInfo?: contactInfo[];
  standardData: {
    taxRate: number; // in percentage, e.g., 19 for 19%
    currency: string; // ISO 4217 currency code, e.g., "USD", "EUR"
    defaultLocationId?: number; // ID of the default location for the company
    power: Power; // Standard power specifications for the company
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

export interface Company {
    name: string;
  discountRate?: number;
  taxId?: string;
  vatId?: string;
  preferredContactMethod?: "email" | "phone" | "mail";
  contactInfo?: contactInfo[];
  employees?: [Person[], ...{position: string}[]]; // Array of employees with their positions
  industry?: string; // e.g., "Retail", "Healthcare"
  businessType?: string; // e.g., "LLC", "Corporation", "Sole Proprietorship"
  establishedYear?: number;
  numberOfEmployees?: number;
  annualRevenue?: number; // in the company's currency
  socialMediaHandles?: { platform: string; handle: string }[]; // e.g., [{ platform: "Twitter", handle: "@company" }]
  notes?: string; // Additional notes about the company
}

export interface ArticleMetadata {
    type: string; //should be one of the company customTypes.articleTypes
  manufacturer?: string;
  model?: string;
  manufacturerPartNumber?: string; // Part Number (MPN)
  EAN?: string; // European Article Number
  UPC?: string; // Universal Product Code
  canBeBookedWithoutStock?: boolean; // e.g., for consumables
  image?: string;
  case: {
    is19Inch: boolean;
    heightUnits: number; // in U for 19" Equipment. Only available if is19Inch is true.
    maxDeviceDepthCm?: number; // in cm
    hasLock?: boolean;
    innerDimensionsCm?: DimensionsCm;
    contentMaxWeightKg?: number; // in kg
    restrictedContentTypes?: string[]; // e.g., ["Electronics", "Cables"]; can also be used for expansion card slots!
  };
  fitsInRestrictedCaseTypes?: string[]; // e.g., "YAMAHA MINI Expansion Slot"
  is19Inch: boolean;
  heightUnits: number; // Height in Rack units. Only available if is19Inch is true.
  dimensionsCm?: DimensionsCm;
  weightKg?: number; // in kg
  connectivity?: string[]; // e.g., ["WiFi", "Bluetooth", "Ethernet"]
  interfaces?: string[]; // e.g., ["USB-C", "HDMI", "DisplayPort"]
  power: Power;
  suppliers?: [(Company | Person), Price?, Website?][]; // Array of tuples with supplier (Company or Person) and price details
  dailyRentalRate?: Price; // in the company's currency
  notes?: string; // Additional notes about the article

}

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

export interface CaseMetadata{
    note?: string; // Additional notes about the case
}
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

export type CustomerMetadata = Person & Company & {
  preferredContactMethod?: "email" | "phone" | "mail";
  customerSince?: string; // ISO date string
  }
export interface JobMetadata {
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