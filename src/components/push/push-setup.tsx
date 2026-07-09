"use client";

import { useEffect, useMemo, useState } from "react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function isIosSafari() {
  const ua = navigator.userAgent;
  const isIos = /iPad|iPhone|iPod/.test(ua);
  const isWebkit = /WebKit/.test(ua);
  const isCriOS = /CriOS/.test(ua);
  const isFxiOS = /FxiOS/.test(ua);
  return isIos && isWebkit && !isCriOS && !isFxiOS;
}

function isStandaloneDisplayMode() {
  // iOS PWA
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nav: any = navigator;
  if (typeof nav.standalone === "boolean") return nav.standalone;
  // other browsers
  return window.matchMedia?.("(display-mode: standalone)")?.matches ?? false;
}

type Props = {
  portal: "client" | "manager" | "team";
};

export function PushSetup({ portal }: Props) {
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [busy, setBusy] = useState(false);
  const showIosInstallPrompt = useMemo(() => {
    if (typeof window === "undefined") return false;
    return isIosSafari() && !isStandaloneDisplayMode();
  }, []);

  useEffect(() => {
    const can =
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      typeof Notification !== "undefined";
    setSupported(Boolean(can) && Boolean(vapidPublicKey));
    setPermission(typeof Notification !== "undefined" ? Notification.permission : "default");
  }, [vapidPublicKey]);

  useEffect(() => {
    if (!supported) return;

    let cancelled = false;
    async function register() {
      const reg = await navigator.serviceWorker.register("/sw.js");
      if (cancelled) return;

      if (Notification.permission !== "granted") return;

      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        // Ensure server has it (idempotent).
        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ subscription: sub, userAgent: navigator.userAgent, portal }),
        });
        return;
      }

      const created = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ subscription: created, userAgent: navigator.userAgent, portal }),
      });
    }

    void register().catch(() => {
      // noop: user can retry via banner
    });

    return () => {
      cancelled = true;
    };
  }, [portal, supported, vapidPublicKey]);

  if (!supported) return null;

  if (showIosInstallPrompt) {
    return (
      <div className="mx-auto mb-3 max-w-lg rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 shadow-[var(--shadow-card)]">
        <p className="font-semibold text-stone-900">Enable phone notifications</p>
        <p className="mt-1 text-[13px] text-stone-600">
          On iPhone/iPad, push works only after installing this app. Tap <span className="font-medium">Share</span> →{" "}
          <span className="font-medium">Add to Home Screen</span>, then open the installed app to enable notifications.
        </p>
      </div>
    );
  }

  if (permission === "denied") {
    return (
      <div className="mx-auto mb-3 max-w-lg rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 shadow-[var(--shadow-card)]">
        <p className="font-semibold text-stone-900">Notifications blocked</p>
        <p className="mt-1 text-[13px] text-stone-600">
          Enable notifications in your browser settings to get message alerts.
        </p>
      </div>
    );
  }

  if (permission === "granted") return null;

  return (
    <div className="mx-auto mb-3 max-w-lg rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-stone-900">Turn on notifications</p>
          <p className="mt-1 text-[13px] text-stone-600">
            Get a ping when you receive a new message, even when you’re away.
          </p>
        </div>
        <button
          type="button"
          disabled={busy}
          className="shrink-0 rounded-full bg-burgundy px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
          onClick={async () => {
            setBusy(true);
            try {
              const next = await Notification.requestPermission();
              setPermission(next);
              // subscription will happen in effect after permission becomes granted
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? "Enabling…" : "Enable"}
        </button>
      </div>
    </div>
  );
}

