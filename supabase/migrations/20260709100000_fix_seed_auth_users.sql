-- Fix GoTrue 500 on email/password login for SQL-seeded users.
-- GoTrue expects empty strings on token columns, not NULL.

update auth.users
set
  confirmation_token = coalesce(confirmation_token, ''),
  recovery_token = coalesce(recovery_token, ''),
  email_change_token_new = coalesce(email_change_token_new, ''),
  email_change_token_current = coalesce(email_change_token_current, ''),
  email_change = coalesce(email_change, ''),
  phone_change = coalesce(phone_change, ''),
  phone_change_token = coalesce(phone_change_token, ''),
  reauthentication_token = coalesce(reauthentication_token, ''),
  is_sso_user = coalesce(is_sso_user, false),
  is_anonymous = coalesce(is_anonymous, false)
where confirmation_token is null
   or recovery_token is null
   or email_change_token_new is null
   or email_change is null;

create or replace function public.seed_auth_email_user(
  user_email text,
  user_password text,
  user_full_name text
)
returns uuid
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  new_id uuid := gen_random_uuid();
  normalized_email text := lower(trim(user_email));
begin
  if exists (select 1 from auth.users where lower(email) = normalized_email) then
    return (select id from auth.users where lower(email) = normalized_email limit 1);
  end if;

  insert into auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change_token_current,
    email_change,
    phone_change,
    phone_change_token,
    reauthentication_token,
    is_sso_user,
    is_anonymous
  ) values (
    new_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    normalized_email,
    extensions.crypt(user_password, extensions.gen_salt('bf')),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('full_name', user_full_name),
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    false,
    false
  );

  insert into auth.identities (
    provider_id,
    user_id,
    identity_data,
    provider,
    email,
    last_sign_in_at,
    created_at,
    updated_at
  ) values (
    new_id::text,
    new_id,
    jsonb_build_object('sub', new_id::text, 'email', normalized_email),
    'email',
    normalized_email,
    now(),
    now(),
    now()
  );

  return new_id;
end;
$$;
