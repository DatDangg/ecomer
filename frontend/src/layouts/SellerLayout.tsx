import { ClipboardList, LayoutDashboard, Package } from "lucide-react";

import { SidebarLayout, type SidebarNavItem } from "@/components/shared/SidebarLayout";

const sellerNav: SidebarNavItem[] = [
  { to: "/seller", labelKey: "seller.nav.overview", icon: LayoutDashboard, end: true },
  { to: "/seller/products", labelKey: "seller.nav.products", icon: Package },
  { to: "/seller/orders", labelKey: "seller.nav.orders", icon: ClipboardList },
];

export function SellerLayout() {
  return <SidebarLayout navLabelKey="nav.sellerSection" items={sellerNav} />;
}
