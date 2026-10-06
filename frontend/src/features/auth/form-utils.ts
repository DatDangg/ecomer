export const DEFAULT_AUTH_REDIRECT = "/products";

/** Auth entry paths must never be a login redirect target (redirect loop). */
const AUTH_ENTRY_PATHS = ["/login", "/register"] as const;

function isAuthEntryPath(path: string): boolean {
  return AUTH_ENTRY_PATHS.some(
    (entry) => path === entry || path.startsWith(`${entry}?`) || path.startsWith(`${entry}#`),
  );
}

/**
 * Returns `from` only when it is a safe internal path. External,
 * protocol-relative (`//host`) and auth-entry paths fall back to the product
 * listing, so a crafted `location.state.from` cannot redirect off-site or loop.
 */
export function resolveSafeRedirect(from: unknown): string {
  if (typeof from !== "string" || from.length === 0) {
    return DEFAULT_AUTH_REDIRECT;
  }
  if (!from.startsWith("/") || from.startsWith("//")) {
    return DEFAULT_AUTH_REDIRECT;
  }
  return isAuthEntryPath(from) ? DEFAULT_AUTH_REDIRECT : from;
}
