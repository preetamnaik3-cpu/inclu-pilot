import Link from "next/link";
import { AuthHeaderAction } from "@/components/auth-header-action";
import { PageHeader } from "@/components/client-page-header";
import { ManagerClientsMock } from "@/app/manager/manager-clients-mock";
import { isSupabaseConfigured } from "@/lib/config";
import { getManagerClients } from "@/lib/queries";

export default async function ManagerClientsPage() {
  if (!isSupabaseConfigured()) {
    return <ManagerClientsMock />;
  }

  const clients = await getManagerClients();

  return (
    <div className="px-4 pt-5">
      <PageHeader
        title="Your clients"
        subtitle={`${clients.length} active projects`}
        action={<AuthHeaderAction />}
      />

      <div className="space-y-2.5">
        {clients.map((client, index) => {
          const isPrimary = index === 0;
          const href = `/manager/activities?project=${client.id}`;
          const badge =
            (client.unreadCount ?? 0) + (client.pendingNoteCount ?? 0);

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
                    {isPrimary ? (
                      <span className="rounded-full bg-burgundy-light px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-burgundy">
                        Active
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm text-stone-500">{client.clientName}</p>
                </div>
                {badge > 0 ? (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-burgundy px-1.5 text-[10px] font-bold text-white">
                    {badge}
                  </span>
                ) : null}
              </div>
              <p className="mt-2 text-xs text-stone-500">{client.statusLine}</p>
              <p className="mt-2 text-sm text-stone-600">{client.lastMessage}</p>
              <div className="mt-2 flex items-center justify-between text-xs text-stone-400">
                <span>
                  {client.activeActivityCount ?? 0} active activit
                  {(client.activeActivityCount ?? 0) === 1 ? "y" : "ies"}
                </span>
                <span>{client.lastMessageTime}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
