-- Unassigned role, project-level team membership, manager assignment RPCs

alter type public.user_role add value if not exists 'unassigned';

-- Backfill: users without assignments become unassigned
update public.profiles p
set role = 'unassigned'
where p.role = 'client'
  and not exists (select 1 from public.projects pr where pr.client_id = p.id);

create table if not exists public.project_team_members (
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

alter table public.project_team_members enable row level security;

create policy "Managers manage project team members"
  on public.project_team_members for all
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_team_members.project_id
        and p.manager_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.projects p
      where p.id = project_team_members.project_id
        and p.manager_id = auth.uid()
    )
  );

create policy "Team members read own membership"
  on public.project_team_members for select
  using (user_id = auth.uid());

-- Backfill team membership from work item assignments
insert into public.project_team_members (project_id, user_id)
select distinct wi.project_id, wia.user_id
from public.work_item_assignments wia
join public.work_items wi on wi.id = wia.work_item_id
join public.profiles pr on pr.id = wia.user_id
where pr.role = 'team'
on conflict do nothing;

update public.profiles p
set role = 'unassigned'
where p.role = 'team'
  and not exists (
    select 1 from public.project_team_members ptm where ptm.user_id = p.id
  );

create or replace function public.is_project_member(project_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.projects p
    where p.id = project_uuid
      and (
        p.client_id = auth.uid()
        or p.manager_id = auth.uid()
        or exists (
          select 1
          from public.project_team_members ptm
          where ptm.project_id = project_uuid
            and ptm.user_id = auth.uid()
        )
        or exists (
          select 1
          from public.work_items wi
          join public.work_item_assignments wia on wia.work_item_id = wi.id
          where wi.project_id = project_uuid
            and wia.user_id = auth.uid()
        )
      )
  );
$$;

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
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'designation',
    coalesce((new.raw_app_meta_data ->> 'role')::public.user_role, 'unassigned')
  );
  return new;
end;
$$;

create or replace function public.create_client_project_for_pair(
  p_client_id uuid,
  p_manager_id uuid,
  p_project_name text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_project_id uuid;
  trimmed_name text;
begin
  trimmed_name := trim(p_project_name);
  if trimmed_name = '' then
    raise exception 'Project name is required';
  end if;

  if exists (select 1 from public.projects where client_id = p_client_id) then
    raise exception 'This client already has a project';
  end if;

  if not exists (
    select 1 from public.profiles where id = p_manager_id and role in ('manager', 'admin')
  ) then
    raise exception 'Invalid manager';
  end if;

  if not exists (
    select 1 from public.profiles
    where id = p_client_id
      and role in ('client', 'unassigned')
  ) then
    raise exception 'Invalid client profile';
  end if;

  perform set_config('app.allow_role_change', 'on', true);
  update public.profiles set role = 'client' where id = p_client_id;
  perform set_config('app.allow_role_change', 'off', true);

  insert into public.projects (name, client_id, manager_id)
  values (trimmed_name, p_client_id, p_manager_id)
  returning id into new_project_id;

  insert into public.conversations (project_id, type) values
    (new_project_id, 'client_manager'),
    (new_project_id, 'internal_team')
  on conflict (project_id, type) do nothing;

  return new_project_id;
end;
$$;

create or replace function public.manager_assign_client(
  p_user_id uuid,
  p_project_name text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_project_id uuid;
  target_profile public.profiles%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not exists (
    select 1 from public.profiles where id = auth.uid() and role in ('manager', 'admin')
  ) then
    raise exception 'Only managers can assign clients';
  end if;

  select * into target_profile from public.profiles where id = p_user_id;

  if not found then
    raise exception 'User not found';
  end if;

  if target_profile.role in ('manager', 'admin', 'team') then
    raise exception 'That user cannot be assigned as a client';
  end if;

  if exists (select 1 from public.projects where client_id = p_user_id) then
    raise exception 'This user already has a project';
  end if;

  new_project_id := public.create_client_project_for_pair(
    p_user_id,
    auth.uid(),
    p_project_name
  );

  delete from public.pending_client_assignments
  where lower(email) = lower(target_profile.email);

  return new_project_id;
end;
$$;

create or replace function public.manager_assign_team_member(
  p_user_id uuid,
  p_project_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_profile public.profiles%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not exists (
    select 1 from public.projects
    where id = p_project_id and manager_id = auth.uid()
  ) then
    raise exception 'Project not found or not yours';
  end if;

  select * into target_profile from public.profiles where id = p_user_id;

  if not found then
    raise exception 'User not found';
  end if;

  if target_profile.role in ('manager', 'admin') then
    raise exception 'Cannot assign a manager as team';
  end if;

  if exists (select 1 from public.projects where client_id = p_user_id) then
    raise exception 'This user is already a client on a project';
  end if;

  if exists (
    select 1 from public.project_team_members
    where user_id = p_user_id and project_id <> p_project_id
  ) then
    raise exception 'This user is already on another project. Remove them first.';
  end if;

  perform set_config('app.allow_role_change', 'on', true);
  update public.profiles set role = 'team' where id = p_user_id;
  perform set_config('app.allow_role_change', 'off', true);

  insert into public.project_team_members (project_id, user_id)
  values (p_project_id, p_user_id)
  on conflict do nothing;
end;
$$;

create or replace function public.manager_remove_team_member(
  p_user_id uuid,
  p_project_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not exists (
    select 1 from public.projects
    where id = p_project_id and manager_id = auth.uid()
  ) then
    raise exception 'Project not found or not yours';
  end if;

  delete from public.project_team_members
  where project_id = p_project_id and user_id = p_user_id;

  if not exists (
    select 1 from public.project_team_members where user_id = p_user_id
  ) then
    perform set_config('app.allow_role_change', 'on', true);
    update public.profiles set role = 'unassigned' where id = p_user_id;
    perform set_config('app.allow_role_change', 'off', true);
  end if;
end;
$$;

create or replace function public.manager_transfer_team_member(
  p_user_id uuid,
  p_from_project_id uuid,
  p_to_project_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.manager_remove_team_member(p_user_id, p_from_project_id);
  perform public.manager_assign_team_member(p_user_id, p_to_project_id);
end;
$$;

create or replace function public.get_unassigned_users()
returns table (
  id uuid,
  email text,
  full_name text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return;
  end if;

  if not exists (
    select 1 from public.profiles where id = auth.uid() and role in ('manager', 'admin')
  ) then
    raise exception 'Only managers can list unassigned users';
  end if;

  return query
  select p.id, p.email, p.full_name
  from public.profiles p
  where p.role = 'unassigned'
  order by p.full_name, p.email;
end;
$$;

create or replace function public.get_manager_project_team(p_project_id uuid)
returns table (
  user_id uuid,
  email text,
  full_name text,
  designation text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return;
  end if;

  if not exists (
    select 1 from public.projects
    where id = p_project_id and manager_id = auth.uid()
  ) then
    raise exception 'Project not found or not yours';
  end if;

  return query
  select p.id, p.email, p.full_name, p.designation
  from public.project_team_members ptm
  join public.profiles p on p.id = ptm.user_id
  where ptm.project_id = p_project_id
  order by p.full_name;
end;
$$;

grant execute on function public.manager_assign_client(uuid, text) to authenticated;
grant execute on function public.manager_assign_team_member(uuid, uuid) to authenticated;
grant execute on function public.manager_remove_team_member(uuid, uuid) to authenticated;
grant execute on function public.manager_transfer_team_member(uuid, uuid, uuid) to authenticated;
grant execute on function public.get_unassigned_users() to authenticated;
grant execute on function public.get_manager_project_team(uuid) to authenticated;
