# IncluPilot

A multi-portal client project hub for agencies, powered by [IncluHub](https://github.com/preetamnaik3-cpu/inclu-pilot).

IncluPilot connects clients, project managers, and delivery teams in one workspace. Managers control what clients see; clients track activities, share feedback, and communicate through a dedicated channel.

## Features

- **Client portal** — project home, activities, manager chat, notifications
- **Manager portal** — multi-client overview, activity management, publish workflow, file vault
- **Team portal** — assigned tasks, quick updates, internal manager chat
- **Unified activity stream** — `hub_updates` as the single source of truth for updates, notes, and feed items
- **Role-based access** — authentication and routing driven by `profiles.role` with Row Level Security
- **Realtime messaging** — client–manager and internal team conversations with file attachments

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS 4 |
| Backend | Supabase (Auth, Postgres, Storage, Realtime) |
| Deployment | Vercel (recommended) |

## Prerequisites

- Node.js 20+
- npm
- A [Supabase](https://supabase.com) project

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/preetamnaik3-cpu/inclu-pilot.git
cd inclu-pilot
npm install
```

### 2. Environment variables

```bash
cp .env.example .env.local
```

Set the following in `.env.local` (values from Supabase → **Project Settings → API**):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

> `.env.local` is gitignored. Never commit credentials to version control.

### 3. Database setup

**Fresh database (recommended):** run `supabase/schema/canonical.sql` in the Supabase SQL Editor.

**Incremental migrations:** apply files in `supabase/migrations/` in chronological order through `20260709120000_normalize_demo_emails.sql`.

Key later migrations:

- `20260708145000` — `unassigned` role
- `20260708150000` — team assignment RPCs + `project_team_members`
- `20260708170000` — manager delete project
- `20260709100000` — fix SQL-seeded email/password auth (GoTrue token fields)
- `20260709110000` — fix `get_unassigned_users` ambiguous `id`
- `20260709120000` — normalize demo emails to `demo001@inclupilot.test`

Demo users (optional): run `supabase/seed-100-demo-users.sql` in the Supabase SQL editor. Default password: `Demo1234!`.

### 4. Enable Realtime

In Supabase → **Database → Publications**, ensure `messages` and `hub_updates` are enabled on the `supabase_realtime` publication.

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with a provisioned account.

Production build:

```bash
npm run build
npm start
```

## Authentication & Roles

Users are created in Supabase Auth. A profile row is created automatically on signup; assign roles via the `profiles` table:

| Role | Portal route | Description |
|------|--------------|-------------|
| `unassigned` | `/waiting` | Signed in but not yet assigned to a project |
| `client` | `/client` | Project visibility, activities, manager chat |
| `manager` | `/manager` | Client portfolio, activities, publish controls |
| `team` | `/team/work` | Assigned work items, internal updates |
| `admin` | `/manager` | Full manager access |

Managers assign clients and team from registered users on `/manager`. New signups land on `/waiting` until assigned.

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │     │   Manager   │     │    Team     │
│   Portal    │     │   Portal    │     │   Portal    │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
                    Next.js App Router
                           │
              ┌────────────┴────────────┐
              │       Supabase          │
              │  Auth · Postgres · RLS  │
              │  Storage · Realtime     │
              └─────────────────────────┘
```

### Data model

| UI concept | Database table |
|------------|----------------|
| Activities | `work_items` |
| Updates & notes | `hub_updates` |
| Chat | `conversations`, `messages` |
| Files | `activity-files` storage bucket + `hub_updates` (`file_upload`) |
| Read state | `notification_reads`, `conversation_reads` |

Team updates are written with `visibility = manager` until a manager publishes them to the client.

## Project Structure

```
src/
├── app/
│   ├── client/          # Client portal routes
│   ├── manager/         # Manager portal routes
│   └── team/            # Team portal routes
├── components/          # UI components
├── lib/
│   ├── actions/         # Server actions
│   ├── auth/            # Role routing helpers
│   ├── updates/         # Hub update queries & selectors
│   └── supabase/        # Supabase clients
└── middleware.ts        # Session & role guards
supabase/
├── migrations/          # Schema migrations
├── schema/              # Canonical schema (fresh installs)
└── seed*.sql            # Reference seed scripts
```

## Deployment

### Vercel

1. Import the repository from GitHub
2. Add environment variables in **Project Settings → Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Apply all migrations in `supabase/migrations/` to your Supabase project (SQL editor or CLI)
4. In Supabase → **Authentication → URL configuration**, add your Vercel preview/production URLs to **Redirect URLs**
5. Enable Google OAuth in Supabase if using Google sign-in
6. Deploy

The Supabase database is hosted separately and is not tied to the frontend deployment lifecycle.

### Post-deploy smoke check

```bash
node scripts/audit-smoke-perf.mjs
```

Requires `.env.local` with Supabase keys. Starts the dev server separately if you want local page timing (`npm run dev`).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm start` | Run production server |
| `npm run lint` | Run ESLint |

## License

Private — All rights reserved.
