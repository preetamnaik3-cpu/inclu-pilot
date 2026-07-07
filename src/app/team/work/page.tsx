import { TeamWorkMock } from "@/app/team/team-work-mock";
import { AuthHeaderAction } from "@/components/auth-header-action";
import { TeamWorkView } from "@/components/team-work-view";
import { isSupabaseConfigured } from "@/lib/config";
import { getTeamProject, getTeamWorkItems } from "@/lib/queries";

export default async function TeamWorkPage() {
  if (!isSupabaseConfigured()) {
    return <TeamWorkMock />;
  }

  const items = await getTeamWorkItems();
  const teamProject = await getTeamProject();

  return (
    <TeamWorkView
      items={items}
      projectName={teamProject?.projectName ?? "Your project"}
      live
      headerAction={<AuthHeaderAction />}
    />
  );
}
