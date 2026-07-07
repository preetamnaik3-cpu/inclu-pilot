"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { StatusPill } from "@/components/status-pill";
import { statusLabelClient } from "@/lib/client-helpers";
import { ActivityFilesSection } from "@/components/activity-files-section";
import { addWorkComment } from "@/lib/actions/data";
import type {
  ActivityFile,
  ActivityManagerUpdate,
  ClientProject,
  WorkComment,
  WorkItem,
} from "@/lib/types";

export function ActivityDetailView({
  item,
  project,
  comments,
  updates,
  files = [],
  live = false,
  onAddComment,
}: {
  item: WorkItem;
  project: ClientProject;
  comments: WorkComment[];
  updates: ActivityManagerUpdate[];
  files?: ActivityFile[];
  live?: boolean;
  onAddComment?: (body: string) => void;
}) {
  const [noteInput, setNoteInput] = useState("");
  const [localComments, setLocalComments] = useState(comments);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    setLocalComments(comments);
  }, [comments]);

  const managerFirst = project.manager.name.split(" ")[0];

  async function handleNote() {
    const trimmed = noteInput.trim();
    if (!trimmed) return;

    if (live) {
      setSending(true);
      const result = await addWorkComment(item.id, trimmed);
      setSending(false);
      if ("success" in result && result.success) {
        setLocalComments((prev) => [
          ...prev,
          {
            id: `local-${Date.now()}`,
            workItemId: item.id,
            authorName: "You",
            authorRole: "client",
            body: trimmed,
            createdAt: "Just now",
          },
        ]);
        setNoteInput("");
      }
      return;
    }

    if (onAddComment) {
      onAddComment(trimmed);
      setNoteInput("");
      return;
    }

    setLocalComments((prev) => [
      ...prev,
      {
        id: `local-${Date.now()}`,
        workItemId: item.id,
        authorName: "You",
        authorRole: "client",
        body: trimmed,
        createdAt: "Just now",
      },
    ]);
    setNoteInput("");
  }

  return (
    <div className="px-4 pt-2 pb-8">
      <Link
        href="/client/activities"
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-burgundy"
      >
        ← Activities
      </Link>

      <div className="mb-1 flex items-start justify-between gap-3">
        <h1 className="text-xl font-bold tracking-tight text-stone-900">
          {item.title}
        </h1>
        <StatusPill status={item.status} />
      </div>
      <p className="mb-4 text-xs text-stone-400">
        {statusLabelClient(item.status)}
        {item.completedAt ? ` · ${item.completedAt}` : ""}
      </p>

      {item.previewUrl ? (
        <div className="card relative aspect-video overflow-hidden p-0">
          <Image
            src={item.previewUrl}
            alt={item.title}
            fill
            className="object-cover"
            sizes="(max-width: 430px) 100vw"
          />
        </div>
      ) : null}

      <section className="mt-6">
        <h2 className="section-title">What you&apos;ll get</h2>
        <p className="mt-2 text-sm leading-relaxed text-stone-600">
          {item.outcome}
        </p>
      </section>

      <section className="mt-6">
        <h2 className="section-title">Working on this</h2>
        <p className="mt-2 text-sm text-stone-600">
          {item.assignee.name} · {item.assignee.designation}
        </p>
      </section>

      <section className="mt-8">
        <h2 className="section-title">Updates</h2>
        <p className="mb-3 mt-1 text-[11px] text-stone-400">
          Posted by your manager
        </p>
        {updates.length > 0 ? (
          <div className="space-y-2.5">
            {updates.map((update) => (
              <div key={update.id} className="card p-4">
                <p className="text-[11px] font-medium text-stone-500">
                  {update.authorName} · {update.createdAt}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-stone-800">
                  {update.body}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-stone-400">No updates yet.</p>
        )}
      </section>

      <ActivityFilesSection files={files} title="Shared files" />

      <section className="mt-8">
        <h2 className="section-title">Your message to manager</h2>
        <p className="mb-3 mt-1 text-[11px] text-stone-400">
          Notes go to {project.manager.name} only — not the team directly
        </p>
        <div className="space-y-2.5">
          {localComments.map((comment) => (
            <div
              key={comment.id}
              className={`rounded-2xl px-4 py-3 ${
                comment.authorRole === "client"
                  ? "bg-burgundy-light"
                  : "bg-stone-50"
              }`}
            >
              <p className="text-[11px] font-medium text-stone-500">
                {comment.authorName} · {comment.createdAt}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-stone-800">
                {comment.body}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-4 flex gap-2">
          <input
            type="text"
            value={noteInput}
            onChange={(e) => setNoteInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleNote()}
            placeholder="Leave a note for your manager..."
            className="input-field flex-1 px-4 py-2.5 text-sm"
          />
          <button
            type="button"
            onClick={handleNote}
            disabled={sending}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-burgundy text-white transition-colors hover:bg-burgundy-hover disabled:opacity-60"
            aria-label="Send note"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 2L11 13" />
              <path d="M22 2L15 22L11 13L2 9L22 2Z" />
            </svg>
          </button>
        </div>
      </section>

      <Link
        href="/client/chat"
        className="mt-6 block text-center text-sm font-medium text-burgundy"
      >
        Or chat with {managerFirst} →
      </Link>
    </div>
  );
}

/** @deprecated Use ActivityDetailView */
export function WorkDetailView({
  item,
  project,
  comments,
  live,
  onAddComment,
}: {
  item: WorkItem;
  project: ClientProject;
  comments: WorkComment[];
  live?: boolean;
  onAddComment?: (body: string) => void;
}) {
  return (
    <ActivityDetailView
      item={item}
      project={project}
      comments={comments}
      updates={[]}
      live={live}
      onAddComment={onAddComment}
    />
  );
}
