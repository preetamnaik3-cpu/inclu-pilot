"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  ACTIVE_DEMO_PROJECT_ID,
  demoClientChat,
  demoManager,
  demoManagerClientChats,
  demoManagerClients,
  demoTeamChat,
  demoTeamMember,
} from "@/lib/demo-data";
import { attachmentFromFile } from "@/lib/chat-attachments";
import { recomputeProject, statusDueLabel } from "@/lib/project-sync";
import type {
  ChatMessage,
  ChatSendPayload,
  ClientProject,
  HubUpdate,
  UserRole,
  WorkStatus,
} from "@/lib/types";
import {
  applyLatestLinesToWorkItems,
  countClientNotesAwaitingReply,
  createUpdate,
  getActivityNotes,
  getActivityTimelineForClient,
  getClientHomeFeed,
  getTeamPulseForManager,
  toActivityManagerUpdate,
} from "@/lib/updates/selectors";
import { buildDemoHubUpdates } from "@/lib/updates/seed";
import { buildDemoProjectFromUpdates } from "@/lib/updates/sync-project";
import { feedIconForActivity } from "@/lib/project-sync";

interface MockContextValue {
  role: UserRole | null;
  setRole: (role: UserRole) => void;
  updates: HubUpdate[];
  project: ClientProject;
  addComment: (workItemId: string, body: string) => void;
  replyToClientComment: (workItemId: string, body: string) => void;
  postTeamQuickUpdate: (activityId: string, body: string) => void;
  publishTeamUpdate: (updateId: string) => void;
  clientMessages: ChatMessage[];
  addClientMessage: (payload: ChatSendPayload) => void;
  addManagerClientMessage: (projectId: string, payload: ChatSendPayload) => void;
  getManagerChatMessages: (projectId: string) => ChatMessage[];
  teamMessages: ChatMessage[];
  addTeamMessage: (payload: ChatSendPayload) => void;
  updateActivityStatus: (activityId: string, status: WorkStatus) => void;
  addActivity: (input: { title: string; outcome: string }) => void;
  postActivityUpdate: (activityId: string, body: string) => void;
  postFeedUpdate: (title: string, subtitle: string, workItemId?: string) => void;
  getActivityTimeline: (activityId: string) => ReturnType<typeof toActivityManagerUpdate>[];
  getActivityNotesFor: (activityId: string) => ReturnType<typeof getActivityNotes>;
  getTeamPulse: (activityId: string) => HubUpdate[];
  getPendingNoteCount: (activityId: string) => number;
}

const MockContext = createContext<MockContextValue | null>(null);

function syncProject(
  project: ClientProject,
  updates: HubUpdate[],
  projectId: string,
): ClientProject {
  const next = {
    ...project,
    workItems: applyLatestLinesToWorkItems(project.workItems, updates),
    activities: getClientHomeFeed(updates, projectId),
  };
  return recomputeProject(next);
}

export function MockProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole | null>(null);
  const [updates, setUpdates] = useState<HubUpdate[]>(buildDemoHubUpdates);
  const [projectBase, setProjectBase] = useState<ClientProject>(() =>
    buildDemoProjectFromUpdates(buildDemoHubUpdates()),
  );
  const [clientMessages, setClientMessages] =
    useState<ChatMessage[]>(demoClientChat);
  const [otherClientChats, setOtherClientChats] = useState<
    Record<string, ChatMessage[]>
  >(() => ({ ...demoManagerClientChats }));
  const [teamMessages, setTeamMessages] = useState<ChatMessage[]>(demoTeamChat);

  const project = useMemo(
    () => syncProject(projectBase, updates, ACTIVE_DEMO_PROJECT_ID),
    [projectBase, updates],
  );

  const appendUpdate = useCallback((update: HubUpdate) => {
    setUpdates((prev) => [update, ...prev]);
  }, []);

  const addComment = useCallback(
    (workItemId: string, body: string) => {
      appendUpdate(
        createUpdate({
          projectId: ACTIVE_DEMO_PROJECT_ID,
          activityId: workItemId,
          authorId: "client-1",
          authorName: "You",
          authorRole: "client",
          type: "client_note",
          body,
          visibility: "manager",
        }),
      );
    },
    [appendUpdate],
  );

  const replyToClientComment = useCallback(
    (workItemId: string, body: string) => {
      const trimmed = body.trim();
      if (!trimmed) return;
      appendUpdate(
        createUpdate({
          projectId: ACTIVE_DEMO_PROJECT_ID,
          activityId: workItemId,
          authorId: demoManager.id,
          authorName: "Priya (Manager)",
          authorRole: "manager",
          type: "manager_reply",
          body: trimmed,
          visibility: "client",
        }),
      );
    },
    [appendUpdate],
  );

  const postTeamQuickUpdate = useCallback(
    (activityId: string, body: string) => {
      const trimmed = body.trim();
      if (!trimmed) return;
      appendUpdate(
        createUpdate({
          projectId: ACTIVE_DEMO_PROJECT_ID,
          activityId,
          authorId: demoTeamMember.id,
          authorName: demoTeamMember.name,
          authorRole: "team",
          type: "team_quick_update",
          body: trimmed,
          visibility: "manager",
        }),
      );
    },
    [appendUpdate],
  );

  const publishTeamUpdate = useCallback((updateId: string) => {
    setUpdates((prev) =>
      prev.map((update) =>
        update.id === updateId
          ? {
              ...update,
              visibility: "client" as const,
              publishedAt: "Just now",
              type: "manager_update" as const,
              authorName: "Priya (Manager)",
              authorRole: "manager" as const,
            }
          : update,
      ),
    );
  }, []);

  const addClientMessage = useCallback((payload: ChatSendPayload) => {
    const { body, file } = payload;
    if (!body.trim() && !file) return;

    setClientMessages((prev) => [
      ...prev,
      {
        id: `msg-${Date.now()}`,
        senderId: "client-1",
        senderName: "You",
        body: body.trim(),
        time: "Just now",
        isOwn: true,
        attachment: file ? attachmentFromFile(file) : undefined,
      },
    ]);
  }, []);

  const addManagerClientMessage = useCallback(
    (projectId: string, payload: ChatSendPayload) => {
      const { body, file } = payload;
      if (!body.trim() && !file) return;

      const msg: ChatMessage = {
        id: `msg-mgr-${Date.now()}`,
        senderId: demoManager.id,
        senderName: "Priya Sharma",
        body: body.trim(),
        time: "Just now",
        isOwn: true,
        attachment: file ? attachmentFromFile(file) : undefined,
      };

      if (projectId === ACTIVE_DEMO_PROJECT_ID) {
        setClientMessages((prev) => [...prev, msg]);
        return;
      }

      setOtherClientChats((prev) => ({
        ...prev,
        [projectId]: [...(prev[projectId] ?? []), msg],
      }));
    },
    [],
  );

  const getManagerChatMessages = useCallback(
    (projectId: string) => {
      if (projectId === ACTIVE_DEMO_PROJECT_ID) return clientMessages;
      return otherClientChats[projectId] ?? [];
    },
    [clientMessages, otherClientChats],
  );

  const addTeamMessage = useCallback((payload: ChatSendPayload) => {
    const { body, file } = payload;
    if (!body.trim() && !file) return;

    setTeamMessages((prev) => [
      ...prev,
      {
        id: `tmsg-${Date.now()}`,
        senderId: demoTeamMember.id,
        senderName: "You",
        body: body.trim(),
        time: "Just now",
        isOwn: true,
        attachment: file ? attachmentFromFile(file) : undefined,
      },
    ]);
  }, []);

  const updateActivityStatus = useCallback(
    (activityId: string, status: WorkStatus) => {
      setProjectBase((prev) => {
        const workItems = prev.workItems.map((item) => {
          if (item.id !== activityId) return item;

          return {
            ...item,
            status,
            dueLabel: statusDueLabel(status) ?? item.dueLabel,
            completedAt:
              status === "done"
                ? new Date().toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : undefined,
          };
        });

        return recomputeProject({ ...prev, workItems });
      });

      appendUpdate(
        createUpdate({
          projectId: ACTIVE_DEMO_PROJECT_ID,
          activityId,
          authorId: demoManager.id,
          authorName: "Priya (Manager)",
          authorRole: "manager",
          type: "status_change",
          body: `Status updated to ${status.replace("_", " ")}.`,
          visibility: "client",
        }),
      );
    },
    [appendUpdate],
  );

  const addActivity = useCallback(
    (input: { title: string; outcome: string }) => {
      const title = input.title.trim();
      const outcome = input.outcome.trim();
      if (!title || !outcome) return;

      const newItem = {
        id: `work-${Date.now()}`,
        title,
        description: "",
        outcome,
        status: "planned" as const,
        assignee: demoTeamMember,
        commentCount: 0,
        dueLabel: "Just created",
        latestUpdate: "New activity created — your team will begin shortly.",
      };

      setProjectBase((prev) =>
        recomputeProject({
          ...prev,
          workItems: [...prev.workItems, newItem],
        }),
      );

      appendUpdate(
        createUpdate({
          projectId: ACTIVE_DEMO_PROJECT_ID,
          activityId: newItem.id,
          authorId: demoManager.id,
          authorName: "Priya (Manager)",
          authorRole: "manager",
          type: "feed_highlight",
          body: "New activity added to your brand",
          visibility: "client",
          feedTitle: title,
          feedSubtitle: "New activity added to your brand",
          icon: feedIconForActivity(title),
        }),
      );
    },
    [appendUpdate],
  );

  const postActivityUpdate = useCallback(
    (activityId: string, body: string) => {
      const trimmed = body.trim();
      if (!trimmed) return;
      const activity = projectBase.workItems.find((item) => item.id === activityId);

      appendUpdate(
        createUpdate({
          projectId: ACTIVE_DEMO_PROJECT_ID,
          activityId,
          authorId: demoManager.id,
          authorName: "Priya (Manager)",
          authorRole: "manager",
          type: "manager_update",
          body: trimmed,
          visibility: "client",
        }),
      );

      if (activity) {
        appendUpdate(
          createUpdate({
            projectId: ACTIVE_DEMO_PROJECT_ID,
            activityId,
            authorId: demoManager.id,
            authorName: "Priya (Manager)",
            authorRole: "manager",
            type: "feed_highlight",
            body: trimmed,
            visibility: "client",
            feedTitle: activity.title,
            feedSubtitle: trimmed,
            icon: feedIconForActivity(activity.title),
          }),
        );
      }
    },
    [appendUpdate, projectBase.workItems],
  );

  const postFeedUpdate = useCallback(
    (title: string, subtitle: string, workItemId?: string) => {
      const trimmedTitle = title.trim();
      if (!trimmedTitle) return;

      appendUpdate(
        createUpdate({
          projectId: ACTIVE_DEMO_PROJECT_ID,
          activityId: workItemId,
          authorId: demoManager.id,
          authorName: "Priya (Manager)",
          authorRole: "manager",
          type: "feed_highlight",
          body: subtitle.trim() || trimmedTitle,
          visibility: "client",
          feedTitle: trimmedTitle,
          feedSubtitle: subtitle.trim(),
          icon: feedIconForActivity(trimmedTitle),
        }),
      );
    },
    [appendUpdate],
  );

  const getActivityTimeline = useCallback(
    (activityId: string) =>
      getActivityTimelineForClient(updates, activityId).map(toActivityManagerUpdate),
    [updates],
  );

  const getActivityNotesFor = useCallback(
    (activityId: string) => getActivityNotes(updates, activityId),
    [updates],
  );

  const getTeamPulse = useCallback(
    (activityId: string) => getTeamPulseForManager(updates, activityId),
    [updates],
  );

  const getPendingNoteCount = useCallback(
    (activityId: string) => countClientNotesAwaitingReply(updates, activityId),
    [updates],
  );

  const value = useMemo(
    () => ({
      role,
      setRole,
      updates,
      project,
      addComment,
      replyToClientComment,
      postTeamQuickUpdate,
      publishTeamUpdate,
      clientMessages,
      addClientMessage,
      addManagerClientMessage,
      getManagerChatMessages,
      teamMessages,
      addTeamMessage,
      updateActivityStatus,
      addActivity,
      postActivityUpdate,
      postFeedUpdate,
      getActivityTimeline,
      getActivityNotesFor,
      getTeamPulse,
      getPendingNoteCount,
    }),
    [
      role,
      updates,
      project,
      addComment,
      replyToClientComment,
      postTeamQuickUpdate,
      publishTeamUpdate,
      clientMessages,
      addClientMessage,
      addManagerClientMessage,
      getManagerChatMessages,
      teamMessages,
      addTeamMessage,
      updateActivityStatus,
      addActivity,
      postActivityUpdate,
      postFeedUpdate,
      getActivityTimeline,
      getActivityNotesFor,
      getTeamPulse,
      getPendingNoteCount,
    ],
  );

  return <MockContext.Provider value={value}>{children}</MockContext.Provider>;
}

export function useMock() {
  const ctx = useContext(MockContext);
  if (!ctx) {
    throw new Error("useMock must be used within MockProvider");
  }
  return ctx;
}

export function useManagerClientChat(projectId: string) {
  const { getManagerChatMessages, addManagerClientMessage } = useMock();

  const client = demoManagerClients.find((entry) => entry.id === projectId);
  const clientName = client?.clientName ?? "Client";
  const rawMessages = getManagerChatMessages(projectId);

  const messages = useMemo(
    () =>
      rawMessages.map((message) => ({
        ...message,
        isOwn: message.senderId === demoManager.id,
        senderName:
          message.senderId === demoManager.id
            ? "You"
            : (clientName.split(" ")[0] ?? message.senderName),
      })),
    [rawMessages, clientName],
  );

  const sendMessage = useCallback(
    (payload: ChatSendPayload) => addManagerClientMessage(projectId, payload),
    [addManagerClientMessage, projectId],
  );

  return {
    messages,
    sendMessage,
    clientName,
    projectName: client?.projectName ?? "Project",
    isLiveDemo: projectId === ACTIVE_DEMO_PROJECT_ID,
  };
}
