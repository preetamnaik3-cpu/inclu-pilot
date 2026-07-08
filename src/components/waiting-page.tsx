"use client";

import { BrandLogo } from "@/components/brand-logo";
import { signOut } from "@/lib/actions/auth";

export function WaitingPageClient({ email }: { email: string | null }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm text-center">
        <BrandLogo size="lg" />

        <h1 className="mt-8 text-lg font-bold text-stone-900">
          Waiting for assignment
        </h1>
        <p className="mt-2 text-sm text-stone-600">
          You are not assigned to any project yet. Please wait while your
          dedicated manager adds you to a project.
        </p>
        <p className="mt-4 text-xs text-stone-500">
          Sign out and sign in again after your manager confirms.
        </p>
        {email ? (
          <p className="mt-2 text-xs text-stone-400">Signed in as {email}</p>
        ) : null}

        <form action={signOut} className="mt-8">
          <button
            type="submit"
            className="text-sm font-medium text-burgundy hover:underline"
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
