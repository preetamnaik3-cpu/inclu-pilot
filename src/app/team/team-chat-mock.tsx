"use client";

import { ChatView } from "@/components/chat-view";
import { demoManager } from "@/lib/demo-data";
import { useMock } from "@/components/mock-provider";

export function TeamChatMock() {
  const { teamMessages, addTeamMessage } = useMock();

  return (
    <div className="flex h-[calc(100vh-5rem)] flex-col">
      <ChatView
        title={demoManager.name}
        subtitle="Your manager — internal only"
        messages={teamMessages}
        onSend={addTeamMessage}
        placeholder="Message your manager..."
      />
    </div>
  );
}
