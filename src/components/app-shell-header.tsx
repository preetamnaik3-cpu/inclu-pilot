import Image from "next/image";
import { PoweredByBadge } from "@/components/brand-logo";

export function AppShellHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="border-b border-gray-100 bg-white px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-white ring-1 ring-gray-100">
            <Image
              src="/incluhub-logo.png"
              alt="IncluHub"
              fill
              className="object-contain p-0.5"
              sizes="36px"
            />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold text-gray-900">
              {title}
            </h1>
            {subtitle ? (
              <p className="truncate text-xs text-gray-500">{subtitle}</p>
            ) : null}
          </div>
        </div>
        {action}
      </div>
      <div className="mt-2">
        <PoweredByBadge />
      </div>
    </header>
  );
}
