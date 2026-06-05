import { describe, it, expect } from "vitest";
import { canTransition, isTerminal, transition } from "../../src/intent/lifecycle.ts";

describe("payment intent lifecycle", () => {
  it("walks the happy path pending -> settled", () => {
    expect(transition("pending", "authorized")).toBe("authorized");
    expect(transition("authorized", "executing")).toBe("executing");
    expect(transition("executing", "settled")).toBe("settled");
  });

  it("allows revoke only before execution", () => {
    expect(canTransition("pending", "revoked")).toBe(true);
    expect(canTransition("authorized", "revoked")).toBe(true);
    expect(canTransition("executing", "revoked")).toBe(false);
  });

  it("rejects skipping states", () => {
    expect(() => transition("pending", "settled")).toThrow(/invalid/);
  });

  it("rejects leaving a terminal state", () => {
    expect(isTerminal("settled")).toBe(true);
    expect(isTerminal("failed")).toBe(true);
    expect(isTerminal("revoked")).toBe(true);
    expect(isTerminal("pending")).toBe(false);
    expect(() => transition("settled", "executing")).toThrow(/invalid/);
  });
});
