# IncluPilot

Internal client project hub — **powered by IncluHub**.

Clients see project progress, comment on work items, and chat with their manager only. Managers assign flexible work, relay feedback, and control what clients see.

## Quick start (demo mode)

No Supabase needed — runs with fake data:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and pick a role.

## Production setup (Supabase)

### 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a project
2. Copy your **Project URL** and **anon key** from Settings → API

### 2. Configure environment

```bash
cp .env.example .env.local
```

Fill in:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Run database migrations

**Option A — one-shot (fresh project):** paste and run `supabase/schema/canonical.sql` in Supabase Dashboard → SQL Editor.

**Option B — incremental (Supabase CLI or manual):** run these in order:

1. `supabase/migrations/20260707000000_initial_schema.sql`
2. `supabase/migrations/20260707100100_chat_attachments.sql`
3. `supabase/migrations/20260707120000_unified_hub_updates.sql`
4. `supabase/migrations/20260707150000_fix_internal_team_enum.sql` (only if you ran an older copy of step 1 with `internal` instead of `internal_team`)

> Legacy duplicate `20260324120000_initial_schema.sql` is archived under `supabase/migrations/_archive/` — do not run it on new projects.

### 4. Create demo users

In Supabase Dashboard → Authentication → Users, create:

| Email | Password | Role (set in profiles after signup) |
|-------|----------|-------------------------------------|
| rahul@demo.com | demo123456 | client |
| priya@demo.com | demo123456 | manager |
| alex@demo.com | demo123456 | team |

After each user signs up, update their profile in SQL Editor:

```sql
update public.profiles set role = 'manager', full_name = 'Priya Sharma', designation = 'Project Manager' where email = 'priya@demo.com';
update public.profiles set role = 'client', full_name = 'Rahul Mehta', designation = 'Client' where email = 'rahul@demo.com';
update public.profiles set role = 'team', full_name = 'Alex Kumar', designation = 'Web Designer' where email = 'alex@demo.com';
```

Then uncomment and run seed data from `supabase/seed.sql` (replace `:client_id`, `:manager_id`, `:team_id` with real profile UUIDs).

### 5. Enable Realtime

In Supabase Dashboard → Database → Replication, ensure `messages` and `hub_updates` are enabled for realtime.

### 6. Sign in

Restart `npm run dev`. The login page shows email/password only (no role picker). After sign-in, middleware routes you by `profiles.role` and blocks cross-portal URLs.

### 7. P1 migration (multi-client, files, notifications)

Run `supabase/migrations/20260707190000_p1_multi_client_files_notifications.sql` in SQL Editor.

Optional: add 2 more client users and run `supabase/seed-multi-client.sql` for manager multi-client testing.

## Deploy to Vercel

1. Push to GitHub
2. Import project in [vercel.com](https://vercel.com)
3. Add the same env vars from `.env.local`
4. Deploy

## Roles

| Role | Route | Access |
|------|-------|--------|
| Client | `/client` | Client portal only |
| Manager | `/manager` | Manager portal only |
| Team | `/team/work` | Team portal only |
| Admin | `/manager` | All portals |

## Data model notes

- **Activities** in the UI map to `work_items` in the database.
- **Updates, notes, and feed items** use `hub_updates` as the single write path (legacy `activity_updates` and `work_item_comments` tables remain for backfill only).
- Manager is the publish gate: team quick updates stay `visibility = manager` until published to the client.

## Branding

- Product: **IncluPilot**
- Powered by: **IncluHub**
- Logo: `public/incluhub-logo.png`
