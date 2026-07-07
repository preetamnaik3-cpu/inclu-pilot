"use client";

import Link from "next/link";
import { AuthHeaderAction } from "@/components/auth-header-action";
import { PageHeader } from "@/components/client-page-header";
import { ACTIVE_DEMO_PROJECT_ID, demoManagerClients } from "@/lib/demo-data";
import { useMock } from "@/components/mock-provider";

export function ManagerChatListMock() {
  const { getManagerChatMessages } = useMock();

  const totalUnread = demoManagerClients.reduce(
    (sum, client) => sum + client.unreadCount,
    0,
  );

  return (
    <div className="px-4 pt-5 pb-8">
      <PageHeader
        title="Chat"
        subtitle={`${demoManagerClients.length} client conversations`}
        action={<AuthHeaderAction demo />}
      />

      <p className="mb-4 text-xs text-stone-500">
        Pick a client to open their thread. Only{" "}
        <span className="font-medium text-stone-700">Acme Rebrand</span> syncs
        with the Client role in this demo.
      </p>

      <div className="space-y-2.5">
        {demoManagerClients.map((client) => {
          const messages = getManagerChatMessages(client.id);
          const lastMessage = messages[messages.length - 1];
          const isLive = client.id === ACTIVE_DEMO_PROJECT_ID;

          return (
            <Link
              key={client.id}
              href={`/manager/chat/${client.id}`}
              className="card block p-4 transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-stone-900">
                      {client.clientName}
                    </h3>
                    {isLive ? (
                      <span className="rounded-full bg-burgundy-light px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-burgundy">
                        Live demo
                      </span>
                    ) : (
                      <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-500">
                        Chat preview
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-stone-500">{client.projectName}</p>
                </div>
                {client.unreadCount > 0 ? (
                  <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-burgundy px-1.5 text-[10px] font-bold text-white">
                    {client.unreadCount}
                  </span>
                ) : null}
              </div>
              <p className="mt-2 truncate text-sm text-stone-600">
                {lastMessage?.body || client.lastMessage}
              </p>
              <p className="mt-1 text-xs text-stone-400">
                {lastMessage?.time || client.lastMessageTime}
              </p>
            </Link>
          );
        })}
      </div>

      {totalUnread > 0 ? (
        <p className="mt-6 text-center text-[11px] text-stone-400">
          {totalUnread} unread across all clients
        </p>
      ) : null}
    </div>
  );
}
