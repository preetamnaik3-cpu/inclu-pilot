"use client";

import { useState } from "react";
import { TeamWorkView } from "@/components/team-work-view";
import { useMock } from "@/components/mock-provider";

export function TeamWorkMock() {
  const { project, postTeamQuickUpdate } = useMock();

  const teamItems = project.workItems.filter(
    (item) => item.assignee.id === "team-1",
  );

  return (
    <TeamWorkView
      items={teamItems.length > 0 ? teamItems : project.workItems.slice(0, 2)}
      projectName={project.name}
      onQuickUpdate={(activityId, text) => postTeamQuickUpdate(activityId, text)}
      showSwitchRole
    />
  );
}
