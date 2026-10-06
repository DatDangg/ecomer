import { useEffect, useRef, useState, type RefObject } from "react";
import { Link, NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LogIn, Menu, Search, ShoppingCart, User, UserPlus, type LucideIcon } from "lucide-react";

import { SkipLink } from "@/components/shared/SkipLink";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { selectIsAuthenticated, useAuthStore } from "@/stores/auth.store";

interface HeaderNavItem {
  to: string;
  labelKey: string;
  end?: boolean;
}

const primaryNav: HeaderNavItem[] = [
  { to: "/", labelKey: "nav.home", end: true },
  { to: "/products", labelKey: "nav.products" },
];

const guestNav = [
  { to: "/login", labelKey: "nav.login", icon: LogIn },
  { to: "/register", labelKey: "nav.register", icon: UserPlus },
] as const;

function HeaderNavLink({
  item,
  icon: Icon,
  onNavigate,
}: {
  item: HeaderNavItem;
  icon?: LucideIcon;
  onNavigate?: () => void;
}) {
  const { t } = useTranslation();

  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          "inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-medium",
          isActive ? "bg-surface" : "text-foreground hover:bg-surface",
        )
      }
    >
      {Icon ? <Icon className="h-4 w-4" aria-hidden="true" /> : null}
      {t(item.labelKey)}
    </NavLink>
  );
}

function MobileMenuSheet() {
  const { t } = useTranslation();
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label={t("common.openMenu")}>
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left">
        <SheetTitle>{t("common.openMenu")}</SheetTitle>
        <nav aria-label={t("nav.primary")} className="mt-2 flex flex-col gap-1">
          {primaryNav.map((item) => (
            <HeaderNavLink key={item.to} item={item} onNavigate={close} />
          ))}
        </nav>
        <div className="mt-2 flex flex-col gap-1 border-t border-border pt-2">
          {isAuthenticated ? (
            <HeaderNavLink
              item={{ to: "/profile", labelKey: "nav.profile" }}
              icon={User}
              onNavigate={close}
            />
          ) : (
            guestNav.map((item) => (
              <HeaderNavLink key={item.to} item={item} icon={item.icon} onNavigate={close} />
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function DesktopPrimaryNav() {
  const { t } = useTranslation();

  return (
    <nav aria-label={t("nav.primary")} className="hidden items-center gap-1 lg:flex">
      {primaryNav.map((item) => (
        <HeaderNavLink key={item.to} item={item} />
      ))}
    </nav>
  );
}

function SearchForm({
  id,
  className,
  inputRef,
}: {
  id: string;
  className?: string;
  inputRef?: RefObject<HTMLInputElement>;
}) {
  const { t } = useTranslation();

  return (
    <form role="search" className={className} onSubmit={(event) => event.preventDefault()}>
      <label htmlFor={id} className="sr-only">
        {t("common.search")}
      </label>
      <Input
        ref={inputRef}
        id={id}
        type="search"
        placeholder={t("common.searchPlaceholder")}
        className="h-9"
      />
    </form>
  );
}

function HeaderActions({
  searchOpen,
  onToggleSearch,
}: {
  searchOpen: boolean;
  onToggleSearch: () => void;
}) {
  const { t } = useTranslation();
  const isAuthenticated = useAuthStore(selectIsAuthenticated);

  return (
    <div className="ml-auto flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        aria-label={t("common.search")}
        aria-expanded={searchOpen}
        onClick={onToggleSearch}
      >
        <Search className="h-5 w-5" />
      </Button>

      <Button asChild variant="ghost" size="icon" aria-label={t("nav.cart")}>
        <Link to="/cart">
          <ShoppingCart className="h-5 w-5" />
        </Link>
      </Button>

      {isAuthenticated ? (
        <Button asChild variant="ghost" size="icon" aria-label={t("nav.account")}>
          <Link to="/profile">
            <User className="h-5 w-5" />
          </Link>
        </Button>
      ) : (
        <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
          <Link to="/login">{t("nav.login")}</Link>
        </Button>
      )}
    </div>
  );
}

export function SiteHeader() {
  const { t } = useTranslation();
  const [searchOpen, setSearchOpen] = useState(false);
  const mobileSearchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) {
      mobileSearchRef.current?.focus();
    }
  }, [searchOpen]);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background">
      <SkipLink label={t("common.skipToContent")} />

      <div className="container-page flex h-14 items-center gap-2 lg:h-16 lg:gap-4">
        <MobileMenuSheet />

        <Link to="/" className="font-heading text-lg font-semibold tracking-tight">
          {t("app.name")}
        </Link>

        <DesktopPrimaryNav />

        <SearchForm id="site-search" className="ml-2 hidden max-w-sm flex-1 lg:block" />

        <HeaderActions searchOpen={searchOpen} onToggleSearch={() => setSearchOpen((open) => !open)} />
      </div>

      {searchOpen ? (
        <div className="container-page pb-3 lg:hidden">
          <SearchForm id="mobile-search" inputRef={mobileSearchRef} />
        </div>
      ) : null}
    </header>
  );
}
