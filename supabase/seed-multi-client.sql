-- Multi-client seed — run top to bottom in SQL Editor.
-- Prerequisites: auth users + client profiles for meera@demo.com and arjun@demo.com.

-- 0) Verify profiles exist (must return 3 rows before continuing)
select email, id, role
from public.profiles
where email in ('meera@demo.com', 'arjun@demo.com', 'priya@demo.com');

-- 1) Projects (run this FIRST — conversations depend on it)
insert into public.projects (id, name, client_id, manager_id)
select
  '00000000-0000-0000-0000-000000000002',
  'Bloom Cafe',
  meera.id,
  priya.id
from public.profiles meera
cross join public.profiles priya
where meera.email = 'meera@demo.com'
  and priya.email = 'priya@demo.com'
on conflict (id) do nothing;

insert into public.projects (id, name, client_id, manager_id)
select
  '00000000-0000-0000-0000-000000000003',
  'TechStart Launch',
  arjun.id,
  priya.id
from public.profiles arjun
cross join public.profiles priya
where arjun.email = 'arjun@demo.com'
  and priya.email = 'priya@demo.com'
on conflict (id) do nothing;

-- 2) Confirm projects exist (should return Bloom Cafe + TechStart Launch)
select id, name from public.projects
where id in (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000003'
);

-- 3) Conversations
insert into public.conversations (project_id, type) values
  ('00000000-0000-0000-0000-000000000002', 'client_manager'::public.conversation_type),
  ('00000000-0000-0000-0000-000000000002', 'internal_team'::public.conversation_type),
  ('00000000-0000-0000-0000-000000000003', 'client_manager'::public.conversation_type),
  ('00000000-0000-0000-0000-000000000003', 'internal_team'::public.conversation_type)
on conflict (project_id, type) do nothing;

-- 4) Activities
insert into public.work_items (
  id, project_id, title, description, outcome_description,
  status, due_label, sort_order, created_by
)
select
  '00000000-0000-0000-0000-000000000201',
  '00000000-0000-0000-0000-000000000002',
  'Menu Photography', 'Cafe menu shoot', '12 edited menu photos',
  'in_progress', 'Shoot next Tuesday', 1,
  priya.id
from public.profiles priya
where priya.email = 'priya@demo.com'
on conflict (id) do nothing;

insert into public.work_items (
  id, project_id, title, description, outcome_description,
  status, due_label, sort_order, created_by
)
select
  '00000000-0000-0000-0000-000000000301',
  '00000000-0000-0000-0000-000000000003',
  'Landing Page', 'Launch site', 'Responsive launch page',
  'in_review', '90% complete', 1,
  priya.id
from public.profiles priya
where priya.email = 'priya@demo.com'
on conflict (id) do nothing;
