-- Manager can delete a project and release client + team back to unassigned

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
    and not exists (
      select 1 from public.projects pr where pr.client_id = p.id
    )
    and not exists (
      select 1 from public.project_team_members ptm where ptm.user_id = p.id
    )
  order by p.full_name, p.email;
end;
$$;

create or replace function public.manager_delete_project(p_project_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  proj public.projects%rowtype;
  team_user_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select * into proj from public.projects where id = p_project_id;

  if not found then
    raise exception 'Project not found';
  end if;

  if not exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('manager', 'admin')
  ) then
    raise exception 'Only managers can delete projects';
  end if;

  if proj.manager_id <> auth.uid() and not exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ) then
    raise exception 'Project not found or not yours';
  end if;

  perform set_config('app.allow_role_change', 'on', true);

  for team_user_id in
    select ptm.user_id
    from public.project_team_members ptm
    where ptm.project_id = p_project_id
  loop
    update public.profiles
    set role = 'unassigned'
    where id = team_user_id;
  end loop;

  update public.profiles
  set role = 'unassigned'
  where id = proj.client_id;

  perform set_config('app.allow_role_change', 'off', true);

  delete from public.projects where id = p_project_id;
end;
$$;

grant execute on function public.manager_delete_project(uuid) to authenticated;
