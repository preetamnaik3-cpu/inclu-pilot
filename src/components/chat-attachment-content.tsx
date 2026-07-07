import Image from "next/image";
import type { ChatAttachment } from "@/lib/types";
import { formatFileSize } from "@/lib/chat-attachments";

function FileIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" strokeLinecap="round" />
    </svg>
  );
}

export function ChatAttachmentContent({
  attachment,
  isOwn,
}: {
  attachment: ChatAttachment;
  isOwn: boolean;
}) {
  if (attachment.kind === "image") {
    return (
      <a
        href={attachment.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block overflow-hidden rounded-xl"
      >
        <div className="relative max-h-56 w-full min-w-[180px] max-w-[240px]">
          <Image
            src={attachment.url}
            alt={attachment.name}
            width={240}
            height={180}
            className="h-auto max-h-56 w-full object-cover"
            unoptimized
          />
        </div>
      </a>
    );
  }

  if (attachment.kind === "video") {
    return (
      <video
        src={attachment.url}
        controls
        className="max-h-56 w-full max-w-[240px] rounded-xl bg-black"
        preload="metadata"
      >
        <track kind="captions" />
      </video>
    );
  }

  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noopener noreferrer"
      download={attachment.name}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${
        isOwn ? "bg-white/15 text-white" : "bg-stone-50 text-stone-800"
      }`}
    >
      <span className={isOwn ? "text-white/90" : "text-burgundy"}>
        <FileIcon />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{attachment.name}</span>
        {attachment.sizeBytes ? (
          <span className={`text-[11px] ${isOwn ? "text-white/70" : "text-stone-400"}`}>
            {formatFileSize(attachment.sizeBytes)}
          </span>
        ) : null}
      </span>
    </a>
  );
}
