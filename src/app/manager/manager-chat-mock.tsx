"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ChatView } from "@/components/chat-view";
import { useManagerClientChat } from "@/components/mock-provider";
import { demoManagerClients } from "@/lib/demo-data";

export function ManagerChatThreadMock() {
  const params = useParams();
  const projectId = params.clientId as string;
  const client = demoManagerClients.find((entry) => entry.id === projectId);

  const { messages, sendMessage, clientName, projectName, isLiveDemo } =
    useManagerClientChat(projectId);

  if (!client) {
    return (
      <div className="px-4 pt-6 text-center">
        <p className="text-stone-500">Conversation not found</p>
        <Link href="/manager/chat" className="mt-4 font-medium text-burgundy">
          ← All conversations
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-5rem)] flex-col">
      <div className="border-b border-stone-200/80 bg-white px-4 py-3">
        <Link
          href="/manager/chat"
          className="mb-2 inline-flex text-sm font-medium text-burgundy"
        >
          ← All conversations
        </Link>
        <h1 className="text-base font-bold text-stone-900">{clientName}</h1>
        <p className="text-[13px] text-stone-500">{projectName}</p>
        {isLiveDemo ? (
          <p className="mt-1 text-[11px] text-burgundy">
            Synced with Client role — messages appear on both sides
          </p>
        ) : (
          <p className="mt-1 text-[11px] text-stone-400">
            Preview thread — not linked to Client role in this demo
          </p>
        )}
      </div>
      <div className="min-h-0 flex-1">
        <ChatView
          title={clientName}
          subtitle={projectName}
          messages={messages}
          onSend={sendMessage}
          allowAttachments
          placeholder="Message or attach a file..."
        />
      </div>
    </div>
  );
}
