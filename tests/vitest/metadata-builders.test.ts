import {describe, expect, it} from "vitest";
import {buildCustomerMetadata, buildEquipmentMetadata} from "@/lib/metadata/builders";
import {defaultCustomerMetadataDE} from "@/lib/metadata/defaults";

describe("metadata builders", () => {
  it("buildCustomerMetadata merges defaults and overrides", () => {
    const out = buildCustomerMetadata({ firstName: "Max", lastName: "Mustermann", preferredContactMethod: "phone" });
    expect(out.firstName).toBe("Max");
    expect(out.lastName).toBe("Mustermann");
    expect(out.preferredContactMethod).toBe("phone");
    expect(out.name).toBe(defaultCustomerMetadataDE.name);
  });

  it("buildEquipmentMetadata merges nested power object without clobbering", () => {
    const out = buildEquipmentMetadata({ type: "Camera", power: { powerType: "DC" } });
    expect(out.type).toBe("Camera");
    expect(out.power?.powerType).toBe("DC");
    // voltageRangeV remains undefined unless provided in input or company defaults at runtime
    expect(out.power?.voltageRangeV).toBeUndefined();
  });
});

