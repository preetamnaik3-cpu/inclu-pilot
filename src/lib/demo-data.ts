import type {
  ActivityManagerUpdate,
  ChatMessage,
  ClientNotification,
  ClientProject,
  InboxThread,
  ManagerClientSummary,
  TodayAttention,
  WorkComment,
  WorkItem,
} from "./types";

export const demoManager = {
  id: "mgr-1",
  name: "Priya Sharma",
  designation: "Project Manager",
};

export const demoClient = {
  id: "client-1",
  name: "Rahul Mehta",
  designation: "Client",
};

export const demoTeamMember = {
  id: "team-1",
  name: "Alex Kumar",
  designation: "Web Designer",
};

export const demoWorkItems: WorkItem[] = [
  {
    id: "work-1",
    title: "Homepage Design",
    description: "Main landing page for the rebrand launch.",
    outcome:
      "A fully responsive homepage with hero, services, and contact sections.",
    status: "in_review",
    previewUrl:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=240&fit=crop",
    assignee: { id: "team-1", name: "Alex Kumar", designation: "Web Designer" },
    commentCount: 2,
    dueLabel: "Ready for your review",
    latestUpdate: "Homepage is ready — please review when you can.",
  },
  {
    id: "work-2",
    title: "Product Shoot",
    description: "Studio session for product catalog images.",
    outcome: "20 edited product photos for web and print use.",
    status: "planned",
    previewUrl:
      "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=400&h=240&fit=crop",
    assignee: { id: "team-2", name: "Sam Patel", designation: "Photographer" },
    commentCount: 0,
    dueLabel: "Studio booked Friday",
    latestUpdate: "Shoot day confirmed for Friday at 10 AM.",
  },
  {
    id: "work-3",
    title: "Instagram Reel Series",
    description: "Five short reels for launch week.",
    outcome: "5 edited reels with captions, ready to publish.",
    status: "in_progress",
    previewUrl:
      "https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=400&h=240&fit=crop",
    assignee: { id: "team-3", name: "Maya Singh", designation: "Social Media" },
    commentCount: 0,
    dueLabel: "3 of 5 drafted",
    latestUpdate: "3 of 5 reels drafted — on track for launch week.",
  },
  {
    id: "work-4",
    title: "Brand Guidelines PDF",
    description: "Document covering logo usage, colors, and typography.",
    outcome: "A shareable PDF your team can reference.",
    status: "in_progress",
    assignee: { id: "team-4", name: "Jordan Lee", designation: "Brand Designer" },
    commentCount: 0,
    dueLabel: "Draft due tomorrow",
    latestUpdate: "Brand guidelines draft in progress.",
  },
  {
    id: "work-5",
    title: "Logo Final Files",
    description: "Deliverable logo package for print and web.",
    outcome: "SVG, PNG, and usage guide for your logo.",
    status: "done",
    previewUrl:
      "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=400&h=240&fit=crop",
    assignee: { id: "team-4", name: "Jordan Lee", designation: "Brand Designer" },
    commentCount: 0,
    latestUpdate: "Final logo files delivered and approved.",
    completedAt: "12 Mar 2026",
  },
];

export const demoTodayAttention: TodayAttention[] = [
  {
    id: "att-1",
    label: "Homepage needs your review",
    workItemId: "work-1",
  },
  {
    id: "att-2",
    label: "Product shoot scheduled Friday",
    workItemId: "work-2",
  },
];

export const demoActivityUpdates: ActivityManagerUpdate[] = [
  {
    id: "upd-1",
    workItemId: "work-1",
    authorName: "Priya (Manager)",
    body: "Homepage is ready — please review when you can. Alex has incorporated the brand colors we discussed.",
    createdAt: "Today",
  },
  {
    id: "upd-2",
    workItemId: "work-1",
    authorName: "Priya (Manager)",
    body: "First internal draft was shared with the team yesterday.",
    createdAt: "Yesterday",
  },
  {
    id: "upd-3",
    workItemId: "work-2",
    authorName: "Priya (Manager)",
    body: "Studio is booked for Friday at 10 AM. Sam will handle the shoot.",
    createdAt: "2h ago",
  },
  {
    id: "upd-4",
    workItemId: "work-3",
    authorName: "Priya (Manager)",
    body: "3 of 5 reels are drafted. Launch week schedule is lining up.",
    createdAt: "Mon",
  },
  {
    id: "upd-5",
    workItemId: "work-5",
    authorName: "Priya (Manager)",
    body: "Logo package delivered — all formats included. Marking this activity complete.",
    createdAt: "12 Mar",
  },
];

export const demoNotifications: ClientNotification[] = [
  {
    id: "n-1",
    title: "Homepage ready for review",
    body: "Priya posted an update on Homepage Design",
    time: "2h ago",
    workItemId: "work-1",
    read: false,
  },
  {
    id: "n-2",
    title: "Shoot day confirmed",
    body: "Friday at 10 AM — Product Shoot",
    time: "Yesterday",
    workItemId: "work-2",
    read: false,
  },
  {
    id: "n-3",
    title: "Priya replied",
    body: "Got it — passing this to Alex.",
    time: "Today",
    workItemId: "work-1",
    read: true,
  },
];

export const demoProject: ClientProject = {
  id: "proj-1",
  name: "Acme Rebrand",
  clientName: "Rahul Mehta",
  manager: demoManager,
  progressPercent: 68,
  completedCount: 1,
  totalCount: 5,
  workItems: demoWorkItems,
  activities: [
    {
      id: "act-1",
      icon: "📸",
      title: "Shoot day confirmed",
      subtitle: "Friday, 10 AM at Studio B",
      time: "2h ago",
      workItemId: "work-2",
    },
    {
      id: "act-2",
      icon: "🌐",
      title: "Homepage ready for your review",
      subtitle: "Tap to view and leave feedback",
      time: "Yesterday",
      workItemId: "work-1",
    },
    {
      id: "act-3",
      icon: "📱",
      title: "3 social posts scheduled",
      subtitle: "Launch week content lined up",
      time: "Mon",
      workItemId: "work-3",
    },
  ],
  upcoming: ["Brand guidelines draft → Fri", "Social launch → Mon"],
  todayAttention: demoTodayAttention,
};

export const demoComments: WorkComment[] = [
  {
    id: "cmt-1",
    workItemId: "work-1",
    authorName: "You",
    authorRole: "client",
    body: "Can we make the hero image larger?",
    createdAt: "Yesterday",
  },
  {
    id: "cmt-2",
    workItemId: "work-1",
    authorName: "Priya (Manager)",
    authorRole: "manager",
    body: "Got it — passing this to Alex. Will update you soon.",
    createdAt: "Today",
  },
];

export const demoClientChat: ChatMessage[] = [
  {
    id: "msg-1",
    senderId: "mgr-1",
    senderName: "Priya Sharma",
    body: "Hi! Homepage is ready — take a look when you can.",
    time: "10:30 AM",
    isOwn: false,
  },
  {
    id: "msg-2",
    senderId: "client-1",
    senderName: "You",
    body: "Looks great! Can we tweak the hero?",
    time: "10:45 AM",
    isOwn: true,
  },
  {
    id: "msg-3",
    senderId: "mgr-1",
    senderName: "Priya Sharma",
    body: "Of course — I'll pass it to the team.",
    time: "10:46 AM",
    isOwn: false,
  },
  {
    id: "msg-4",
    senderId: "mgr-1",
    senderName: "Priya Sharma",
    body: "Here's a quick preview of the hero section:",
    time: "11:00 AM",
    isOwn: false,
    attachment: {
      url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=480&h=320&fit=crop",
      name: "homepage-hero-preview.jpg",
      kind: "image",
      mimeType: "image/jpeg",
    },
  },
];

export const ACTIVE_DEMO_PROJECT_ID = "proj-1";

export const demoManagerClientChats: Record<string, ChatMessage[]> = {
  "proj-2": [
    {
      id: "msg-m2-1",
      senderId: "client-2",
      senderName: "Meera Shah",
      body: "When is social launch?",
      time: "Yesterday",
      isOwn: false,
    },
    {
      id: "msg-m2-2",
      senderId: "mgr-1",
      senderName: "Priya Sharma",
      body: "Launch week is next Monday — I'll send the schedule tomorrow.",
      time: "Yesterday",
      isOwn: true,
    },
  ],
  "proj-3": [
    {
      id: "msg-m3-1",
      senderId: "client-3",
      senderName: "Arjun Rao",
      body: "All caught up on my end. Thanks!",
      time: "3d ago",
      isOwn: false,
    },
    {
      id: "msg-m3-2",
      senderId: "mgr-1",
      senderName: "Priya Sharma",
      body: "Great — we'll share the final website preview on Friday.",
      time: "3d ago",
      isOwn: true,
    },
  ],
};

export const demoManagerClients: ManagerClientSummary[] = [
  {
    id: "proj-1",
    projectName: "Acme Rebrand",
    clientName: "Rahul Mehta",
    lastMessage: "Can we tweak the hero?",
    lastMessageTime: "10m ago",
    statusLine: "Homepage in review",
    unreadCount: 1,
  },
  {
    id: "proj-2",
    projectName: "Bloom Cafe",
    clientName: "Meera Shah",
    lastMessage: "When is social launch?",
    lastMessageTime: "2d ago",
    statusLine: "Social launch next week",
    unreadCount: 0,
  },
  {
    id: "proj-3",
    projectName: "TechStart Launch",
    clientName: "Arjun Rao",
    lastMessage: "All caught up",
    lastMessageTime: "3d ago",
    statusLine: "Website 90% done",
    unreadCount: 0,
  },
];

export const demoInboxThreads: InboxThread[] = [
  {
    id: "thread-1",
    type: "client",
    name: "Rahul Mehta",
    preview: "Can we tweak the hero?",
    time: "10:45 AM",
  },
  {
    id: "thread-2",
    type: "internal",
    name: "Dev team",
    preview: "About page draft ready",
    time: "9:00 AM",
  },
  {
    id: "thread-3",
    type: "client",
    name: "Meera Shah",
    preview: "When is social launch?",
    time: "Yesterday",
  },
];

export const demoTeamWorkItems: WorkItem[] = [
  {
    id: "work-4",
    title: "Brand Guidelines PDF",
    description: "Brand document for client handoff.",
    outcome: "PDF with logo, colors, typography rules.",
    status: "in_progress",
    assignee: demoTeamMember,
    commentCount: 0,
    dueLabel: "Due tomorrow",
  },
  {
    id: "work-1",
    title: "Homepage Design",
    description: "Main landing page.",
    outcome: "Responsive homepage.",
    status: "in_review",
    assignee: demoTeamMember,
    commentCount: 0,
    dueLabel: "Client reviewing",
  },
];

export const demoTeamChat: ChatMessage[] = [
  {
    id: "tmsg-1",
    senderId: "mgr-1",
    senderName: "Priya Sharma",
    body: "Client asked to make the hero image larger. Can you adjust?",
    time: "11:00 AM",
    isOwn: false,
  },
  {
    id: "tmsg-2",
    senderId: "team-1",
    senderName: "You",
    body: "On it — will send updated mockup by EOD.",
    time: "11:05 AM",
    isOwn: true,
  },
];
