"use client";

import { useState } from "react";
import { StatusPill } from "@/components/status-pill";
import { AuthHeaderAction } from "@/components/auth-header-action";
import { PageHeader } from "@/components/client-page-header";
import { sendMessage } from "@/lib/actions/data";
import type { WorkItem } from "@/lib/types";

export function TeamWorkView({
  items,
  projectName = "Your project",
  live = false,
  conversationId,
  onQuickUpdate,
  showSwitchRole = false,
  headerAction,
}: {
  items: WorkItem[];
  projectName?: string;
  live?: boolean;
  conversationId?: string;
  onQuickUpdate?: (activityId: string, text: string) => void;
  showSwitchRole?: boolean;
  headerAction?: React.ReactNode;
}) {
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [sentFor, setSentFor] = useState<string | null>(null);
  const [sendingFor, setSendingFor] = useState<string | null>(null);
  const [errorFor, setErrorFor] = useState<Record<string, string>>({});

  async function handleSendUpdate(activityId: string) {
    const trimmed = (drafts[activityId] ?? "").trim();
    if (!trimmed || sendingFor) return;

    if (onQuickUpdate) {
      setSendingFor(activityId);
      setErrorFor((prev) => {
        const next = { ...prev };
        delete next[activityId];
        return next;
      });
      try {
        await onQuickUpdate(activityId, trimmed);
        setDrafts((prev) => ({ ...prev, [activityId]: "" }));
        setSentFor(activityId);
        setTimeout(() => setSentFor(null), 2000);
      } catch (error) {
        setErrorFor((prev) => ({
          ...prev,
          [activityId]:
            error instanceof Error ? error.message : "Failed to send update",
        }));
      } finally {
        setSendingFor(null);
      }
      return;
    }

    if (live && conversationId) {
      setSendingFor(activityId);
      setErrorFor((prev) => {
        const next = { ...prev };
        delete next[activityId];
        return next;
      });
      const result = await sendMessage(conversationId, trimmed);
      setSendingFor(null);
      if (result?.error) {
        setErrorFor((prev) => ({ ...prev, [activityId]: result.error! }));
        return;
      }
      setDrafts((prev) => ({ ...prev, [activityId]: "" }));
      setSentFor(activityId);
      setTimeout(() => setSentFor(null), 2000);
    }
  }

  return (
    <div className="px-4 pt-5 pb-8">
      <PageHeader
        title="My tasks"
        subtitle={projectName}
        action={
          headerAction ??
          (showSwitchRole ? <AuthHeaderAction demo /> : undefined)
        }
      />

      <p className="mb-4 text-xs text-stone-500">
        Quick updates go to your manager on each task — they publish to the
        client when ready.
      </p>

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="card p-4">
            <h3 className="font-semibold text-stone-900">{item.title}</h3>
            {item.dueLabel ? (
              <p className="mt-0.5 text-sm text-stone-500">{item.dueLabel}</p>
            ) : null}
            <div className="mt-2">
              <StatusPill status={item.status} />
            </div>

            <div className="mt-4 border-t border-stone-100 pt-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">
                Quick update
              </p>
              <textarea
                value={drafts[item.id] ?? ""}
                onChange={(e) =>
                  setDrafts((prev) => ({ ...prev, [item.id]: e.target.value }))
                }
                rows={2}
                placeholder="e.g. Draft ready for manager review..."
                className="input-field mt-2 w-full px-3 py-2 text-sm"
              />
              {errorFor[item.id] ? (
                <p className="mt-2 text-xs text-red-600">{errorFor[item.id]}</p>
              ) : null}
              <button
                type="button"
                onClick={() => handleSendUpdate(item.id)}
                disabled={sendingFor === item.id}
                className="btn-primary mt-2 w-full py-2 text-sm disabled:opacity-60"
              >
                {sentFor === item.id
                  ? "Sent ✓"
                  : sendingFor === item.id
                    ? "Sending..."
                    : "Send to manager"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
