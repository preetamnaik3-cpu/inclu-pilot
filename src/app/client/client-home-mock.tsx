"use client";

import { ClientHomeView } from "@/components/client-home-view";
import { ClientWelcomeHeader } from "@/components/client-welcome-header";
import { AuthHeaderAction } from "@/components/auth-header-action";
import { useMock } from "@/components/mock-provider";
import { demoNotifications } from "@/lib/demo-data";

export function ClientHomeMock() {
  const { project } = useMock();

  return (
    <div className="px-4 pt-5">
      <ClientWelcomeHeader
        project={project}
        notifications={demoNotifications}
        headerAction={<AuthHeaderAction demo />}
      />
      <ClientHomeView project={project} />
    </div>
  );
}
