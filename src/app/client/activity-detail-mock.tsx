"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ActivityDetailView } from "@/components/activity-detail-view";
import { useMock } from "@/components/mock-provider";

export function ActivityDetailMock() {
  const params = useParams();
  const activityId = params.id as string;
  const { project, addComment, getActivityTimeline, getActivityNotesFor } =
    useMock();
  const item = project.workItems.find((w) => w.id === activityId);

  if (!item) {
    return (
      <div className="px-4 pt-6 text-center">
        <p className="text-stone-500">Activity not found</p>
        <Link
          href="/client/activities"
          className="mt-4 font-medium text-burgundy"
        >
          ← Back to activities
        </Link>
      </div>
    );
  }

  return (
    <ActivityDetailView
      item={item}
      project={project}
      comments={getActivityNotesFor(activityId)}
      updates={getActivityTimeline(activityId)}
      onAddComment={(body) => addComment(activityId, body)}
    />
  );
}

/** @deprecated Use ActivityDetailMock */
export function WorkDetailMock() {
  return <ActivityDetailMock />;
}
