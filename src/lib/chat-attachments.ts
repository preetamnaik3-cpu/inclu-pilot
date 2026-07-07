import type { ChatAttachmentKind } from "@/lib/types";

const IMAGE_TYPES = /^image\//;
const VIDEO_TYPES = /^video\//;

export const CHAT_ACCEPTED_FILE_TYPES =
  "image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.txt";

export const CHAT_MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const CHAT_MAX_VIDEO_BYTES = 50 * 1024 * 1024;
export const CHAT_MAX_FILE_BYTES = 25 * 1024 * 1024;

export function getAttachmentKind(mimeType: string): ChatAttachmentKind {
  if (IMAGE_TYPES.test(mimeType)) return "image";
  if (VIDEO_TYPES.test(mimeType)) return "video";
  return "file";
}

export function getAttachmentKindFromFile(file: File): ChatAttachmentKind {
  return getAttachmentKind(file.type || "application/octet-stream");
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function validateChatFile(file: File): string | null {
  const kind = getAttachmentKindFromFile(file);
  if (kind === "image" && file.size > CHAT_MAX_IMAGE_BYTES) {
    return "Images must be under 10 MB.";
  }
  if (kind === "video" && file.size > CHAT_MAX_VIDEO_BYTES) {
    return "Videos must be under 50 MB.";
  }
  if (kind === "file" && file.size > CHAT_MAX_FILE_BYTES) {
    return "Files must be under 25 MB.";
  }
  return null;
}

export function attachmentFromFile(file: File): {
  url: string;
  name: string;
  kind: ChatAttachmentKind;
  mimeType: string;
  sizeBytes: number;
} {
  return {
    url: URL.createObjectURL(file),
    name: file.name,
    kind: getAttachmentKindFromFile(file),
    mimeType: file.type || "application/octet-stream",
    sizeBytes: file.size,
  };
}
