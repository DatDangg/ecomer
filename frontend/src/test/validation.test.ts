import { describe, expect, it } from "vitest";
import { object, string } from "yup";

import { toFieldErrors, toFieldErrorsFromApi } from "@/lib/validation";

describe("validation helpers", () => {
  it("map lỗi Yup thành field -> message đầu tiên", async () => {
    const schema = object({
      email: string().email("Email không đúng định dạng").required("Bắt buộc"),
      password: string().min(8, "Mật khẩu phải có ít nhất 8 ký tự").required("Bắt buộc"),
    });

    const error: unknown = await schema
      .validate({ email: "khong-phai-email", password: "123" }, { abortEarly: false })
      .catch((reason: unknown) => reason);

    expect(toFieldErrors(error)).toEqual({
      email: "Email không đúng định dạng",
      password: "Mật khẩu phải có ít nhất 8 ký tự",
    });
  });

  it("map errors từ envelope lỗi API", () => {
    expect(
      toFieldErrorsFromApi([
        { field: "email", message: "Email không đúng định dạng" },
        { field: "password", message: "Mật khẩu phải có ít nhất 8 ký tự" },
      ]),
    ).toEqual({
      email: "Email không đúng định dạng",
      password: "Mật khẩu phải có ít nhất 8 ký tự",
    });
  });

  it("trả về rỗng khi input không phải ValidationError", () => {
    expect(toFieldErrors(new Error("boom"))).toEqual({});
    expect(toFieldErrorsFromApi(undefined)).toEqual({});
  });
});
