"use client";

import Link from "next/link";
import type { ClientProject } from "@/lib/types";
import { ActivityCard } from "@/components/activity-card";
import { splitActivities } from "@/lib/client-helpers";

const activityIconBg: Record<string, string> = {
  "📸": "bg-sky-50 text-sky-600",
  "🌐": "bg-emerald-50 text-emerald-600",
  "📱": "bg-violet-50 text-violet-600",
};

function getActivityIconClass(icon: string) {
  return activityIconBg[icon] ?? "bg-stone-100 text-stone-600";
}

export function ClientHomeView({ project }: { project: ClientProject }) {
  const { active } = splitActivities(project.workItems);

  return (
    <>
      {project.todayAttention.length > 0 ? (
        <section className="mb-6">
          <h2 className="section-title mb-3">Today on your brand</h2>
          <div className="space-y-2">
            {project.todayAttention.map((item) => (
              <Link
                key={item.id}
                href={
                  item.workItemId
                    ? `/client/activities/${item.workItemId}`
                    : "/client/activities"
                }
                className="flex items-center gap-3 rounded-2xl border border-burgundy/15 bg-burgundy-light/60 px-4 py-3 transition-colors hover:bg-burgundy-light"
              >
                <span className="flex h-2 w-2 shrink-0 rounded-full bg-burgundy" />
                <span className="text-sm font-medium text-stone-800">
                  {item.label}
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="section-title">Recent updates</h2>
          <Link
            href="/client/activities"
            className="text-xs font-semibold text-burgundy"
          >
            See all
          </Link>
        </div>
        <div className="space-y-2.5">
          {project.activities.map((activity) => (
            <Link
              key={activity.id}
              href={
                activity.workItemId
                  ? `/client/activities/${activity.workItemId}`
                  : "/client/activities"
              }
              className="card flex items-center gap-3 p-3.5 transition-shadow hover:shadow-md"
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg ${getActivityIconClass(activity.icon)}`}
              >
                {activity.icon}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-stone-900">
                  {activity.title}
                </p>
                <p className="mt-0.5 text-xs text-stone-500">
                  {activity.subtitle}
                  <span className="mx-1 text-stone-300">·</span>
                  {activity.time}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {active.length > 0 ? (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="section-title">Active activities</h2>
            <Link
              href="/client/activities"
              className="text-xs font-semibold text-burgundy"
            >
              View all
            </Link>
          </div>
          <div className="space-y-2.5">
            {active.slice(0, 3).map((item) => (
              <ActivityCard
                key={item.id}
                item={item}
                href={`/client/activities/${item.id}`}
                compact
              />
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
