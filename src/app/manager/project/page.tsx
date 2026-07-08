import { ManagerProjectMock } from "@/app/manager/manager-project-mock";
import { AuthHeaderAction } from "@/components/auth-header-action";
import { ManagerProjectView } from "@/components/manager-project-view";
import { isSupabaseConfigured } from "@/lib/config";
import {
  getClientProject,
  getCurrentProfile,
  getManagerProjectTabs,
} from "@/lib/queries";
import { getHubUpdatesForProject } from "@/lib/updates/queries";
import { countClientNotesAwaitingReply } from "@/lib/updates/selectors";
import Link from "next/link";

export default async function ManagerProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  if (!isSupabaseConfigured()) {
    return <ManagerProjectMock />;
  }

  const { project: projectParam } = await searchParams;
  const [clients, profile] = await Promise.all([
    getManagerProjectTabs(),
    getCurrentProfile(),
  ]);
  const project = await getClientProject(projectParam ?? clients[0]?.id);

  if (!project || !profile) {
    return (
      <div className="px-4 pt-6 text-center text-stone-500">No project found.</div>
    );
  }

  const hubUpdates = await getHubUpdatesForProject(project.id);
  const clientCommentCounts: Record<string, number> = {};
  for (const item of project.workItems) {
    const count = countClientNotesAwaitingReply(hubUpdates, item.id);
    if (count > 0) clientCommentCounts[item.id] = count;
  }

  return (
    <div>
      <div className="flex items-center justify-end px-4 pt-4">
        <AuthHeaderAction />
      </div>

      {clients.length > 1 ? (
        <div className="mb-2 flex gap-2 overflow-x-auto px-4 pb-1">
          {clients.map((client) => (
            <Link
              key={client.id}
              href={`/manager/project?project=${client.id}`}
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

      <ManagerProjectView
        project={project}
        projectId={project.id}
        managerId={profile.id}
        clientCommentCounts={clientCommentCounts}
        live
      />
    </div>
  );
}
