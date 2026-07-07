"use client";

import { useTransition } from "react";
import { signOut } from "@/lib/actions/auth";

export function SignOutButton() {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => signOut())}
      className="rounded-full bg-white px-3 py-1 text-[11px] font-medium text-stone-500 shadow-sm ring-1 ring-stone-200/80 transition-colors hover:text-burgundy disabled:opacity-60"
    >
      {pending ? "Signing out..." : "Sign out"}
    </button>
  );
}
