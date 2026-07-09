"use client";

import { PoweredByBadge } from "@/components/brand-logo";
import { BottomNav } from "@/components/bottom-nav";
import { PortalNavigationProvider, usePortalNavigation } from "@/components/portal-navigation";
import { PushSetup } from "@/components/push/push-setup";
import { ToastProvider, ToastViewport } from "@/components/toast-provider";
import { useMessageToasts } from "@/hooks/use-message-toasts";
import {
  useClientUnreadChatCount,
  useManagerUnreadChatCount,
} from "@/hooks/use-unread-chat-count";
import { isSupabaseConfigured } from "@/lib/config";

const clientNavBase = [
  { href: "/client", label: "Home", icon: "home" as const },
  { href: "/client/activities", label: "Activities", icon: "work" as const },
  { href: "/client/chat", label: "Chat", icon: "chat" as const },
];

const managerNavBase = [
  { href: "/manager", label: "Clients", icon: "home" as const },
  { href: "/manager/activities", label: "Activities", icon: "work" as const },
  { href: "/manager/chat", label: "Chat", icon: "chat" as const },
];

function ClientPortalShellInner({ children }: { children: React.ReactNode }) {
  const unreadChat = useClientUnreadChatCount();
  const live = isSupabaseConfigured();
  const portalNav = usePortalNavigation();

  useMessageToasts("client");

  const items = clientNavBase.map((item) =>
    item.href === "/client/chat" && live && unreadChat > 0
      ? { ...item, badge: unreadChat }
      : item,
  );

  return (
    <>
      <ToastViewport onNavigate={(href) => portalNav?.navigate(href)} />
      <div className="mx-auto min-h-screen max-w-lg bg-background pb-28">
        {live ? (
          <div className="px-4 pt-4">
            <PushSetup portal="client" />
          </div>
        ) : null}
        {children}
        <div className="fixed bottom-[4.25rem] left-0 right-0 z-40 mx-auto max-w-lg px-4">
          <PoweredByBadge />
        </div>
        <BottomNav items={items} />
      </div>
    </>
  );
}

export function ClientPortalShell({ children }: { children: React.ReactNode }) {
  return (
    <PortalNavigationProvider>
      <ToastProvider>
        <ClientPortalShellInner>{children}</ClientPortalShellInner>
      </ToastProvider>
    </PortalNavigationProvider>
  );
}

function ManagerPortalShellInner({ children }: { children: React.ReactNode }) {
  const unreadChat = useManagerUnreadChatCount();
  const live = isSupabaseConfigured();
  const portalNav = usePortalNavigation();

  useMessageToasts("manager");

  const items = managerNavBase.map((item) =>
    item.href === "/manager/chat" && live && unreadChat > 0
      ? { ...item, badge: unreadChat }
      : item,
  );

  return (
    <>
      <ToastViewport onNavigate={(href) => portalNav?.navigate(href)} />
      <div className="mx-auto min-h-screen max-w-lg bg-background pb-28">
        {live ? (
          <div className="px-4 pt-4">
            <PushSetup portal="manager" />
          </div>
        ) : null}
        {children}
        <div className="fixed bottom-[4.25rem] left-0 right-0 z-40 mx-auto max-w-lg px-4">
          <PoweredByBadge />
        </div>
        <BottomNav items={items} />
      </div>
    </>
  );
}

export function ManagerPortalShell({ children }: { children: React.ReactNode }) {
  return (
    <PortalNavigationProvider>
      <ToastProvider>
        <ManagerPortalShellInner>{children}</ManagerPortalShellInner>
      </ToastProvider>
    </PortalNavigationProvider>
  );
}
