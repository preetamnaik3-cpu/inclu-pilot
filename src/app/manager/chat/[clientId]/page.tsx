import { ManagerChatThreadMock } from "@/app/manager/manager-chat-mock";
import { ConversationReadMarker } from "@/components/conversation-read-marker";
import { RealtimeChat } from "@/components/realtime-chat";
import { isSupabaseConfigured } from "@/lib/config";
import {
  getConversation,
  getCurrentProfile,
  getManagerClientByProjectId,
  getMessages,
} from "@/lib/queries";
import Link from "next/link";

export default async function ManagerChatThreadPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  if (!isSupabaseConfigured()) {
    return <ManagerChatThreadMock />;
  }

  const { clientId } = await params;
  const [profile, client] = await Promise.all([
    getCurrentProfile(),
    getManagerClientByProjectId(clientId),
  ]);

  if (!profile || !client) {
    return (
      <div className="px-4 pt-6 text-center text-stone-500">
        Conversation not found.
      </div>
    );
  }

  const conversation = await getConversation(clientId, "client_manager");
  if (!conversation) {
    return (
      <div className="px-4 pt-6 text-center text-stone-500">
        No conversation set up for this client yet.
      </div>
    );
  }

  const messages = await getMessages(conversation.id, profile.id);

  return (
    <div className="flex h-[calc(100vh-5rem)] flex-col">
      <ConversationReadMarker conversationId={conversation.id} />
      <div className="border-b border-stone-200/80 bg-white px-4 py-3">
        <Link
          href="/manager/chat"
          className="mb-2 inline-flex text-sm font-medium text-burgundy"
        >
          ← All conversations
        </Link>
        <h1 className="text-base font-bold text-stone-900">{client.clientName}</h1>
        <p className="text-[13px] text-stone-500">{client.projectName}</p>
      </div>
      <div className="min-h-0 flex-1">
        <RealtimeChat
          conversationId={conversation.id}
          currentUserId={profile.id}
          title={client.clientName}
          subtitle={client.projectName}
          initialMessages={messages}
          allowAttachments
        />
      </div>
    </div>
  );
}
