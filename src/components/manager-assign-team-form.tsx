"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { assignTeamMemberToProject } from "@/lib/actions/team";
import type { AssignableUser } from "@/components/manager-assign-client-form";

export type ManagerProjectOption = {
  id: string;
  label: string;
};

export function ManagerAssignTeamForm({
  unassignedUsers,
  projects,
}: {
  unassignedUsers: AssignableUser[];
  projects: ManagerProjectOption[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setLoading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData(form);
    const result = await assignTeamMemberToProject(formData);

    setLoading(false);

    if (result?.error) {
      setError(result.error);
      return;
    }

    if (result?.message) {
      setSuccess(result.message);
      form.reset();
      router.refresh();
    }
  }

  return (
    <section className="mb-6">
      <div className="card space-y-3 p-4">
        <div>
          <h2 className="text-sm font-semibold text-stone-900">
            Add team member to project
          </h2>
          <p className="mt-1 text-xs text-stone-500">
            Pick someone who has signed in and an existing project.
          </p>
        </div>

        {projects.length === 0 ? (
          <p className="text-sm text-stone-500">
            Create a client project first, then add team members here.
          </p>
        ) : unassignedUsers.length === 0 ? (
          <p className="text-sm text-stone-500">
            No unassigned users available. Ask team members to sign in first.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <select
              name="teamMemberId"
              required
              className="input-field w-full px-3 py-2.5 text-sm"
              defaultValue=""
            >
              <option value="" disabled>
                Select team member email
              </option>
              {unassignedUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.fullName} · {user.email}
                </option>
              ))}
            </select>
            <select
              name="projectId"
              required
              className="input-field w-full px-3 py-2.5 text-sm"
              defaultValue=""
            >
              <option value="" disabled>
                Select project
              </option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.label}
                </option>
              ))}
            </select>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            {success ? (
              <p className="text-sm text-emerald-700">{success}</p>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 text-sm disabled:opacity-60"
            >
              {loading ? "Adding..." : "Add to project →"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
