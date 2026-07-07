"use client";

import { useTransition } from "react";
import Link from "next/link";
import { markNotificationRead } from "@/lib/actions/notifications";
import type { ClientNotification } from "@/lib/types";

export function NotificationBell({
  notifications,
  live = false,
}: {
  notifications: ClientNotification[];
  live?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const unread = notifications.filter((n) => !n.read).length;

  function handleOpen(notification: ClientNotification) {
    if (!live || notification.read) return;
    startTransition(() => {
      void markNotificationRead(notification.id);
    });
  }

  return (
    <div className="relative">
      <details className="group">
        <summary className="relative flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-full bg-white text-stone-600 shadow-sm ring-1 ring-stone-200/80 transition-colors hover:text-burgundy [&::-webkit-details-marker]:hidden">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            aria-hidden
          >
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinejoin="round" />
            <path d="M13.73 21a2 2 0 01-3.46 0" strokeLinecap="round" />
          </svg>
          {unread > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-burgundy px-1 text-[9px] font-bold text-white">
              {unread}
            </span>
          ) : null}
        </summary>

        <div className="absolute right-0 top-11 z-50 w-[min(18rem,calc(100vw-2rem))] overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-stone-200/80">
          <div className="border-b border-stone-100 px-4 py-3">
            <p className="text-sm font-semibold text-stone-900">Notifications</p>
          </div>
          <ul className="max-h-72 overflow-y-auto">
            {notifications.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-stone-400">
                You&apos;re all caught up
              </li>
            ) : (
              notifications.map((n) => (
                <li key={n.id}>
                  <Link
                    href={
                      n.workItemId
                        ? `/client/activities/${n.workItemId}`
                        : "/client"
                    }
                    onClick={() => handleOpen(n)}
                    className={`block border-b border-stone-50 px-4 py-3 transition-colors hover:bg-stone-50 ${
                      n.read ? "opacity-70" : ""
                    } ${pending ? "pointer-events-none opacity-80" : ""}`}
                  >
                    <p className="text-sm font-medium text-stone-900">{n.title}</p>
                    <p className="mt-0.5 text-xs text-stone-500">{n.body}</p>
                    <p className="mt-1 text-[10px] text-stone-400">{n.time}</p>
                  </Link>
                </li>
              ))
            )}
          </ul>
        </div>
      </details>
    </div>
  );
}
