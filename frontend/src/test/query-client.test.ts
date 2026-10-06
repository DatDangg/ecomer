import { describe, expect, it } from "vitest";

import { ApiRequestError } from "@/lib/api-client";
import { shouldRetryQuery } from "@/lib/query-client";

describe("shouldRetryQuery", () => {
  it("không retry lỗi 4xx", () => {
    expect(shouldRetryQuery(0, new ApiRequestError("Không tìm thấy", { status: 404 }))).toBe(false);
    expect(shouldRetryQuery(0, new ApiRequestError("Sai quyền", { status: 403 }))).toBe(false);
  });

  it("retry lỗi 5xx/mạng tối đa 2 lần", () => {
    const serverError = new ApiRequestError("Lỗi server", { status: 500 });

    expect(shouldRetryQuery(0, serverError)).toBe(true);
    expect(shouldRetryQuery(1, serverError)).toBe(true);
    expect(shouldRetryQuery(2, serverError)).toBe(false);
  });
});
