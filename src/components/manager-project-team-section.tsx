"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  removeTeamMemberFromProject,
  transferTeamMember,
} from "@/lib/actions/team";
import type { ManagerProjectOption } from "@/components/manager-assign-team-form";

export type ProjectTeamMember = {
  userId: string;
  email: string;
  fullName: string;
  designation: string | null;
};

export type ProjectTeamRoster = {
  projectId: string;
  projectLabel: string;
  members: ProjectTeamMember[];
};

function RemoveMemberButton({
  userId,
  projectId,
  memberName,
  projectLabel,
}: {
  userId: string;
  projectId: string;
  memberName: string;
  projectLabel: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleRemove() {
    const confirmed = window.confirm(
      `Remove ${memberName} from ${projectLabel}? They will return to unassigned and can be added to another project later.`,
    );
    if (!confirmed) return;

    setLoading(true);
    const formData = new FormData();
    formData.set("teamMemberId", userId);
    formData.set("projectId", projectId);
    const result = await removeTeamMemberFromProject(formData);
    setLoading(false);
    if (!result?.error) {
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      onClick={handleRemove}
      disabled={loading}
      className="text-xs font-medium text-red-600 hover:underline disabled:opacity-60"
    >
      {loading ? "Removing..." : "Remove"}
    </button>
  );
}

function TransferMemberSelect({
  userId,
  fromProjectId,
  projects,
}: {
  userId: string;
  fromProjectId: string;
  projects: ManagerProjectOption[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const otherProjects = projects.filter((p) => p.id !== fromProjectId);

  if (otherProjects.length === 0) return null;

  async function handleTransfer(toProjectId: string) {
    setLoading(true);
    const formData = new FormData();
    formData.set("teamMemberId", userId);
    formData.set("fromProjectId", fromProjectId);
    formData.set("toProjectId", toProjectId);
    const result = await transferTeamMember(formData);
    setLoading(false);
    if (!result?.error) {
      router.refresh();
    }
  }

  return (
    <select
      disabled={loading}
      className="rounded border border-stone-200 px-2 py-1 text-xs"
      defaultValue=""
      onChange={(e) => {
        if (e.target.value) {
          void handleTransfer(e.target.value);
          e.target.value = "";
        }
      }}
    >
      <option value="" disabled>
        Move to...
      </option>
      {otherProjects.map((project) => (
        <option key={project.id} value={project.id}>
          {project.label}
        </option>
      ))}
    </select>
  );
}

export function ManagerProjectTeamSection({
  rosters,
  projects,
}: {
  rosters: ProjectTeamRoster[];
  projects: ManagerProjectOption[];
}) {
  if (rosters.length === 0) return null;

  return (
    <section className="mb-6">
      <div className="card space-y-4 p-4">
        <div>
          <h2 className="text-sm font-semibold text-stone-900">Project teams</h2>
          <p className="mt-1 text-xs text-stone-500">
            Remove or move team members between your projects.
          </p>
        </div>

        {rosters.map((roster) => (
          <div key={roster.projectId} className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-500">
              {roster.projectLabel}
            </h3>
            {roster.members.length === 0 ? (
              <p className="text-sm text-stone-400">No team members yet.</p>
            ) : (
              <ul className="space-y-2">
                {roster.members.map((member) => (
                  <li
                    key={member.userId}
                    className="flex items-center justify-between gap-2 rounded-lg border border-stone-100 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-stone-900">
                        {member.fullName}
                      </p>
                      <p className="truncate text-xs text-stone-500">
                        {member.email}
                        {member.designation ? ` · ${member.designation}` : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <TransferMemberSelect
                        userId={member.userId}
                        fromProjectId={roster.projectId}
                        projects={projects}
                      />
                      <RemoveMemberButton
                        userId={member.userId}
                        projectId={roster.projectId}
                        memberName={member.fullName}
                        projectLabel={roster.projectLabel}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
