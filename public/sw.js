/* global self */

self.addEventListener("push", (event) => {
  const data = (() => {
    try {
      return event.data?.json() ?? {};
    } catch {
      return {};
    }
  })();

  const title = data.title || "IncluPilot";
  const options = {
    body: data.body || "You have a new message.",
    icon: "/incluhub-logo.png",
    badge: "/incluhub-logo.png",
    data: {
      url: data.url || "/",
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification?.data?.url || "/";

  event.waitUntil(
    (async () => {
      const clientList = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      for (const client of clientList) {
        if (client.url && "focus" in client) {
          await client.focus();
          if ("navigate" in client) {
            await client.navigate(url);
          }
          return;
        }
      }

      await self.clients.openWindow(url);
    })(),
  );
});

