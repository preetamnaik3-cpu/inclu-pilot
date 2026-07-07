"use client";

import Link from "next/link";
import { AuthHeaderAction } from "@/components/auth-header-action";
import { PageHeader } from "@/components/client-page-header";
import { useMock } from "@/components/mock-provider";
import { ACTIVE_DEMO_PROJECT_ID, demoManagerClients } from "@/lib/demo-data";
import { splitActivities } from "@/lib/client-helpers";

export function ManagerClientsMock() {
  const { project, getPendingNoteCount } = useMock();
  const { active } = splitActivities(project.workItems);

  const pendingNotes = project.workItems.reduce(
    (sum, item) => sum + getPendingNoteCount(item.id),
    0,
  );

  return (
    <div className="px-4 pt-5">
      <PageHeader
        title="Good morning, Priya"
        subtitle={`${demoManagerClients.length} active clients`}
        action={<AuthHeaderAction demo />}
      />

      <div className="space-y-2.5">
        {demoManagerClients.map((client) => {
          const isLive = client.id === ACTIVE_DEMO_PROJECT_ID;
          const href = isLive ? "/manager/activities" : `/manager/chat/${client.id}`;

          return (
          <Link
            key={client.id}
            href={href}
            className="card block p-4 transition-shadow hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-stone-900">
                    {client.projectName}
                  </h3>
                  {isLive ? (
                    <span className="rounded-full bg-burgundy-light px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-burgundy">
                      Live demo
                    </span>
                  ) : null}
                </div>
                <p className="text-sm text-stone-500">{client.clientName}</p>
              </div>
              {(client.unreadCount > 0 || (isLive && pendingNotes > 0)) ? (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-burgundy px-1.5 text-[10px] font-bold text-white">
                  {isLive ? pendingNotes || client.unreadCount : client.unreadCount}
                </span>
              ) : null}
            </div>
            {isLive ? (
              <p className="mt-2 text-xs text-stone-500">
                {active.length} active activit{active.length === 1 ? "y" : "ies"}
                {pendingNotes > 0
                  ? ` · ${pendingNotes} note${pendingNotes === 1 ? "" : "s"} to reply`
                  : ""}
              </p>
            ) : (
              <p className="mt-2 text-xs text-stone-400">
                Chat preview only — open to message {client.clientName.split(" ")[0]}
              </p>
            )}
            <p className="mt-2 text-sm text-stone-600">{client.lastMessage}</p>
            <div className="mt-2 flex items-center justify-between text-xs text-stone-400">
              <span>{client.statusLine}</span>
              <span>{client.lastMessageTime}</span>
            </div>
          </Link>
          );
        })}
      </div>
    </div>
  );
}
