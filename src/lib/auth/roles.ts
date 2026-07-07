import type { UserRole } from "@/lib/types";

export type DbRole = UserRole | "admin";

export function routeForRole(role: string | undefined | null): string {
  switch (role) {
    case "manager":
    case "admin":
      return "/manager";
    case "team":
      return "/team/work";
    case "client":
    default:
      return "/client";
  }
}

export function portalForPath(path: string): UserRole | null {
  if (path.startsWith("/client")) return "client";
  if (path.startsWith("/manager")) return "manager";
  if (path.startsWith("/team")) return "team";
  return null;
}

export function roleCanAccessPath(
  role: string | undefined | null,
  path: string,
): boolean {
  const portal = portalForPath(path);
  if (!portal) return true;

  switch (role) {
    case "admin":
      return true;
    case "manager":
      return portal === "manager";
    case "team":
      return portal === "team";
    case "client":
      return portal === "client";
    default:
      return false;
  }
}
