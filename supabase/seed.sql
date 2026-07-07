-- IncluPilot demo seed — run AFTER auth users exist and profiles are updated.
-- Replace placeholder UUIDs with real auth.users / profiles ids from your project.

-- 1) Set roles (run in SQL editor after creating users in Auth dashboard):
-- update public.profiles set role = 'manager', full_name = 'Priya Sharma', designation = 'Project Manager' where email = 'priya@demo.com';
-- update public.profiles set role = 'client', full_name = 'Rahul Mehta', designation = 'Client' where email = 'rahul@demo.com';
-- update public.profiles set role = 'team', full_name = 'Alex Kumar', designation = 'Web Designer' where email = 'alex@demo.com';

-- 2) Replace these placeholders:
--   :client_id   — Rahul's profile uuid
--   :manager_id  — Priya's profile uuid
--   :team_id     — Alex's profile uuid

/*
-- Project
insert into public.projects (id, name, client_id, manager_id)
values (
  '00000000-0000-0000-0000-000000000001',
  'Acme Rebrand',
  ':client_id',
  ':manager_id'
);

-- Conversations
insert into public.conversations (project_id, type) values
  ('00000000-0000-0000-0000-000000000001', 'client_manager'),
  ('00000000-0000-0000-0000-000000000001', 'internal_team');

-- Activities (work_items)
insert into public.work_items (
  id, project_id, title, description, outcome_description,
  status, preview_url, due_label, sort_order, created_by
) values
  (
    '00000000-0000-0000-0000-000000000101',
    '00000000-0000-0000-0000-000000000001',
    'Homepage Design',
    'Main landing page',
    'Responsive homepage with hero and contact',
    'in_review',
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400',
    'Ready for review',
    1,
    ':manager_id'
  ),
  (
    '00000000-0000-0000-0000-000000000102',
    '00000000-0000-0000-0000-000000000001',
    'Product Shoot',
    'Studio session',
    '20 edited product photos',
    'planned',
    'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=400',
    'Studio booked Friday',
    2,
    ':manager_id'
  ),
  (
    '00000000-0000-0000-0000-000000000103',
    '00000000-0000-0000-0000-000000000001',
    'Instagram Reel Series',
    'Launch week reels',
    '5 edited reels with captions',
    'in_progress',
    'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=400',
    '3 of 5 drafted',
    3,
    ':manager_id'
  );

-- Team assignments
insert into public.work_item_assignments (work_item_id, user_id, visible_to_client) values
  ('00000000-0000-0000-0000-000000000101', ':team_id', true),
  ('00000000-0000-0000-0000-000000000102', ':team_id', true),
  ('00000000-0000-0000-0000-000000000103', ':team_id', true);

-- Unified hub updates (single source of truth)
insert into public.hub_updates (
  project_id, activity_id, author_id, author_role, type, body,
  visibility, published_at, feed_title, feed_subtitle, icon
) values
  (
    '00000000-0000-0000-0000-000000000001',
    null,
    ':manager_id',
    'manager',
    'feed_highlight',
    'Friday, 10 AM at Studio B',
    'client',
    now() - interval '2 days',
    'Shoot day confirmed',
    'Friday, 10 AM at Studio B',
    '📸'
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000101',
    ':manager_id',
    'manager',
    'manager_update',
    'Homepage mockups are ready for your review.',
    'client',
    now() - interval '1 day',
    'Homepage ready for your review',
    'Tap to view and leave feedback',
    '🌐'
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000103',
    ':team_id',
    'team',
    'team_quick_update',
    'Drafted 3 of 5 reels — waiting on product shots.',
    'manager',
    null,
    null,
    null,
    null
  );
*/
