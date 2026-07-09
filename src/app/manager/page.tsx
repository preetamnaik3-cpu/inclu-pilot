import { Suspense } from "react";
import { AuthHeaderAction } from "@/components/auth-header-action";
import { ManagerAssignClientForm } from "@/components/manager-assign-client-form";
import { ManagerAssignTeamForm } from "@/components/manager-assign-team-form";
import { ManagerClientProjectList } from "@/components/manager-client-project-list";
import { ManagerClientProjectPreviews } from "@/components/manager-client-project-previews";
import { ManagerProjectTeamSection } from "@/components/manager-project-team-section";
import { PageHeader } from "@/components/client-page-header";
import { ManagerClientsMock } from "@/app/manager/manager-clients-mock";
import { isSupabaseConfigured } from "@/lib/config";
import { ensureManagerAccess } from "@/lib/auth/onboarding";
import { createClient } from "@/lib/supabase/server";
import { getManagerDashboard } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function ManagerClientsPage() {
  if (!isSupabaseConfigured()) {
    return <ManagerClientsMock />;
  }

  const supabase = await createClient();
  await ensureManagerAccess(supabase);

  const { clientSummaries, unassignedUsers, projectOptions, rosters } =
    await getManagerDashboard();

  return (
    <div className="px-4 pt-5">
      <PageHeader
        title="Your clients"
        subtitle={`${clientSummaries.length} active projects`}
        action={<AuthHeaderAction />}
      />

      <ManagerAssignClientForm unassignedUsers={unassignedUsers} />
      <ManagerAssignTeamForm
        unassignedUsers={unassignedUsers}
        projects={projectOptions}
      />
      <ManagerProjectTeamSection rosters={rosters} projects={projectOptions} />

      <Suspense
        fallback={<ManagerClientProjectList clients={clientSummaries} />}
      >
        <ManagerClientProjectPreviews summaries={clientSummaries} />
      </Suspense>
    </div>
  );
}
