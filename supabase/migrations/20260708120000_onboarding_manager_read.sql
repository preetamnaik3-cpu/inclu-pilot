-- Allow new clients on /onboarding to read the platform manager profile
-- before a project link exists.

create policy "Authenticated users can read platform manager profile"
  on public.profiles for select
  to authenticated
  using (
    exists (
      select 1
      from public.platform_config pc
      where pc.key = 'default_manager_id'
        and pc.value = profiles.id::text
    )
  );
