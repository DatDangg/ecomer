import MockAdapter from "axios-mock-adapter";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiRequestError, apiGet, apiClient, setUnauthorizedRedirect } from "@/lib/api-client";
import { useAuthStore, type AuthUser } from "@/stores/auth.store";

const customer: AuthUser = {
  id: "customer-1",
  email: "buyer@example.com",
  fullName: "Người mua",
  role: "customer",
  shopName: "Gian hàng của Người mua",
};

const otherCustomer: AuthUser = {
  id: "customer-2",
  email: "other@example.com",
  fullName: "Người khác",
  role: "customer",
  shopName: null,
};

const mock = new MockAdapter(apiClient);

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
}

/** Promise có thể resolve thủ công để điều khiển chính xác thời điểm response về. */
function createDeferred<T>(): Deferred<T> {
  let resolveFn: ((value: T) => void) | undefined;
  const promise = new Promise<T>((resolve) => {
    resolveFn = resolve;
  });

  return {
    promise,
    resolve: (value: T) => resolveFn?.(value),
  };
}

function signIn(accessToken: string, refreshToken: string | null): void {
  useAuthStore.setState({ user: customer, accessToken, refreshToken });
}

describe("apiClient", () => {
  beforeEach(() => {
    mock.reset();
    setUnauthorizedRedirect(() => {});
    signIn("expired-access", "refresh-token");
  });

  afterEach(() => {
    mock.reset();
  });

  it("gắn access token vào header Authorization của request", async () => {
    mock.onGet("/users/me").reply((config) => {
      expect(config.headers?.Authorization).toBe("Bearer expired-access");
      return [200, { success: true, data: { id: "customer-1" }, message: "ok" }];
    });

    await expect(apiGet("/users/me")).resolves.toEqual({ id: "customer-1" });
  });

  it("401 → refresh một lần → retry request gốc và trả data đã unwrap", async () => {
    const redirect = vi.fn();
    setUnauthorizedRedirect(redirect);

    let productCalls = 0;
    mock.onGet("/products").reply((config) => {
      productCalls += 1;

      if (config.headers?.Authorization === "Bearer fresh-access") {
        return [200, { success: true, data: { items: [] }, message: "ok" }];
      }

      return [401, { success: false, message: "Token hết hạn" }];
    });
    mock.onPost("/auth/refresh").reply(200, {
      success: true,
      data: { accessToken: "fresh-access" },
      message: "ok",
    });

    await expect(apiGet("/products")).resolves.toEqual({ items: [] });

    expect(productCalls).toBe(2);
    expect(mock.history.post).toHaveLength(1);
    expect(useAuthStore.getState().accessToken).toBe("fresh-access");
    expect(redirect).not.toHaveBeenCalled();
  });

  it("gộp nhiều 401 đồng thời thành một lần gọi /auth/refresh", async () => {
    mock.onPost("/auth/refresh").reply(200, {
      success: true,
      data: { accessToken: "fresh-access" },
      message: "ok",
    });
    mock.onGet("/products").reply((config) => {
      if (config.headers?.Authorization === "Bearer fresh-access") {
        return [200, { success: true, data: { items: [] }, message: "ok" }];
      }
      return [401, { success: false, message: "Token hết hạn" }];
    });
    mock.onGet("/categories").reply((config) => {
      if (config.headers?.Authorization === "Bearer fresh-access") {
        return [200, { success: true, data: { items: [] }, message: "ok" }];
      }
      return [401, { success: false, message: "Token hết hạn" }];
    });

    await Promise.all([apiGet("/products"), apiGet("/categories")]);

    const refreshCalls = mock.history.post.filter((request) => request.url === "/auth/refresh");
    expect(refreshCalls).toHaveLength(1);
  });

  it("refresh fail → clear session + redirect /login", async () => {
    const redirect = vi.fn();
    setUnauthorizedRedirect(redirect);

    mock.onGet("/products").reply(401, { success: false, message: "Token hết hạn" });
    mock.onPost("/auth/refresh").reply(401, { success: false, message: "Refresh token hết hạn" });

    await expect(apiGet("/products")).rejects.toBeInstanceOf(ApiRequestError);

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
    expect(redirect).toHaveBeenCalledTimes(1);
  });

  it("không gọi refresh khi không có refresh token, chỉ clear session", async () => {
    const redirect = vi.fn();
    setUnauthorizedRedirect(redirect);
    signIn("expired-access", null);

    mock.onGet("/products").reply(401, { success: false, message: "Token hết hạn" });

    await expect(apiGet("/products")).rejects.toBeInstanceOf(ApiRequestError);

    expect(mock.history.post).toHaveLength(0);
    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(redirect).toHaveBeenCalledTimes(1);
  });

  it("giữ session khi request retry lỗi 5xx sau refresh thành công", async () => {
    const redirect = vi.fn();
    setUnauthorizedRedirect(redirect);

    mock.onPost("/auth/refresh").reply(200, {
      success: true,
      data: { accessToken: "fresh-access" },
      message: "ok",
    });

    let productCalls = 0;
    mock.onGet("/products").reply((config) => {
      productCalls += 1;

      if (config.headers?.Authorization === "Bearer fresh-access") {
        return [500, { success: false, message: "Lỗi server" }];
      }

      return [401, { success: false, message: "Token hết hạn" }];
    });

    await expect(apiGet("/products")).rejects.toMatchObject({ status: 500 });

    expect(productCalls).toBe(2);
    expect(useAuthStore.getState().accessToken).toBe("fresh-access");
    expect(redirect).not.toHaveBeenCalled();
  });

  it("không hồi sinh token cũ khi logout xảy ra trong lúc refresh đang chờ", async () => {
    const redirect = vi.fn();
    setUnauthorizedRedirect(redirect);

    mock.onPost("/auth/refresh").reply(() => {
      // Logout xảy ra khi refresh đang in-flight, trước khi response hoàn tất.
      useAuthStore.getState().logout();
      return [200, { success: true, data: { accessToken: "stale-access" }, message: "ok" }];
    });

    let productCalls = 0;
    mock.onGet("/products").reply(() => {
      productCalls += 1;
      return [401, { success: false, message: "Token hết hạn" }];
    });

    await expect(apiGet("/products")).rejects.toBeInstanceOf(ApiRequestError);

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
    expect(productCalls).toBe(1);
    expect(redirect).not.toHaveBeenCalled();
  });

  it("không ghi đè token tài khoản mới khi account switch trong lúc refresh đang chờ", async () => {
    mock.onPost("/auth/refresh").reply(() => {
      useAuthStore.getState().login({
        user: otherCustomer,
        accessToken: "new-account-access",
        refreshToken: "new-account-refresh",
      });
      return [200, { success: true, data: { accessToken: "stale-access" }, message: "ok" }];
    });

    let productCalls = 0;
    mock.onGet("/products").reply((config) => {
      productCalls += 1;

      if (config.headers?.Authorization === "Bearer new-account-access") {
        return [200, { success: true, data: { items: [] }, message: "ok" }];
      }

      return [401, { success: false, message: "Token hết hạn" }];
    });

    await expect(apiGet("/products")).rejects.toBeInstanceOf(ApiRequestError);

    const state = useAuthStore.getState();
    expect(state.accessToken).toBe("new-account-access");
    expect(state.refreshToken).toBe("new-account-refresh");
    expect(state.user?.id).toBe("customer-2");
    expect(productCalls).toBe(1);
  });

  it("reject request A khi account switch xảy ra trước khi 401 ban đầu được xử lý", async () => {
    const redirect = vi.fn();
    setUnauthorizedRedirect(redirect);

    const responseGate = createDeferred<[number, unknown]>();
    const requestReceived = createDeferred<void>();

    let productCalls = 0;
    mock.onGet("/products").reply(() => {
      productCalls += 1;
      requestReceived.resolve();
      return responseGate.promise;
    });
    mock.onPost("/auth/refresh").reply(200, {
      success: true,
      data: { accessToken: "fresh-access" },
      message: "ok",
    });

    const requestPromise = apiGet("/products");
    await requestReceived.promise;

    // Account switch trước khi 401 của request A được xử lý.
    useAuthStore.getState().login({
      user: otherCustomer,
      accessToken: "new-account-access",
      refreshToken: "new-account-refresh",
    });
    responseGate.resolve([401, { success: false, message: "Token hết hạn" }]);

    await expect(requestPromise).rejects.toBeInstanceOf(ApiRequestError);

    expect(productCalls).toBe(1);
    expect(mock.history.post).toHaveLength(0);
    const state = useAuthStore.getState();
    expect(state.accessToken).toBe("new-account-access");
    expect(state.user?.id).toBe("customer-2");
    expect(redirect).not.toHaveBeenCalled();
  });

  it("không logout session B khi retry của account A trả 401 muộn sau account switch", async () => {
    const redirect = vi.fn();
    setUnauthorizedRedirect(redirect);

    const retryGate = createDeferred<[number, unknown]>();
    const retryReceived = createDeferred<void>();

    mock.onPost("/auth/refresh").reply(200, {
      success: true,
      data: { accessToken: "fresh-access" },
      message: "ok",
    });

    let productCalls = 0;
    mock.onGet("/products").reply((config) => {
      productCalls += 1;

      if (config.headers?.Authorization === "Bearer fresh-access") {
        retryReceived.resolve();
        return retryGate.promise;
      }

      return [401, { success: false, message: "Token hết hạn" }];
    });

    const requestPromise = apiGet("/products");
    await retryReceived.promise;

    // Account switch khi retry của A đang in-flight.
    useAuthStore.getState().login({
      user: otherCustomer,
      accessToken: "new-account-access",
      refreshToken: "new-account-refresh",
    });
    retryGate.resolve([401, { success: false, message: "Token hết hạn" }]);

    await expect(requestPromise).rejects.toBeInstanceOf(ApiRequestError);

    expect(productCalls).toBe(2);
    const state = useAuthStore.getState();
    expect(state.accessToken).toBe("new-account-access");
    expect(state.refreshToken).toBe("new-account-refresh");
    expect(state.user?.id).toBe("customer-2");
    expect(redirect).not.toHaveBeenCalled();
  });

  it("chặn request/retry thuộc session cũ ngay trước dispatch (không gửi bằng token session mới)", async () => {
    const redirect = vi.fn();
    setUnauthorizedRedirect(redirect);

    // Session A → generation tăng.
    useAuthStore.getState().login({
      user: customer,
      accessToken: "a-access",
      refreshToken: "a-refresh",
    });
    const staleGeneration = useAuthStore.getState().sessionGeneration - 1;

    // Session B (account switch).
    useAuthStore.getState().login({
      user: otherCustomer,
      accessToken: "b-access",
      refreshToken: "b-refresh",
    });

    let productCalls = 0;
    mock.onGet("/products").reply(() => {
      productCalls += 1;
      return [200, { success: true, data: { items: [] }, message: "ok" }];
    });

    // Request mang generation của session A không được dispatch dù đang ở session B.
    await expect(
      apiGet("/products", { __sessionGeneration: staleGeneration }),
    ).rejects.toBeInstanceOf(ApiRequestError);

    expect(productCalls).toBe(0);
    expect(mock.history.get).toHaveLength(0);
    const state = useAuthStore.getState();
    expect(state.accessToken).toBe("b-access");
    expect(state.user?.id).toBe("customer-2");
    expect(redirect).not.toHaveBeenCalled();
  });
});
