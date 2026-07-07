-- Align conversation_type enum with application code (internal → internal_team)
do $$
begin
  if exists (
    select 1
    from pg_enum e
    join pg_type t on e.enumtypid = t.oid
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'conversation_type'
      and e.enumlabel = 'internal'
  ) then
    alter type public.conversation_type rename value 'internal' to 'internal_team';
  end if;
end $$;
