import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { signStoragePath } from "@/lib/storage/signed-url";
import type { Database } from "@/lib/database.types";
import type { ActivityUpdate, ClientNotification, ClientProject, ManagerClientSummary, WorkItem, WorkStatus } from "@/lib/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return data;
});

export const getClientProject = cache(async (
  projectId?: string,
): Promise<ClientProject | null> => {
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  if (!profile) return null;

  let projectQuery = supabase.from("projects").select("*");
  if (profile.role === "client") {
    projectQuery = projectQuery.eq("client_id", profile.id);
  } else if (profile.role === "manager") {
    projectQuery = projectQuery.eq("manager_id", profile.id);
    if (projectId) {
      projectQuery = projectQuery.eq("id", projectId);
    } else {
      projectQuery = projectQuery.order("created_at").limit(1);
    }
  } else {
    return null;
  }

  const { data: project } = await projectQuery.single();
  if (!project) return null;

  const { data: workItems } = await supabase
    .from("work_items")
    .select("*")
    .eq("project_id", project.id)
    .order("sort_order");

  const workItemIds = (workItems ?? []).map((w) => w.id);

  const [{ data: manager }, { data: assignments }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, designation")
      .eq("id", project.manager_id)
      .single(),
    workItemIds.length > 0
      ? supabase
          .from("work_item_assignments")
          .select("work_item_id, user_id, visible_to_client")
          .in("work_item_id", workItemIds)
      : Promise.resolve({ data: [] as { work_item_id: string; user_id: string; visible_to_client: boolean }[] }),
  ]);

  const assigneeIds = [
    ...new Set((assignments ?? []).map((a) => a.user_id)),
  ];
  const { data: assigneeProfiles } =
    assigneeIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, full_name, designation")
          .in("id", assigneeIds)
      : { data: [] };

  const profileMap = Object.fromEntries(
    (assigneeProfiles ?? []).map((p) => [p.id, p]),
  );

  let resolvedItems: WorkItem[] = (workItems ?? []).map((wi) => {
    const assignment = (assignments ?? []).find(
      (a) => a.work_item_id === wi.id && a.visible_to_client,
    );
    const assigneeProfile = assignment
      ? profileMap[assignment.user_id]
      : undefined;

    return {
      id: wi.id,
      title: wi.title,
      description: wi.description ?? "",
      outcome: wi.outcome_description ?? "",
      status: wi.status as WorkStatus,
      previewUrl: wi.preview_url ?? undefined,
      assignee: {
        id: assigneeProfile?.id ?? "",
        name: assigneeProfile?.full_name ?? "Unassigned",
        designation: assigneeProfile?.designation ?? "Team",
      },
      commentCount: 0,
      dueLabel: wi.due_label ?? undefined,
    };
  });

  const doneCount = resolvedItems.filter((i) => i.status === "done").length;

  const { data: clientProfile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", project.client_id)
    .single();

  const { getHubUpdatesForProject } = await import("@/lib/updates/queries");
  const {
    applyLatestLinesToWorkItems,
    getClientHomeFeed,
  } = await import("@/lib/updates/selectors");

  let hubFeed: ActivityUpdate[] = [];

  try {
    const hubUpdates = await getHubUpdatesForProject(project.id);
    hubFeed = getClientHomeFeed(hubUpdates, project.id);
    resolvedItems = applyLatestLinesToWorkItems(resolvedItems, hubUpdates);
  } catch {
    // hub_updates table may not exist until migration runs
  }

  return {
    id: project.id,
    name: project.name,
    clientName: clientProfile?.full_name ?? "Client",
    manager: {
      id: manager?.id ?? project.manager_id,
      name: manager?.full_name ?? "Manager",
      designation: manager?.designation ?? "Project Manager",
    },
    progressPercent:
      resolvedItems.length > 0
        ? Math.round((doneCount / resolvedItems.length) * 100)
        : 0,
    completedCount: doneCount,
    totalCount: resolvedItems.length,
    workItems: resolvedItems,
    activities: hubFeed,
    upcoming: resolvedItems
      .filter((i) => i.status !== "done" && i.dueLabel)
      .map((i) => `${i.title} → ${i.dueLabel}`),
    todayAttention: resolvedItems
      .filter((i) => i.status === "in_review")
      .map((i) => ({
        id: `att-${i.id}`,
        label: `${i.title} needs your review`,
        workItemId: i.id,
      })),
  };
});

export async function getWorkItem(workItemId: string): Promise<WorkItem | null> {
  const supabase = await createClient();
  const { data: wi } = await supabase
    .from("work_items")
    .select("*")
    .eq("id", workItemId)
    .single();

  if (!wi) return null;

  const { data: assignment } = await supabase
    .from("work_item_assignments")
    .select("user_id")
    .eq("work_item_id", workItemId)
    .eq("visible_to_client", true)
    .limit(1)
    .maybeSingle();

  let assignee = { id: "", name: "Unassigned", designation: "Team" };
  if (assignment?.user_id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, full_name, designation")
      .eq("id", assignment.user_id)
      .single();
    if (profile) {
      assignee = {
        id: profile.id,
        name: profile.full_name,
        designation: profile.designation ?? "Team",
      };
    }
  }

  return {
    id: wi.id,
    title: wi.title,
    description: wi.description ?? "",
    outcome: wi.outcome_description ?? "",
    status: wi.status as WorkStatus,
    previewUrl: wi.preview_url ?? undefined,
    assignee,
    commentCount: 0,
    dueLabel: wi.due_label ?? undefined,
    latestUpdate: wi.due_label ?? undefined,
    completedAt:
      wi.status === "done" ? formatRelative(wi.created_at) : undefined,
  };
}

export async function getActivityUpdates(workItemId: string) {
  const { getHubUpdatesForActivity } = await import("@/lib/updates/queries");
  const {
    getActivityTimelineForClient,
    toActivityManagerUpdate,
  } = await import("@/lib/updates/selectors");

  const updates = await getHubUpdatesForActivity(workItemId);
  return getActivityTimelineForClient(updates, workItemId).map(
    toActivityManagerUpdate,
  );
}

export async function getProjectIdForWorkItem(
  workItemId: string,
): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("work_items")
    .select("project_id")
    .eq("id", workItemId)
    .single();
  return data?.project_id ?? null;
}

export const getManagerProjectTabs = cache(async () => {
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "manager") return [];

  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, client_id, created_at")
    .eq("manager_id", profile.id)
    .order("created_at");

  if (!projects?.length) return [];

  const clientIds = projects.map((p) => p.client_id);
  const { data: clients } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", clientIds);

  const clientMap = Object.fromEntries(
    (clients ?? []).map((c) => [c.id, c.full_name]),
  );

  return projects.map((p) => ({
    id: p.id,
    projectName: p.name,
    clientName: clientMap[p.client_id] ?? "Client",
  }));
});

export async function getClientNoteCountsForProject(projectId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("hub_updates")
    .select("activity_id")
    .eq("project_id", projectId)
    .eq("type", "client_note");

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    if (!row.activity_id) continue;
    counts[row.activity_id] = (counts[row.activity_id] ?? 0) + 1;
  }
  return counts;
}

export const getManagerClients = cache(async () => {
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "manager") return [];

  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, client_id, created_at")
    .eq("manager_id", profile.id)
    .order("created_at");

  if (!projects?.length) return [];

  const projectIds = projects.map((p) => p.id);
  const clientIds = projects.map((p) => p.client_id);

  const [
    { data: clients },
    { data: conversations },
    { data: workItems },
    { data: hubUpdates },
  ] = await Promise.all([
    supabase.from("profiles").select("id, full_name").in("id", clientIds),
    supabase
      .from("conversations")
      .select("id, project_id")
      .in("project_id", projectIds)
      .eq("type", "client_manager"),
    supabase
      .from("work_items")
      .select("id, project_id, status, due_label")
      .in("project_id", projectIds),
    supabase
      .from("hub_updates")
      .select("id, project_id, activity_id, type, visibility")
      .in("project_id", projectIds),
  ]);

  const clientMap = Object.fromEntries(
    (clients ?? []).map((c) => [c.id, c.full_name]),
  );

  const conversationIds = (conversations ?? []).map((c) => c.id);
  const conversationByProject = Object.fromEntries(
    (conversations ?? []).map((c) => [c.project_id, c.id]),
  );

  const { data: messages } =
    conversationIds.length > 0
      ? await supabase
          .from("messages")
          .select("id, conversation_id, sender_id, body, created_at")
          .in("conversation_id", conversationIds)
          .order("created_at", { ascending: false })
          .limit(Math.max(conversationIds.length * 5, 40))
      : { data: [] };

  const { data: reads } =
    conversationIds.length > 0
      ? await supabase
          .from("conversation_reads")
          .select("conversation_id, last_read_at")
          .eq("user_id", profile.id)
          .in("conversation_id", conversationIds)
      : { data: [] };

  const readMap = Object.fromEntries(
    (reads ?? []).map((r) => [r.conversation_id, r.last_read_at]),
  );

  const messagesByConversation: Record<
    string,
    Array<{
      id: string;
      sender_id: string;
      body: string;
      created_at: string;
    }>
  > = {};
  for (const message of messages ?? []) {
    if (messagesByConversation[message.conversation_id]) continue;
    messagesByConversation[message.conversation_id] = [message];
  }

  return projects.map((p) => {
    const projectWorkItems = (workItems ?? []).filter(
      (wi) => wi.project_id === p.id,
    );
    const activeCount = projectWorkItems.filter((wi) => wi.status !== "done")
      .length;
    const inReview = projectWorkItems.find((wi) => wi.status === "in_review");
    const projectUpdates = (hubUpdates ?? []).filter(
      (u) => u.project_id === p.id,
    );
    const pendingNotes = projectWorkItems.reduce((sum, wi) => {
      const notes = projectUpdates.filter(
        (u) =>
          u.activity_id === wi.id &&
          (u.type === "client_note" || u.type === "manager_reply"),
      );
      const clientCount = notes.filter((n) => n.type === "client_note").length;
      const managerCount = notes.filter((n) => n.type === "manager_reply")
        .length;
      return sum + Math.max(0, clientCount - managerCount);
    }, 0);

    const conversationId = conversationByProject[p.id];
    const convoMessages = conversationId
      ? messagesByConversation[conversationId] ?? []
      : [];
    const latestMessage = convoMessages[0];
    const lastReadAt = conversationId ? readMap[conversationId] : undefined;
    const unreadCount = (messages ?? []).filter(
      (m) =>
        m.conversation_id === conversationId &&
        m.sender_id !== profile.id &&
        (!lastReadAt || new Date(m.created_at) > new Date(lastReadAt)),
    ).length;

    return {
      id: p.id,
      projectName: p.name,
      clientName: clientMap[p.client_id] ?? "Client",
      lastMessage: latestMessage?.body ?? "No messages yet",
      lastMessageTime: latestMessage
        ? formatRelative(latestMessage.created_at)
        : "",
      statusLine: inReview
        ? `${inReview.due_label ?? "Activity"} in review`
        : activeCount > 0
          ? `${activeCount} active activit${activeCount === 1 ? "y" : "ies"}`
          : "Active project",
      unreadCount,
      activeActivityCount: activeCount,
      pendingNoteCount: pendingNotes,
    };
  });
});

export async function getManagerClientByProjectId(projectId: string) {
  const clients = await getManagerClients();
  return clients.find((client) => client.id === projectId) ?? null;
}

export async function getTeamProject(): Promise<{
  projectId: string;
  projectName: string;
  managerName: string;
} | null> {
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "team") return null;

  const { data: membership } = await supabase
    .from("project_team_members")
    .select("project_id")
    .eq("user_id", profile.id)
    .limit(1)
    .maybeSingle();

  if (!membership) return null;

  const { data: project } = await supabase
    .from("projects")
    .select("id, name, manager_id")
    .eq("id", membership.project_id)
    .single();

  if (!project) return null;

  const { data: manager } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", project.manager_id)
    .single();

  return {
    projectId: project.id,
    projectName: project.name,
    managerName: manager?.full_name ?? "Manager",
  };
}

export async function getTeamWorkItems(): Promise<WorkItem[]> {
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "team") return [];

  const { data: membership } = await supabase
    .from("project_team_members")
    .select("project_id")
    .eq("user_id", profile.id)
    .limit(1)
    .maybeSingle();

  if (!membership) return [];

  const { data: workItems } = await supabase
    .from("work_items")
    .select("id, title, description, outcome_description, status, due_label, preview_url")
    .eq("project_id", membership.project_id)
    .order("sort_order");

  return (workItems ?? []).map((wi) => ({
    id: wi.id,
    title: wi.title,
    description: wi.description ?? "",
    outcome: wi.outcome_description ?? "",
    status: wi.status as WorkStatus,
    previewUrl: wi.preview_url ?? undefined,
    assignee: {
      id: profile.id,
      name: profile.full_name,
      designation: profile.designation ?? "Team",
    },
    commentCount: 0,
    dueLabel: wi.due_label ?? undefined,
  }));
}

export type UnassignedUser = {
  id: string;
  email: string;
  fullName: string;
};

export const getUnassignedUsers = cache(async (): Promise<UnassignedUser[]> => {
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  if (!profile || (profile.role !== "manager" && profile.role !== "admin")) {
    return [];
  }

  const { data: rpcData, error: rpcError } = await supabase.rpc(
    "get_unassigned_users",
  );

  if (!rpcError && rpcData) {
    return (rpcData as { id: string; email: string; full_name: string }[]).map(
      (row) => ({
        id: row.id,
        email: row.email,
        fullName: row.full_name,
      }),
    );
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name")
    .eq("role", "unassigned")
    .order("full_name")
    .order("email");

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    email: row.email,
    fullName: row.full_name,
  }));
});

export type ManagerProjectOption = {
  id: string;
  label: string;
};

type ManagerProjectRow = {
  id: string;
  name: string;
  client_id: string;
  created_at: string;
};

function buildLightClientSummaries(
  projects: ManagerProjectRow[],
  clientMap: Record<string, string>,
  workItems: Array<{ id: string; project_id: string; status: string; due_label: string | null }>,
): ManagerClientSummary[] {
  return projects.map((p) => {
    const projectWorkItems = workItems.filter((wi) => wi.project_id === p.id);
    const activeCount = projectWorkItems.filter((wi) => wi.status !== "done").length;
    const inReview = projectWorkItems.find((wi) => wi.status === "in_review");

    return {
      id: p.id,
      projectName: p.name,
      clientName: clientMap[p.client_id] ?? "Client",
      lastMessage: "No messages yet",
      lastMessageTime: "",
      statusLine: inReview
        ? `${inReview.due_label ?? "Activity"} in review`
        : activeCount > 0
          ? `${activeCount} active activit${activeCount === 1 ? "y" : "ies"}`
          : "Active project",
      unreadCount: 0,
      activeActivityCount: activeCount,
      pendingNoteCount: 0,
    };
  });
}

export const getManagerDashboard = cache(async () => {
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "manager") {
    return {
      clientSummaries: [] as ManagerClientSummary[],
      unassignedUsers: [] as UnassignedUser[],
      projectOptions: [] as ManagerProjectOption[],
      rosters: [] as ProjectTeamRoster[],
    };
  }

  const [{ data: projects }, unassignedUsers] = await Promise.all([
    supabase
      .from("projects")
      .select("id, name, client_id, created_at")
      .eq("manager_id", profile.id)
      .order("created_at"),
    getUnassignedUsers(),
  ]);

  if (!projects?.length) {
    return {
      clientSummaries: [],
      unassignedUsers,
      projectOptions: [],
      rosters: [],
    };
  }

  const projectIds = projects.map((p) => p.id);
  const clientIds = projects.map((p) => p.client_id);

  const [
    { data: clientProfiles },
    { data: workItems },
    { data: teamRows },
  ] = await Promise.all([
    supabase.from("profiles").select("id, full_name").in("id", clientIds),
    supabase
      .from("work_items")
      .select("id, project_id, status, due_label")
      .in("project_id", projectIds),
    supabase
      .from("project_team_members")
      .select("project_id, user_id")
      .in("project_id", projectIds),
  ]);

  const clientMap = Object.fromEntries(
    (clientProfiles ?? []).map((c) => [c.id, c.full_name]),
  );

  const projectOptions: ManagerProjectOption[] = projects.map((p) => ({
    id: p.id,
    label: `${p.name} (${clientMap[p.client_id] ?? "Client"})`,
  }));

  const teamUserIds = [...new Set((teamRows ?? []).map((row) => row.user_id))];
  const { data: teamProfiles } =
    teamUserIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, email, full_name, designation")
          .in("id", teamUserIds)
      : { data: [] };

  const teamProfileMap = Object.fromEntries(
    (teamProfiles ?? []).map((member) => [member.id, member]),
  );

  const rosters: ProjectTeamRoster[] = projects.map((project) => {
    const members = (teamRows ?? [])
      .filter((row) => row.project_id === project.id)
      .map((row) => teamProfileMap[row.user_id])
      .filter(Boolean)
      .map((member) => ({
        userId: member!.id,
        email: member!.email,
        fullName: member!.full_name,
        designation: member!.designation,
      }));

    return {
      projectId: project.id,
      projectLabel: `${project.name} (${clientMap[project.client_id] ?? "Client"})`,
      members,
    };
  });

  return {
    clientSummaries: buildLightClientSummaries(
      projects,
      clientMap,
      workItems ?? [],
    ),
    unassignedUsers,
    projectOptions,
    rosters,
  };
});

export async function enrichManagerClientSummaries(
  summaries: ManagerClientSummary[],
): Promise<ManagerClientSummary[]> {
  if (!summaries.length) return summaries;

  const supabase = await createClient();
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "manager") return summaries;

  const projectIds = summaries.map((summary) => summary.id);

  const { data: conversations } = await supabase
    .from("conversations")
    .select("id, project_id")
    .in("project_id", projectIds)
    .eq("type", "client_manager");

  const conversationIds = (conversations ?? []).map((c) => c.id);
  const conversationByProject = Object.fromEntries(
    (conversations ?? []).map((c) => [c.project_id, c.id]),
  );

  const [{ data: messages }, { data: reads }] = await Promise.all([
    conversationIds.length > 0
      ? supabase
          .from("messages")
          .select("id, conversation_id, sender_id, body, created_at")
          .in("conversation_id", conversationIds)
          .order("created_at", { ascending: false })
          .limit(Math.max(conversationIds.length * 5, 20))
      : Promise.resolve({ data: [] }),
    conversationIds.length > 0
      ? supabase
          .from("conversation_reads")
          .select("conversation_id, last_read_at")
          .eq("user_id", profile.id)
          .in("conversation_id", conversationIds)
      : Promise.resolve({ data: [] }),
  ]);

  const latestByConversation: Record<
    string,
    {
      id: string;
      conversation_id: string;
      sender_id: string;
      body: string;
      created_at: string;
    }
  > = {};
  for (const message of messages ?? []) {
    if (!latestByConversation[message.conversation_id]) {
      latestByConversation[message.conversation_id] = message;
    }
  }

  const readMap = Object.fromEntries(
    (reads ?? []).map((row) => [row.conversation_id, row.last_read_at]),
  );

  return summaries.map((summary) => {
    const conversationId = conversationByProject[summary.id];
    const latestMessage = conversationId
      ? latestByConversation[conversationId]
      : undefined;
    const lastReadAt = conversationId ? readMap[conversationId] : undefined;
    const unreadCount = (messages ?? []).filter(
      (message) =>
        message.conversation_id === conversationId &&
        message.sender_id !== profile.id &&
        (!lastReadAt || new Date(message.created_at) > new Date(lastReadAt)),
    ).length;

    return {
      ...summary,
      lastMessage: latestMessage?.body ?? summary.lastMessage,
      lastMessageTime: latestMessage
        ? formatRelative(latestMessage.created_at)
        : summary.lastMessageTime,
      unreadCount,
    };
  });
}

export async function getManagerProjectsForSelect(): Promise<
  ManagerProjectOption[]
> {
  const tabs = await getManagerProjectTabs();
  return tabs.map((tab) => ({
    id: tab.id,
    label: `${tab.projectName} (${tab.clientName})`,
  }));
}

export type ProjectTeamMember = {
  userId: string;
  email: string;
  fullName: string;
  designation: string | null;
};

export type ProjectTeamRoster = {
  projectId: string;
  projectLabel: string;
  members: ProjectTeamMember[];
};

export async function getManagerProjectTeamRosters(
  projectOptions?: ManagerProjectOption[],
): Promise<ProjectTeamRoster[]> {
  const options =
    projectOptions ?? (await getManagerProjectsForSelect());

  if (!options.length) return [];

  const supabase = await createClient();
  const projectIds = options.map((project) => project.id);

  const { data: teamRows } = await supabase
    .from("project_team_members")
    .select("project_id, user_id")
    .in("project_id", projectIds);

  const teamUserIds = [...new Set((teamRows ?? []).map((row) => row.user_id))];
  const { data: teamProfiles } =
    teamUserIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, email, full_name, designation")
          .in("id", teamUserIds)
      : { data: [] };

  const teamProfileMap = Object.fromEntries(
    (teamProfiles ?? []).map((member) => [member.id, member]),
  );

  return options.map((project) => ({
    projectId: project.id,
    projectLabel: project.label,
    members: (teamRows ?? [])
      .filter((row) => row.project_id === project.id)
      .map((row) => teamProfileMap[row.user_id])
      .filter(Boolean)
      .map((member) => ({
        userId: member!.id,
        email: member!.email,
        fullName: member!.full_name,
        designation: member!.designation,
      })),
  }));
}

export async function getConversation(
  projectId: string,
  type: "client_manager" | "internal_team",
): Promise<{ id: string } | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("conversations")
    .select("id")
    .eq("project_id", projectId)
    .eq("type", type)
    .single();

  return data;
}

export async function getMessages(conversationId: string, currentUserId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("messages")
    .select(
      "id, sender_id, body, created_at, attachment_url, attachment_name, attachment_kind, attachment_mime_type",
    )
    .eq("conversation_id", conversationId)
    .order("created_at");

  const senderIds = [...new Set((data ?? []).map((m) => m.sender_id))];
  const { data: senders } =
    senderIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", senderIds)
      : { data: [] };

  const senderMap = Object.fromEntries(
    (senders ?? []).map((s) => [s.id, s.full_name]),
  );

  return Promise.all(
    (data ?? []).map(async (m) => {
      const signedAttachmentUrl = m.attachment_url
        ? await signStoragePath(supabase, "chat-attachments", m.attachment_url)
        : null;

      return {
        id: m.id,
        senderId: m.sender_id,
        senderName: senderMap[m.sender_id] ?? "User",
        body: m.body,
        time: formatTime(m.created_at),
        isOwn: m.sender_id === currentUserId,
        attachment:
          signedAttachmentUrl && m.attachment_name && m.attachment_kind
            ? {
                url: signedAttachmentUrl,
                name: m.attachment_name,
                kind: m.attachment_kind as "image" | "video" | "file",
                mimeType: m.attachment_mime_type ?? undefined,
              }
            : undefined,
      };
    }),
  );
}

export async function getClientNotifications(): Promise<ClientNotification[]> {
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "client") return [];

  const project = await getClientProject();
  if (!project) return [];

  const { getHubUpdatesForProject } = await import("@/lib/updates/queries");
  const {
    hubUpdatesToNotifications,
    mergeNotifications,
    messagesToNotifications,
  } = await import("@/lib/notifications/derive");

  const { data: readRows } = await supabase
    .from("notification_reads")
    .select("notification_key")
    .eq("user_id", profile.id);

  const readKeys = new Set((readRows ?? []).map((r) => r.notification_key));

  const hubUpdates = await getHubUpdatesForProject(project.id);
  const hubNotifications = hubUpdatesToNotifications(hubUpdates, readKeys);

  const conversation = await getConversation(project.id, "client_manager");
  let messageNotifications: ClientNotification[] = [];
  if (conversation) {
    const { data: recentMessages } = await supabase
      .from("messages")
      .select("id, body, sender_id, created_at")
      .eq("conversation_id", conversation.id)
      .neq("sender_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(5);

    const senderIds = [
      ...new Set((recentMessages ?? []).map((m) => m.sender_id)),
    ];
    const { data: senders } =
      senderIds.length > 0
        ? await supabase
            .from("profiles")
            .select("id, full_name")
            .in("id", senderIds)
        : { data: [] };
    const senderMap = Object.fromEntries(
      (senders ?? []).map((s) => [s.id, s.full_name]),
    );

    messageNotifications = messagesToNotifications(
      (recentMessages ?? []).map((m) => ({
        id: m.id,
        body: m.body,
        senderName: senderMap[m.sender_id] ?? "Manager",
        createdAt: formatRelative(m.created_at),
      })),
      readKeys,
    );
  }

  return mergeNotifications(hubNotifications, messageNotifications).slice(
    0,
    10,
  );
}

export async function getWorkItemComments(workItemId: string) {
  const { getHubUpdatesForActivity } = await import("@/lib/updates/queries");
  const { getActivityNotes } = await import("@/lib/updates/selectors");
  const profile = await getCurrentProfile();

  const updates = await getHubUpdatesForActivity(workItemId);
  const notes = getActivityNotes(updates, workItemId);

  return notes.map((note) => ({
    ...note,
    authorName:
      note.authorRole === "manager"
        ? `${note.authorName} (Manager)`
        : note.authorName === profile?.full_name
          ? "You"
          : note.authorName,
  }));
}

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  return new Date(iso).toLocaleDateString();
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}
