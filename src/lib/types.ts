export type UserRole = "client" | "manager" | "team";

export type WorkStatus = "planned" | "in_progress" | "in_review" | "done";

export interface Person {
  id: string;
  name: string;
  designation: string;
}

export interface WorkComment {
  id: string;
  workItemId: string;
  authorName: string;
  authorRole: "client" | "manager";
  body: string;
  createdAt: string;
}

export type UpdateType =
  | "team_quick_update"
  | "manager_update"
  | "status_change"
  | "file_upload"
  | "client_note"
  | "manager_reply"
  | "feed_highlight";

export type UpdateVisibility = "internal" | "manager" | "client";

export interface HubUpdate {
  id: string;
  projectId: string;
  activityId?: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  type: UpdateType;
  body: string;
  visibility: UpdateVisibility;
  publishedAt?: string;
  createdAt: string;
  sortKey: number;
  feedTitle?: string;
  feedSubtitle?: string;
  icon?: string;
  metadata?: HubUpdateMetadata;
}

export interface HubUpdateMetadata {
  fileUrl?: string;
  fileName?: string;
  fileKind?: ChatAttachmentKind;
  mimeType?: string;
  sizeBytes?: number;
}

export interface ActivityFile {
  id: string;
  activityId: string;
  url: string;
  name: string;
  kind: ChatAttachmentKind;
  mimeType?: string;
  sizeBytes?: number;
  uploadedAt: string;
  visibleToClient: boolean;
}

/** @deprecated Read from HubUpdate via selectors */
export interface ActivityManagerUpdate {
  id: string;
  workItemId: string;
  authorName: string;
  body: string;
  createdAt: string;
}

export interface WorkItem {
  id: string;
  title: string;
  description: string;
  outcome: string;
  status: WorkStatus;
  previewUrl?: string;
  assignee: Person;
  commentCount: number;
  dueLabel?: string;
  latestUpdate?: string;
  completedAt?: string;
}

export interface TodayAttention {
  id: string;
  label: string;
  workItemId?: string;
}

export interface ClientNotification {
  id: string;
  title: string;
  body: string;
  time: string;
  workItemId?: string;
  read: boolean;
}

export interface ActivityUpdate {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  time: string;
  workItemId?: string;
}

export type ChatAttachmentKind = "image" | "video" | "file";

export interface ChatAttachment {
  url: string;
  name: string;
  kind: ChatAttachmentKind;
  mimeType?: string;
  sizeBytes?: number;
}

export interface ChatSendPayload {
  body: string;
  file?: File;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  body: string;
  time: string;
  isOwn: boolean;
  attachment?: ChatAttachment;
}

export interface ClientProject {
  id: string;
  name: string;
  clientName: string;
  manager: Person;
  progressPercent: number;
  completedCount: number;
  totalCount: number;
  workItems: WorkItem[];
  activities: ActivityUpdate[];
  todayAttention: TodayAttention[];
  upcoming: string[];
}

export interface ManagerClientSummary {
  /** Project id — used in manager routes */
  id: string;
  projectName: string;
  clientName: string;
  lastMessage: string;
  lastMessageTime: string;
  statusLine: string;
  unreadCount: number;
  activeActivityCount?: number;
  pendingNoteCount?: number;
}

export interface InboxThread {
  id: string;
  type: "client" | "internal";
  name: string;
  preview: string;
  time: string;
}
