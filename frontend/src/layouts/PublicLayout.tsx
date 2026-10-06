import { Outlet } from "react-router-dom";

import { SiteFooter } from "@/components/shared/SiteFooter";
import { SiteHeader } from "@/components/shared/SiteHeader";

export function PublicLayout() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <SiteHeader />
      <main id="main-content" className="flex-1">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  );
}
