import type {
  ActivityUpdate,
  ClientProject,
  TodayAttention,
  WorkItem,
  WorkStatus,
} from "@/lib/types";

export function buildTodayAttention(items: WorkItem[]): TodayAttention[] {
  const attention: TodayAttention[] = [];

  for (const item of items) {
    if (item.status === "in_review") {
      attention.push({
        id: `att-${item.id}`,
        label: `${item.title} needs client review`,
        workItemId: item.id,
      });
    } else if (item.status === "planned" && item.dueLabel?.toLowerCase().includes("booked")) {
      attention.push({
        id: `att-${item.id}`,
        label: item.dueLabel,
        workItemId: item.id,
      });
    }
  }

  return attention;
}

export function recomputeProject(project: ClientProject): ClientProject {
  const doneCount = project.workItems.filter((i) => i.status === "done").length;
  const total = project.workItems.length;

  return {
    ...project,
    completedCount: doneCount,
    totalCount: total,
    progressPercent: total > 0 ? Math.round((doneCount / total) * 100) : 0,
    todayAttention: buildTodayAttention(project.workItems),
  };
}

export function statusDueLabel(status: WorkStatus): string | undefined {
  switch (status) {
    case "planned":
      return "Getting started";
    case "in_progress":
      return "In progress";
    case "in_review":
      return "Ready for client review";
    case "done":
      return undefined;
    default: {
      const exhaustive: never = status;
      return exhaustive;
    }
  }
}

export function feedIconForActivity(title: string): string {
  const lower = title.toLowerCase();
  if (lower.includes("shoot") || lower.includes("photo")) return "📸";
  if (lower.includes("social") || lower.includes("reel") || lower.includes("instagram")) {
    return "📱";
  }
  if (lower.includes("logo") || lower.includes("brand")) return "🎨";
  return "🌐";
}

export function createFeedEntry(
  title: string,
  subtitle: string,
  workItemId?: string,
): ActivityUpdate {
  return {
    id: `act-${Date.now()}`,
    icon: feedIconForActivity(title),
    title,
    subtitle,
    time: "Just now",
    workItemId,
  };
}
