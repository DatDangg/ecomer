import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface FormAlertProps {
  /** `error` announces via `role="alert"`; `success` via `role="status"`. */
  tone: "error" | "success";
  className?: string;
  children: ReactNode;
}

/**
 * Form-level status banner. Keeps the announced role and tone bound to the
 * message so success/error copy is never conveyed by color alone.
 */
export function FormAlert({ tone, className, children }: FormAlertProps) {
  const toneClass =
    tone === "error"
      ? "border-error/40 bg-error/5 text-error"
      : "border-success/40 bg-success/5 text-success";

  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={cn("rounded-md border p-3 text-sm", toneClass, className)}
    >
      {children}
    </p>
  );
}
