"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";
import { useMock } from "@/components/mock-provider";
import { signIn } from "@/lib/actions/auth";
import type { UserRole } from "@/lib/types";

const roleRoutes: Record<UserRole, string> = {
  client: "/client",
  manager: "/manager",
  team: "/team/work",
};

interface LoginPageProps {
  supabaseEnabled: boolean;
}

export function LoginPageClient({ supabaseEnabled }: LoginPageProps) {
  const router = useRouter();
  const { setRole } = useMock();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function enterAs(role: UserRole) {
    setRole(role);
    router.push(roleRoutes[role]);
  }

  async function handleSignIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const result = await signIn(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm">
        <div className="mb-10">
          <BrandLogo size="lg" />
        </div>

        {supabaseEnabled ? (
          <>
            <form onSubmit={handleSignIn} className="space-y-3">
              <input
                name="email"
                type="email"
                required
                placeholder="email@company.com"
                className="input-field w-full px-4 py-3.5 text-sm"
              />
              <input
                name="password"
                type="password"
                required
                placeholder="Password"
                className="input-field w-full px-4 py-3.5 text-sm"
              />
              {error ? (
                <p className="text-center text-sm text-red-600">{error}</p>
              ) : null}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full px-4 py-3.5 text-sm disabled:opacity-60"
              >
                {loading ? "Signing in..." : "Sign in →"}
              </button>
            </form>
            <p className="mt-6 text-center text-xs text-stone-400">
              Use demo accounts from README after running seed
            </p>
          </>
        ) : (
          <>
            <div className="mb-6 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-center text-sm text-stone-600 shadow-sm">
              Demo mode — pick a role to preview
            </div>
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => enterAs("client")}
                className="btn-primary w-full px-4 py-3.5 text-sm"
              >
                Enter as Client
              </button>
              <button
                type="button"
                onClick={() => enterAs("manager")}
                className="w-full rounded-full border border-stone-200 bg-white px-4 py-3.5 text-sm font-semibold text-stone-800 shadow-sm transition-colors hover:bg-stone-50"
              >
                Enter as Manager
              </button>
              <button
                type="button"
                onClick={() => enterAs("team")}
                className="w-full rounded-full border border-stone-200 bg-white px-4 py-3.5 text-sm font-semibold text-stone-800 shadow-sm transition-colors hover:bg-stone-50"
              >
                Enter as Team Member
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
