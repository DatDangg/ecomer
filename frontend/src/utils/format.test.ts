import { describe, expect, it } from "vitest";

import { formatNumber, formatVnd } from "@/utils/format";

describe("formatVnd", () => {
  it("formats a VNĐ amount with vi-VN digit grouping and currency symbol", () => {
    const result = formatVnd(1234567);

    expect(result).toContain("1.234.567");
    expect(result).toContain("₫");
  });

  it("formats a plain count with vi-VN digit grouping", () => {
    expect(formatNumber(1234567)).toBe("1.234.567");
  });
});
