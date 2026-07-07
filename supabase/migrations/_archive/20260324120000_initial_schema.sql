-- IncluPilot initial schema (powered by IncluHub)

create type user_role as enum ('client', 'manager', 'team', 'admin');
create type work_status as enum ('planned', 'in_progress', 'in_review', 'done');
create type project_status as enum ('active', 'paused', 'completed');
create type conversation_type as enum ('client_manager', 'internal_team');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null,
  designation text,
  role user_role not null default 'client',
  created_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  client_id uuid not null references public.profiles (id) on delete cascade,
  manager_id uuid not null references public.profiles (id) on delete cascade,
  status project_status not null default 'active',
  created_at timestamptz not null default now()
);

create table public.work_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  title text not null,
  description text,
  outcome_description text,
  status work_status not null default 'planned',
  preview_url text,
  due_label text,
  sort_order int not null default 0,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.work_item_assignments (
  work_item_id uuid not null references public.work_items (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  visible_to_client boolean not null default true,
  primary key (work_item_id, user_id)
);

create table public.work_item_comments (
  id uuid primary key default gen_random_uuid(),
  work_item_id uuid not null references public.work_items (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  is_manager_reply boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.activity_updates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  icon text default '📌',
  title text not null,
  subtitle text,
  visible_to_client boolean not null default true,
  work_item_id uuid references public.work_items (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  type conversation_type not null,
  created_at timestamptz not null default now(),
  unique (project_id, type)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index idx_projects_client on public.projects (client_id);
create index idx_projects_manager on public.projects (manager_id);
create index idx_work_items_project on public.work_items (project_id);
create index idx_comments_work_item on public.work_item_comments (work_item_id);
create index idx_messages_conversation on public.messages (conversation_id);

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.work_items enable row level security;
alter table public.work_item_assignments enable row level security;
alter table public.work_item_comments enable row level security;
alter table public.activity_updates enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

create or replace function public.get_my_role()
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_project_client(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.projects
    where id = p_project_id and client_id = auth.uid()
  );
$$;

create or replace function public.is_project_manager(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.projects
    where id = p_project_id and manager_id = auth.uid()
  );
$$;

create or replace function public.can_access_project(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_project_client(p_project_id)
    or public.is_project_manager(p_project_id)
    or exists (
      select 1
      from public.work_item_assignments wia
      join public.work_items wi on wi.id = wia.work_item_id
      where wi.project_id = p_project_id and wia.user_id = auth.uid()
    );
$$;

-- Profiles
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can read profiles on shared projects"
  on public.profiles for select
  using (
    exists (
      select 1 from public.projects p
      where (p.client_id = auth.uid() or p.manager_id = auth.uid())
        and (p.client_id = profiles.id or p.manager_id = profiles.id)
    )
    or exists (
      select 1
      from public.work_item_assignments wia
      join public.work_items wi on wi.id = wia.work_item_id
      join public.projects p on p.id = wi.project_id
      where wia.user_id = profiles.id
        and (p.client_id = auth.uid() or p.manager_id = auth.uid())
    )
  );

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Projects
create policy "Project members can read projects"
  on public.projects for select
  using (public.can_access_project(id));

create policy "Managers can manage their projects"
  on public.projects for all
  using (manager_id = auth.uid())
  with check (manager_id = auth.uid());

-- Work items
create policy "Project members can read work items"
  on public.work_items for select
  using (public.can_access_project(project_id));

create policy "Managers can manage work items"
  on public.work_items for all
  using (public.is_project_manager(project_id))
  with check (public.is_project_manager(project_id));

create policy "Team can update assigned work item status"
  on public.work_items for update
  using (
    exists (
      select 1 from public.work_item_assignments
      where work_item_id = work_items.id and user_id = auth.uid()
    )
  );

-- Assignments
create policy "Project members can read assignments"
  on public.work_item_assignments for select
  using (
    exists (
      select 1 from public.work_items wi
      where wi.id = work_item_assignments.work_item_id
        and public.can_access_project(wi.project_id)
    )
  );

create policy "Managers can manage assignments"
  on public.work_item_assignments for all
  using (
    exists (
      select 1 from public.work_items wi
      where wi.id = work_item_assignments.work_item_id
        and public.is_project_manager(wi.project_id)
    )
  )
  with check (
    exists (
      select 1 from public.work_items wi
      where wi.id = work_item_assignments.work_item_id
        and public.is_project_manager(wi.project_id)
    )
  );

-- Comments
create policy "Project members can read comments"
  on public.work_item_comments for select
  using (
    exists (
      select 1 from public.work_items wi
      where wi.id = work_item_comments.work_item_id
        and public.can_access_project(wi.project_id)
    )
    and (
      public.get_my_role() != 'client'
      or is_manager_reply = true
      or author_id = auth.uid()
    )
  );

create policy "Clients and managers can add comments"
  on public.work_item_comments for insert
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.work_items wi
      where wi.id = work_item_comments.work_item_id
        and public.can_access_project(wi.project_id)
    )
    and (
      (public.get_my_role() = 'client' and is_manager_reply = false)
      or (public.get_my_role() = 'manager')
    )
  );

-- Activity updates
create policy "Members read activity"
  on public.activity_updates for select
  using (
    public.can_access_project(project_id)
    and (visible_to_client = true or public.get_my_role() != 'client')
  );

create policy "Managers manage activity"
  on public.activity_updates for all
  using (public.is_project_manager(project_id))
  with check (public.is_project_manager(project_id));

-- Conversations
create policy "Members read conversations"
  on public.conversations for select
  using (
    public.can_access_project(project_id)
    and (
      (type = 'client_manager' and public.get_my_role() in ('client', 'manager'))
      or (type = 'internal_team' and public.get_my_role() in ('manager', 'team'))
    )
  );

create policy "Managers create conversations"
  on public.conversations for insert
  with check (public.is_project_manager(project_id));

-- Messages
create policy "Members read messages"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and public.can_access_project(c.project_id)
        and (
          (c.type = 'client_manager' and public.get_my_role() in ('client', 'manager'))
          or (c.type = 'internal_team' and public.get_my_role() in ('manager', 'team'))
        )
    )
  );

create policy "Members send messages"
  on public.messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and public.can_access_project(c.project_id)
        and (
          (c.type = 'client_manager' and public.get_my_role() in ('client', 'manager'))
          or (c.type = 'internal_team' and public.get_my_role() in ('manager', 'team'))
        )
    )
  );

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, designation, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'designation',
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'client')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Realtime
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.work_item_comments;
