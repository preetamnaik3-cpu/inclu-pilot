"use client";

import { WorkItemCard } from "@/components/work-item-card";
import { AuthHeaderAction } from "@/components/auth-header-action";
import { ClientPageHeader } from "@/components/client-page-header";
import { useMock } from "@/components/mock-provider";

export function ClientWorkMock() {
  const { project, getActivityNotesFor } = useMock();

  function commentCountFor(workItemId: string) {
    return getActivityNotesFor(workItemId).filter((n) => n.authorRole === "client")
      .length;
  }

  return (
    <div className="px-4 pt-5">
      <ClientPageHeader
        title="Your work"
        subtitle={`Assigned by ${project.manager.name}`}
        action={<AuthHeaderAction demo />}
      />

      <div className="space-y-2.5">
        {project.workItems.map((item) => (
          <WorkItemCard
            key={item.id}
            item={item}
            commentCount={commentCountFor(item.id)}
            href={`/client/work/${item.id}`}
          />
        ))}
      </div>

      <p className="mt-6 text-center text-[11px] text-stone-400">
        Work items are assigned by your manager
      </p>
    </div>
  );
}
