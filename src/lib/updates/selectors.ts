import type {
  ActivityUpdate,
  ActivityFile,
  HubUpdate,
  UpdateType,
  UserRole,
  WorkComment,
  WorkItem,
} from "@/lib/types";

export function isClientVisible(update: HubUpdate): boolean {
  return update.visibility === "client";
}

export function isManagerVisible(update: HubUpdate): boolean {
  return (
    update.visibility === "manager" ||
    update.visibility === "client" ||
    update.visibility === "internal"
  );
}

export function isTeamVisible(
  update: HubUpdate,
  teamMemberId: string,
  assignedActivityIds: string[],
): boolean {
  if (update.authorId === teamMemberId) return true;
  if (update.activityId && !assignedActivityIds.includes(update.activityId)) {
    return false;
  }
  return update.type === "team_quick_update" || update.visibility !== "internal";
}

export function sortUpdatesNewestFirst(updates: HubUpdate[]): HubUpdate[] {
  return [...updates].sort((a, b) => b.sortKey - a.sortKey);
}

export function getUpdatesForProject(
  updates: HubUpdate[],
  projectId: string,
): HubUpdate[] {
  return sortUpdatesNewestFirst(
    updates.filter((update) => update.projectId === projectId),
  );
}

export function getClientHomeFeed(
  updates: HubUpdate[],
  projectId: string,
): ActivityUpdate[] {
  return getUpdatesForProject(updates, projectId)
    .filter(isClientVisible)
    .filter(
      (update) =>
        update.type === "feed_highlight" ||
        update.type === "manager_update" ||
        update.type === "status_change",
    )
    .map(toFeedCard);
}

export function getActivityTimelineForClient(
  updates: HubUpdate[],
  activityId: string,
): HubUpdate[] {
  return sortUpdatesNewestFirst(
    updates.filter(
      (update) =>
        update.activityId === activityId &&
        isClientVisible(update) &&
        (update.type === "manager_update" ||
          update.type === "status_change" ||
          update.type === "file_upload" ||
          update.type === "team_quick_update"),
    ),
  );
}

export function getTeamPulseForManager(
  updates: HubUpdate[],
  activityId: string,
): HubUpdate[] {
  return sortUpdatesNewestFirst(
    updates.filter(
      (update) =>
        update.activityId === activityId &&
        update.type === "team_quick_update" &&
        update.visibility !== "client",
    ),
  );
}

export function getActivityNotes(
  updates: HubUpdate[],
  activityId: string,
): WorkComment[] {
  return sortUpdatesNewestFirst(
    updates.filter(
      (update) =>
        update.activityId === activityId &&
        (update.type === "client_note" || update.type === "manager_reply"),
    ),
  ).map(toWorkComment);
}

export function countClientNotesAwaitingReply(
  updates: HubUpdate[],
  activityId: string,
): number {
  const notes = updates.filter(
    (update) =>
      update.activityId === activityId &&
      (update.type === "client_note" || update.type === "manager_reply"),
  );
  const clientCount = notes.filter((n) => n.type === "client_note").length;
  const managerCount = notes.filter((n) => n.type === "manager_reply").length;
  return Math.max(0, clientCount - managerCount);
}

export function getActivityFiles(
  updates: HubUpdate[],
  activityId: string,
  options?: { clientView?: boolean },
): ActivityFile[] {
  const clientView = options?.clientView ?? false;

  return sortUpdatesNewestFirst(
    updates.filter(
      (update) =>
        update.activityId === activityId &&
        update.type === "file_upload" &&
        (!clientView || update.visibility === "client"),
    ),
  ).map((update) => ({
    id: update.id,
    activityId,
    url: update.metadata?.fileUrl ?? "",
    name: update.metadata?.fileName ?? update.body,
    kind: update.metadata?.fileKind ?? "file",
    mimeType: update.metadata?.mimeType,
    sizeBytes: update.metadata?.sizeBytes,
    uploadedAt: update.createdAt,
    visibleToClient: update.visibility === "client",
  }));
}

export function getActivityFilesForManager(
  updates: HubUpdate[],
  activityId: string,
) {
  return getActivityFiles(updates, activityId, { clientView: false });
}

export function getLatestClientVisibleLine(
  updates: HubUpdate[],
  activityId: string,
): string | undefined {
  const latest = getActivityTimelineForClient(updates, activityId)[0];
  return latest?.body;
}

export function applyLatestLinesToWorkItems(
  workItems: WorkItem[],
  updates: HubUpdate[],
): WorkItem[] {
  return workItems.map((item) => ({
    ...item,
    latestUpdate:
      getLatestClientVisibleLine(updates, item.id) ?? item.latestUpdate,
  }));
}

export function toFeedCard(update: HubUpdate): ActivityUpdate {
  const title =
    update.feedTitle ??
    (update.activityId ? update.body.split(" — ")[0] : update.body);
  const subtitle =
    update.feedSubtitle ??
    (update.feedTitle ? update.body : update.body.split(" — ").slice(1).join(" — "));

  return {
    id: update.id,
    icon: update.icon ?? "📌",
    title,
    subtitle: subtitle || update.body,
    time: update.createdAt,
    workItemId: update.activityId,
  };
}

export function toActivityManagerUpdate(update: HubUpdate) {
  return {
    id: update.id,
    workItemId: update.activityId ?? "",
    authorName: update.authorName,
    body: update.body,
    createdAt: update.createdAt,
  };
}

export function toWorkComment(update: HubUpdate): WorkComment {
  return {
    id: update.id,
    workItemId: update.activityId ?? "",
    authorName:
      update.type === "client_note" && update.authorRole === "client"
        ? "You"
        : update.authorName,
    authorRole: update.type === "manager_reply" ? "manager" : "client",
    body: update.body,
    createdAt: update.createdAt,
  };
}

export function createUpdate(input: {
  projectId: string;
  activityId?: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  type: UpdateType;
  body: string;
  visibility: HubUpdate["visibility"];
  feedTitle?: string;
  feedSubtitle?: string;
  icon?: string;
  publishedAt?: string;
}): HubUpdate {
  const now = Date.now();
  return {
    id: `upd-${now}-${Math.random().toString(36).slice(2, 7)}`,
    projectId: input.projectId,
    activityId: input.activityId,
    authorId: input.authorId,
    authorName: input.authorName,
    authorRole: input.authorRole,
    type: input.type,
    body: input.body,
    visibility: input.visibility,
    publishedAt: input.publishedAt ?? (input.visibility === "client" ? "Just now" : undefined),
    feedTitle: input.feedTitle,
    feedSubtitle: input.feedSubtitle,
    icon: input.icon,
    createdAt: "Just now",
    sortKey: now,
  };
}
