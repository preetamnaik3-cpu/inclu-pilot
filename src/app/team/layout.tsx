import { PoweredByBadge } from "@/components/brand-logo";
import { BottomNav } from "@/components/bottom-nav";
import { PortalNavigationProvider } from "@/components/portal-navigation";

export const dynamic = "force-dynamic";

const teamNav = [
  { href: "/team/work", label: "Work", icon: "work" as const },
  { href: "/team/chat", label: "Chat", icon: "chat" as const },
];

export default function TeamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PortalNavigationProvider>
      <div className="mx-auto min-h-screen max-w-lg bg-background pb-28">
        {children}
        <div className="fixed bottom-[4.25rem] left-0 right-0 z-40 mx-auto max-w-lg px-4">
          <PoweredByBadge />
        </div>
        <BottomNav items={teamNav} />
      </div>
    </PortalNavigationProvider>
  );
}
