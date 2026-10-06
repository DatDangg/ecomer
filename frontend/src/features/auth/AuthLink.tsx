import type { ReactNode } from "react";
import { Link } from "react-router-dom";

/**
 * Inline auth navigation link. `min-h-11` gives a ≥44px touch target while the
 * `px-2 -mx-2` pair keeps the text aligned with the surrounding copy, so the
 * hit area grows without changing the visual hierarchy.
 */
export function AuthLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="inline-flex min-h-11 items-center px-2 -mx-2 font-medium underline underline-offset-4"
    >
      {children}
    </Link>
  );
}
