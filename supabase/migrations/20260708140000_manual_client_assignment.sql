-- Manual manager-first client assignment

create table public.pending_client_assignments (
  email text primary key,
  manager_id uuid not null references public.profiles (id) on delete cascade,
  project_name text not null,
  created_at timestamptz not null default now()
);

alter table public.pending_client_assignments enable row level security;

create policy "Managers manage own pending client assignments"
  on public.pending_client_assignments for all
  using (manager_id = auth.uid())
  with check (manager_id = auth.uid());

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
    select 1 from public.profiles where id = p_client_id and role = 'client'
  ) then
    raise exception 'Invalid client profile';
  end if;

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
  p_email text,
  p_project_name text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_email text;
  client_profile public.profiles%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not exists (
    select 1 from public.profiles where id = auth.uid() and role in ('manager', 'admin')
  ) then
    raise exception 'Only managers can assign clients';
  end if;

  normalized_email := lower(trim(p_email));
  if normalized_email = '' then
    raise exception 'Client email is required';
  end if;

  select * into client_profile
  from public.profiles
  where lower(email) = normalized_email
  limit 1;

  if found then
    if client_profile.role in ('manager', 'team', 'admin') then
      raise exception 'That email belongs to a non-client account';
    end if;

    perform set_config('app.allow_role_change', 'on', true);
  update public.profiles set role = 'client' where id = client_profile.id;
  perform set_config('app.allow_role_change', 'off', true);

    perform public.create_client_project_for_pair(
      client_profile.id,
      auth.uid(),
      p_project_name
    );

    delete from public.pending_client_assignments
    where lower(email) = normalized_email;

    return 'linked';
  end if;

  insert into public.pending_client_assignments (email, manager_id, project_name)
  values (normalized_email, auth.uid(), trim(p_project_name))
  on conflict (email) do update
    set manager_id = excluded.manager_id,
        project_name = excluded.project_name,
        created_at = now();

  return 'pending';
end;
$$;

create or replace function public.fulfill_pending_client_assignment()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  pending_row public.pending_client_assignments%rowtype;
  user_email text;
  new_project_id uuid;
begin
  if auth.uid() is null then
    return null;
  end if;

  if exists (select 1 from public.projects where client_id = auth.uid()) then
    return null;
  end if;

  select email into user_email from public.profiles where id = auth.uid();
  if user_email is null then
    return null;
  end if;

  select * into pending_row
  from public.pending_client_assignments
  where lower(email) = lower(user_email);

  if not found then
    return null;
  end if;

  perform set_config('app.allow_role_change', 'on', true);
  update public.profiles set role = 'client' where id = auth.uid();
  perform set_config('app.allow_role_change', 'off', true);

  new_project_id := public.create_client_project_for_pair(
    auth.uid(),
    pending_row.manager_id,
    pending_row.project_name
  );

  delete from public.pending_client_assignments
  where lower(email) = lower(user_email);

  return new_project_id;
end;
$$;

create or replace function public.get_my_pending_assignment()
returns table (
  project_name text,
  manager_name text,
  manager_email text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  user_email text;
begin
  if auth.uid() is null then
    return;
  end if;

  select email into user_email from public.profiles where id = auth.uid();

  return query
  select p.project_name, m.full_name, m.email
  from public.pending_client_assignments p
  join public.profiles m on m.id = p.manager_id
  where lower(p.email) = lower(user_email);
end;
$$;

grant execute on function public.manager_assign_client(text, text) to authenticated;
grant execute on function public.fulfill_pending_client_assignment() to authenticated;
grant execute on function public.get_my_pending_assignment() to authenticated;

-- Disable self-serve client onboarding (manager assigns first)
create or replace function public.complete_client_onboarding(project_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
begin
  raise exception 'Your manager must assign you before you can access the client portal';
end;
$$;
