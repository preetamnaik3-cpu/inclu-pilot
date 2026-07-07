import { ManagerActivityDetailMock } from "@/app/manager/manager-activity-detail-mock";
import { ManagerActivityDetailLive } from "@/app/manager/manager-activity-detail-live";
import { isSupabaseConfigured } from "@/lib/config";
import { getActivityHubBundle } from "@/lib/updates/queries";
import {
  getClientProject,
  getProjectIdForWorkItem,
  getWorkItem,
} from "@/lib/queries";

export default async function ManagerActivityDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ project?: string }>;
}) {
  if (!isSupabaseConfigured()) {
    return <ManagerActivityDetailMock />;
  }

  const { id } = await params;
  const { project: projectParam } = await searchParams;
  const workItemProjectId = await getProjectIdForWorkItem(id);
  const projectId = projectParam ?? workItemProjectId ?? undefined;

  const [project, item, hub] = await Promise.all([
    projectId ? getClientProject(projectId) : getClientProject(),
    getWorkItem(id),
    getActivityHubBundle(id),
  ]);

  if (!project || !item) {
    return (
      <div className="px-4 pt-6 text-center text-stone-500">
        Activity not found.
      </div>
    );
  }

  return (
    <ManagerActivityDetailLive
      item={item}
      project={project}
      comments={hub.comments}
      updates={hub.updates}
      teamPulse={hub.teamPulse}
      managerFiles={hub.managerFiles}
      activityId={id}
      projectId={project.id}
    />
  );
}
