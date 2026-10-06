import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { RouterProvider, createMemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";

import { appRoutes } from "@/router";
import { useAuthStore, type AuthUser } from "@/stores/auth.store";

const customer: AuthUser = {
  id: "customer-1",
  email: "buyer@example.com",
  fullName: "Người mua",
  role: "customer",
  shopName: "Gian hàng của Người mua",
};

const admin: AuthUser = {
  id: "admin-1",
  email: "admin@example.com",
  fullName: "Quản trị viên",
  role: "admin",
  shopName: null,
};

function renderRoute(path: string) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0 },
      mutations: { retry: false },
    },
  });
  const router = createMemoryRouter(appRoutes, { initialEntries: [path] });
  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

describe("SellerRoute", () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, accessToken: null });
  });

  it("redirects a guest to the login screen", () => {
    renderRoute("/seller");

    expect(screen.getByRole("heading", { name: "Đăng nhập" })).toBeInTheDocument();
  });

  it("admits a signed-in customer into the seller shell", () => {
    useAuthStore.setState({ user: customer, accessToken: "access-token" });
    renderRoute("/seller");

    expect(screen.getByRole("heading", { name: "Tổng quan người bán" })).toBeInTheDocument();
  });

  it("blocks an admin from the seller shell", () => {
    useAuthStore.setState({ user: admin, accessToken: "access-token" });
    renderRoute("/seller");

    expect(screen.getByRole("heading", { name: "Trang chủ" })).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Tổng quan người bán" }),
    ).not.toBeInTheDocument();
  });
});
