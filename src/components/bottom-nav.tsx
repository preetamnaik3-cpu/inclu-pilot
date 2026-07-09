"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePortalNavigation } from "@/components/portal-navigation";

interface NavItem {
  href: string;
  label: string;
  icon: "home" | "work" | "chat";
  badge?: number;
}

function NavIcon({ icon, active }: { icon: NavItem["icon"]; active: boolean }) {
  const color = active ? "var(--burgundy)" : "#a8a29e";
  if (icon === "home") {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1V9.5z" strokeLinejoin="round" />
      </svg>
    );
  }
  if (icon === "work") {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75">
        <rect x="3" y="7" width="18" height="13" rx="2" />
        <path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" strokeLinejoin="round" />
    </svg>
  );
}

function isActiveRoute(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function BottomNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const portalNav = usePortalNavigation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-stone-200/80 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-lg items-center justify-around px-4 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {items.map((item) => {
          const active = isActiveRoute(pathname, item.href);
          const className = `relative flex flex-col items-center gap-0.5 rounded-xl px-5 py-1.5 text-[10px] font-semibold transition-colors ${
            active ? "text-burgundy" : "text-stone-400"
          }`;

          const content = (
            <>
              <NavIcon icon={item.icon} active={active} />
              <span>{item.label}</span>
              {item.badge ? (
                <span className="absolute right-3 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-burgundy px-1 text-[9px] font-bold text-white">
                  {item.badge}
                </span>
              ) : null}
            </>
          );

          if (portalNav && !active) {
            return (
              <button
                key={item.href}
                type="button"
                onClick={() => portalNav.navigate(item.href)}
                className={className}
              >
                {content}
              </button>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              className={className}
            >
              {content}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
