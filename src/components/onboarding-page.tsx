"use client";

import { BrandLogo } from "@/components/brand-logo";

export function OnboardingPageClient({
  pending,
}: {
  pending: {
    projectName: string;
    managerName: string;
    managerEmail: string;
  } | null;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm text-center">
        <BrandLogo size="lg" />

        {pending ? (
          <>
            <h1 className="mt-8 text-lg font-bold text-stone-900">
              You&apos;re invited
            </h1>
            <p className="mt-2 text-sm text-stone-600">
              <span className="font-semibold">{pending.managerName}</span> assigned
              you to{" "}
              <span className="font-semibold">{pending.projectName}</span>.
            </p>
            <p className="mt-4 text-xs text-stone-500">
              Sign out and sign in again if this screen does not update. Your
              workspace will open automatically after login.
            </p>
            <p className="mt-2 text-xs text-stone-400">
              Manager contact: {pending.managerEmail}
            </p>
          </>
        ) : (
          <>
            <h1 className="mt-8 text-lg font-bold text-stone-900">
              Waiting for assignment
            </h1>
            <p className="mt-2 text-sm text-stone-600">
              Your manager has not assigned you to a project yet.
            </p>
            <p className="mt-4 text-xs text-stone-500">
              Ask your manager to add your email in IncluPilot, then sign in
              again.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
