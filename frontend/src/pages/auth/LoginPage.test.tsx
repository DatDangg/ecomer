import MockAdapter from "axios-mock-adapter";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { RouteObject } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";

import { LoginPage } from "@/pages/auth/LoginPage";
import { apiClient } from "@/lib/api-client";
import { useAuthStore, type AuthUser } from "@/stores/auth.store";
import { renderRoutes } from "@/test/render-router";

const mock = new MockAdapter(apiClient);

const customer: AuthUser = {
  id: "customer-1",
  email: "buyer@example.com",
  fullName: "Người mua",
  role: "customer",
  shopName: null,
};

const routes: RouteObject[] = [
  { path: "/login", element: <LoginPage /> },
  { path: "/products", element: <h1>Danh sách sản phẩm</h1> },
  { path: "/cart", element: <h1>Giỏ hàng</h1> },
];

async function submitCredentials(email = "buyer@example.com", password = "secret123") {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Email"), email);
  await user.type(screen.getByLabelText("Mật khẩu"), password);
  await user.click(screen.getByRole("button", { name: "Đăng nhập" }));
}

describe("LoginPage", () => {
  beforeEach(() => {
    mock.reset();
    useAuthStore.setState({ user: null, accessToken: null, refreshToken: null });
  });

  it("validates the email format before calling the API", async () => {
    renderRoutes(routes, "/login");

    await submitCredentials("not-an-email");

    expect(await screen.findByText("Email không hợp lệ")).toBeInTheDocument();
    expect(mock.history.post).toHaveLength(0);
  });

  it("shows the wrong-credentials message inline on 401", async () => {
    mock.onPost("/auth/login").reply(401, {
      success: false,
      message: "Email hoặc mật khẩu không đúng",
    });
    renderRoutes(routes, "/login");

    await submitCredentials();

    expect(await screen.findByText("Email hoặc mật khẩu không đúng")).toBeInTheDocument();
    expect(useAuthStore.getState().accessToken).toBeNull();
  });

  it("shows the exact locked-account message on 403", async () => {
    mock.onPost("/auth/login").reply(403, {
      success: false,
      message: "Tài khoản đã bị khóa",
    });
    renderRoutes(routes, "/login");

    await submitCredentials();

    expect(await screen.findByText("Tài khoản đã bị khóa")).toBeInTheDocument();
  });

  it("stores the session and redirects to location.state.from when safe", async () => {
    mock.onPost("/auth/login").reply(200, {
      success: true,
      message: "ok",
      data: { user: customer, accessToken: "access-token", refreshToken: "refresh-token" },
    });
    renderRoutes(routes, { pathname: "/login", state: { from: "/cart" } });

    await submitCredentials();

    expect(await screen.findByRole("heading", { name: "Giỏ hàng" })).toBeInTheDocument();
    const state = useAuthStore.getState();
    expect(state.accessToken).toBe("access-token");
    expect(state.refreshToken).toBe("refresh-token");
    expect(state.user?.id).toBe("customer-1");
  });

  it("falls back to /products when the return path is external", async () => {
    mock.onPost("/auth/login").reply(200, {
      success: true,
      message: "ok",
      data: { user: customer, accessToken: "access-token", refreshToken: "refresh-token" },
    });
    renderRoutes(routes, { pathname: "/login", state: { from: "https://evil.example" } });

    await submitCredentials();

    expect(await screen.findByRole("heading", { name: "Danh sách sản phẩm" })).toBeInTheDocument();
  });

  it("shows a Vietnamese retry message when the request has no response", async () => {
    mock.onPost("/auth/login").networkError();
    renderRoutes(routes, "/login");

    await submitCredentials();

    expect(
      await screen.findByText("Không thể kết nối máy chủ. Vui lòng thử lại."),
    ).toBeInTheDocument();
  });

  it("trims the email loaded from navigation state before submitting", async () => {
    mock.onPost("/auth/login").reply(200, {
      success: true,
      message: "ok",
      data: { user: customer, accessToken: "access-token", refreshToken: "refresh-token" },
    });
    renderRoutes(routes, { pathname: "/login", state: { email: "  buyer@example.com  " } });

    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Mật khẩu"), "secret123");
    await user.click(screen.getByRole("button", { name: "Đăng nhập" }));

    await waitFor(() => expect(mock.history.post).toHaveLength(1));
    const body = JSON.parse(mock.history.post[0].data as string) as { email: string };
    expect(body.email).toBe("buyer@example.com");
  });
});
