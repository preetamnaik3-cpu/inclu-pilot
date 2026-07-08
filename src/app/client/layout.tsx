import { ClientPortalShell } from "@/components/portal-shell";

export const dynamic = "force-dynamic";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ClientPortalShell>{children}</ClientPortalShell>;
}
