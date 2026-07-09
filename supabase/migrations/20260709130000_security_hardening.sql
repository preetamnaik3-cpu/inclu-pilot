-- MVP security hardening: storage, platform_config, seed function, signup roles

-- 1) Private buckets (stop public anonymous reads)
update storage.buckets
set public = false
where id in ('chat-attachments', 'activity-files');

drop policy if exists "Anyone read chat attachments" on storage.objects;
drop policy if exists "Authenticated users upload chat attachments" on storage.objects;
drop policy if exists "Anyone read activity files" on storage.objects;
drop policy if exists "Authenticated users upload activity files" on storage.objects;

create policy "Project members read chat attachments"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'chat-attachments'
    and exists (
      select 1
      from public.conversations c
      where c.id::text = (storage.foldername(name))[1]
        and public.is_project_member(c.project_id)
    )
  );

create policy "Project members upload chat attachments"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'chat-attachments'
    and exists (
      select 1
      from public.conversations c
      where c.id::text = (storage.foldername(name))[1]
        and public.is_project_member(c.project_id)
    )
  );

create policy "Project members read activity files"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'activity-files'
    and exists (
      select 1
      from public.work_items wi
      where wi.id::text = (storage.foldername(name))[2]
        and public.is_project_member(wi.project_id)
    )
  );

create policy "Project members upload activity files"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'activity-files'
    and exists (
      select 1
      from public.work_items wi
      where wi.id::text = (storage.foldername(name))[2]
        and public.is_project_member(wi.project_id)
    )
  );

-- 2) Lock down platform_config (manager allowlist is sensitive)
drop policy if exists "Authenticated users can read platform config" on public.platform_config;

create policy "Managers read platform config"
  on public.platform_config for select
  to authenticated
  using (public.is_platform_manager());

drop policy if exists "Authenticated users can read platform manager profile" on public.profiles;

-- 3) New users always start unassigned; roles change only via assignment RPCs
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
    'unassigned'
  );
  return new;
end;
$$;

-- 4) Seed helper must not be callable from the client API
revoke all on function public.seed_auth_email_user(text, text, text) from public;
revoke all on function public.seed_auth_email_user(text, text, text) from anon;
revoke all on function public.seed_auth_email_user(text, text, text) from authenticated;

-- 5) Remove unused self-serve onboarding RPC grants
revoke all on function public.complete_client_onboarding(text) from public;
revoke all on function public.complete_client_onboarding(text) from anon;
revoke all on function public.complete_client_onboarding(text) from authenticated;

revoke all on function public.fulfill_pending_client_assignment() from public;
revoke all on function public.fulfill_pending_client_assignment() from anon;
revoke all on function public.fulfill_pending_client_assignment() from authenticated;
