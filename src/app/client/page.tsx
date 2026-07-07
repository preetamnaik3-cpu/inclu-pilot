import { ClientHomeView } from "@/components/client-home-view";
import { ClientWelcomeHeader } from "@/components/client-welcome-header";
import { AuthHeaderAction } from "@/components/auth-header-action";
import { ClientHomeMock } from "@/app/client/client-home-mock";
import { isSupabaseConfigured } from "@/lib/config";
import { getClientNotifications, getClientProject } from "@/lib/queries";

export default async function ClientHomePage() {
  if (!isSupabaseConfigured()) {
    return <ClientHomeMock />;
  }

  const [project, notifications] = await Promise.all([
    getClientProject(),
    getClientNotifications(),
  ]);
  if (!project) {
    return (
      <div className="px-4 pt-6 text-center text-stone-500">
        No project assigned to your account yet.
      </div>
    );
  }

  return (
    <div className="px-4 pt-5">
      <ClientWelcomeHeader
        project={project}
        notifications={notifications}
        headerAction={<AuthHeaderAction />}
        liveNotifications
      />
      <ClientHomeView project={project} />
    </div>
  );
}
