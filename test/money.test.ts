import { describe, it, expect } from "vitest";
import { formatBaseUnits, toBaseUnits } from "../src/money.ts";

describe("money", () => {
  it("round-trips a decimal string", () => {
    expect(formatBaseUnits(toBaseUnits("12.5"))).toBe("12.5");
  });

  it("adds without float drift", () => {
    expect(formatBaseUnits(toBaseUnits("0.1") + toBaseUnits("0.2"))).toBe("0.3");
  });

  it("rejects a non-decimal amount", () => {
    expect(() => toBaseUnits("abc")).toThrow(/invalid amount/);
  });
});
