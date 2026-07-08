import { AuthHeaderAction } from "@/components/auth-header-action";
import { ManagerAssignClientForm } from "@/components/manager-assign-client-form";
import { ManagerAssignTeamForm } from "@/components/manager-assign-team-form";
import { ManagerClientProjectList } from "@/components/manager-client-project-list";
import { ManagerProjectTeamSection } from "@/components/manager-project-team-section";
import { PageHeader } from "@/components/client-page-header";
import { ManagerClientsMock } from "@/app/manager/manager-clients-mock";
import { isSupabaseConfigured } from "@/lib/config";
import { ensureManagerAccess } from "@/lib/auth/onboarding";
import { createClient } from "@/lib/supabase/server";
import {
  getManagerClients,
  getManagerProjectTeamRosters,
  getManagerProjectsForSelect,
  getUnassignedUsers,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function ManagerClientsPage() {
  if (!isSupabaseConfigured()) {
    return <ManagerClientsMock />;
  }

  const supabase = await createClient();
  await ensureManagerAccess(supabase);

  const [clients, unassignedUsers, projects, rosters] = await Promise.all([
    getManagerClients(),
    getUnassignedUsers(),
    getManagerProjectsForSelect(),
    getManagerProjectTeamRosters(),
  ]);

  return (
    <div className="px-4 pt-5">
      <PageHeader
        title="Your clients"
        subtitle={`${clients.length} active projects`}
        action={<AuthHeaderAction />}
      />

      <ManagerAssignClientForm unassignedUsers={unassignedUsers} />
      <ManagerAssignTeamForm
        unassignedUsers={unassignedUsers}
        projects={projects}
      />
      <ManagerProjectTeamSection rosters={rosters} projects={projects} />

      <ManagerClientProjectList clients={clients} />
    </div>
  );
}
