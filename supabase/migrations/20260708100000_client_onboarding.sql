-- Google OAuth client onboarding: platform manager + secure project linking

create table public.platform_config (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

alter table public.platform_config enable row level security;

create policy "Authenticated users can read platform config"
  on public.platform_config for select
  to authenticated
  using (true);

-- Prevent clients from promoting themselves by editing profiles.role
create or replace function public.profiles_prevent_role_change()
returns trigger
language plpgsql
as $$
begin
  if current_setting('app.allow_role_change', true) = 'on' then
    return new;
  end if;

  if old.role is distinct from new.role then
    raise exception 'Role cannot be changed directly';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_prevent_role_change on public.profiles;
create trigger profiles_prevent_role_change
  before update on public.profiles
  for each row
  execute function public.profiles_prevent_role_change();

-- Whitelisted manager emails (comma-separated). Update with your Google email(s).
insert into public.platform_config (key, value)
values ('allowed_manager_emails', 'contact@incluhub.in,priya@demo.com')
on conflict (key) do nothing;

create or replace function public.promote_to_platform_manager()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  user_email text;
  allowed text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select email into user_email from public.profiles where id = auth.uid();
  select value into allowed from public.platform_config where key = 'allowed_manager_emails';

  if user_email is null or allowed is null then
    raise exception 'Manager onboarding is not configured';
  end if;

  if not exists (
    select 1
    from unnest(string_to_array(allowed, ',')) as e(email)
    where lower(trim(e.email)) = lower(trim(user_email))
  ) then
    raise exception 'Not an authorized manager';
  end if;

  perform set_config('app.allow_role_change', 'on', true);

  update public.profiles
  set
    role = 'manager',
    designation = coalesce(designation, 'Project Manager')
  where id = auth.uid();

  perform set_config('app.allow_role_change', 'off', true);

  insert into public.platform_config (key, value)
  values ('default_manager_id', auth.uid()::text)
  on conflict (key) do update
    set value = excluded.value, updated_at = now();
end;
$$;

grant execute on function public.promote_to_platform_manager() to authenticated;

create or replace function public.complete_client_onboarding(project_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  manager_id uuid;
  new_project_id uuid;
  trimmed_name text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  trimmed_name := trim(project_name);
  if trimmed_name = '' then
    raise exception 'Project name is required';
  end if;

  if exists (
    select 1 from public.profiles where id = auth.uid() and role in ('manager', 'admin', 'team')
  ) then
    raise exception 'Only clients can complete client onboarding';
  end if;

  if exists (select 1 from public.projects where client_id = auth.uid()) then
    raise exception 'You already have a project';
  end if;

  select value::uuid into manager_id
  from public.platform_config
  where key = 'default_manager_id';

  if manager_id is null then
    raise exception 'No manager is available yet. Please ask your manager to sign in first.';
  end if;

  if not exists (
    select 1 from public.profiles where id = manager_id and role in ('manager', 'admin')
  ) then
    raise exception 'Configured manager is invalid';
  end if;

  perform set_config('app.allow_role_change', 'on', true);

  update public.profiles
  set role = 'client'
  where id = auth.uid() and role is distinct from 'client';

  perform set_config('app.allow_role_change', 'off', true);

  insert into public.projects (name, client_id, manager_id)
  values (trimmed_name, auth.uid(), manager_id)
  returning id into new_project_id;

  insert into public.conversations (project_id, type) values
    (new_project_id, 'client_manager'),
    (new_project_id, 'internal_team')
  on conflict (project_id, type) do nothing;

  return new_project_id;
end;
$$;

grant execute on function public.complete_client_onboarding(text) to authenticated;
