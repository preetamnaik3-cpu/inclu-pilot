import { ClientChatMock } from "@/app/client/client-chat-mock";
import { ConversationReadMarker } from "@/components/conversation-read-marker";
import { RealtimeChat } from "@/components/realtime-chat";
import { isSupabaseConfigured } from "@/lib/config";
import { getClientChatPageData } from "@/lib/queries";

export default async function ClientChatPage() {
  if (!isSupabaseConfigured()) {
    return <ClientChatMock />;
  }

  const data = await getClientChatPageData();
  if (!data) {
    return (
      <div className="px-4 pt-6 text-center text-gray-500">Chat unavailable.</div>
    );
  }

  if (!data.conversation) {
    return (
      <div className="px-4 pt-6 text-center text-gray-500">
        No conversation set up yet.
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-5rem)] flex-col">
      <ConversationReadMarker conversationId={data.conversation.id} />
      <RealtimeChat
        conversationId={data.conversation.id}
        currentUserId={data.profile.id}
        title={data.managerName}
        subtitle="Your project manager"
        initialMessages={data.messages}
        allowAttachments
      />
    </div>
  );
}
