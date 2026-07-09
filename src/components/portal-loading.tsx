import Image from "next/image";

export function PortalLoadingPulse({
  label = "Loading…",
}: {
  label?: string;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center px-4"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="animate-portal-pulse relative h-16 w-16 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-100">
        <Image
          src="/incluhub-logo.png"
          alt="IncluHub"
          fill
          className="object-contain p-1.5"
          sizes="64px"
          priority
        />
      </div>
      <p className="mt-4 text-sm font-medium text-stone-500">{label}</p>
    </div>
  );
}

export function PortalLoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <PortalLoadingPulse />
    </div>
  );
}

export function PortalLoadingOverlay() {
  return (
    <div
      className="fixed inset-0 z-40 mx-auto flex max-w-lg items-center justify-center bg-background/85 backdrop-blur-sm"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading page"
    >
      <PortalLoadingPulse />
    </div>
  );
}
