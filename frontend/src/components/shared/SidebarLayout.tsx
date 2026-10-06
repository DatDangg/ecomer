import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Menu, type LucideIcon } from "lucide-react";

import { SkipLink } from "@/components/shared/SkipLink";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export interface SidebarNavItem {
  to: string;
  labelKey: string;
  icon: LucideIcon;
  end?: boolean;
}

interface SidebarLayoutProps {
  navLabelKey: string;
  items: SidebarNavItem[];
}

function SidebarNav({ navLabelKey, items }: SidebarLayoutProps) {
  const { t } = useTranslation();

  return (
    <nav aria-label={t(navLabelKey)} className="flex flex-col gap-1">
      {items.map((item) => (
        <SidebarLink key={item.to} item={item} />
      ))}
    </nav>
  );
}

function SidebarLink({ item, onNavigate }: { item: SidebarNavItem; onNavigate?: () => void }) {
  const { t } = useTranslation();
  const Icon = item.icon;

  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          "inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-medium",
          isActive ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-surface",
        )
      }
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {t(item.labelKey)}
    </NavLink>
  );
}

function SidebarMenuSheet({
  navLabelKey,
  items,
}: {
  navLabelKey: string;
  items: SidebarNavItem[];
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label={t("common.openMenu")}>
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left">
        <SheetTitle>{t(navLabelKey)}</SheetTitle>
        <div className="mt-2 flex flex-col gap-1">
          {items.map((item) => (
            <SidebarLink key={item.to} item={item} onNavigate={() => setOpen(false)} />
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function SidebarLayout({ navLabelKey, items }: SidebarLayoutProps) {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <SkipLink label={t("common.skipToContent")} />

      <header className="sticky top-0 z-40 border-b border-border bg-background">
        <div className="container-page flex h-14 items-center gap-3">
          <SidebarMenuSheet navLabelKey={navLabelKey} items={items} />
          <Link to="/" className="font-heading text-lg font-semibold tracking-tight">
            {t("app.name")}
          </Link>
        </div>
      </header>

      <div className="container-page flex flex-1 items-start gap-6 py-6">
        <aside className="hidden w-56 shrink-0 lg:block">
          <SidebarNav navLabelKey={navLabelKey} items={items} />
        </aside>
        <main id="main-content" className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
