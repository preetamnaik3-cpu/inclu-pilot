-- P1: read tracking, activity file storage, notification read state

create table public.conversation_reads (
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create table public.notification_reads (
  user_id uuid not null references public.profiles (id) on delete cascade,
  notification_key text not null,
  read_at timestamptz not null default now(),
  primary key (user_id, notification_key)
);

alter table public.conversation_reads enable row level security;
alter table public.notification_reads enable row level security;

create policy "Users manage own conversation reads"
  on public.conversation_reads for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users manage own notification reads"
  on public.notification_reads for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Activity file uploads (manager → client publish gate)
insert into storage.buckets (id, name, public)
values ('activity-files', 'activity-files', true)
on conflict (id) do nothing;

create policy "Authenticated users upload activity files"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'activity-files');

create policy "Anyone read activity files"
  on storage.objects for select
  to public
  using (bucket_id = 'activity-files');

create policy "Users delete own activity files"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'activity-files' and auth.uid()::text = (storage.foldername(name))[1]);
