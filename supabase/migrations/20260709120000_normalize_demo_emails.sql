-- Normalize spaced demo emails (demo  1@...) to demo001@inclupilot.test format.

do $$
declare
  r record;
  digits text;
  new_email text;
  new_name text;
begin
  for r in
    select u.id, u.email, p.full_name
    from auth.users u
    join public.profiles p on p.id = u.id
    where u.email ~ '^demo\s+\d+@inclupilot\.test$'
  loop
    digits := regexp_replace(r.email, '^demo\s+(\d+)@inclupilot\.test$', '\1');
    new_email := 'demo' || lpad(digits, 3, '0') || '@inclupilot.test';
    new_name := 'Demo User ' || lpad(digits, 3, '0');

    update auth.users
    set email = new_email,
        raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb)
          || jsonb_build_object('full_name', new_name)
    where id = r.id;

    update auth.identities
    set identity_data = jsonb_set(
          coalesce(identity_data, '{}'::jsonb),
          '{email}',
          to_jsonb(new_email),
          true
        )
    where user_id = r.id
      and provider = 'email';

    update public.profiles
    set email = new_email,
        full_name = new_name
    where id = r.id;
  end loop;
end $$;
