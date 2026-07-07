"use client";

import { ManagerActivityDetailView } from "@/components/manager-activity-detail-view";
import {
  addManagerCommentReply,
  postActivityUpdateForWorkItem,
  publishActivityFile,
  publishTeamQuickUpdate,
  updateWorkItemStatus,
  uploadActivityFile,
} from "@/lib/actions/data";
import type {
  ActivityFile,
  ActivityManagerUpdate,
  ClientProject,
  HubUpdate,
  WorkComment,
  WorkItem,
  WorkStatus,
} from "@/lib/types";

export function ManagerActivityDetailLive({
  item,
  project,
  comments,
  updates,
  teamPulse,
  managerFiles,
  activityId,
  projectId,
}: {
  item: WorkItem;
  project: ClientProject;
  comments: WorkComment[];
  updates: ActivityManagerUpdate[];
  teamPulse: HubUpdate[];
  managerFiles: ActivityFile[];
  activityId: string;
  projectId: string;
}) {
  return (
    <ManagerActivityDetailView
      item={item}
      project={project}
      comments={comments}
      updates={updates}
      teamPulse={teamPulse}
      managerFiles={managerFiles}
      activitiesHref={`/manager/activities?project=${projectId}`}
      live
      onStatusChange={async (status: WorkStatus) => {
        await updateWorkItemStatus(activityId, status);
      }}
      onPostUpdate={async (body) => {
        await postActivityUpdateForWorkItem(projectId, activityId, body);
      }}
      onReplyToClient={async (body) => {
        await addManagerCommentReply(activityId, body);
      }}
      onPublishTeamUpdate={async (updateId) => {
        await publishTeamQuickUpdate(updateId, activityId);
      }}
      onUploadFile={async (file) => {
        await uploadActivityFile(projectId, activityId, file, false);
      }}
      onPublishFile={async (fileId) => {
        await publishActivityFile(fileId, activityId);
      }}
    />
  );
}
