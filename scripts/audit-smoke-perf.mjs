/**
 * Option 1 + 3 audit script — smoke flows + API timing
 * Run: node scripts/audit-smoke-perf.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnv() {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return process.env;
  }
  const envPath = resolve(root, ".env.local");
  const text = readFileSync(envPath, "utf8").replace(/^\uFEFF/, "");
  const env = {};
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) env[m[1].trim()] = m[2].trim();
  }
  return env;
}

const env = loadEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const baseUrl = process.env.APP_URL || "http://localhost:3000";

const MANAGER_EMAIL = "asrkrao191@gmail.com";
const MANAGER_PASSWORD = "Demo1234!";
const CLIENT_EMAIL = "demo003@inclupilot.test";
const TEAM_EMAIL = "demo004@inclupilot.test";
const UNASSIGNED_EMAIL = "demo005@inclupilot.test";
const PASSWORD = "Demo1234!";

const results = { smoke: [], perf: [], errors: [] };

function logSmoke(id, name, pass, detail = "") {
  results.smoke.push({ id, name, pass, detail });
  const icon = pass ? "PASS" : "FAIL";
  console.log(`[${icon}] ${id}: ${name}${detail ? ` — ${detail}` : ""}`);
}

function logPerf(name, ms, note = "") {
  results.perf.push({ name, ms, note });
  console.log(`[PERF] ${name}: ${ms}ms${note ? ` (${note})` : ""}`);
}

async function timed(name, fn) {
  const t0 = performance.now();
  const result = await fn();
  logPerf(name, Math.round(performance.now() - t0));
  return result;
}

async function signIn(email, password) {
  const supabase = createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw new Error(`${email}: ${error.message}`);
  return { supabase, user: data.user, session: data.session };
}

async function measurePage(path, label) {
  const t0 = performance.now();
  try {
    const res = await fetch(`${baseUrl}${path}`, { redirect: "manual" });
    const ms = Math.round(performance.now() - t0);
    logPerf(label, ms, `HTTP ${res.status}`);
    return { ms, status: res.status };
  } catch (e) {
    logPerf(label, Math.round(performance.now() - t0), `error: ${e.message}`);
    return { ms: -1, status: 0 };
  }
}

async function cleanupTestProject(supabase) {
  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, client_id")
    .ilike("name", "Audit Test%");

  for (const p of projects ?? []) {
    await supabase.rpc("manager_delete_project", { p_project_id: p.id });
  }
}

async function projectIdForClient(supabase, clientId) {
  const { data } = await supabase
    .from("projects")
    .select("id")
    .eq("client_id", clientId)
    .maybeSingle();
  return data?.id ?? null;
}

async function main() {
  console.log("\n=== IncluPilot Audit: Option 1 (Smoke) + Option 3 (Perf) ===\n");
  console.log(`App: ${baseUrl}`);
  console.log(`Supabase: ${url}\n`);

  // --- Option 3: unauthenticated page timing ---
  console.log("--- Performance: public routes (no auth) ---");
  await measurePage("/", "GET / (login)");
  await measurePage("/waiting", "GET /waiting (redirect expected)");
  await measurePage("/manager", "GET /manager (redirect expected)");

  // --- Manager sign-in first (needed for cleanup + assignment) ---
  let managerSession;
  try {
    managerSession = await timed("Auth sign-in (manager)", () =>
      signIn(MANAGER_EMAIL, MANAGER_PASSWORD),
    );
    await managerSession.supabase.rpc("promote_to_platform_manager");
    const { data: mp } = await managerSession.supabase
      .from("profiles")
      .select("role")
      .eq("id", managerSession.user.id)
      .single();
    logSmoke(
      "M",
      "Manager sign-in + role",
      mp?.role === "manager",
      `role=${mp?.role}`,
    );
  } catch (e) {
    logSmoke("M", "Manager sign-in", false, e.message);
    results.errors.push(String(e));
    console.log("\nCannot continue assignment tests without manager.\n");
    printSummary();
    return;
  }

  await cleanupTestProject(managerSession.supabase);

  // --- Smoke 1: unassigned user sign-in ---
  try {
    const unassignedSession = await timed("Auth sign-in (unassigned)", () =>
      signIn(UNASSIGNED_EMAIL, PASSWORD),
    );
    const { data: profile } = await unassignedSession.supabase
      .from("profiles")
      .select("role")
      .eq("id", unassignedSession.user.id)
      .single();
    logSmoke(
      "1",
      "Unassigned user has role unassigned",
      profile?.role === "unassigned",
      `role=${profile?.role}`,
    );

    const { data: project } = await unassignedSession.supabase
      .from("projects")
      .select("id")
      .eq("client_id", unassignedSession.user.id)
      .maybeSingle();
    logSmoke("1b", "Unassigned user has no project", !project);
  } catch (e) {
    logSmoke("1", "Unassigned user sign-in", false, e.message);
    results.errors.push(String(e));
  }

  // --- Perf: unassigned users RPC ---
  try {
    const users = await timed("RPC get_unassigned_users", async () => {
      const r = await managerSession.supabase.rpc("get_unassigned_users");
      if (r.error) throw r.error;
      return r.data;
    });
    logSmoke(
      "8",
      "Demo users in dropdown source",
      (users?.length ?? 0) >= 90,
      `count=${users?.length ?? 0}`,
    );
  } catch (e) {
    logSmoke("8", "get_unassigned_users", false, e.message);
  }

  // --- Smoke 2: assign client ---
  let clientSession;
  let projectId;
  try {
    clientSession = await signIn(CLIENT_EMAIL, PASSWORD);
    const clientId = clientSession.user.id;

    projectId = await timed("RPC manager_assign_client", async () => {
      const r = await managerSession.supabase.rpc("manager_assign_client", {
        p_user_id: clientId,
        p_project_name: "Audit Test Project",
      });
      if (r.error) throw r.error;
      return r.data;
    });

    if (!projectId) {
      projectId = await projectIdForClient(managerSession.supabase, clientId);
    }

    const { data: cp } = await clientSession.supabase
      .from("profiles")
      .select("role")
      .eq("id", clientId)
      .single();
    logSmoke(
      "2",
      "Manager assigns client → role client",
      cp?.role === "client",
      `projectId=${projectId}`,
    );

    const { data: unassignedAfter } = await managerSession.supabase.rpc(
      "get_unassigned_users",
    );
    const stillInList = (unassignedAfter ?? []).some((u) => u.id === clientId);
    logSmoke(
      "2b",
      "Assigned client removed from unassigned list",
      !stillInList,
    );

    const { data: clientProject } = await clientSession.supabase
      .from("projects")
      .select("id")
      .eq("client_id", clientId)
      .maybeSingle();
    logSmoke(
      "3",
      "Client can read own project (portal route)",
      Boolean(clientProject?.id),
    );
  } catch (e) {
    logSmoke("2", "Manager assigns client", false, e.message);
  }

  // --- Smoke 4: assign team ---
  let teamSession;
  try {
    if (!projectId) throw new Error("No project id for team assignment");
    teamSession = await signIn(TEAM_EMAIL, PASSWORD);
    const teamId = teamSession.user.id;

    await timed("RPC manager_assign_team_member", async () => {
      const r = await managerSession.supabase.rpc("manager_assign_team_member", {
        p_user_id: teamId,
        p_project_id: projectId,
      });
      if (r.error) throw r.error;
    });

    const { data: tp } = await teamSession.supabase
      .from("profiles")
      .select("role")
      .eq("id", teamId)
      .single();
    logSmoke("4", "Manager assigns team → role team", tp?.role === "team");

    const { data: membership } = await teamSession.supabase
      .from("project_team_members")
      .select("project_id")
      .eq("user_id", teamId)
      .maybeSingle();
    logSmoke(
      "4b",
      "Team member on project_team_members",
      membership?.project_id === projectId,
    );
    logSmoke(
      "4c",
      "Team can read project membership (portal route)",
      Boolean(membership?.project_id),
    );
  } catch (e) {
    logSmoke("4", "Manager assigns team", false, e.message);
  }

  // --- Smoke 5: remove team ---
  try {
    const teamId = teamSession?.user?.id;
    if (!teamId || !projectId) throw new Error("Missing team/project");

    await managerSession.supabase.rpc("manager_remove_team_member", {
      p_user_id: teamId,
      p_project_id: projectId,
    });

    const { data: tp } = await teamSession.supabase
      .from("profiles")
      .select("role")
      .eq("id", teamId)
      .single();
    logSmoke(
      "5",
      "Remove team → back to unassigned",
      tp?.role === "unassigned",
      `role=${tp?.role}`,
    );
  } catch (e) {
    logSmoke("5", "Manager removes team", false, e.message);
  }

  // --- Smoke 6: delete project ---
  try {
    if (!projectId) throw new Error("No project");
    const clientId = clientSession.user.id;

    await timed("RPC manager_delete_project", async () => {
      const r = await managerSession.supabase.rpc("manager_delete_project", {
        p_project_id: projectId,
      });
      if (r.error) throw r.error;
    });

    const { data: cp } = await clientSession.supabase
      .from("profiles")
      .select("role")
      .eq("id", clientId)
      .single();
    const { data: proj } = await clientSession.supabase
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .maybeSingle();

    logSmoke(
      "6",
      "Delete project releases client",
      cp?.role === "unassigned" && !proj,
    );
  } catch (e) {
    logSmoke("6", "Manager deletes project", false, e.message);
  }

  // --- Smoke 7: cross-role RLS spot checks ---
  try {
    if (!clientSession) throw new Error("No client session");
    const { data: otherProjects, error } = await clientSession.supabase
      .from("projects")
      .select("id")
      .neq("client_id", clientSession.user.id);
    logSmoke(
      "7",
      "Client cannot read other projects (RLS)",
      !error && (otherProjects?.length ?? 0) === 0,
      `rows=${otherProjects?.length ?? 0}`,
    );
  } catch (e) {
    logSmoke("7", "Client RLS isolation", false, e.message);
  }

  // --- Perf: simulate manager page query fan-out ---
  try {
    await timed("Manager page: projects query", async () => {
      const r = await managerSession.supabase
        .from("projects")
        .select("id, name, client_id, created_at")
        .eq("manager_id", managerSession.user.id);
      if (r.error) throw r.error;
      return r.data;
    });

    const { data: projects } = await managerSession.supabase
      .from("projects")
      .select("id")
      .eq("manager_id", managerSession.user.id);

    const n = projects?.length ?? 0;
    if (n > 0) {
      await timed(`Manager page: team roster RPC x${n} projects`, async () => {
        await Promise.all(
          (projects ?? []).map((p) =>
            managerSession.supabase.rpc("get_manager_project_team", {
              p_project_id: p.id,
            }),
          ),
        );
      });
    } else {
      logPerf("Manager page: team roster RPC x0", 0, "no projects");
    }
  } catch (e) {
    results.errors.push(`Perf fan-out: ${e.message}`);
  }

  // --- Terminal log analysis from dev server ---
  console.log("\n--- Dev server logs (recent /manager) ---");
  console.log(
    "From terminal: GET /manager typically 1.0–3.4s total; middleware (proxy.ts) 680–1350ms",
  );

  printSummary();
}

function printSummary() {
  const passed = results.smoke.filter((r) => r.pass).length;
  const total = results.smoke.length;
  console.log("\n=== SUMMARY ===");
  console.log(`Smoke: ${passed}/${total} passed`);
  if (results.errors.length) {
    console.log("Errors:", results.errors.join("; "));
  }
  const slow = results.perf.filter((p) => p.ms > 2000);
  if (slow.length) {
    console.log(`Slow operations (>2s): ${slow.map((s) => `${s.name} ${s.ms}ms`).join(", ")}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
