"use client";

import { useState } from "react";
import type { WorkItem } from "@/lib/types";
import { ActivityCard } from "@/components/activity-card";
import { splitActivities } from "@/lib/client-helpers";

type Tab = "active" | "completed";

export function ActivitiesListView({
  items,
  commentCounts = {},
}: {
  items: WorkItem[];
  commentCounts?: Record<string, number>;
}) {
  const [tab, setTab] = useState<Tab>("active");
  const { active, completed } = splitActivities(items);
  const list = tab === "active" ? active : completed;

  return (
    <>
      <div className="mb-5 flex rounded-2xl bg-stone-100 p-1">
        <button
          type="button"
          onClick={() => setTab("active")}
          className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-colors ${
            tab === "active"
              ? "bg-white text-stone-900 shadow-sm"
              : "text-stone-500"
          }`}
        >
          Active ({active.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("completed")}
          className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-colors ${
            tab === "completed"
              ? "bg-white text-stone-900 shadow-sm"
              : "text-stone-500"
          }`}
        >
          Completed ({completed.length})
        </button>
      </div>

      {list.length > 0 ? (
        <div className="space-y-2.5">
          {list.map((item) => (
            <ActivityCard
              key={item.id}
              item={item}
              commentCount={commentCounts[item.id] ?? 0}
              href={`/client/activities/${item.id}`}
            />
          ))}
        </div>
      ) : (
        <div className="card py-12 text-center">
          <p className="text-sm text-stone-500">
            {tab === "active"
              ? "No active activities right now."
              : "No completed activities yet."}
          </p>
        </div>
      )}

      <p className="mt-6 text-center text-[11px] text-stone-400">
        Activities are managed by your manager
      </p>
    </>
  );
}
