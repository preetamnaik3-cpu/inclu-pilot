"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ManagerActivityDetailView } from "@/components/manager-activity-detail-view";
import { useMock } from "@/components/mock-provider";

export function ManagerActivityDetailMock() {
  const params = useParams();
  const activityId = params.id as string;
  const {
    project,
    updateActivityStatus,
    postActivityUpdate,
    replyToClientComment,
    getActivityTimeline,
    getActivityNotesFor,
    getTeamPulse,
    publishTeamUpdate,
  } = useMock();

  const item = project.workItems.find((w) => w.id === activityId);

  if (!item) {
    return (
      <div className="px-4 pt-6 text-center">
        <p className="text-stone-500">Activity not found</p>
        <Link
          href="/manager/activities"
          className="mt-4 font-medium text-burgundy"
        >
          ← Back to activities
        </Link>
      </div>
    );
  }

  return (
    <ManagerActivityDetailView
      item={item}
      project={project}
      comments={getActivityNotesFor(activityId)}
      updates={getActivityTimeline(activityId)}
      teamPulse={getTeamPulse(activityId)}
      onStatusChange={(status) => updateActivityStatus(activityId, status)}
      onPostUpdate={(body) => postActivityUpdate(activityId, body)}
      onReplyToClient={(body) => replyToClientComment(activityId, body)}
      onPublishTeamUpdate={publishTeamUpdate}
    />
  );
}
