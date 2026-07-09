import { TeamPortalShell } from "@/components/team-portal-shell";

export const dynamic = "force-dynamic";

export default function TeamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <TeamPortalShell>{children}</TeamPortalShell>;
}
