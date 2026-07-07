"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { StatusPill } from "@/components/status-pill";
import { ManagerActivityFilesSection } from "@/components/activity-files-section";
import { statusLabelClient } from "@/lib/client-helpers";
import type {
  ActivityFile,
  ActivityManagerUpdate,
  ClientProject,
  HubUpdate,
  WorkComment,
  WorkItem,
  WorkStatus,
} from "@/lib/types";

const statusOptions: WorkStatus[] = [
  "planned",
  "in_progress",
  "in_review",
  "done",
];

export function ManagerActivityDetailView({
  item,
  project,
  comments,
  updates,
  teamPulse = [],
  managerFiles = [],
  onStatusChange,
  onPostUpdate,
  onReplyToClient,
  onPublishTeamUpdate,
  onUploadFile,
  onPublishFile,
  activitiesHref = "/manager/activities",
  live = false,
}: {
  item: WorkItem;
  project: ClientProject;
  comments: WorkComment[];
  updates: ActivityManagerUpdate[];
  teamPulse?: HubUpdate[];
  managerFiles?: ActivityFile[];
  onStatusChange: (status: WorkStatus) => void | Promise<void>;
  onPostUpdate: (body: string) => void | Promise<void>;
  onReplyToClient: (body: string) => void | Promise<void>;
  onPublishTeamUpdate?: (updateId: string) => void | Promise<void>;
  onUploadFile?: (file: File) => void | Promise<void>;
  onPublishFile?: (fileId: string) => void | Promise<void>;
  activitiesHref?: string;
  live?: boolean;
}) {
  const [updateInput, setUpdateInput] = useState("");
  const [replyInput, setReplyInput] = useState("");
  const [sendingUpdate, setSendingUpdate] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  const clientNotes = comments.filter((c) => c.authorRole === "client");
  const managerReplies = comments.filter((c) => c.authorRole === "manager");

  async function handleStatusChange(status: WorkStatus) {
    await onStatusChange(status);
  }

  async function handlePostUpdate() {
    const trimmed = updateInput.trim();
    if (!trimmed) return;
    setSendingUpdate(true);
    try {
      await onPostUpdate(trimmed);
      setUpdateInput("");
    } finally {
      setSendingUpdate(false);
    }
  }

  async function handleReply() {
    const trimmed = replyInput.trim();
    if (!trimmed) return;
    setSendingReply(true);
    try {
      await onReplyToClient(trimmed);
      setReplyInput("");
    } finally {
      setSendingReply(false);
    }
  }

  return (
    <div className="px-4 pt-2 pb-8">
      <Link
        href={activitiesHref}
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
        {statusLabelClient(item.status)} · Client sees this activity live
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
        <h2 className="section-title">Outcome (client-facing)</h2>
        <p className="mt-2 text-sm leading-relaxed text-stone-600">
          {item.outcome}
        </p>
      </section>

      <section className="mt-6">
        <h2 className="section-title">Assigned team</h2>
        <p className="mt-2 text-sm text-stone-600">
          {item.assignee.name} · {item.assignee.designation}
        </p>
      </section>

      <section className="mt-6">
        <h2 className="section-title">Status</h2>
        <select
          className="input-field mt-2 w-full px-3 py-2.5 text-sm"
          value={item.status}
          onChange={(e) =>
            handleStatusChange(e.target.value as WorkStatus)
          }
          disabled={live && sendingUpdate}
          aria-label={`Status for ${item.title}`}
        >
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {statusLabelClient(status)}
            </option>
          ))}
        </select>
        <p className="mt-1.5 text-[11px] text-stone-400">
          Set to &quot;Needs your review&quot; to flag the client on their home
          screen.
        </p>
      </section>

      {teamPulse.length > 0 ? (
        <section className="mt-8">
          <h2 className="section-title">Team pulse</h2>
          <p className="mb-3 mt-1 text-[11px] text-stone-400">
            Quick updates from your team — publish to share with client
          </p>
          <div className="space-y-2.5">
            {teamPulse.map((pulse) => (
              <div key={pulse.id} className="card p-4">
                <p className="text-[11px] font-medium text-stone-500">
                  {pulse.authorName} · {pulse.createdAt}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-stone-800">
                  {pulse.body}
                </p>
                {onPublishTeamUpdate ? (
                  <button
                    type="button"
                    onClick={() => onPublishTeamUpdate(pulse.id)}
                    className="mt-3 rounded-full bg-burgundy px-4 py-2 text-xs font-semibold text-white"
                  >
                    Publish to client →
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-8">
        <h2 className="section-title">Post update to client</h2>
        <p className="mb-3 mt-1 text-[11px] text-stone-400">
          Appears in the activity Updates stream and client home feed
        </p>
        <textarea
          value={updateInput}
          onChange={(e) => setUpdateInput(e.target.value)}
          placeholder="Homepage is ready — please review when you can."
          rows={3}
          className="input-field w-full px-3 py-2.5 text-sm"
        />
        <button
          type="button"
          onClick={handlePostUpdate}
          disabled={sendingUpdate || !updateInput.trim()}
          className="btn-primary mt-2 w-full py-2.5 text-sm disabled:opacity-50"
        >
          Publish update →
        </button>

        {updates.length > 0 ? (
          <div className="mt-4 space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">
              Previous updates
            </p>
            {updates.map((update) => (
              <div key={update.id} className="card p-3">
                <p className="text-[11px] text-stone-400">{update.createdAt}</p>
                <p className="mt-1 text-sm text-stone-700">{update.body}</p>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      {onUploadFile ? (
        <ManagerActivityFilesSection
          files={managerFiles}
          uploading={uploadingFile}
          onUpload={async (file) => {
            setUploadingFile(true);
            try {
              await onUploadFile(file);
            } finally {
              setUploadingFile(false);
            }
          }}
          onPublish={onPublishFile}
        />
      ) : null}

      <section className="mt-8">
        <h2 className="section-title">Client notes</h2>
        <p className="mb-3 mt-1 text-[11px] text-stone-400">
          Reply here — only {project.clientName.split(" ")[0]} and you see this
          thread
        </p>

        <div className="space-y-2.5">
          {comments.length === 0 ? (
            <p className="text-sm text-stone-400">No client notes yet.</p>
          ) : (
            comments.map((comment) => (
              <div
                key={comment.id}
                className={`rounded-2xl px-4 py-3 ${
                  comment.authorRole === "client"
                    ? "bg-amber-50"
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
            ))
          )}
        </div>

        {clientNotes.length > 0 && managerReplies.length === 0 ? (
          <p className="mt-2 text-xs font-medium text-amber-700">
            Client is waiting for your reply
          </p>
        ) : null}

        <div className="mt-4 flex gap-2">
          <input
            type="text"
            value={replyInput}
            onChange={(e) => setReplyInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleReply()}
            placeholder="Reply to client..."
            className="input-field flex-1 px-4 py-2.5 text-sm"
          />
          <button
            type="button"
            onClick={handleReply}
            disabled={sendingReply || !replyInput.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-burgundy text-white disabled:opacity-50"
            aria-label="Send reply"
          >
            →
          </button>
        </div>
      </section>

      <Link
        href={`/manager/chat/${project.id}`}
        className="mt-6 block text-center text-sm font-medium text-burgundy"
      >
        Open chat with {project.clientName.split(" ")[0]} →
      </Link>
    </div>
  );
}
