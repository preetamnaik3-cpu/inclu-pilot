"use client";

import { PoweredByBadge } from "@/components/brand-logo";
import { BottomNav } from "@/components/bottom-nav";
import { PortalNavigationProvider, usePortalNavigation } from "@/components/portal-navigation";
import { PushSetup } from "@/components/push/push-setup";
import { ToastProvider, ToastViewport } from "@/components/toast-provider";
import { useMessageToasts } from "@/hooks/use-message-toasts";

const teamNav = [
  { href: "/team/work", label: "Work", icon: "work" as const },
  { href: "/team/chat", label: "Chat", icon: "chat" as const },
];

function TeamPortalShellInner({ children }: { children: React.ReactNode }) {
  const portalNav = usePortalNavigation();
  useMessageToasts("team");

  return (
    <>
      <ToastViewport onNavigate={(href) => portalNav?.navigate(href)} />
      <div className="mx-auto min-h-screen max-w-lg bg-background pb-28">
        <div className="px-4 pt-4">
          <PushSetup portal="team" />
        </div>
        {children}
        <div className="fixed bottom-[4.25rem] left-0 right-0 z-40 mx-auto max-w-lg px-4">
          <PoweredByBadge />
        </div>
        <BottomNav items={teamNav} />
      </div>
    </>
  );
}

export function TeamPortalShell({ children }: { children: React.ReactNode }) {
  return (
    <PortalNavigationProvider>
      <ToastProvider>
        <TeamPortalShellInner>{children}</TeamPortalShellInner>
      </ToastProvider>
    </PortalNavigationProvider>
  );
}

