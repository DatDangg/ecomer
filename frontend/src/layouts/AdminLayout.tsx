import { ClipboardList, FolderTree, LayoutDashboard, Package, Users } from "lucide-react";

import { SidebarLayout, type SidebarNavItem } from "@/components/shared/SidebarLayout";

const adminNav: SidebarNavItem[] = [
  { to: "/admin", labelKey: "admin.nav.overview", icon: LayoutDashboard, end: true },
  { to: "/admin/users", labelKey: "admin.nav.users", icon: Users },
  { to: "/admin/products", labelKey: "admin.nav.products", icon: Package },
  { to: "/admin/categories", labelKey: "admin.nav.categories", icon: FolderTree },
  { to: "/admin/orders", labelKey: "admin.nav.orders", icon: ClipboardList },
];

export function AdminLayout() {
  return <SidebarLayout navLabelKey="nav.adminSection" items={adminNav} />;
}
