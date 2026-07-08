-- Allow managers to list unassigned users in assignment dropdowns

create or replace function public.is_platform_manager()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('manager', 'admin')
  );
$$;

drop policy if exists "Managers can read unassigned profiles" on public.profiles;
create policy "Managers can read unassigned profiles"
  on public.profiles for select
  using (public.is_platform_manager() and role = 'unassigned');

grant execute on function public.is_platform_manager() to authenticated;
