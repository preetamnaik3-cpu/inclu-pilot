import { ManagerChatListMock } from "@/app/manager/manager-chat-list-mock";
import { PageHeader } from "@/components/client-page-header";
import Link from "next/link";
import { isSupabaseConfigured } from "@/lib/config";
import { getManagerClients } from "@/lib/queries";

export default async function ManagerChatPage() {
  if (!isSupabaseConfigured()) {
    return <ManagerChatListMock />;
  }

  const clients = await getManagerClients();

  return (
    <div className="px-4 pt-5 pb-8">
      <PageHeader
        title="Chat"
        subtitle={`${clients.length} client conversations`}
      />

      <div className="mt-4 space-y-2.5">
        {clients.map((client) => (
          <Link
            key={client.id}
            href={`/manager/chat/${client.id}`}
            className="card block p-4 transition-shadow hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-semibold text-stone-900">{client.clientName}</h3>
                <p className="text-sm text-stone-500">{client.projectName}</p>
                <p className="mt-2 truncate text-sm text-stone-600">
                  {client.lastMessage}
                </p>
              </div>
              {client.unreadCount > 0 ? (
                <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-burgundy px-1.5 text-[10px] font-bold text-white">
                  {client.unreadCount}
                </span>
              ) : null}
            </div>
            {client.lastMessageTime ? (
              <p className="mt-2 text-xs text-stone-400">{client.lastMessageTime}</p>
            ) : null}
          </Link>
        ))}
      </div>
    </div>
  );
}
