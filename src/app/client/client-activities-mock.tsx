"use client";

import { ActivitiesListView } from "@/components/activities-list-view";
import { AuthHeaderAction } from "@/components/auth-header-action";
import { ClientPageHeader } from "@/components/client-page-header";
import { useMock } from "@/components/mock-provider";

export function ClientActivitiesMock() {
  const { project, getActivityNotesFor } = useMock();

  return (
    <div className="px-4 pt-5">
      <ClientPageHeader
        title="Activities"
        subtitle={`${project.name} · ${project.manager.name}`}
        action={<AuthHeaderAction demo />}
      />
      <ActivitiesListView
        items={project.workItems}
        commentCounts={Object.fromEntries(
          project.workItems.map((item) => [
            item.id,
            getActivityNotesFor(item.id).filter((n) => n.authorRole === "client")
              .length,
          ]),
        )}
      />
    </div>
  );
}
