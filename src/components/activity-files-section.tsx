"use client";

import { ChatAttachmentContent } from "@/components/chat-attachment-content";
import { formatFileSize } from "@/lib/chat-attachments";
import type { ActivityFile } from "@/lib/types";

export function ActivityFilesSection({
  files,
  title = "Files",
  emptyLabel = "No files shared yet.",
}: {
  files: ActivityFile[];
  title?: string;
  emptyLabel?: string;
}) {
  if (files.length === 0) {
    return (
      <section className="mt-8">
        <h2 className="section-title">{title}</h2>
        <p className="mt-2 text-sm text-stone-400">{emptyLabel}</p>
      </section>
    );
  }

  return (
    <section className="mt-8">
      <h2 className="section-title">{title}</h2>
      <div className="mt-3 space-y-2.5">
        {files.map((file) => (
          <div key={file.id} className="card p-3">
            {file.kind === "image" || file.kind === "video" ? (
              <ChatAttachmentContent
                attachment={{
                  url: file.url,
                  name: file.name,
                  kind: file.kind,
                  mimeType: file.mimeType,
                  sizeBytes: file.sizeBytes,
                }}
                isOwn={false}
              />
            ) : (
              <a
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                download={file.name}
                className="flex items-center gap-3 text-stone-800"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-100 text-lg">
                  📎
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {file.name}
                  </span>
                  {file.sizeBytes ? (
                    <span className="text-xs text-stone-400">
                      {formatFileSize(file.sizeBytes)}
                    </span>
                  ) : null}
                </span>
              </a>
            )}
            <p className="mt-2 text-[10px] text-stone-400">
              Shared {file.uploadedAt}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function ManagerActivityFilesSection({
  files,
  onUpload,
  onPublish,
  uploading = false,
}: {
  files: ActivityFile[];
  onUpload: (file: File, publishNow: boolean) => void | Promise<void>;
  onPublish?: (fileId: string) => void | Promise<void>;
  uploading?: boolean;
}) {
  return (
    <section className="mt-8">
      <h2 className="section-title">Files vault</h2>
      <p className="mb-3 mt-1 text-[11px] text-stone-400">
        Upload deliverables — publish when the client should see them
      </p>

      <label className="card flex cursor-pointer items-center justify-center border-dashed p-4 text-sm font-medium text-burgundy hover:bg-stone-50">
        <input
          type="file"
          className="sr-only"
          disabled={uploading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void onUpload(file, false);
            e.target.value = "";
          }}
        />
        {uploading ? "Uploading..." : "+ Upload file"}
      </label>

      {files.length > 0 ? (
        <div className="mt-3 space-y-2.5">
          {files.map((file) => (
            <div key={file.id} className="card p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-stone-900">
                    {file.name}
                  </p>
                  <p className="text-[10px] text-stone-400">
                    {file.visibleToClient ? "Visible to client" : "Draft — not published"}
                  </p>
                </div>
                {!file.visibleToClient && onPublish ? (
                  <button
                    type="button"
                    onClick={() => onPublish(file.id)}
                    className="shrink-0 rounded-full bg-burgundy px-3 py-1 text-[11px] font-semibold text-white"
                  >
                    Publish
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-stone-400">No files uploaded yet.</p>
      )}
    </section>
  );
}
