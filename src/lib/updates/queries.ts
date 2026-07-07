import { createClient } from "@/lib/supabase/server";
import type { HubUpdate, UpdateType, UpdateVisibility, UserRole } from "@/lib/types";

type HubUpdateRow = {
  id: string;
  project_id: string;
  activity_id: string | null;
  author_id: string | null;
  author_role: UserRole;
  type: UpdateType;
  body: string;
  visibility: UpdateVisibility;
  published_at: string | null;
  feed_title: string | null;
  feed_subtitle: string | null;
  icon: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

function parseMetadata(
  raw: Record<string, unknown> | null,
): HubUpdate["metadata"] {
  if (!raw) return undefined;
  return {
    fileUrl: typeof raw.fileUrl === "string" ? raw.fileUrl : undefined,
    fileName: typeof raw.fileName === "string" ? raw.fileName : undefined,
    fileKind:
      raw.fileKind === "image" ||
      raw.fileKind === "video" ||
      raw.fileKind === "file"
        ? raw.fileKind
        : undefined,
    mimeType: typeof raw.mimeType === "string" ? raw.mimeType : undefined,
    sizeBytes:
      typeof raw.sizeBytes === "number" ? raw.sizeBytes : undefined,
  };
}

function mapRow(
  row: HubUpdateRow,
  authorName: string,
): HubUpdate {
  return {
    id: row.id,
    projectId: row.project_id,
    activityId: row.activity_id ?? undefined,
    authorId: row.author_id ?? "",
    authorName,
    authorRole: row.author_role,
    type: row.type,
    body: row.body,
    visibility: row.visibility,
    publishedAt: row.published_at ? formatRelative(row.published_at) : undefined,
    feedTitle: row.feed_title ?? undefined,
    feedSubtitle: row.feed_subtitle ?? undefined,
    icon: row.icon ?? undefined,
    metadata: parseMetadata(row.metadata),
    createdAt: formatRelative(row.created_at),
    sortKey: new Date(row.created_at).getTime(),
  };
}

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  return new Date(iso).toLocaleDateString();
}

async function attachAuthorNames(rows: HubUpdateRow[]): Promise<HubUpdate[]> {
  const supabase = await createClient();
  const authorIds = [...new Set(rows.map((r) => r.author_id).filter(Boolean))] as string[];
  const { data: authors } =
    authorIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", authorIds)
      : { data: [] };

  const authorMap = Object.fromEntries(
    (authors ?? []).map((a) => [a.id, a.full_name]),
  );

  return rows.map((row) =>
    mapRow(row, authorMap[row.author_id ?? ""] ?? "User"),
  );
}

export async function getHubUpdatesForProject(
  projectId: string,
): Promise<HubUpdate[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("hub_updates")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  return attachAuthorNames((data ?? []) as HubUpdateRow[]);
}

export async function getHubUpdatesForActivity(
  activityId: string,
): Promise<HubUpdate[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("hub_updates")
    .select("*")
    .eq("activity_id", activityId)
    .order("created_at", { ascending: false });

  return attachAuthorNames((data ?? []) as HubUpdateRow[]);
}

export async function getActivityHubBundle(activityId: string) {
  const {
    getActivityNotes,
    getActivityFiles,
    getActivityFilesForManager,
    getActivityTimelineForClient,
    getTeamPulseForManager,
    toActivityManagerUpdate,
  } = await import("@/lib/updates/selectors");

  const updates = await getHubUpdatesForActivity(activityId);

  return {
    comments: getActivityNotes(updates, activityId),
    updates: getActivityTimelineForClient(updates, activityId).map(
      toActivityManagerUpdate,
    ),
    teamPulse: getTeamPulseForManager(updates, activityId),
    files: getActivityFiles(updates, activityId, { clientView: true }),
    managerFiles: getActivityFilesForManager(updates, activityId),
  };
}
