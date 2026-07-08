import { ClientChatMock } from "@/app/client/client-chat-mock";
import { ConversationReadMarker } from "@/components/conversation-read-marker";
import { RealtimeChat } from "@/components/realtime-chat";
import { isSupabaseConfigured } from "@/lib/config";
import {
  getClientProject,
  getConversation,
  getCurrentProfile,
  getMessages,
} from "@/lib/queries";

export default async function ClientChatPage() {
  if (!isSupabaseConfigured()) {
    return <ClientChatMock />;
  }

  const profile = await getCurrentProfile();
  const project = await getClientProject();
  if (!profile || !project) {
    return (
      <div className="px-4 pt-6 text-center text-gray-500">Chat unavailable.</div>
    );
  }

  const conversation = await getConversation(project.id, "client_manager");
  if (!conversation) {
    return (
      <div className="px-4 pt-6 text-center text-gray-500">
        No conversation set up yet.
      </div>
    );
  }

  const messages = await getMessages(conversation.id, profile.id);

  return (
    <div className="flex h-[calc(100vh-5rem)] flex-col">
      <ConversationReadMarker conversationId={conversation.id} />
      <RealtimeChat
        conversationId={conversation.id}
        currentUserId={profile.id}
        title={project.manager.name}
        subtitle="Your project manager"
        initialMessages={messages}
        allowAttachments
      />
    </div>
  );
}
