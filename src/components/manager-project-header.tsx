import { activitySummary } from "@/lib/client-helpers";
import type { ClientProject } from "@/lib/types";

export function ManagerProjectHeader({
  project,
  pendingNotes,
}: {
  project: ClientProject;
  pendingNotes?: number;
}) {
  return (
    <header className="mb-5">
      <h1 className="text-xl font-bold tracking-tight text-stone-900">
        {project.name}
      </h1>
      <p className="mt-0.5 text-sm text-stone-500">
        Client: {project.clientName}
      </p>
      <p className="mt-1 text-xs text-stone-400">{activitySummary(project)}</p>
      {pendingNotes && pendingNotes > 0 ? (
        <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
          {pendingNotes} client note{pendingNotes === 1 ? "" : "s"} need a reply
        </p>
      ) : null}
    </header>
  );
}
