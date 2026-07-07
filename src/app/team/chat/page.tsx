import { TeamChatMock } from "@/app/team/team-chat-mock";
import { RealtimeChat } from "@/components/realtime-chat";
import { isSupabaseConfigured } from "@/lib/config";
import {
  getConversation,
  getCurrentProfile,
  getMessages,
  getTeamProject,
} from "@/lib/queries";

export default async function TeamChatPage() {
  if (!isSupabaseConfigured()) {
    return <TeamChatMock />;
  }

  const profile = await getCurrentProfile();
  const teamProject = await getTeamProject();
  if (!profile || !teamProject) {
    return (
      <div className="px-4 pt-6 text-center text-gray-500">Chat unavailable.</div>
    );
  }

  const conversation = await getConversation(
    teamProject.projectId,
    "internal_team",
  );
  if (!conversation) {
    return (
      <div className="px-4 pt-6 text-center text-gray-500">
        No internal chat set up yet.
      </div>
    );
  }

  const messages = await getMessages(conversation.id, profile.id);

  return (
    <div className="flex h-[calc(100vh-5rem)] flex-col">
      <RealtimeChat
        conversationId={conversation.id}
        currentUserId={profile.id}
        title={teamProject.managerName}
        subtitle="Your manager — internal only"
        initialMessages={messages}
      />
    </div>
  );
}
