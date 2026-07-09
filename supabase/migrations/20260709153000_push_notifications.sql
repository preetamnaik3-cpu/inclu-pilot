-- Push notifications (PWA Web Push) + outbox for reliable delivery

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  user_agent text null,
  created_at timestamptz not null default now(),
  unique (user_id, endpoint)
);

alter table public.push_subscriptions enable row level security;

create policy "push_subscriptions_select_own"
on public.push_subscriptions
for select
to authenticated
using (user_id = auth.uid());

create policy "push_subscriptions_insert_own"
on public.push_subscriptions
for insert
to authenticated
with check (user_id = auth.uid());

create policy "push_subscriptions_delete_own"
on public.push_subscriptions
for delete
to authenticated
using (user_id = auth.uid());

create policy "push_subscriptions_update_own"
on public.push_subscriptions
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

do $$ begin
  create type public.notification_outbox_status as enum (
    'pending',
    'sent',
    'needs_email',
    'failed'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists public.notifications_outbox (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text not null,
  url text not null,
  data jsonb not null default '{}'::jsonb,
  status public.notification_outbox_status not null default 'pending',
  attempts integer not null default 0,
  last_error text null,
  created_at timestamptz not null default now(),
  sent_at timestamptz null
);

alter table public.notifications_outbox enable row level security;

-- Users can only see their own outbox rows (useful for debugging/preferences)
create policy "notifications_outbox_select_own"
on public.notifications_outbox
for select
to authenticated
using (user_id = auth.uid());

-- Only the service role should insert/update outbox rows directly.
-- (Edge Function uses the service role key and bypasses RLS.)
revoke insert, update, delete on public.notifications_outbox from authenticated, anon;

create table if not exists public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  in_app boolean not null default true,
  push boolean not null default true,
  email boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.notification_preferences enable row level security;

create policy "notification_preferences_select_own"
on public.notification_preferences
for select
to authenticated
using (user_id = auth.uid());

create policy "notification_preferences_upsert_own"
on public.notification_preferences
for insert
to authenticated
with check (user_id = auth.uid());

create policy "notification_preferences_update_own"
on public.notification_preferences
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

