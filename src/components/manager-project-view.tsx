"use client";

import Link from "next/link";
import { useState } from "react";
import { StatusPill } from "@/components/status-pill";
import {
  createWorkItem,
  publishActivityUpdate,
  updateWorkItemStatus,
} from "@/lib/actions/data";
import type { ClientProject, WorkStatus } from "@/lib/types";

type Tab = "work" | "updates" | "team";

export function ManagerProjectView({
  project,
  projectId,
  managerId,
  clientCommentCounts,
  live = false,
}: {
  project: ClientProject;
  projectId: string;
  managerId: string;
  clientCommentCounts: Record<string, number>;
  live?: boolean;
}) {
  const [tab, setTab] = useState<Tab>("work");
  const [newTitle, setNewTitle] = useState("");
  const [updateTitle, setUpdateTitle] = useState("");
  const [updateSubtitle, setUpdateSubtitle] = useState("");
  const [visibleToClient, setVisibleToClient] = useState(true);

  async function handleStatusChange(workItemId: string, status: WorkStatus) {
    if (!live) return;
    await updateWorkItemStatus(workItemId, status);
  }

  async function handleAddWorkItem() {
    if (!live || !newTitle.trim()) return;
    await createWorkItem(projectId, newTitle.trim(), managerId);
    setNewTitle("");
  }

  async function handlePublish() {
    if (!live || !updateTitle.trim()) return;
    await publishActivityUpdate(
      projectId,
      updateTitle.trim(),
      updateSubtitle.trim(),
      visibleToClient,
    );
    setUpdateTitle("");
    setUpdateSubtitle("");
  }

  return (
    <div className="px-4 pt-5">
      <Link href="/manager" className="mb-2 inline-flex text-sm font-medium text-burgundy">
        ← Clients
      </Link>
      <h1 className="text-xl font-bold tracking-tight text-stone-900">{project.name}</h1>
      <p className="text-sm text-stone-500">Client: {project.clientName}</p>

      <div className="mt-4 flex gap-2">
        {(
          [
            ["work", "Work Items"],
            ["updates", "Updates"],
            ["team", "Team"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              tab === key
                ? "bg-burgundy text-white"
                : "bg-stone-100 text-stone-600"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "work" ? (
        <div className="mt-4 space-y-2.5">
          <div className="flex gap-2">
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="New work item title..."
              className="input-field flex-1 rounded-xl px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={handleAddWorkItem}
              className="rounded-full bg-burgundy px-4 py-2 text-sm font-semibold text-white"
            >
              Add
            </button>
          </div>
          {project.workItems.map((item) => {
            const clientComments = clientCommentCounts[item.id] ?? 0;
            return (
              <div key={item.id} className="card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-stone-900">{item.title}</h3>
                    <p className="mt-1 text-xs text-stone-400">
                      {item.assignee.name} · {item.assignee.designation}
                    </p>
                  </div>
                  <StatusPill status={item.status} />
                </div>
                {clientComments > 0 ? (
                  <p className="mt-2 text-xs text-amber-600">
                    💬 {clientComments} client comment
                    {clientComments > 1 ? "s" : ""}
                  </p>
                ) : null}
                <select
                  className="mt-3 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm"
                  defaultValue={item.status}
                  onChange={(e) =>
                    handleStatusChange(item.id, e.target.value as WorkStatus)
                  }
                  aria-label={`Status for ${item.title}`}
                >
                  {(
                    [
                      "planned",
                      "in_progress",
                      "in_review",
                      "done",
                    ] as WorkStatus[]
                  ).map((s) => (
                    <option key={s} value={s}>
                      {s.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
      ) : null}

      {tab === "updates" ? (
        <div className="mt-4 space-y-4">
          <div className="card p-4">
            <h3 className="section-title">Post to client feed</h3>
            <input
              value={updateTitle}
              onChange={(e) => setUpdateTitle(e.target.value)}
              className="input-field mt-2 w-full rounded-xl px-3 py-2 text-sm"
              placeholder="Shoot day confirmed..."
            />
            <textarea
              value={updateSubtitle}
              onChange={(e) => setUpdateSubtitle(e.target.value)}
              className="input-field mt-2 w-full rounded-xl px-3 py-2 text-sm"
              rows={2}
              placeholder="Friday at 10 AM at Studio B"
            />
            <label className="mt-2 flex items-center gap-2 text-sm text-stone-600">
              <input
                type="checkbox"
                checked={visibleToClient}
                onChange={(e) => setVisibleToClient(e.target.checked)}
                className="rounded"
              />
              Visible to client
            </label>
            <button
              type="button"
              onClick={handlePublish}
              className="btn-primary mt-3 w-full py-2.5 text-sm"
            >
              Publish →
            </button>
          </div>
        </div>
      ) : null}

      {tab === "team" ? (
        <div className="mt-4 space-y-3">
          {project.workItems.map((item) => (
            <div key={item.id} className="card p-4">
              <p className="font-medium text-stone-900">{item.assignee.name}</p>
              <p className="text-xs text-stone-400">{item.assignee.designation}</p>
              <p className="mt-1 text-sm text-stone-600">On: {item.title}</p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
