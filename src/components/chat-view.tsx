"use client";

import { useRef, useState } from "react";
import type { ChatMessage, ChatSendPayload } from "@/lib/types";
import { ChatAttachmentContent } from "@/components/chat-attachment-content";
import {
  CHAT_ACCEPTED_FILE_TYPES,
  formatFileSize,
  getAttachmentKindFromFile,
  validateChatFile,
} from "@/lib/chat-attachments";

export function ChatView({
  title,
  subtitle,
  messages,
  onSend,
  placeholder = "Type a message...",
  allowAttachments = false,
}: {
  title: string;
  subtitle: string;
  messages: ChatMessage[];
  onSend: (payload: ChatSendPayload) => void | Promise<void>;
  placeholder?: string;
  allowAttachments?: boolean;
}) {
  const [input, setInput] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function clearPendingFile() {
    setPendingFile(null);
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleFileSelect(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;

    const error = validateChatFile(file);
    if (error) {
      setFileError(error);
      setPendingFile(null);
      return;
    }

    setFileError(null);
    setPendingFile(file);
  }

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed && !pendingFile) return;
    if (sending) return;

    setSending(true);
    try {
      await onSend({ body: trimmed, file: pendingFile ?? undefined });
      setInput("");
      clearPendingFile();
    } finally {
      setSending(false);
    }
  }

  const canSend = Boolean(input.trim() || pendingFile);

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="border-b border-stone-200/80 bg-white px-4 py-4">
        <h1 className="text-base font-bold tracking-tight text-stone-900">
          {title}
        </h1>
        <p className="text-[13px] text-stone-500">{subtitle}</p>
        {allowAttachments ? (
          <p className="mt-1 text-[11px] text-stone-400">
            Share images, videos, or files with your manager
          </p>
        ) : null}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.isOwn ? "items-end" : "items-start"}`}
          >
            <div
              className={`max-w-[85%] overflow-hidden text-sm leading-relaxed ${
                msg.isOwn
                  ? "rounded-2xl rounded-br-md bg-burgundy text-white"
                  : "rounded-2xl rounded-bl-md bg-white text-stone-800 shadow-[var(--shadow-card)]"
              } ${msg.attachment ? "p-2" : "px-4 py-2.5"}`}
            >
              {msg.attachment ? (
                <div className={msg.body ? "mb-2" : ""}>
                  <ChatAttachmentContent
                    attachment={msg.attachment}
                    isOwn={msg.isOwn}
                  />
                </div>
              ) : null}
              {msg.body ? (
                <p className={msg.attachment ? "px-2 pb-1" : ""}>{msg.body}</p>
              ) : null}
            </div>
            <span className="mt-1 text-[10px] text-stone-400">{msg.time}</span>
          </div>
        ))}
      </div>

      <div className="border-t border-stone-200/80 bg-white px-4 py-3">
        {pendingFile ? (
          <div className="mb-2 flex items-center gap-2 rounded-xl bg-stone-50 px-3 py-2">
            <span className="text-lg">
              {getAttachmentKindFromFile(pendingFile) === "image"
                ? "🖼️"
                : getAttachmentKindFromFile(pendingFile) === "video"
                  ? "🎬"
                  : "📎"}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-stone-800">
                {pendingFile.name}
              </p>
              <p className="text-[11px] text-stone-400">
                {formatFileSize(pendingFile.size)}
              </p>
            </div>
            <button
              type="button"
              onClick={clearPendingFile}
              className="rounded-full px-2 py-1 text-xs text-stone-500 hover:bg-stone-200/60"
              aria-label="Remove attachment"
            >
              ✕
            </button>
          </div>
        ) : null}

        {fileError ? (
          <p className="mb-2 text-xs text-red-600">{fileError}</p>
        ) : null}

        <div className="flex items-center gap-2">
          {allowAttachments ? (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept={CHAT_ACCEPTED_FILE_TYPES}
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files)}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-stone-100 text-stone-600 transition-colors hover:bg-stone-200/80 hover:text-burgundy"
                aria-label="Attach file"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                >
                  <path
                    d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </>
          ) : null}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder={placeholder}
            className="input-field flex-1 px-4 py-2.5 text-sm"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!canSend || sending}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-burgundy text-white transition-colors hover:bg-burgundy-hover disabled:opacity-40"
            aria-label="Send message"
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}
