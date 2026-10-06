import { ValidationError } from "yup";

import type { ApiError } from "@/types/api";

export type FieldErrors = Record<string, string>;

/**
 * Chuyển lỗi Yup (`ValidationError.inner`) thành map `field -> message`
 * (lấy message đầu tiên cho mỗi field). Dùng để đưa vào `Formik.setErrors`.
 */
export function toFieldErrors(error: unknown): FieldErrors {
  const fieldErrors: FieldErrors = {};

  if (!(error instanceof ValidationError)) {
    return fieldErrors;
  }

  for (const issue of error.inner) {
    const path = issue.path;
    if (path && fieldErrors[path] === undefined) {
      fieldErrors[path] = issue.message;
    }
  }

  return fieldErrors;
}

/** Chuyển `errors` từ envelope lỗi API thành map `field -> message` cho Formik. */
export function toFieldErrorsFromApi(errors: ApiError["errors"]): FieldErrors {
  const fieldErrors: FieldErrors = {};

  for (const issue of errors ?? []) {
    if (fieldErrors[issue.field] === undefined) {
      fieldErrors[issue.field] = issue.message;
    }
  }

  return fieldErrors;
}

/** Field lỗi đầu tiên theo thứ tự hiển thị — dùng để focus field không hợp lệ. */
export function firstInvalidField(errors: object, order: readonly string[]): string | undefined {
  const record = errors as Record<string, unknown>;
  return order.find((field) => Boolean(record[field]));
}
