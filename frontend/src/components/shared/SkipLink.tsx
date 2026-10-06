interface SkipLinkProps {
  label: string;
}

/** Keyboard-only link that jumps focus to the main landmark of a shell. */
export function SkipLink({ label }: SkipLinkProps) {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50 focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:text-primary-foreground"
    >
      {label}
    </a>
  );
}
