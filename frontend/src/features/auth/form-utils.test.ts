import { describe, expect, it } from "vitest";

import { resolveSafeRedirect } from "@/features/auth/form-utils";

describe("resolveSafeRedirect", () => {
  it("falls back to the product listing when no return path is provided", () => {
    expect(resolveSafeRedirect(undefined)).toBe("/products");
    expect(resolveSafeRedirect(null)).toBe("/products");
    expect(resolveSafeRedirect(42)).toBe("/products");
  });

  it("keeps a safe internal path", () => {
    expect(resolveSafeRedirect("/cart")).toBe("/cart");
    expect(resolveSafeRedirect("/orders/my/123?tab=paid")).toBe("/orders/my/123?tab=paid");
  });

  it("rejects external and protocol-relative targets", () => {
    expect(resolveSafeRedirect("https://evil.example/steal")).toBe("/products");
    expect(resolveSafeRedirect("//evil.example")).toBe("/products");
    expect(resolveSafeRedirect("cart")).toBe("/products");
  });

  it("rejects auth entry paths to avoid redirect loops", () => {
    expect(resolveSafeRedirect("/login")).toBe("/products");
    expect(resolveSafeRedirect("/register?from=/cart")).toBe("/products");
  });
});
