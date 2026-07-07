import { ActivityDetailMock } from "@/app/client/activity-detail-mock";
import { ActivityDetailView } from "@/components/activity-detail-view";
import { isSupabaseConfigured } from "@/lib/config";
import { getActivityHubBundle } from "@/lib/updates/queries";
import { getClientProject, getWorkItem } from "@/lib/queries";

export default async function ClientActivityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!isSupabaseConfigured()) {
    return <ActivityDetailMock />;
  }

  const { id } = await params;
  const [project, item, hub] = await Promise.all([
    getClientProject(),
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
    <ActivityDetailView
      item={item}
      project={project}
      comments={hub.comments}
      updates={hub.updates}
      files={hub.files}
      live
    />
  );
}
