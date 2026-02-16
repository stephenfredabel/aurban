-- ════════════════════════════════════════════════════════════
-- Provider Verification — Adds verification columns to profiles
-- and updates handle_new_user() to store whatsapp + account_type
-- ════════════════════════════════════════════════════════════

-- ── Add verification columns to profiles ─────────────────
alter table profiles add column if not exists whatsapp            text;
alter table profiles add column if not exists whatsapp_verified   boolean not null default false;
alter table profiles add column if not exists email_verified      boolean not null default false;
alter table profiles add column if not exists verification_status text not null default 'unverified';
  -- Values: 'unverified' | 'pending' | 'approved' | 'rejected' | 'docs_requested'

-- ── Index for admin verification queue ───────────────────
create index if not exists idx_profiles_verification_status
  on profiles (verification_status)
  where role in ('provider', 'host', 'agent', 'seller', 'service');

-- ── Update handle_new_user() to store new fields ─────────
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, name, email, phone, whatsapp, role, account_type, verification_status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    new.email,
    coalesce(new.raw_user_meta_data->>'phone', new.phone),
    coalesce(new.raw_user_meta_data->>'whatsapp', new.raw_user_meta_data->>'phone', new.phone),
    coalesce(new.raw_user_meta_data->>'role', 'user'),
    coalesce(new.raw_user_meta_data->>'accountType', 'individual'),
    case
      when coalesce(new.raw_user_meta_data->>'role', 'user') in ('provider', 'host', 'agent', 'seller', 'service')
      then 'unverified'
      else 'approved'
    end
  );
  return new;
end;
$$ language plpgsql security definer;

-- ── Update email_verified on email confirmation ──────────
-- This function is called by a Supabase auth hook or can be
-- triggered by listening to auth.users updates
create or replace function sync_email_verification()
returns trigger as $$
begin
  if new.email_confirmed_at is not null and old.email_confirmed_at is null then
    update profiles
    set email_verified = true
    where id = new.id;
  end if;
  return new;
end;
$$ language plpgsql security definer;

-- Only create the trigger if it doesn't exist
do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'on_email_confirmed'
  ) then
    create trigger on_email_confirmed
      after update of email_confirmed_at on auth.users
      for each row execute function sync_email_verification();
  end if;
end;
$$;
