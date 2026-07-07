"use client";

import { ChatView } from "@/components/chat-view";
import { useMock } from "@/components/mock-provider";

export function ClientChatMock() {
  const { project, clientMessages, addClientMessage } = useMock();

  return (
    <div className="flex h-[calc(100vh-5rem)] flex-col">
      <ChatView
        title={project.manager.name}
        subtitle="Your project manager"
        messages={clientMessages}
        onSend={addClientMessage}
        allowAttachments
        placeholder="Message or attach a file..."
      />
    </div>
  );
}
