import type { WorkStatus } from "@/lib/types";

const statusConfig: Record<
  WorkStatus,
  { label: string; className: string }
> = {
  planned: {
    label: "Planned",
    className: "bg-stone-100 text-stone-600",
  },
  in_progress: {
    label: "In Progress",
    className: "bg-amber-50 text-amber-700",
  },
  in_review: {
    label: "In Review",
    className: "bg-burgundy-light text-burgundy",
  },
  done: {
    label: "Done",
    className: "bg-emerald-50 text-emerald-700",
  },
};

export function StatusPill({ status }: { status: WorkStatus }) {
  const config = statusConfig[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${config.className}`}
    >
      {config.label}
    </span>
  );
}

export function statusLabel(status: WorkStatus): string {
  return statusConfig[status].label;
}
