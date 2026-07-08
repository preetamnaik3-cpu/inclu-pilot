import { TeamWorkMock } from "@/app/team/team-work-mock";
import { TeamWorkLive } from "@/app/team/team-work-live";
import { AuthHeaderAction } from "@/components/auth-header-action";
import { WaitingPageClient } from "@/components/waiting-page";
import { isSupabaseConfigured } from "@/lib/config";
import { getCurrentProfile, getTeamProject, getTeamWorkItems } from "@/lib/queries";

export default async function TeamWorkPage() {
  if (!isSupabaseConfigured()) {
    return <TeamWorkMock />;
  }

  const [profile, teamProject, items] = await Promise.all([
    getCurrentProfile(),
    getTeamProject(),
    getTeamWorkItems(),
  ]);

  if (!teamProject) {
    return <WaitingPageClient email={profile?.email ?? null} />;
  }

  return (
    <TeamWorkLive
      items={items}
      projectName={teamProject.projectName}
      headerAction={<AuthHeaderAction />}
    />
  );
}
