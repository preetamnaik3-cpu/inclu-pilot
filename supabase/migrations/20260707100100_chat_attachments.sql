-- Chat attachments: images, videos, and files in manager-client messages

alter table public.messages
  add column if not exists attachment_url text,
  add column if not exists attachment_name text,
  add column if not exists attachment_kind text
    check (attachment_kind is null or attachment_kind in ('image', 'video', 'file')),
  add column if not exists attachment_mime_type text;

alter table public.messages
  alter column body drop not null;

alter table public.messages
  alter column body set default '';

-- Storage bucket for chat uploads (public read for shared links in chat UI)
insert into storage.buckets (id, name, public)
values ('chat-attachments', 'chat-attachments', true)
on conflict (id) do nothing;

create policy "Authenticated users upload chat attachments"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'chat-attachments');

create policy "Anyone read chat attachments"
  on storage.objects for select
  to public
  using (bucket_id = 'chat-attachments');

create policy "Users delete own chat attachments"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'chat-attachments' and auth.uid()::text = (storage.foldername(name))[1]);
