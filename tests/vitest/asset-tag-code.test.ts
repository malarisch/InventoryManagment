import { describe, it, expect } from "vitest";
import { buildAssetTagCode, type AssetTagEntityType } from "@/lib/asset-tags/code";
import type { adminCompanyMetadata, asset_tag_template_print } from "@/components/metadataTypes.types";

function makeMeta(overrides: Partial<adminCompanyMetadata> = {}): adminCompanyMetadata {
  // Minimal, type-correct company metadata for tests
  const base: adminCompanyMetadata = {
    standardData: {
      taxRate: 0,
      currency: "EUR",
      power: { powerType: "AC" },
      person: { firstName: "Test", lastName: "User" },
    },
    customTypes: { articleTypes: [], caseTypes: [], locationTypes: [] },
    companyWidePrefix: "",
    assetTagArticlePrefix: "AR",
    assetTagEquipmentPrefix: "EQ",
    assetTagCasePrefix: "CA",
    assetTagLocationPrefix: "LO",
  };
  return { ...base, ...overrides } as adminCompanyMetadata;
}

function makeTemplate(overrides: Partial<asset_tag_template_print> = {}): asset_tag_template_print {
  const base: asset_tag_template_print = {
    name: "Default",
    description: "Test template",
    prefix: "EQ",
    numberLength: 5,
    numberingScheme: "sequential",
    stringTemplate: "{company-prefix}-{prefix}-{code}{suffix}",
    codeType: "QR",
  };
  return { ...base, ...overrides } as asset_tag_template_print;
}

describe("buildAssetTagCode (template stringTemplate)", () => {
  it("replaces {company-prefix}, {prefix}, {code}, {suffix} and pads the number", () => {
    const meta = makeMeta({ companyWidePrefix: "ACME" });
    const template = makeTemplate({ prefix: "EQ", suffix: "A", numberLength: 5 });
    const result = buildAssetTagCode(meta, "equipment", 42, template);
    expect(result).toBe("ACME-EQ-00042A");
  });

  it("works when some placeholders are empty or missing (no suffix)", () => {
    const meta = makeMeta({ companyWidePrefix: "ACME" });
    const template = makeTemplate({ prefix: "EQ", suffix: undefined, numberLength: 4 });
    const result = buildAssetTagCode(meta, "equipment", 7, template);
    expect(result).toBe("ACME-EQ-0007");
  });

  it("supports custom template ignoring meta/entity defaults when provided", () => {
    const meta = makeMeta({ companyWidePrefix: "CO" });
    const template = makeTemplate({ stringTemplate: "TAG-{code}", numberLength: 3 });
    const result = buildAssetTagCode(meta, "article", 9, template);
    // Should ignore company/entity prefix because template path short-circuits
    expect(result).toBe("TAG-009");
  });

  it("returns empty string if stringTemplate is empty (current behavior)", () => {
    const meta = makeMeta({ companyWidePrefix: "ACME" });
    const template = makeTemplate({ stringTemplate: "" });
    const result = buildAssetTagCode(meta, "equipment", 123, template);
    expect(result).toBe("");
  });
});

describe("buildAssetTagCode (fallback without template)", () => {
  const entity: AssetTagEntityType = "equipment";

  it("company + entity prefix + id: CO-EQ-42", () => {
    const meta = makeMeta({ companyWidePrefix: "CO" });
    const result = buildAssetTagCode(meta, entity, 42);
    expect(result).toBe("CO-EQ-42");
  });

  it("only entity prefix + id: EQ-42 when no company prefix", () => {
    const meta = makeMeta({ companyWidePrefix: "" });
    const result = buildAssetTagCode(meta, entity, 42);
    expect(result).toBe("EQ-42");
  });

  it("just id when neither company nor entity prefix present", () => {
    const meta = makeMeta({ companyWidePrefix: "", assetTagEquipmentPrefix: "" });
    const result = buildAssetTagCode(meta, entity, 42);
    expect(result).toBe("42");
  });
});

