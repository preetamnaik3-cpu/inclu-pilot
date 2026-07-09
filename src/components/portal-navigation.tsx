"use client";

import {
  createContext,
  useContext,
  useTransition,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { PortalLoadingOverlay } from "@/components/portal-loading";

type PortalNavigationContextValue = {
  navigate: (href: string) => void;
};

const PortalNavigationContext =
  createContext<PortalNavigationContextValue | null>(null);

export function usePortalNavigation() {
  return useContext(PortalNavigationContext);
}

function isActiveRoute(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function PortalNavigationProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function navigate(href: string) {
    if (isActiveRoute(pathname, href)) return;

    startTransition(() => {
      router.push(href);
    });
  }

  return (
    <PortalNavigationContext.Provider value={{ navigate }}>
      {children}
      {isPending ? <PortalLoadingOverlay /> : null}
    </PortalNavigationContext.Provider>
  );
}
