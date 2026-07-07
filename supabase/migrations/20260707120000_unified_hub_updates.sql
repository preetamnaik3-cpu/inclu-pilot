-- Phase A: unified hub_updates stream (single source of truth for activity events)

create type public.hub_update_type as enum (
  'team_quick_update',
  'manager_update',
  'status_change',
  'file_upload',
  'client_note',
  'manager_reply',
  'feed_highlight'
);

create type public.hub_update_visibility as enum ('internal', 'manager', 'client');

create table public.hub_updates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  activity_id uuid references public.work_items (id) on delete set null,
  author_id uuid references public.profiles (id) on delete set null,
  author_role public.user_role not null,
  type public.hub_update_type not null,
  body text not null,
  visibility public.hub_update_visibility not null default 'manager',
  published_at timestamptz,
  feed_title text,
  feed_subtitle text,
  icon text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_hub_updates_project on public.hub_updates (project_id, created_at desc);
create index idx_hub_updates_activity on public.hub_updates (activity_id, created_at desc);
create index idx_hub_updates_visibility on public.hub_updates (project_id, visibility);

alter table public.hub_updates enable row level security;

-- Clients: client-visible updates on their project
create policy "Clients read published hub updates"
  on public.hub_updates for select
  using (
    visibility = 'client'
    and exists (
      select 1 from public.projects p
      where p.id = hub_updates.project_id
        and p.client_id = auth.uid()
    )
  );

-- Managers: all updates on managed projects
create policy "Managers read hub updates"
  on public.hub_updates for select
  using (
    exists (
      select 1 from public.projects p
      where p.id = hub_updates.project_id
        and p.manager_id = auth.uid()
    )
  );

-- Team: manager-visible updates on assigned activities
create policy "Team read hub updates on assigned work"
  on public.hub_updates for select
  using (
    exists (
      select 1
      from public.work_item_assignments wia
      join public.work_items wi on wi.id = wia.work_item_id
      where wi.id = hub_updates.activity_id
        and wia.user_id = auth.uid()
    )
    or (
      author_id = auth.uid()
    )
  );

create policy "Managers insert hub updates"
  on public.hub_updates for insert
  with check (
    exists (
      select 1 from public.projects p
      where p.id = hub_updates.project_id
        and p.manager_id = auth.uid()
    )
  );

create policy "Clients insert client notes"
  on public.hub_updates for insert
  with check (
    type = 'client_note'
    and author_id = auth.uid()
    and exists (
      select 1 from public.projects p
      where p.id = hub_updates.project_id
        and p.client_id = auth.uid()
    )
  );

create policy "Team insert quick updates"
  on public.hub_updates for insert
  with check (
    type = 'team_quick_update'
    and author_id = auth.uid()
    and exists (
      select 1
      from public.work_item_assignments wia
      join public.work_items wi on wi.id = wia.work_item_id
      where wi.id = hub_updates.activity_id
        and wia.user_id = auth.uid()
    )
  );

create policy "Managers update hub updates"
  on public.hub_updates for update
  using (
    exists (
      select 1 from public.projects p
      where p.id = hub_updates.project_id
        and p.manager_id = auth.uid()
    )
  );

alter publication supabase_realtime add table public.hub_updates;

-- Backfill from legacy activity_updates where possible
insert into public.hub_updates (
  project_id,
  activity_id,
  author_role,
  type,
  body,
  visibility,
  published_at,
  feed_title,
  feed_subtitle,
  icon,
  created_at
)
select
  au.project_id,
  au.work_item_id,
  'manager'::public.user_role,
  case
    when au.visible_to_client then 'feed_highlight'::public.hub_update_type
    else 'manager_update'::public.hub_update_type
  end,
  coalesce(au.subtitle, au.title),
  case
    when au.visible_to_client then 'client'::public.hub_update_visibility
    else 'manager'::public.hub_update_visibility
  end,
  case when au.visible_to_client then au.created_at else null end,
  au.title,
  au.subtitle,
  au.icon,
  au.created_at
from public.activity_updates au;

insert into public.hub_updates (
  project_id,
  activity_id,
  author_id,
  author_role,
  type,
  body,
  visibility,
  published_at,
  created_at
)
select
  wi.project_id,
  c.work_item_id,
  c.author_id,
  case when c.is_manager_reply then 'manager' else 'client' end::public.user_role,
  case
    when c.is_manager_reply then 'manager_reply'::public.hub_update_type
    else 'client_note'::public.hub_update_type
  end,
  c.body,
  case
    when c.is_manager_reply then 'client'::public.hub_update_visibility
    else 'manager'::public.hub_update_visibility
  end,
  case when c.is_manager_reply then c.created_at else null end,
  c.created_at
from public.work_item_comments c
join public.work_items wi on wi.id = c.work_item_id;
