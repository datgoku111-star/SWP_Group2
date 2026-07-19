import { describe, it, expect } from "vitest";
import hexToRGB from "@/utils/hexToRgb";

describe("hexToRGB", () => {
  it("should convert 3-digit hex values correctly", () => {
    expect(hexToRGB("#fff")).toBe("rgb(255,255,255)");
    expect(hexToRGB("#000")).toBe("rgb(0,0,0)");
    expect(hexToRGB("#f0a")).toBe("rgb(255,0,170)");
  });

  it("should convert 6-digit hex values correctly", () => {
    expect(hexToRGB("#ffffff")).toBe("rgb(255,255,255)");
    expect(hexToRGB("#000000")).toBe("rgb(0,0,0)");
    expect(hexToRGB("#ff00aa")).toBe("rgb(255,0,170)");
    expect(hexToRGB("#123456")).toBe("rgb(18,52,86)");
  });
});
