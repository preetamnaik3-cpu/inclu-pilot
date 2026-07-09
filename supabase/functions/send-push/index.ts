/// <reference types="jsr:@supabase/functions-js/edge-runtime.d.ts" />

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.110.0";
import webpush from "npm:web-push@3.6.7";

type OutboxRow = {
  id: string;
  user_id: string;
  title: string;
  body: string;
  url: string;
  data: Record<string, unknown>;
  status: "pending" | "sent" | "needs_email" | "failed";
  attempts: number;
};

type SubscriptionRow = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

type MessageTriggerPayload = {
  conversationId: string;
  message: {
    id: string;
    senderId: string;
    body: string;
  };
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

async function tryEmailFallback(
  supabase: ReturnType<typeof createClient>,
  row: OutboxRow,
): Promise<{ ok: boolean; error?: string }> {
  const resendKey = Deno.env.get("RESEND_API_KEY");
  const fromEmail = Deno.env.get("RESEND_FROM_EMAIL");
  const appBaseUrl = Deno.env.get("APP_BASE_URL") ?? "https://inclu-pilot-three.vercel.app";

  if (!resendKey || !fromEmail) {
    return { ok: false, error: "Email provider not configured" };
  }

  const { data: prefs } = await supabase
    .from("notification_preferences")
    .select("email")
    .eq("user_id", row.user_id)
    .maybeSingle();

  if (prefs && prefs.email === false) {
    return { ok: false, error: "Email notifications disabled" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, full_name")
    .eq("id", row.user_id)
    .maybeSingle();

  if (!profile?.email) {
    return { ok: false, error: "Recipient email not found" };
  }

  const link = `${appBaseUrl.replace(/\/$/, "")}${row.url.startsWith("/") ? row.url : `/${row.url}`}`;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${resendKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [profile.email],
      subject: row.title,
      html: `<p>${row.body}</p><p><a href="${link}">Open chat</a></p>`,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    return { ok: false, error: text || `Resend error ${response.status}` };
  }

  return { ok: true };
}

async function deliverOutboxRow(
  supabase: ReturnType<typeof createClient>,
  row: OutboxRow,
) {
  const results: Array<{ id: string; status: string; error?: string }> = [];

  const { data: subs, error: subsError } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", row.user_id);

  if (subsError) {
    await supabase
      .from("notifications_outbox")
      .update({
        status: "failed",
        attempts: row.attempts + 1,
        last_error: subsError.message,
      })
      .eq("id", row.id);
    results.push({ id: row.id, status: "failed", error: subsError.message });
    return results;
  }

  const subscriptionRows = (subs ?? []) as SubscriptionRow[];
  if (subscriptionRows.length === 0) {
    const email = await tryEmailFallback(supabase, row);
    if (email.ok) {
      await supabase
        .from("notifications_outbox")
        .update({
          status: "sent",
          attempts: row.attempts + 1,
          sent_at: new Date().toISOString(),
          last_error: null,
        })
        .eq("id", row.id);
      results.push({ id: row.id, status: "sent" });
      return results;
    }

    await supabase
      .from("notifications_outbox")
      .update({
        status: "needs_email",
        attempts: row.attempts + 1,
        last_error: email.error ?? "No push subscription",
      })
      .eq("id", row.id);
    results.push({ id: row.id, status: "needs_email", error: email.error });
    return results;
  }

  const pushPayload = JSON.stringify({
    title: row.title,
    body: row.body,
    url: row.url,
    data: row.data ?? {},
  });

  let delivered = 0;
  let lastErr: string | null = null;

  for (const sub of subscriptionRows) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        pushPayload,
      );
      delivered += 1;
    } catch (err) {
      lastErr = err instanceof Error ? err.message : String(err);
    }
  }

  if (delivered > 0) {
    await supabase
      .from("notifications_outbox")
      .update({
        status: "sent",
        attempts: row.attempts + 1,
        last_error: lastErr,
        sent_at: new Date().toISOString(),
      })
      .eq("id", row.id);
    results.push({ id: row.id, status: "sent" });
  } else {
    const email = await tryEmailFallback(supabase, row);
    if (email.ok) {
      await supabase
        .from("notifications_outbox")
        .update({
          status: "sent",
          attempts: row.attempts + 1,
          last_error: lastErr,
          sent_at: new Date().toISOString(),
        })
        .eq("id", row.id);
      results.push({ id: row.id, status: "sent" });
    } else {
      await supabase
        .from("notifications_outbox")
        .update({
          status: "failed",
          attempts: row.attempts + 1,
          last_error: lastErr ?? email.error ?? "Unknown push error",
        })
        .eq("id", row.id);
      results.push({
        id: row.id,
        status: "failed",
        error: lastErr ?? email.error ?? "Unknown push error",
      });
    }
  }

  return results;
}

serve(async (req) => {
  if (req.method !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
  const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
  const vapidSubject = Deno.env.get("VAPID_SUBJECT");

  if (!supabaseUrl || !serviceRoleKey) {
    return json(500, { error: "Supabase env missing" });
  }
  if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
    return json(500, { error: "VAPID env missing" });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const payload = (await req.json().catch(() => null)) as
    | { outboxIds?: string[] }
    | MessageTriggerPayload
    | null;
  const outboxIds = (payload as { outboxIds?: string[] } | null)?.outboxIds
    ?.filter(Boolean) ?? [];

  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

  if (outboxIds.length === 0) {
    const trigger = payload as MessageTriggerPayload | null;
    if (!trigger?.conversationId || !trigger?.message?.id) {
      return json(400, { error: "Missing outboxIds or message trigger payload" });
    }

    const { data: conv, error: convError } = await supabase
      .from("conversations")
      .select("project_id, type")
      .eq("id", trigger.conversationId)
      .single();

    if (convError || !conv) {
      return json(500, { error: convError?.message ?? "Conversation not found" });
    }

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, client_id, manager_id, name")
      .eq("id", conv.project_id)
      .single();

    if (projectError || !project) {
      return json(500, { error: projectError?.message ?? "Project not found" });
    }

    const { data: senderProfile } = await supabase
      .from("profiles")
      .select("full_name, role")
      .eq("id", trigger.message.senderId)
      .maybeSingle();

    const senderName = senderProfile?.full_name ?? "Someone";

    const recipients = new Set<string>();
    if (conv.type === "client_manager") {
      recipients.add(project.client_id);
      recipients.add(project.manager_id);
    } else {
      recipients.add(project.manager_id);
      const { data: members } = await supabase
        .from("project_team_members")
        .select("user_id")
        .eq("project_id", project.id);
      for (const m of members ?? []) {
        recipients.add(m.user_id);
      }
    }

    recipients.delete(trigger.message.senderId);

    const outboxRows = [...recipients].map((userId) => {
      const url =
        conv.type === "client_manager"
          ? userId === project.client_id
            ? "/client/chat"
            : `/manager/chat/${project.id}`
          : userId === project.manager_id
            ? "/manager"
            : "/team/chat";

      return {
        user_id: userId,
        title: `Message from ${senderName}`,
        body: trigger.message.body || "Sent an attachment",
        url,
        data: {
          conversationId: trigger.conversationId,
          messageId: trigger.message.id,
          projectId: project.id,
          projectName: project.name,
        },
        status: "pending",
      };
    });

    const { data: inserted, error: insertError } = await supabase
      .from("notifications_outbox")
      .insert(outboxRows)
      .select("id, user_id, title, body, url, data, status, attempts");

    if (insertError) {
      return json(500, { error: insertError.message });
    }

    const deliverResults: Array<{ id: string; status: string; error?: string }> = [];
    const rows = (inserted ?? []) as OutboxRow[];
    const nested = await Promise.all(rows.map((row) => deliverOutboxRow(supabase, row)));
    for (const r of nested) {
      deliverResults.push(...r);
    }

    return json(200, { success: true, results: deliverResults });
  }

  const { data: outbox, error: outboxError } = await supabase
    .from("notifications_outbox")
    .select("id, user_id, title, body, url, data, status, attempts")
    .in("id", outboxIds);

  if (outboxError) {
    return json(500, { error: outboxError.message });
  }

  const results: Array<{ id: string; status: string; error?: string }> = [];

  for (const row of (outbox ?? []) as OutboxRow[]) {
    if (row.status === "needs_email") {
      const email = await tryEmailFallback(supabase, row);
      if (email.ok) {
        await supabase
          .from("notifications_outbox")
          .update({
            status: "sent",
            attempts: row.attempts + 1,
            sent_at: new Date().toISOString(),
          })
          .eq("id", row.id);
        results.push({ id: row.id, status: "sent" });
      } else {
        results.push({ id: row.id, status: "needs_email", error: email.error });
      }
      continue;
    }
    if (row.status !== "pending") {
      results.push({ id: row.id, status: row.status });
      continue;
    }
    const r = await deliverOutboxRow(supabase, row);
    results.push(...r);
  }

  return json(200, { success: true, results });
});

