-- Bypass RLS for onboarding manager lookup (used by get_platform_manager_for_onboarding RPC)

create or replace function public.get_platform_manager_for_onboarding()
returns table (
  id uuid,
  full_name text,
  designation text,
  email text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  manager_id uuid;
begin
  select value::uuid into manager_id
  from public.platform_config
  where key = 'default_manager_id';

  if manager_id is null then
    return;
  end if;

  return query
  select p.id, p.full_name, p.designation, p.email
  from public.profiles p
  where p.id = manager_id
    and p.role in ('manager', 'admin');
end;
$$;

grant execute on function public.get_platform_manager_for_onboarding() to authenticated;
