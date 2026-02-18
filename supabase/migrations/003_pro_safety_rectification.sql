-- ════════════════════════════════════════════════════════════
-- 003: Pro Safety, Rectification & Quality tables
-- Adds tables needed by proSafety.service, proRectification.service, quality.service
-- ════════════════════════════════════════════════════════════

-- ── 1. SOS ALERTS ────────────────────────────────────────────
create table if not exists sos_alerts (
  id            uuid primary key default gen_random_uuid(),
  booking_id    uuid references pro_bookings(id) on delete set null,
  booking_ref   text,
  triggered_by  text not null, -- 'client' | 'provider'
  provider_name text,
  client_name   text,
  service       text,
  location      text,
  lat           numeric,
  lng           numeric,
  reason        text,
  notes         text,
  status        text not null default 'active', -- active | responding | resolved
  resolved_by   uuid references profiles(id) on delete set null,
  resolution    text,
  resolved_at   timestamptz,
  created_at    timestamptz not null default now()
);

create index if not exists idx_sos_alerts_status on sos_alerts(status);
create index if not exists idx_sos_alerts_booking on sos_alerts(booking_id);
create index if not exists idx_sos_alerts_created on sos_alerts(created_at desc);

alter table sos_alerts enable row level security;

create policy "Admins can read all SOS alerts"
  on sos_alerts for select using (is_admin());
create policy "Booking participants can create SOS"
  on sos_alerts for insert with check (
    exists (
      select 1 from pro_bookings
      where id = booking_id
      and (client_id = auth.uid()
           or exists (select 1 from pro_providers where id = provider_id and user_id = auth.uid()))
    )
  );
create policy "Admins can update SOS alerts"
  on sos_alerts for update using (is_admin());


-- ── 2. PRO RECTIFICATIONS ────────────────────────────────────
create table if not exists pro_rectifications (
  id                uuid primary key default gen_random_uuid(),
  booking_id        uuid references pro_bookings(id) on delete set null,
  booking_ref       text,
  reporter_id       uuid references profiles(id) on delete set null,
  reporter_name     text,
  provider_id       uuid references pro_providers(id) on delete set null,
  provider_name     text,
  category          text not null, -- 'quality', 'incomplete', 'damage', 'safety', 'other'
  description       text,
  photos            text[] default '{}',
  status            text not null default 'reported',
    -- reported | provider_notified | fix_scheduled | fix_in_progress | fix_complete | observation | resolved | escalated
  priority          text default 'medium', -- low | medium | high | critical
  provider_response text,
  fix_date          timestamptz,
  fix_notes         text,
  fix_photos        text[] default '{}',
  ruling            text, -- 'resolved' | 'refund_partial' | 'refund_full' | 'escalated'
  refund_amount     numeric default 0,
  ruling_notes      text,
  ruled_by          uuid references profiles(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists idx_pro_rectifications_booking on pro_rectifications(booking_id);
create index if not exists idx_pro_rectifications_status on pro_rectifications(status);
create index if not exists idx_pro_rectifications_provider on pro_rectifications(provider_id);
create index if not exists idx_pro_rectifications_created on pro_rectifications(created_at desc);

create trigger pro_rectifications_updated_at before update on pro_rectifications
  for each row execute function update_updated_at();

alter table pro_rectifications enable row level security;

create policy "Admins can read all rectifications"
  on pro_rectifications for select using (is_admin());
create policy "Participants can read own rectifications"
  on pro_rectifications for select using (
    reporter_id = auth.uid()
    or exists (select 1 from pro_providers where id = provider_id and user_id = auth.uid())
  );
create policy "Users can create rectifications"
  on pro_rectifications for insert with check (reporter_id = auth.uid());
create policy "Participants and admins can update rectifications"
  on pro_rectifications for update using (
    reporter_id = auth.uid()
    or exists (select 1 from pro_providers where id = provider_id and user_id = auth.uid())
    or is_admin()
  );


-- ── 3. QUALITY AUDITS ───────────────────────────────────────
create table if not exists quality_audits (
  id               uuid primary key default gen_random_uuid(),
  reviewed_action  text not null, -- e.g. 'listing.approve', 'kyc.approve', 'user.suspend'
  reviewed_by      uuid references profiles(id) on delete set null,
  reviewed_by_name text,
  outcome          text not null, -- 'correct' | 'overturned' | 'needs_review'
  audited_by       uuid references profiles(id) on delete set null,
  audited_by_name  text,
  notes            text,
  created_at       timestamptz not null default now()
);

create index if not exists idx_quality_audits_action on quality_audits(reviewed_action);
create index if not exists idx_quality_audits_outcome on quality_audits(outcome);
create index if not exists idx_quality_audits_created on quality_audits(created_at desc);

alter table quality_audits enable row level security;

create policy "Admins can read quality audits"
  on quality_audits for select using (is_admin());
create policy "Admins can create quality audits"
  on quality_audits for insert with check (is_admin());
create policy "Admins can update quality audits"
  on quality_audits for update using (is_admin());
