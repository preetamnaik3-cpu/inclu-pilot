import { NotificationBell } from "@/components/notification-bell";
import {
  activitySummary,
  getFirstName,
  getGreeting,
} from "@/lib/client-helpers";
import type { ClientNotification, ClientProject } from "@/lib/types";

export function ClientWelcomeHeader({
  project,
  notifications,
  headerAction,
  liveNotifications = false,
}: {
  project: ClientProject;
  notifications: ClientNotification[];
  headerAction?: React.ReactNode;
  liveNotifications?: boolean;
}) {
  const firstName = getFirstName(project.clientName);

  return (
    <header className="mb-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-stone-500">
            {getGreeting()}, {firstName}
          </p>
          <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-stone-900">
            {project.name}
          </h1>
          <p className="mt-1 text-[13px] text-stone-500">
            {project.manager.name} · {project.manager.designation}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <NotificationBell notifications={notifications} live={liveNotifications} />
          {headerAction}
        </div>
      </div>
      <p className="mt-3 text-xs text-stone-400">{activitySummary(project)}</p>
    </header>
  );
}
