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

**Incremental migrations:** apply files in `supabase/migrations/` in chronological order:

1. `20260707000000_initial_schema.sql`
2. `20260707100100_chat_attachments.sql`
3. `20260707120000_unified_hub_updates.sql`
4. `20260707150000_fix_internal_team_enum.sql`
5. `20260707190000_p1_multi_client_files_notifications.sql`

Initial data can be loaded via `supabase/seed.sql` and `supabase/seed-multi-client.sql` after users are provisioned in Supabase Auth.

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
| `client` | `/client` | Project visibility, activities, manager chat |
| `manager` | `/manager` | Client portfolio, activities, publish controls |
| `team` | `/team/work` | Assigned work items, internal updates |
| `admin` | `/manager` | Full manager access |

Middleware enforces portal isolation based on `profiles.role`.

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
2. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in **Project Settings → Environment Variables**
3. Deploy

The Supabase database is hosted separately and is not tied to the frontend deployment lifecycle.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm start` | Run production server |
| `npm run lint` | Run ESLint |

## License

Private — All rights reserved.
