import type { ClientNotification, HubUpdate } from "@/lib/types";

export function notificationKeyForHubUpdate(updateId: string): string {
  return `hub:${updateId}`;
}

export function notificationKeyForMessage(messageId: string): string {
  return `msg:${messageId}`;
}

export function hubUpdatesToNotifications(
  updates: HubUpdate[],
  readKeys: Set<string>,
): ClientNotification[] {
  return updates
    .filter(
      (update) =>
        update.visibility === "client" &&
        (update.type === "manager_update" ||
          update.type === "feed_highlight" ||
          update.type === "status_change" ||
          update.type === "file_upload" ||
          update.type === "manager_reply"),
    )
    .map((update) => {
      const key = notificationKeyForHubUpdate(update.id);
      let title = update.feedTitle ?? "Project update";
      let body = update.feedSubtitle ?? update.body;

      switch (update.type) {
        case "manager_reply":
          title = `${update.authorName} replied`;
          body = update.body;
          break;
        case "file_upload":
          title = "New file shared";
          body = update.metadata?.fileName ?? update.body;
          break;
        case "status_change":
          title = "Activity status updated";
          break;
        default:
          break;
      }

      return {
        id: key,
        title,
        body,
        time: update.publishedAt ?? update.createdAt,
        workItemId: update.activityId,
        read: readKeys.has(key),
      };
    });
}

export function messagesToNotifications(
  messages: Array<{
    id: string;
    body: string;
    senderName: string;
    createdAt: string;
  }>,
  readKeys: Set<string>,
): ClientNotification[] {
  return messages.map((message) => {
    const key = notificationKeyForMessage(message.id);
    return {
      id: key,
      title: `Message from ${message.senderName}`,
      body: message.body || "Sent an attachment",
      time: message.createdAt,
      read: readKeys.has(key),
    };
  });
}

export function mergeNotifications(
  ...groups: ClientNotification[][]
): ClientNotification[] {
  const seen = new Set<string>();
  const merged: ClientNotification[] = [];

  for (const group of groups) {
    for (const item of group) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      merged.push(item);
    }
  }

  return merged.sort((a, b) => {
    if (a.read !== b.read) return a.read ? 1 : -1;
    return 0;
  });
}
