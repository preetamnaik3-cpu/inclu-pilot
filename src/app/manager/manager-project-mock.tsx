"use client";

import { ManagerProjectView } from "@/components/manager-project-view";
import { useMock } from "@/components/mock-provider";

/** @deprecated Use ManagerActivitiesMock */
export function ManagerProjectMock() {
  const { project, getActivityNotesFor } = useMock();

  const clientCommentCounts = Object.fromEntries(
    project.workItems.map((item) => [
      item.id,
      getActivityNotesFor(item.id).filter((note) => note.authorRole === "client")
        .length,
    ]),
  );

  return (
    <ManagerProjectView
      project={project}
      projectId={project.id}
      managerId={project.manager.id}
      clientCommentCounts={clientCommentCounts}
    />
  );
}
