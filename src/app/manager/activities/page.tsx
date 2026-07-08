import { ManagerActivitiesMock } from "@/app/manager/manager-activities-mock";
import { ManagerActivitiesLiveList } from "@/app/manager/manager-activities-live";
import { ManagerActivitiesFeedLive } from "@/app/manager/manager-activities-feed-live";
import { ManagerProjectHeader } from "@/components/manager-project-header";
import { AuthHeaderAction } from "@/components/auth-header-action";
import { PageHeader } from "@/components/client-page-header";
import { isSupabaseConfigured } from "@/lib/config";
import { getClientProject, getCurrentProfile, getManagerProjectTabs } from "@/lib/queries";
import { getHubUpdatesForProject } from "@/lib/updates/queries";
import { countClientNotesAwaitingReply } from "@/lib/updates/selectors";
import Link from "next/link";

export default async function ManagerActivitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  if (!isSupabaseConfigured()) {
    return <ManagerActivitiesMock />;
  }

  const { project: projectParam } = await searchParams;
  const [clients, profile] = await Promise.all([
    getManagerProjectTabs(),
    getCurrentProfile(),
  ]);
  const project = await getClientProject(
    projectParam ?? clients[0]?.id,
  );

  if (!project || !profile) {
    return (
      <div className="px-4 pt-6 text-center text-stone-500">No project found.</div>
    );
  }

  const hubUpdates = await getHubUpdatesForProject(project.id);
  const clientNoteCounts: Record<string, number> = {};
  for (const item of project.workItems) {
    const count = countClientNotesAwaitingReply(hubUpdates, item.id);
    if (count > 0) clientNoteCounts[item.id] = count;
  }

  return (
    <div className="px-4 pt-5">
      <PageHeader
        title="Activities"
        subtitle={project.name}
        action={<AuthHeaderAction />}
      />

      {clients.length > 1 ? (
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          {clients.map((client) => (
            <Link
              key={client.id}
              href={`/manager/activities?project=${client.id}`}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${
                client.id === project.id
                  ? "bg-burgundy text-white"
                  : "bg-white text-stone-600 ring-1 ring-stone-200"
              }`}
            >
              {client.clientName.split(" ")[0]}
            </Link>
          ))}
        </div>
      ) : null}

      <ManagerProjectHeader project={project} />
      <ManagerActivitiesLiveList
        items={project.workItems}
        commentCounts={clientNoteCounts}
        projectId={project.id}
        managerId={profile.id}
      />
      <ManagerActivitiesFeedLive projectId={project.id} />
    </div>
  );
}
