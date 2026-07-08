"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ManagerActivitiesListView } from "@/components/manager-activities-list-view";
import { createWorkItem } from "@/lib/actions/data";
import type { WorkItem } from "@/lib/types";

export function ManagerActivitiesLiveList({
  items,
  commentCounts,
  projectId,
  managerId,
}: {
  items: WorkItem[];
  commentCounts: Record<string, number>;
  projectId: string;
  managerId: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  async function handleAddActivity(input: { title: string; outcome: string }) {
    const title = input.title.trim();
    const outcome = input.outcome.trim();
    if (!title || !outcome || creating) return;

    setCreating(true);
    setError(null);
    const result = await createWorkItem(projectId, title, managerId, outcome);
    setCreating(false);

    if (result && "error" in result && result.error) {
      setError(result.error);
      return;
    }

    router.refresh();
  }

  return (
    <>
      {error ? (
        <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      <ManagerActivitiesListView
        items={items}
        commentCounts={commentCounts}
        projectId={projectId}
        onAddActivity={handleAddActivity}
      />
      {creating ? (
        <p className="mt-2 text-center text-xs text-stone-500">
          Creating activity...
        </p>
      ) : null}
    </>
  );
}
