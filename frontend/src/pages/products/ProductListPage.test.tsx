import MockAdapter from "axios-mock-adapter";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createMemoryRouter, type RouteObject } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";

import type { Category } from "@/api/categories";
import type { Product } from "@/api/products";
import { apiClient } from "@/lib/api-client";
import { ProductListPage } from "@/pages/products/ProductListPage";

const mock = new MockAdapter(apiClient);

const listRoutes: RouteObject[] = [{ path: "/products", element: <ProductListPage /> }];

function envelope<T>(data: T) {
  return { success: true, message: "ok", data };
}

const inStockProduct: Product = {
  id: "p1",
  sellerId: "s1",
  slug: "ao-thun",
  name: "Áo thun",
  description: "Áo thun cotton",
  price: 199000,
  stock: 5,
  images: ["https://cdn.example/ao-thun.jpg"],
  categoryId: "c1",
  isActive: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const outOfStockProduct: Product = {
  ...inStockProduct,
  id: "p2",
  slug: "quan-jean",
  name: "Quần jean",
  price: 320000,
  stock: 0,
};

const category: Category = {
  id: "c1",
  name: "Áo",
  slug: "ao",
  imageUrl: null,
  isActive: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

function mockProductList(items: Product[]) {
  mock.onGet("/products").reply(
    200,
    envelope({ items, total: items.length, page: 1, limit: 24, totalPages: items.length === 0 ? 0 : 1 }),
  );
}

function mockCategories(categories: Category[]) {
  mock.onGet("/categories").reply(200, envelope(categories));
}

function renderList(initialEntry: string | { pathname: string; search?: string }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0 } },
  });
  const router = createMemoryRouter(listRoutes, { initialEntries: [initialEntry] });

  const utils = render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );

  return { router, ...utils };
}

describe("ProductListPage", () => {
  beforeEach(() => {
    mock.reset();
  });

  it("renders products with a text out-of-stock label and links to detail", async () => {
    mockProductList([inStockProduct, outOfStockProduct]);
    mockCategories([]);
    renderList("/products");

    expect(await screen.findByRole("heading", { name: "Áo thun" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Quần jean" })).toBeInTheDocument();
    expect(screen.getByText("Hết hàng")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Áo thun/ })).toHaveAttribute("href", "/products/p1");
  });

  it("hydrates filters from the URL and sends them to the API", async () => {
    mockProductList([]);
    mockCategories([category]);
    renderList({
      pathname: "/products",
      search: "?categoryId=c1&sortBy=price&order=asc&minPrice=1000&page=2",
    });

    await waitFor(() => expect(mock.history.get.some((request) => request.url === "/products")).toBe(true));
    const call = mock.history.get.filter((request) => request.url === "/products").at(-1);
    expect(call?.params).toMatchObject({
      categoryId: "c1",
      sortBy: "price",
      order: "asc",
      minPrice: 1000,
      page: 2,
      limit: 24,
    });

    expect(await screen.findByLabelText("Danh mục")).toHaveValue("c1");
    expect(screen.getByLabelText("Sắp xếp")).toHaveValue("price:asc");
  });

  it("writes category changes to the URL and refetches", async () => {
    mockProductList([]);
    mockCategories([category]);
    const { router } = renderList("/products");

    const user = userEvent.setup();
    await screen.findByRole("option", { name: "Áo" });
    await user.selectOptions(await screen.findByLabelText("Danh mục"), "c1");

    await waitFor(() => expect(router.state.location.search).toContain("categoryId=c1"));
    await waitFor(() => {
      const last = mock.history.get.filter((request) => request.url === "/products").at(-1);
      expect(last?.params).toMatchObject({ categoryId: "c1" });
    });
  });

  it("restores the previous filter state on browser back", async () => {
    mockProductList([]);
    mockCategories([category]);
    const { router } = renderList("/products");

    const user = userEvent.setup();
    await screen.findByRole("option", { name: "Áo" });
    await user.selectOptions(await screen.findByLabelText("Danh mục"), "c1");
    await waitFor(() => expect(router.state.location.search).toContain("categoryId=c1"));

    await act(async () => {
      await router.navigate(-1);
    });

    expect(router.state.location.search).not.toContain("categoryId");
    await waitFor(() => expect(screen.getByLabelText("Danh mục")).toHaveValue(""));
  });

  it("shows a no-result state whose clear action resets the filters", async () => {
    mockProductList([]);
    mockCategories([]);
    renderList({ pathname: "/products", search: "?search=khong-co" });

    const noResult = await screen.findByText("Không tìm thấy sản phẩm phù hợp.");
    const user = userEvent.setup();
    await user.click(within(noResult.parentElement as HTMLElement).getByRole("button", { name: "Xoá bộ lọc" }));

    expect(await screen.findByText("Chưa có sản phẩm nào.")).toBeInTheDocument();
    await waitFor(() => {
      const last = mock.history.get.filter((request) => request.url === "/products").at(-1);
      expect(last?.params?.search).toBeUndefined();
    });
  });

  it("shows the server error and retries on demand", async () => {
    mock.onGet("/products").replyOnce(500, { success: false, message: "Lỗi máy chủ" });
    mockProductList([inStockProduct]);
    mockCategories([]);
    renderList("/products");

    expect(await screen.findByRole("alert")).toHaveTextContent("Lỗi máy chủ");

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Thử lại" }));

    expect(await screen.findByRole("heading", { name: "Áo thun" })).toBeInTheDocument();
  });

  it("shows the Vietnamese network error when the request has no response", async () => {
    mock.onGet("/products").networkError();
    mockCategories([]);
    renderList("/products");

    expect(
      await screen.findByText("Không thể kết nối máy chủ. Vui lòng thử lại."),
    ).toBeInTheDocument();
  });
});
