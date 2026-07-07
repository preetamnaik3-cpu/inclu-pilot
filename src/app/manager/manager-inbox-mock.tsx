"use client";

import { useState } from "react";
import { PageHeader } from "@/components/client-page-header";
import { demoInboxThreads } from "@/lib/demo-data";

type Filter = "all" | "client" | "internal";

export function ManagerInboxMock() {
  const [filter, setFilter] = useState<Filter>("all");

  const threads = demoInboxThreads.filter((t) => {
    if (filter === "all") return true;
    return t.type === filter;
  });

  return (
    <div className="px-4 pt-5">
      <PageHeader title="Inbox" />

      <div className="mt-2 flex gap-2">
        {(
          [
            ["all", "All"],
            ["client", "Client"],
            ["internal", "Internal"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              filter === key
                ? "bg-burgundy text-white"
                : "bg-stone-100 text-stone-600"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-2.5">
        {threads.map((thread) => (
          <div key={thread.id} className="card p-4">
            <div className="flex items-center justify-between">
              <span
                className={`text-[10px] font-bold uppercase tracking-wide ${
                  thread.type === "client" ? "text-burgundy" : "text-stone-400"
                }`}
              >
                {thread.type === "client" ? "Client" : "Internal"}
              </span>
              <span className="text-xs text-stone-400">{thread.time}</span>
            </div>
            <p className="mt-1 font-semibold text-stone-900">{thread.name}</p>
            <p className="mt-1 text-sm text-stone-600">{thread.preview}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
