import type { ClientProject, WorkItem, WorkStatus } from "@/lib/types";

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function getFirstName(fullName: string): string {
  return fullName.split(" ")[0] ?? fullName;
}

export function isActivityActive(item: WorkItem): boolean {
  return item.status !== "done";
}

export function splitActivities(items: WorkItem[]) {
  const active = items.filter(isActivityActive);
  const completed = items
    .filter((i) => !isActivityActive(i))
    .sort((a, b) => {
      if (!a.completedAt || !b.completedAt) return 0;
      return b.completedAt.localeCompare(a.completedAt);
    });
  return { active, completed };
}

export function activitySummary(project: ClientProject): string {
  const { active, completed } = splitActivities(project.workItems);
  const parts: string[] = [];
  if (active.length > 0) {
    parts.push(
      `${active.length} ${active.length === 1 ? "activity" : "activities"} in progress`,
    );
  }
  if (completed.length > 0) {
    parts.push(`${completed.length} completed`);
  }
  return parts.join(" · ") || "No activities yet";
}

export function needsAttentionCount(items: WorkItem[]): number {
  return items.filter((i) => i.status === "in_review").length;
}

export function statusLabelClient(status: WorkStatus): string {
  switch (status) {
    case "planned":
      return "Planned";
    case "in_progress":
      return "In progress";
    case "in_review":
      return "Needs your review";
    case "done":
      return "Completed";
    default: {
      const exhaustive: never = status;
      return exhaustive;
    }
  }
}
