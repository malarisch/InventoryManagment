import {describe, expect, it} from "vitest";
import {buildCustomerMetadata, buildEquipmentMetadata} from "@/lib/metadata/builders";
import {defaultCustomerMetadataDE, defaultEquipmentMetadataDE} from "@/lib/metadata/defaults";

describe("metadata builders", () => {
  it("buildCustomerMetadata merges defaults and overrides", () => {
    const out = buildCustomerMetadata({ firstName: "Max", lastName: "Mustermann", preferredContactMethod: "phone" });
    expect(out.firstName).toBe("Max");
    expect(out.lastName).toBe("Mustermann");
    expect(out.preferredContactMethod).toBe("phone");
    expect(out.name).toBe(defaultCustomerMetadataDE.name);
  });

  it("buildEquipmentMetadata merges nested power defaults", () => {
    const out = buildEquipmentMetadata({ type: "Camera", power: { powerType: "DC" } });
    expect(out.type).toBe("Camera");
    expect(out.power!.powerType).toBe("DC");
    // still keeps default voltage if not provided
    expect(out.power!.voltageRangeV).toBe(defaultEquipmentMetadataDE.power!.voltageRangeV);
  });
});

