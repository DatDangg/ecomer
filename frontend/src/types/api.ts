/**
 * Shared API contract types — phản chiếu envelope bất biến của backend
 * (`docs/API_SPEC.md`): `{ success, data, message }` khi thành công,
 * `{ success: false, message, errors? }` khi lỗi.
 */

export interface ApiResponse<T> {
  success: true;
  data: T;
  message: string;
}

/** Lỗi validation theo field do backend trả trong `errors`. */
export interface ApiFieldError {
  field: string;
  message: string;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: ApiFieldError[];
}

/** Envelope đầy đủ của một response trước khi unwrap. */
export type ApiEnvelope<T> = ApiResponse<T> | ApiError;

/** Payload phân trang chuẩn nằm trong `data` của endpoint danh sách. */
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
