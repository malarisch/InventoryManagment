import { describe, it, expect } from "vitest";
import { normalizeAdminCompanyMetadata, powerPlaceholders } from "@/lib/metadata/inherit";
import { defaultAdminCompanyMetadataDE } from "@/lib/metadata/defaults";

describe("metadata inheritance", () => {
  it("normalizes undefined to defaults", () => {
    const out = normalizeAdminCompanyMetadata(null);
    expect(out.standardData.currency).toBe("EUR");
    expect(out.standardData.taxRate).toBe(19);
  });

  it("merges nested power correctly", () => {
    const meta = {
      ...defaultAdminCompanyMetadataDE,
      standardData: {
        ...defaultAdminCompanyMetadataDE.standardData,
        power: { ...defaultAdminCompanyMetadataDE.standardData.power, powerType: "DC" },
      },
    };
    const out = normalizeAdminCompanyMetadata(meta);
    expect(powerPlaceholders(out).powerType).toBe("DC");
    expect(powerPlaceholders(out).voltageRangeV).toBeDefined();
  });
});

