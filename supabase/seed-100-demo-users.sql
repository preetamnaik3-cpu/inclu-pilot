-- Reset demo data: keep managers only, seed 100 unassigned test users.
-- Run in Supabase SQL editor (requires auth schema access).
-- Default password for all seeded accounts: Demo1234!

-- 1) Clear project data
delete from public.messages;
delete from public.conversation_reads;
delete from public.conversations;
delete from public.hub_updates;
delete from public.work_item_comments;
delete from public.work_item_assignments;
delete from public.activity_updates;
delete from public.work_items;
delete from public.project_milestones;
delete from public.project_team_members;
delete from public.projects;
delete from public.pending_client_assignments;

-- 2) Remove all users except managers
delete from auth.identities
where user_id in (
  select id from auth.users
  where lower(email) not in ('preetam.naik3@gmail.com', 'asrkrao191@gmail.com')
);

delete from auth.users
where lower(email) not in ('preetam.naik3@gmail.com', 'asrkrao191@gmail.com');

update public.platform_config
set value = 'preetam.naik3@gmail.com,asrkrao191@gmail.com',
    updated_at = now()
where key = 'allowed_manager_emails';

-- 3) Helper to create email/password auth users (trigger creates profiles)
create or replace function public.seed_auth_email_user(
  user_email text,
  user_password text,
  user_full_name text
)
returns uuid
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  new_id uuid := gen_random_uuid();
begin
  if exists (select 1 from auth.users where lower(email) = lower(user_email)) then
    return (select id from auth.users where lower(email) = lower(user_email) limit 1);
  end if;

  insert into auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  ) values (
    new_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    lower(user_email),
    extensions.crypt(user_password, extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('full_name', user_full_name),
    now(),
    now()
  );

  insert into auth.identities (
    provider_id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) values (
    new_id::text,
    new_id,
    jsonb_build_object('sub', new_id::text, 'email', lower(user_email)),
    'email',
    now(),
    now(),
    now()
  );

  return new_id;
end;
$$;

-- 4) Ensure Ask Rao exists
select public.seed_auth_email_user('asrkrao191@gmail.com', 'Demo1234!', 'Ask Rao');

-- 5) Seed demo001@inclupilot.test … demo100@inclupilot.test
do $$
declare
  i int;
begin
  for i in 1..100 loop
    perform public.seed_auth_email_user(
      format('demo%03s@inclupilot.test', i),
      'Demo1234!',
      format('Demo User %03s', i)
    );
  end loop;
end $$;

-- 6) Promote managers
select set_config('app.allow_role_change', 'on', true);
update public.profiles
set role = 'manager'
where lower(email) in ('preetam.naik3@gmail.com', 'asrkrao191@gmail.com');
select set_config('app.allow_role_change', 'off', true);
