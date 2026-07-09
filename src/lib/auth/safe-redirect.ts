const ALLOWED_POST_AUTH_PATHS = new Set([
  "/waiting",
  "/client",
  "/client/activities",
  "/client/chat",
  "/manager",
  "/manager/activities",
  "/manager/chat",
  "/team/work",
  "/team/chat",
]);

/** Reject protocol-relative and off-site open redirects. */
export function safeRelativePath(path: string | null): string | null {
  if (!path) return null;
  if (
    !path.startsWith("/") ||
    path.startsWith("//") ||
    path.includes("://") ||
    path.includes("\\") ||
    path.includes("\0")
  ) {
    return null;
  }
  const base = path.split("?")[0]?.split("#")[0] ?? path;
  if (!ALLOWED_POST_AUTH_PATHS.has(base)) {
    return null;
  }
  return path;
}
