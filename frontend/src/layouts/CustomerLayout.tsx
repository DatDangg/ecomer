import { NavLink, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { SiteFooter } from "@/components/shared/SiteFooter";
import { SiteHeader } from "@/components/shared/SiteHeader";
import { cn } from "@/lib/utils";

const accountNav = [
  { to: "/profile", labelKey: "nav.profile" },
  { to: "/orders", labelKey: "nav.orders" },
  { to: "/cart", labelKey: "nav.cart" },
] as const;

export function CustomerLayout() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <SiteHeader />
      <nav aria-label={t("nav.accountSection")} className="border-b border-border">
        <div className="container-page flex gap-1 overflow-x-auto py-1">
          {accountNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "inline-flex min-h-11 items-center whitespace-nowrap rounded-full px-3 text-sm font-medium",
                  isActive ? "bg-surface" : "text-foreground hover:bg-surface",
                )
              }
            >
              {t(item.labelKey)}
            </NavLink>
          ))}
        </div>
      </nav>
      <main id="main-content" className="flex-1">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  );
}
