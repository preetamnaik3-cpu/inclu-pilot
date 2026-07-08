"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteManagerProject } from "@/lib/actions/clients";
import type { ManagerClientSummary } from "@/lib/types";

function DeleteProjectButton({
  projectId,
  projectName,
  clientName,
}: {
  projectId: string;
  projectName: string;
  clientName: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    const confirmed = window.confirm(
      `Delete project "${projectName}" for ${clientName}? The client and all team on this project will return to unassigned.`,
    );
    if (!confirmed) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.set("projectId", projectId);
    const result = await deleteManagerProject(formData);

    setLoading(false);

    if (result?.error) {
      setError(result.error);
      return;
    }

    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleDelete}
        disabled={loading}
        className="text-xs font-medium text-red-600 hover:underline disabled:opacity-60"
      >
        {loading ? "Deleting..." : "Delete project"}
      </button>
      {error ? <span className="text-[10px] text-red-600">{error}</span> : null}
    </div>
  );
}

export function ManagerClientProjectList({
  clients,
}: {
  clients: ManagerClientSummary[];
}) {
  if (clients.length === 0) {
    return (
      <p className="text-sm text-stone-500">
        No projects yet. Create one using the form above.
      </p>
    );
  }

  return (
    <div className="space-y-2.5">
      {clients.map((client, index) => {
        const isPrimary = index === 0;
        const href = `/manager/activities?project=${client.id}`;
        const badge =
          (client.unreadCount ?? 0) + (client.pendingNoteCount ?? 0);

        return (
          <div key={client.id} className="card p-4">
            <div className="flex items-start justify-between gap-3">
              <Link href={href} className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-stone-900">
                    {client.projectName}
                  </h3>
                  {isPrimary ? (
                    <span className="rounded-full bg-burgundy-light px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-burgundy">
                      Active
                    </span>
                  ) : null}
                </div>
                <p className="text-sm text-stone-500">{client.clientName}</p>
                <p className="mt-2 text-xs text-stone-500">{client.statusLine}</p>
                <p className="mt-2 text-sm text-stone-600">{client.lastMessage}</p>
                <div className="mt-2 flex items-center justify-between text-xs text-stone-400">
                  <span>
                    {client.activeActivityCount ?? 0} active activit
                    {(client.activeActivityCount ?? 0) === 1 ? "y" : "ies"}
                  </span>
                  <span>{client.lastMessageTime}</span>
                </div>
              </Link>
              <div className="flex shrink-0 flex-col items-end gap-2">
                {badge > 0 ? (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-burgundy px-1.5 text-[10px] font-bold text-white">
                    {badge}
                  </span>
                ) : null}
                <DeleteProjectButton
                  projectId={client.id}
                  projectName={client.projectName}
                  clientName={client.clientName}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
