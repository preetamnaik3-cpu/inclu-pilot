-- PL/pgSQL RETURNS TABLE columns shadow bare "id" in the function body.

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
    select 1
    from public.profiles mgr
    where mgr.id = auth.uid()
      and mgr.role in ('manager', 'admin')
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

-- Remove legacy email overload so RPC resolution is unambiguous.
drop function if exists public.manager_assign_client(text, text);
