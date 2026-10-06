import { describe, expect, it } from "vitest";

import { loginSchema, registerSchema } from "@/features/auth/schemas";

describe("loginSchema", () => {
  it("rejects an invalid email", async () => {
    await expect(
      loginSchema.validate({ email: "not-an-email", password: "secret123" }),
    ).rejects.toThrow("Email không hợp lệ");
  });

  it("requires a password", async () => {
    await expect(
      loginSchema.validate({ email: "buyer@example.com", password: "" }),
    ).rejects.toThrow("Vui lòng nhập mật khẩu");
  });
});

describe("registerSchema", () => {
  it("enforces a minimum password length of 8", async () => {
    await expect(
      registerSchema.validate({ fullName: "Người mua", email: "buyer@example.com", password: "short" }),
    ).rejects.toThrow("Mật khẩu tối thiểu 8 ký tự");
  });

  it("requires a full name", async () => {
    await expect(
      registerSchema.validate({ fullName: "  ", email: "buyer@example.com", password: "secret123" }),
    ).rejects.toThrow("Vui lòng nhập họ và tên");
  });
});
