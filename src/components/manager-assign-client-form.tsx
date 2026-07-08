"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { assignClientByUserId } from "@/lib/actions/clients";

export type AssignableUser = {
  id: string;
  email: string;
  fullName: string;
};

export function ManagerAssignClientForm({
  unassignedUsers,
}: {
  unassignedUsers: AssignableUser[];
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
    const result = await assignClientByUserId(formData);

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
            Create project + assign client
          </h2>
          <p className="mt-1 text-xs text-stone-500">
            Pick someone who has already signed in, name their project, then ask
            them to sign in again.
          </p>
        </div>

        {unassignedUsers.length === 0 ? (
          <p className="text-sm text-stone-500">
            No unassigned users yet. Ask people to sign in first (Google or
            email).
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <select
              name="clientId"
              required
              className="input-field w-full px-3 py-2.5 text-sm"
              defaultValue=""
            >
              <option value="" disabled>
                Select client email
              </option>
              {unassignedUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.fullName} · {user.email}
                </option>
              ))}
            </select>
            <input
              name="projectName"
              type="text"
              required
              placeholder="Project name (e.g. Bloom Cafe)"
              className="input-field w-full px-3 py-2.5 text-sm"
            />

            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            {success ? (
              <p className="text-sm text-emerald-700">{success}</p>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 text-sm disabled:opacity-60"
            >
              {loading ? "Assigning..." : "Assign client →"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
