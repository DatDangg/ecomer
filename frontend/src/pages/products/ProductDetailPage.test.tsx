import MockAdapter from "axios-mock-adapter";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { RouteObject } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";

import type { ProductDetail } from "@/api/products";
import { apiClient } from "@/lib/api-client";
import { ProductDetailPage } from "@/pages/products/ProductDetailPage";
import { renderRoutes } from "@/test/render-router";

const mock = new MockAdapter(apiClient);

const detailRoutes: RouteObject[] = [{ path: "/products/:id", element: <ProductDetailPage /> }];

function envelope<T>(data: T) {
  return { success: true, message: "ok", data };
}

const detail: ProductDetail = {
  id: "p1",
  sellerId: "s1",
  slug: "ao-thun",
  name: "Áo thun",
  description: "Áo thun cotton thoáng mát.",
  price: 199000,
  stock: 5,
  images: ["https://cdn.example/a.jpg", "https://cdn.example/b.jpg", "https://cdn.example/c.jpg"],
  categoryId: "c1",
  isActive: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  category: { id: "c1", name: "Áo" },
  seller: { id: "s1", shopName: "Shop A" },
};

describe("ProductDetailPage", () => {
  beforeEach(() => {
    mock.reset();
  });

  it("renders price, stock text, description and the category link", async () => {
    mock.onGet("/products/p1").reply(200, envelope(detail));
    renderRoutes(detailRoutes, "/products/p1");

    expect(await screen.findByRole("heading", { name: "Áo thun" })).toBeInTheDocument();
    expect(screen.getByText(/199\.000/)).toBeInTheDocument();
    expect(screen.getByText("Còn 5 sản phẩm")).toBeInTheDocument();
    expect(screen.getByText("Áo thun cotton thoáng mát.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Danh mục: Áo" })).toHaveAttribute(
      "href",
      "/products?categoryId=c1",
    );
    expect(screen.getByText("Người bán: Shop A")).toBeInTheDocument();
  });

  it("selects gallery images with the keyboard and updates the selected state", async () => {
    mock.onGet("/products/p1").reply(200, envelope(detail));
    renderRoutes(detailRoutes, "/products/p1");

    const thumbnails = await screen.findAllByRole("button", { name: /Xem ảnh/ });
    expect(thumbnails).toHaveLength(3);
    expect(thumbnails[0]).toHaveAttribute("aria-pressed", "true");

    thumbnails[0].focus();
    const user = userEvent.setup();
    await user.keyboard("{ArrowRight}");

    expect(thumbnails[1]).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("img", { name: "Áo thun - ảnh 2" })).toBeInTheDocument();
  });

  it("shows a sold-out label as text when stock is zero", async () => {
    mock.onGet("/products/p1").reply(200, envelope({ ...detail, stock: 0 }));
    renderRoutes(detailRoutes, "/products/p1");

    expect(await screen.findByText("Hết hàng")).toBeInTheDocument();
  });

  it("renders the not-found state for a missing, hidden or blocked product", async () => {
    mock.onGet("/products/hidden").reply(404, {
      success: false,
      message: "Không tìm thấy sản phẩm",
    });
    renderRoutes(detailRoutes, "/products/hidden");

    expect(
      await screen.findByRole("heading", { name: "Không tìm thấy sản phẩm" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Áo thun")).not.toBeInTheDocument();
  });

  it("shows a server error and retries on demand", async () => {
    mock.onGet("/products/p1").replyOnce(500, { success: false, message: "Lỗi máy chủ" });
    mock.onGet("/products/p1").reply(200, envelope(detail));
    renderRoutes(detailRoutes, "/products/p1");

    expect(await screen.findByRole("alert")).toHaveTextContent("Lỗi máy chủ");

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Thử lại" }));

    expect(await screen.findByRole("heading", { name: "Áo thun" })).toBeInTheDocument();
  });

  it("shows the Vietnamese network error when the detail request has no response", async () => {
    mock.onGet("/products/p1").networkError();
    renderRoutes(detailRoutes, "/products/p1");

    expect(
      await screen.findByText("Không thể kết nối máy chủ. Vui lòng thử lại."),
    ).toBeInTheDocument();
  });
});

describe("ProductDetailPage gallery fallback", () => {
  beforeEach(() => {
    mock.reset();
  });

  it("renders a neutral placeholder when a product has no images", async () => {
    mock.onGet("/products/p1").reply(200, envelope({ ...detail, images: [] }));
    renderRoutes(detailRoutes, "/products/p1");

    await screen.findByRole("heading", { name: "Áo thun" });
    expect(screen.queryAllByRole("button", { name: /Xem ảnh/ })).toHaveLength(0);
    expect(screen.getByRole("img", { name: "Áo thun - ảnh 1" })).toBeInTheDocument();
  });
});
