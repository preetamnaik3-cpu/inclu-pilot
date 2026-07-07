"use client";

import { useState } from "react";
import type { WorkItem } from "@/lib/types";
import { ActivityCard } from "@/components/activity-card";
import { splitActivities } from "@/lib/client-helpers";

type Tab = "active" | "completed";

export function ManagerActivitiesListView({
  items,
  commentCounts = {},
  onAddActivity,
  projectId,
}: {
  items: WorkItem[];
  commentCounts?: Record<string, number>;
  onAddActivity?: (input: { title: string; outcome: string }) => void;
  projectId?: string;
}) {
  const [tab, setTab] = useState<Tab>("active");
  const [title, setTitle] = useState("");
  const [outcome, setOutcome] = useState("");
  const [showForm, setShowForm] = useState(false);
  const { active, completed } = splitActivities(items);
  const list = tab === "active" ? active : completed;

  function handleAdd() {
    if (!onAddActivity) return;
    onAddActivity({ title, outcome });
    setTitle("");
    setOutcome("");
    setShowForm(false);
  }

  return (
    <>
      {onAddActivity ? (
        <div className="mb-5">
          {showForm ? (
            <div className="card space-y-3 p-4">
              <h3 className="text-sm font-semibold text-stone-900">
                New activity
              </h3>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Activity title (e.g. Launch Video)"
                className="input-field w-full px-3 py-2 text-sm"
              />
              <textarea
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                placeholder="What the client will get..."
                rows={2}
                className="input-field w-full px-3 py-2 text-sm"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleAdd}
                  className="btn-primary flex-1 py-2 text-sm"
                >
                  Create activity
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-full bg-stone-100 px-4 py-2 text-sm font-medium text-stone-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="btn-primary w-full py-2.5 text-sm"
            >
              + New activity
            </button>
          )}
        </div>
      ) : null}

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
          {list.map((item) => {
            const clientNotes = commentCounts[item.id] ?? 0;
            return (
              <div key={item.id} className="relative">
                <ActivityCard
                  item={item}
                  commentCount={clientNotes}
                  href={
                    projectId
                      ? `/manager/activities/${item.id}?project=${projectId}`
                      : `/manager/activities/${item.id}`
                  }
                />
                {clientNotes > 0 ? (
                  <span className="absolute right-3 top-3 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                    {clientNotes} note{clientNotes === 1 ? "" : "s"}
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card py-12 text-center">
          <p className="text-sm text-stone-500">
            {tab === "active"
              ? "No active activities. Create one for your client."
              : "No completed activities yet."}
          </p>
        </div>
      )}

      <p className="mt-6 text-center text-[11px] text-stone-400">
        Changes sync to the client&apos;s Activities tab instantly
      </p>
    </>
  );
}
