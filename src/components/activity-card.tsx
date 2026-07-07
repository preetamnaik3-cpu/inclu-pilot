"use client";

import Link from "next/link";
import Image from "next/image";
import { StatusPill } from "@/components/status-pill";
import { isActivityActive } from "@/lib/client-helpers";
import type { WorkItem } from "@/lib/types";

export function ActivityCard({
  item,
  commentCount,
  href,
  compact = false,
}: {
  item: WorkItem;
  commentCount?: number;
  href: string;
  compact?: boolean;
}) {
  const completed = !isActivityActive(item);

  return (
    <Link
      href={href}
      className={`card block transition-shadow hover:shadow-md ${
        completed ? "opacity-75" : ""
      } ${compact ? "p-3" : "p-3.5"}`}
    >
      <div className="flex items-start gap-3">
        {item.previewUrl ? (
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-stone-100">
            <Image
              src={item.previewUrl}
              alt=""
              fill
              className="object-cover"
              sizes="48px"
            />
          </div>
        ) : (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-lg">
            📄
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-semibold text-stone-900">{item.title}</h3>
            <StatusPill status={item.status} />
          </div>
          {!compact ? (
            <p className="mt-0.5 text-xs text-stone-500">
              {item.assignee.name} · {item.assignee.designation}
            </p>
          ) : null}
          {item.latestUpdate ? (
            <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-stone-600">
              {item.latestUpdate}
            </p>
          ) : null}
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-stone-400">
            {completed && item.completedAt ? (
              <span>Completed {item.completedAt}</span>
            ) : item.dueLabel ? (
              <span>{item.dueLabel}</span>
            ) : null}
            {commentCount && commentCount > 0 ? (
              <span>💬 {commentCount} note{commentCount === 1 ? "" : "s"}</span>
            ) : null}
          </div>
        </div>
      </div>
    </Link>
  );
}

/** @deprecated Use ActivityCard */
export function WorkItemCard({
  item,
  commentCount,
  href,
}: {
  item: WorkItem;
  commentCount: number;
  href: string;
}) {
  return (
    <ActivityCard item={item} commentCount={commentCount} href={href} />
  );
}
