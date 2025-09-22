import { describe, it, expect } from "vitest";
import { buildAdminCompanyMetadata } from "@/lib/metadata/builders";
import { defaultAdminCompanyMetadataDE } from "@/lib/metadata/defaults";

describe("buildAdminCompanyMetadata", () => {
  it("uses defaults when fields missing", () => {
    const out = buildAdminCompanyMetadata({});
    expect(out.standardData.currency).toBe(defaultAdminCompanyMetadataDE.standardData.currency);
    expect(out.standardData.taxRate).toBe(defaultAdminCompanyMetadataDE.standardData.taxRate);
  });

  it("uppercases currency and keeps numeric tax", () => {
    const out = buildAdminCompanyMetadata({ standardData: { currency: "eur", taxRate: 19 } as unknown as typeof defaultAdminCompanyMetadataDE });
    expect(out.standardData.currency).toBe("EUR");
    expect(out.standardData.taxRate).toBe(19);
  });
});
