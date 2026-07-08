"use client";

import { TeamWorkView } from "@/components/team-work-view";
import { postTeamQuickUpdate } from "@/lib/actions/data";
import type { WorkItem } from "@/lib/types";

export function TeamWorkLive({
  items,
  projectName,
  headerAction,
}: {
  items: WorkItem[];
  projectName: string;
  headerAction?: React.ReactNode;
}) {
  return (
    <TeamWorkView
      items={items}
      projectName={projectName}
      live
      headerAction={headerAction}
      onQuickUpdate={async (activityId, text) => {
        const result = await postTeamQuickUpdate(activityId, text);
        if (result && "error" in result && result.error) {
          throw new Error(result.error);
        }
      }}
    />
  );
}
