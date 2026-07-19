import { describe, it, expect } from "vitest";
import convertNumbThousand from "@/utils/convertNumbThousand";

describe("convertNumbThousand", () => {
  it("should return '0' if input is undefined, null, 0 or falsy", () => {
    expect(convertNumbThousand()).toBe("0");
    expect(convertNumbThousand(0)).toBe("0");
  });

  it("should format numbers with comma separators", () => {
    expect(convertNumbThousand(1000)).toBe("1,000");
    expect(convertNumbThousand(1000000)).toBe("1,000,000");
    expect(convertNumbThousand(1234567.89)).toBe("1,234,567.89");
  });

  it("should handle negative numbers", () => {
    expect(convertNumbThousand(-5000)).toBe("-5,000");
  });
});
