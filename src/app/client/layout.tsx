import { PoweredByBadge } from "@/components/brand-logo";
import { BottomNav } from "@/components/bottom-nav";

export const dynamic = "force-dynamic";

const clientNav = [
  { href: "/client", label: "Home", icon: "home" as const },
  { href: "/client/activities", label: "Activities", icon: "work" as const },
  { href: "/client/chat", label: "Chat", icon: "chat" as const, badge: 1 },
];

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto min-h-screen max-w-lg bg-background pb-28">
      {children}
      <div className="fixed bottom-[4.25rem] left-0 right-0 z-40 mx-auto max-w-lg px-4">
        <PoweredByBadge />
      </div>
      <BottomNav items={clientNav} />
    </div>
  );
}
