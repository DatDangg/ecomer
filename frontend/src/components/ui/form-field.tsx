import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface FormFieldProps {
  id: string;
  label: string;
  /** Inline error; rendered with id `${id}-error` so the control can reference it. */
  error?: ReactNode;
  /** Helper copy rendered with id `${id}-hint`. */
  hint?: string;
  /** Marks the field as optional in visible text (required is the default). */
  optional?: boolean;
  className?: string;
  children: ReactNode;
}

/**
 * Label + control + hint + inline error, kept together so every form field
 * exposes a persistent label and an `aria-describedby`-able message slot.
 */
export function FormField({
  id,
  label,
  error,
  hint,
  optional = false,
  className,
  children,
}: FormFieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
        {optional ? <span className="font-normal text-muted-foreground"> (không bắt buộc)</span> : null}
      </label>
      {children}
      {hint ? (
        <p id={`${id}-hint`} className="text-sm text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-sm text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
