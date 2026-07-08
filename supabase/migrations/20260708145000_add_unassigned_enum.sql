-- Must be committed separately before using the new enum value
alter type public.user_role add value if not exists 'unassigned';
