import axios, {
  type AxiosError,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";

import { useAuthStore } from "@/stores/auth.store";
import type { ApiEnvelope, ApiFieldError } from "@/types/api";

/**
 * Axios instance dùng chung. `baseURL` đã bao gồm `/api/v1` (xem `.env.example`).
 * Response interceptor KHÔNG unwrap để giữ type axios trung thực; dùng các helper
 * `apiGet/apiPost/apiPatch/apiDelete` bên dưới để nhận thẳng `data` đã envelope.
 */
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 20_000,
  headers: { "Content-Type": "application/json" },
});

export class ApiRequestError extends Error {
  readonly status?: number;
  readonly errors?: ApiFieldError[];

  constructor(message: string, options: { status?: number; errors?: ApiFieldError[] } = {}) {
    super(message);
    this.name = "ApiRequestError";
    this.status = options.status;
    this.errors = options.errors;
  }
}

/** Cho phép app (hoặc test) thay cách điều hướng khi session hết hạn. */
let unauthorizedRedirect: () => void = () => {
  window.location.assign("/login");
};

export function setUnauthorizedRedirect(handler: () => void): void {
  unauthorizedRedirect = handler;
}

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const { accessToken, sessionGeneration } = useAuthStore.getState();

  // Bind request vào session lúc dispatch. Retry giữ nguyên giá trị gốc (không ghi đè)
  // để 401 muộn vẫn bị nhận diện là request của session cũ.
  if (config.__sessionGeneration === undefined) {
    config.__sessionGeneration = sessionGeneration;
  } else if (config.__sessionGeneration !== sessionGeneration) {
    // Session đã đổi (logout/login tài khoản khác) sau khi request/retry được lên lịch:
    // chặn NGAY TẠI dispatch, trước khi gắn bearer, để không bao giờ gửi request cũ
    // bằng token của session mới (đóng cửa sổ TOCTOU giữa check và dispatch).
    throw new axios.CanceledError(
      "Yêu cầu thuộc phiên đăng nhập đã kết thúc",
    );
  }

  if (accessToken && !config.skipAuthRefresh) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

/** Single-flight theo session generation: nhiều 401 cùng session chỉ refresh một lần. */
let activeRefresh: { generation: number; promise: Promise<string> } | null = null;

function refreshAccessTokenOnce(refreshToken: string, generation: number): Promise<string> {
  if (!activeRefresh || activeRefresh.generation !== generation) {
    const promise = requestNewAccessToken(refreshToken, generation).finally(() => {
      if (activeRefresh?.generation === generation) {
        activeRefresh = null;
      }
    });
    activeRefresh = { generation, promise };
  }

  return activeRefresh.promise;
}

async function requestNewAccessToken(refreshToken: string, generation: number): Promise<string> {
  try {
    const response = await apiClient.post<ApiEnvelope<{ accessToken: string }>>(
      "/auth/refresh",
      { refreshToken },
      { skipAuthRefresh: true },
    );
    const body = response.data;

    if (!body.success) {
      throw new ApiRequestError(body.message, { status: response.status, errors: body.errors });
    }

    // Session có thể đã đổi (logout/login) trong lúc chờ refresh → không hồi sinh token cũ.
    const applied = useAuthStore.getState().tokenRefreshed(body.data.accessToken, generation);
    if (!applied) {
      throw new ApiRequestError("Phiên đăng nhập đã thay đổi trong lúc làm mới token", {
        status: 401,
      });
    }

    return body.data.accessToken;
  } catch (error) {
    throw toApiRequestError(error);
  }
}

function expireSession(): void {
  const { accessToken, refreshToken, logout } = useAuthStore.getState();
  logout();

  // Chỉ điều hướng khi thực sự có session bị mất — tránh redirect lặp vô hạn.
  if (accessToken || refreshToken) {
    unauthorizedRedirect();
  }
}

async function handleResponseError(error: AxiosError): Promise<AxiosResponse> {
  const config = error.config;
  const status = error.response?.status;

  if (status !== 401 || !config || config.skipAuthRefresh) {
    throw error;
  }

  const currentGeneration = useAuthStore.getState().sessionGeneration;

  // Request thuộc session cũ (đã logout/login tài khoản khác) → reject ngay,
  // KHÔNG refresh, KHÔNG retry, KHÔNG clear session mới.
  if (config.__sessionGeneration !== currentGeneration) {
    throw error;
  }

  // Retry của chính session hiện tại vẫn 401 → session hết hiệu lực.
  if (config._retry) {
    expireSession();
    throw error;
  }

  const { refreshToken } = useAuthStore.getState();
  if (!refreshToken) {
    expireSession();
    throw error;
  }

  const accessToken = await refreshAccessTokenOnce(refreshToken, currentGeneration).catch(
    (refreshError: unknown) => {
      // Chỉ clear session nếu refresh fail cho chính session hiện tại. Nếu session đã
      // đổi (logout/login tài khoản khác) thì giữ nguyên session mới.
      if (useAuthStore.getState().sessionGeneration === currentGeneration) {
        expireSession();
      }
      throw refreshError;
    },
  );

  // Session đổi trong lúc chờ refresh → reject request cũ, không retry trong session mới.
  if (useAuthStore.getState().sessionGeneration !== currentGeneration) {
    throw error;
  }

  config._retry = true;
  config.headers.Authorization = `Bearer ${accessToken}`;
  return apiClient.request(config);
}

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (!axios.isAxiosError(error)) {
      throw error;
    }

    return handleResponseError(error);
  },
);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readFieldErrors(value: unknown): ApiFieldError[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const fieldErrors: ApiFieldError[] = [];
  for (const item of value) {
    if (isRecord(item) && typeof item.field === "string" && typeof item.message === "string") {
      fieldErrors.push({ field: item.field, message: item.message });
    }
  }

  return fieldErrors.length > 0 ? fieldErrors : undefined;
}

function toApiRequestError(error: unknown): ApiRequestError {
  if (error instanceof ApiRequestError) {
    return error;
  }

  if (axios.isAxiosError(error)) {
    const body = error.response?.data;
    const message = isRecord(body) && typeof body.message === "string" ? body.message : error.message;
    const errors = isRecord(body) ? readFieldErrors(body.errors) : undefined;
    return new ApiRequestError(message, { status: error.response?.status, errors });
  }

  if (error instanceof Error) {
    return new ApiRequestError(error.message);
  }

  return new ApiRequestError("Đã xảy ra lỗi không xác định");
}

/** Trạng thái HTTP của lỗi (nếu có) — dùng cho retry policy của TanStack Query. */
export function getApiErrorStatus(error: unknown): number | undefined {
  if (error instanceof ApiRequestError) {
    return error.status;
  }

  if (axios.isAxiosError(error)) {
    return error.response?.status;
  }

  return undefined;
}

async function requestData<T>(config: AxiosRequestConfig): Promise<T> {
  try {
    const response = await apiClient.request<ApiEnvelope<T>>(config);
    const body = response.data;

    if (!body.success) {
      throw new ApiRequestError(body.message, { status: response.status, errors: body.errors });
    }

    return body.data;
  } catch (error) {
    throw toApiRequestError(error);
  }
}

export function apiGet<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  return requestData<T>({ ...config, method: "GET", url });
}

export function apiPost<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  return requestData<T>({ ...config, method: "POST", url, data });
}

export function apiPatch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  return requestData<T>({ ...config, method: "PATCH", url, data });
}

export function apiDelete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  return requestData<T>({ ...config, method: "DELETE", url });
}
