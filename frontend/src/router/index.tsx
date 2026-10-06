import type { RouteObject } from "react-router-dom";

import { AdminLayout } from "@/layouts/AdminLayout";
import { CustomerLayout } from "@/layouts/CustomerLayout";
import { PublicLayout } from "@/layouts/PublicLayout";
import { SellerLayout } from "@/layouts/SellerLayout";
import { ProfilePage } from "@/pages/account/ProfilePage";
import { LoginPage } from "@/pages/auth/LoginPage";
import { RegisterPage } from "@/pages/auth/RegisterPage";
import { ProductDetailPage } from "@/pages/products/ProductDetailPage";
import { ProductListPage } from "@/pages/products/ProductListPage";
import { NotFoundPage, PlaceholderPage } from "@/pages/PlaceholderPage";
import { AdminRoute, PrivateRoute, SellerRoute } from "@/router/guards";

export const appRoutes: RouteObject[] = [
  {
    element: <PublicLayout />,
    children: [
      { path: "/", element: <ProductListPage /> },
      { path: "/products", element: <ProductListPage /> },
      { path: "/products/:id", element: <ProductDetailPage /> },
      { path: "/login", element: <LoginPage /> },
      { path: "/register", element: <RegisterPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
  {
    element: <PrivateRoute />,
    children: [
      {
        element: <CustomerLayout />,
        children: [
          { path: "/cart", element: <PlaceholderPage title="Giỏ hàng" /> },
          { path: "/checkout", element: <PlaceholderPage title="Thanh toán" /> },
          { path: "/orders", element: <PlaceholderPage title="Đơn mua" /> },
          { path: "/profile", element: <ProfilePage /> },
        ],
      },
    ],
  },
  {
    element: <SellerRoute />,
    children: [
      {
        element: <SellerLayout />,
        children: [
          { path: "/seller", element: <PlaceholderPage title="Tổng quan người bán" /> },
          { path: "/seller/products", element: <PlaceholderPage title="Sản phẩm của tôi" /> },
          { path: "/seller/orders", element: <PlaceholderPage title="Đơn bán" /> },
        ],
      },
    ],
  },
  {
    element: <AdminRoute />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { path: "/admin", element: <PlaceholderPage title="Bảng điều khiển quản trị" /> },
          { path: "/admin/users", element: <PlaceholderPage title="Quản lý người dùng" /> },
          { path: "/admin/products", element: <PlaceholderPage title="Kiểm duyệt sản phẩm" /> },
          { path: "/admin/categories", element: <PlaceholderPage title="Quản lý danh mục" /> },
          { path: "/admin/orders", element: <PlaceholderPage title="Quản lý đơn hàng" /> },
        ],
      },
    ],
  },
];
