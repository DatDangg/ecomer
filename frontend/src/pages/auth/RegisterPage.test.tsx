import MockAdapter from "axios-mock-adapter";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { RouteObject } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";

import { RegisterPage } from "@/pages/auth/RegisterPage";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth.store";
import { renderRoutes } from "@/test/render-router";

const mock = new MockAdapter(apiClient);

const routes: RouteObject[] = [
  { path: "/register", element: <RegisterPage /> },
  { path: "/login", element: <h1>Đăng nhập</h1> },
];

async function fillAndSubmit(fullName = "Người mua", password = "secret123") {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Họ và tên"), fullName);
  await user.type(screen.getByLabelText("Email"), "buyer@example.com");
  await user.type(screen.getByLabelText("Mật khẩu"), password);
  await user.click(screen.getByRole("button", { name: "Tạo tài khoản" }));
}

describe("RegisterPage", () => {
  beforeEach(() => {
    mock.reset();
    useAuthStore.setState({ user: null, accessToken: null, refreshToken: null });
  });

  it("enforces the minimum password length before calling the API", async () => {
    renderRoutes(routes, "/register");

    await fillAndSubmit("Người mua", "short");

    expect(await screen.findByText("Mật khẩu tối thiểu 8 ký tự")).toBeInTheDocument();
    expect(mock.history.post).toHaveLength(0);
  });

  it("shows a duplicate-email notice with a link to login on 409", async () => {
    mock.onPost("/auth/register").reply(409, {
      success: false,
      message: "Email đã được sử dụng",
    });
    renderRoutes(routes, "/register");

    await fillAndSubmit();

    expect(await screen.findByText("Email đã được sử dụng")).toBeInTheDocument();
    expect(await screen.findByText("Đã có tài khoản dùng email này.")).toBeInTheDocument();
    const loginLinks = screen.getAllByRole("link", { name: "Đăng nhập" });
    expect(loginLinks.some((link) => link.getAttribute("href") === "/login")).toBe(true);
  });

  it("redirects to /login after a successful registration", async () => {
    mock.onPost("/auth/register").reply(201, {
      success: true,
      message: "ok",
      data: { userId: "user-1", email: "buyer@example.com", fullName: "Người mua" },
    });
    renderRoutes(routes, "/register");

    await fillAndSubmit();

    expect(await screen.findByRole("heading", { name: "Đăng nhập" })).toBeInTheDocument();
    expect(useAuthStore.getState().accessToken).toBeNull();
  });

  it("shows a Vietnamese retry message when the request has no response", async () => {
    mock.onPost("/auth/register").networkError();
    renderRoutes(routes, "/register");

    await fillAndSubmit();

    expect(
      await screen.findByText("Không thể kết nối máy chủ. Vui lòng thử lại."),
    ).toBeInTheDocument();
  });

  it("trims surrounding whitespace from the email before submitting", async () => {
    mock.onPost("/auth/register").reply(201, {
      success: true,
      message: "ok",
      data: { userId: "user-1", email: "buyer@example.com", fullName: "Người mua" },
    });
    renderRoutes(routes, "/register");

    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Họ và tên"), "Người mua");
    await user.type(screen.getByLabelText("Email"), "  buyer@example.com  ");
    await user.type(screen.getByLabelText("Mật khẩu"), "secret123");
    await user.click(screen.getByRole("button", { name: "Tạo tài khoản" }));

    await waitFor(() => expect(mock.history.post).toHaveLength(1));
    const body = JSON.parse(mock.history.post[0].data as string) as { email: string };
    expect(body.email).toBe("buyer@example.com");
  });
});
