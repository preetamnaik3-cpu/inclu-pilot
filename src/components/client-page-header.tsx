import Image from "next/image";
import Link from "next/link";

interface ClientPageHeaderProps {
  title: string;
  subtitle: string;
  roleLabel?: string;
  action?: React.ReactNode;
}

export function ClientPageHeader({
  title,
  subtitle,
  roleLabel = "Client",
  action,
}: ClientPageHeaderProps) {
  return (
    <header className="mb-5 flex items-start justify-between gap-3">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <div className="relative mt-0.5 h-10 w-10 shrink-0 overflow-hidden rounded-full bg-white shadow-[var(--shadow-card)] ring-1 ring-stone-200/80">
          <Image
            src="/incluhub-logo.png"
            alt=""
            fill
            className="object-contain p-1.5"
            sizes="40px"
          />
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold tracking-tight text-stone-900">
            {title}
          </h1>
          <p className="mt-0.5 text-[13px] leading-snug text-stone-500">
            {subtitle}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2">
        <span className="rounded-full bg-burgundy-light px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-burgundy">
          Role: {roleLabel}
        </span>
        {action}
      </div>
    </header>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="mb-5 flex items-start justify-between gap-3">
      <div>
        <h1 className="text-lg font-bold tracking-tight text-stone-900">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-0.5 text-[13px] text-stone-500">{subtitle}</p>
        ) : null}
      </div>
      {action}
    </header>
  );
}

export function SwitchRoleLink() {
  return (
    <Link
      href="/"
      className="rounded-full bg-white px-3 py-1 text-[11px] font-medium text-stone-500 shadow-sm ring-1 ring-stone-200/80 transition-colors hover:text-burgundy"
    >
      Switch role
    </Link>
  );
}
