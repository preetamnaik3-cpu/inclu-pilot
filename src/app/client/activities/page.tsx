import { ClientPageHeader } from "@/components/client-page-header";
import { ActivitiesListView } from "@/components/activities-list-view";
import { AuthHeaderAction } from "@/components/auth-header-action";
import { ClientActivitiesMock } from "@/app/client/client-activities-mock";
import { isSupabaseConfigured } from "@/lib/config";
import { getClientNoteCountsForProject, getClientProject } from "@/lib/queries";

export default async function ClientActivitiesPage() {
  if (!isSupabaseConfigured()) {
    return <ClientActivitiesMock />;
  }

  const project = await getClientProject();
  if (!project) {
    return (
      <div className="px-4 pt-6 text-center text-stone-500">
        No activities yet.
      </div>
    );
  }

  const countMap = await getClientNoteCountsForProject(project.id);

  return (
    <div className="px-4 pt-5">
      <ClientPageHeader
        title="Activities"
        subtitle={`${project.name} · ${project.manager.name}`}
        action={<AuthHeaderAction />}
      />
      <ActivitiesListView
        items={project.workItems}
        commentCounts={countMap}
      />
    </div>
  );
}
