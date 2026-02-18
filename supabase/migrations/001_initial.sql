-- ════════════════════════════════════════════════════════════
-- Aurban Platform — Complete Supabase Schema
-- 34 tables · RLS on all · Realtime on messages/notifications
-- ════════════════════════════════════════════════════════════

-- ── Helper: update updated_at trigger ──────────────────────
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ── Helper: is_admin() ─────────────────────────────────────
create or replace function is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from profiles
    where id = auth.uid()
      and role in ('super_admin','operations_admin','moderator',
                   'verification_admin','support_admin','finance_admin','compliance_admin','admin')
  );
end;
$$ language plpgsql security definer;


-- ════════════════════════════════════════════════════════════
-- 1. PROFILES (extends auth.users)
-- ════════════════════════════════════════════════════════════

create table profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  name         text not null default '',
  email        text,
  phone        text,
  role         text not null default 'user',
  avatar       text,
  verified     boolean not null default false,
  tier         jsonb default '{"type":"individual","level":1,"label":"Basic Provider"}',
  account_type text default 'individual',
  country_code text default 'NG',
  bio          text,
  status       text default 'active',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger profiles_updated_at before update on profiles
  for each row execute function update_updated_at();

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, name, email, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    new.email,
    new.phone,
    coalesce(new.raw_user_meta_data->>'role', 'user')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

alter table profiles enable row level security;

create policy "Users can read own profile"
  on profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);
create policy "Public can read basic profile info"
  on profiles for select using (true);
create policy "Admins can manage all profiles"
  on profiles for all using (is_admin());


-- ════════════════════════════════════════════════════════════
-- 2. PROPERTIES
-- ════════════════════════════════════════════════════════════

create table properties (
  id            uuid primary key default gen_random_uuid(),
  provider_id   uuid references profiles(id) on delete cascade,
  title         text not null,
  description   text,
  type          text not null, -- rental, sale, shortlet, land, shared
  category      text,
  price         numeric,
  price_label   text,
  currency      text default 'NGN',
  location      jsonb, -- { state, lga, address, lat, lng }
  images        text[] default '{}',
  amenities     text[] default '{}',
  bedrooms      int,
  bathrooms     int,
  area_sqm      numeric,
  features      jsonb default '{}',
  status        text default 'active', -- active, pending, rejected, sold, rented
  featured      boolean default false,
  views         int default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index idx_properties_provider on properties(provider_id);
create index idx_properties_type on properties(type);
create index idx_properties_status on properties(status);
create index idx_properties_created on properties(created_at desc);

create trigger properties_updated_at before update on properties
  for each row execute function update_updated_at();

alter table properties enable row level security;

create policy "Anyone can read active properties"
  on properties for select using (status = 'active' or provider_id = auth.uid() or is_admin());
create policy "Providers can insert own properties"
  on properties for insert with check (provider_id = auth.uid());
create policy "Providers can update own properties"
  on properties for update using (provider_id = auth.uid() or is_admin());
create policy "Admins can delete properties"
  on properties for delete using (is_admin());


-- ════════════════════════════════════════════════════════════
-- 3. PROPERTY REVIEWS
-- ════════════════════════════════════════════════════════════

create table property_reviews (
  id           uuid primary key default gen_random_uuid(),
  property_id  uuid references properties(id) on delete cascade,
  user_id      uuid references profiles(id) on delete set null,
  user_name    text,
  rating       int not null check (rating between 1 and 5),
  comment      text,
  created_at   timestamptz not null default now()
);

create index idx_property_reviews_property on property_reviews(property_id);

alter table property_reviews enable row level security;

create policy "Anyone can read reviews"
  on property_reviews for select using (true);
create policy "Authenticated users can write reviews"
  on property_reviews for insert with check (auth.uid() = user_id);
create policy "Admins can manage reviews"
  on property_reviews for all using (is_admin());


-- ════════════════════════════════════════════════════════════
-- 4. PRODUCTS (marketplace)
-- ════════════════════════════════════════════════════════════

create table products (
  id            uuid primary key default gen_random_uuid(),
  seller_id     uuid references profiles(id) on delete cascade,
  title         text not null,
  description   text,
  category      text not null,
  subcategory   text,
  price         numeric not null,
  currency      text default 'NGN',
  unit          text, -- per_bag, per_tonne, each
  min_order     int default 1,
  images        text[] default '{}',
  location      jsonb,
  specs         jsonb default '{}',
  stock         int default 0,
  status        text default 'active',
  featured      boolean default false,
  rating        numeric default 0,
  review_count  int default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index idx_products_seller on products(seller_id);
create index idx_products_category on products(category);
create index idx_products_status on products(status);

create trigger products_updated_at before update on products
  for each row execute function update_updated_at();

alter table products enable row level security;

create policy "Anyone can read active products"
  on products for select using (status = 'active' or seller_id = auth.uid() or is_admin());
create policy "Sellers can insert own products"
  on products for insert with check (seller_id = auth.uid());
create policy "Sellers can update own products"
  on products for update using (seller_id = auth.uid() or is_admin());
create policy "Admins can delete products"
  on products for delete using (is_admin());


-- ════════════════════════════════════════════════════════════
-- 5. BOOKINGS (inspections & appointments)
-- ════════════════════════════════════════════════════════════

create table bookings (
  id             uuid primary key default gen_random_uuid(),
  listing_id     text,
  listing_title  text,
  listing_type   text,
  address        text,
  user_id        uuid references profiles(id) on delete set null,
  user_name      text,
  user_phone     text,
  provider_id    uuid references profiles(id) on delete set null,
  provider_name  text,
  date           date,
  time           text,
  transport      text,
  notes          text,
  status         text not null default 'pending',
  escrow_amount  numeric default 0,
  notifications  jsonb default '{"email":true,"calendar":false,"whatsapp":false}',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index idx_bookings_user on bookings(user_id);
create index idx_bookings_provider on bookings(provider_id);
create index idx_bookings_status on bookings(status);
create index idx_bookings_date on bookings(date);

create trigger bookings_updated_at before update on bookings
  for each row execute function update_updated_at();

alter table bookings enable row level security;

create policy "Users can read own bookings"
  on bookings for select using (user_id = auth.uid() or provider_id = auth.uid() or is_admin());
create policy "Users can create bookings"
  on bookings for insert with check (user_id = auth.uid());
create policy "Participants can update bookings"
  on bookings for update using (user_id = auth.uid() or provider_id = auth.uid() or is_admin());


-- ════════════════════════════════════════════════════════════
-- 6. ORDERS (marketplace)
-- ════════════════════════════════════════════════════════════

create table orders (
  id              uuid primary key default gen_random_uuid(),
  ref             text unique,
  buyer_id        uuid references profiles(id) on delete set null,
  buyer_name      text,
  buyer_phone     text,
  seller_id       uuid references profiles(id) on delete set null,
  seller_name     text,
  items           jsonb not null default '[]',
  subtotal        numeric not null default 0,
  delivery_fee    numeric default 0,
  service_fee     numeric default 0,
  total           numeric not null default 0,
  status          text not null default 'pending_payment',
  delivery_choice text default 'delivery',
  address         jsonb,
  tracking_info   text,
  escrow_status   text default 'pending',
  cancel_reason   text,
  refund_reason   text,
  timeline        jsonb default '[]',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_orders_buyer on orders(buyer_id);
create index idx_orders_seller on orders(seller_id);
create index idx_orders_status on orders(status);
create index idx_orders_created on orders(created_at desc);

create trigger orders_updated_at before update on orders
  for each row execute function update_updated_at();

alter table orders enable row level security;

create policy "Participants can read own orders"
  on orders for select using (buyer_id = auth.uid() or seller_id = auth.uid() or is_admin());
create policy "Buyers can create orders"
  on orders for insert with check (buyer_id = auth.uid());
create policy "Participants can update orders"
  on orders for update using (buyer_id = auth.uid() or seller_id = auth.uid() or is_admin());


-- ════════════════════════════════════════════════════════════
-- 7. CONVERSATIONS
-- ════════════════════════════════════════════════════════════

create table conversations (
  id             uuid primary key default gen_random_uuid(),
  listing_id     text,
  listing_title  text,
  listing_type   text,
  listing_image  text,
  listing_price  text,
  type           text default 'inquiry', -- inquiry, booking, support
  is_paid        boolean default false,
  last_message   jsonb,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create trigger conversations_updated_at before update on conversations
  for each row execute function update_updated_at();

alter table conversations enable row level security;


-- ════════════════════════════════════════════════════════════
-- 8. CONVERSATION PARTICIPANTS
-- ════════════════════════════════════════════════════════════

create table conversation_participants (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id) on delete cascade,
  user_id         uuid references profiles(id) on delete cascade,
  role            text default 'user',
  role_label      text,
  unread_count    int default 0,
  joined_at       timestamptz not null default now()
);

create unique index idx_conv_participant_unique on conversation_participants(conversation_id, user_id);
create index idx_conv_participant_user on conversation_participants(user_id);

alter table conversation_participants enable row level security;

create policy "Participants can read own conversations"
  on conversations for select using (
    exists (select 1 from conversation_participants where conversation_id = conversations.id and user_id = auth.uid())
    or is_admin()
  );
create policy "Authenticated users can create conversations"
  on conversations for insert with check (auth.uid() is not null);
create policy "Participants can update conversations"
  on conversations for update using (
    exists (select 1 from conversation_participants where conversation_id = conversations.id and user_id = auth.uid())
    or is_admin()
  );

create policy "Participants can read own entries"
  on conversation_participants for select using (user_id = auth.uid() or is_admin());
create policy "Authenticated can insert participants"
  on conversation_participants for insert with check (auth.uid() is not null);
create policy "Participants can update own entry"
  on conversation_participants for update using (user_id = auth.uid() or is_admin());


-- ════════════════════════════════════════════════════════════
-- 9. MESSAGES (Realtime enabled)
-- ════════════════════════════════════════════════════════════

create table messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id) on delete cascade,
  sender_id       uuid references profiles(id) on delete set null,
  text            text,
  file            jsonb, -- { name, url, type, size }
  type            text default 'text', -- text, file, system
  status          text default 'sent', -- sent, delivered, read
  created_at      timestamptz not null default now()
);

create index idx_messages_conversation on messages(conversation_id);
create index idx_messages_sender on messages(sender_id);
create index idx_messages_created on messages(created_at);

alter table messages enable row level security;

create policy "Participants can read messages"
  on messages for select using (
    exists (
      select 1 from conversation_participants
      where conversation_id = messages.conversation_id and user_id = auth.uid()
    ) or is_admin()
  );
create policy "Participants can send messages"
  on messages for insert with check (
    sender_id = auth.uid() and exists (
      select 1 from conversation_participants
      where conversation_id = messages.conversation_id and user_id = auth.uid()
    )
  );
create policy "Sender can update message status"
  on messages for update using (
    exists (
      select 1 from conversation_participants
      where conversation_id = messages.conversation_id and user_id = auth.uid()
    ) or is_admin()
  );


-- ════════════════════════════════════════════════════════════
-- 10. PEER META (cached provider info for chat sidebar)
-- ════════════════════════════════════════════════════════════

create table peer_meta (
  user_id          uuid primary key references profiles(id) on delete cascade,
  rating           numeric default 0,
  review_count     int default 0,
  joined_date      text,
  location         text,
  response_time    text,
  completed_deals  int default 0,
  total_inquiries  int default 0,
  listings         jsonb default '[]',
  recent_reviews   jsonb default '[]',
  visibility       jsonb default '{"location":true,"rating":true,"listings":true,"reviews":true}',
  updated_at       timestamptz not null default now()
);

create trigger peer_meta_updated_at before update on peer_meta
  for each row execute function update_updated_at();

alter table peer_meta enable row level security;

create policy "Anyone can read peer meta"
  on peer_meta for select using (true);
create policy "Users can update own meta"
  on peer_meta for update using (user_id = auth.uid());
create policy "Users can insert own meta"
  on peer_meta for insert with check (user_id = auth.uid());


-- ════════════════════════════════════════════════════════════
-- 11. ESCROW (marketplace orders)
-- ════════════════════════════════════════════════════════════

create table escrow (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid references orders(id) on delete cascade,
  amount       numeric not null,
  seller_id    uuid references profiles(id),
  buyer_id     uuid references profiles(id),
  status       text not null default 'held', -- held, released, frozen, refunded, partial_refund
  items        jsonb default '[]',
  reason       text,
  released_at  timestamptz,
  frozen_at    timestamptz,
  refunded_at  timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index idx_escrow_order on escrow(order_id);
create index idx_escrow_status on escrow(status);

create trigger escrow_updated_at before update on escrow
  for each row execute function update_updated_at();

alter table escrow enable row level security;

create policy "Participants can read own escrow"
  on escrow for select using (buyer_id = auth.uid() or seller_id = auth.uid() or is_admin());
create policy "System can create escrow"
  on escrow for insert with check (auth.uid() is not null);
create policy "Admins can manage escrow"
  on escrow for update using (is_admin());


-- ════════════════════════════════════════════════════════════
-- 12. PAYMENTS
-- ════════════════════════════════════════════════════════════

create table payments (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references profiles(id),
  order_id      uuid references orders(id),
  booking_id    uuid references bookings(id),
  amount        numeric not null,
  currency      text default 'NGN',
  gateway       text, -- paystack, flutterwave, stripe, opay
  reference     text unique,
  status        text default 'pending', -- pending, completed, failed, refunded
  metadata      jsonb default '{}',
  created_at    timestamptz not null default now()
);

create index idx_payments_user on payments(user_id);
create index idx_payments_order on payments(order_id);
create index idx_payments_status on payments(status);

alter table payments enable row level security;

create policy "Users can read own payments"
  on payments for select using (user_id = auth.uid() or is_admin());
create policy "Users can create payments"
  on payments for insert with check (user_id = auth.uid());
create policy "Admins can manage payments"
  on payments for all using (is_admin());


-- ════════════════════════════════════════════════════════════
-- 13. PAYOUTS
-- ════════════════════════════════════════════════════════════

create table payouts (
  id            uuid primary key default gen_random_uuid(),
  provider_id   uuid references profiles(id),
  amount        numeric not null,
  currency      text default 'NGN',
  gateway       text,
  reference     text unique,
  status        text default 'pending', -- pending, processing, completed, failed, held
  bank_details  jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index idx_payouts_provider on payouts(provider_id);
create index idx_payouts_status on payouts(status);

create trigger payouts_updated_at before update on payouts
  for each row execute function update_updated_at();

alter table payouts enable row level security;

create policy "Providers can read own payouts"
  on payouts for select using (provider_id = auth.uid() or is_admin());
create policy "Admins can manage payouts"
  on payouts for all using (is_admin());


-- ════════════════════════════════════════════════════════════
-- 14. PRO PROVIDERS
-- ════════════════════════════════════════════════════════════

create table pro_providers (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references profiles(id) on delete cascade,
  name            text not null,
  avatar          text,
  bio             text,
  phone           text,
  email           text,
  state           text,
  lga             text,
  level           text default 'verified', -- verified, gold, top
  verified        boolean default false,
  rating          numeric default 0,
  review_count    int default 0,
  completed_jobs  int default 0,
  certifications  text[] default '{}',
  categories      text[] default '{}',
  joined_at       timestamptz not null default now(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_pro_providers_user on pro_providers(user_id);
create index idx_pro_providers_state on pro_providers(state);
create index idx_pro_providers_level on pro_providers(level);

create trigger pro_providers_updated_at before update on pro_providers
  for each row execute function update_updated_at();

alter table pro_providers enable row level security;

create policy "Anyone can read pro providers"
  on pro_providers for select using (true);
create policy "Owners can insert own provider profile"
  on pro_providers for insert with check (user_id = auth.uid());
create policy "Owners can update own provider profile"
  on pro_providers for update using (user_id = auth.uid() or is_admin());


-- ════════════════════════════════════════════════════════════
-- 15. PRO LISTINGS (services)
-- ════════════════════════════════════════════════════════════

create table pro_listings (
  id              uuid primary key default gen_random_uuid(),
  provider_id     uuid references pro_providers(id) on delete cascade,
  provider_name   text,
  provider_avatar text,
  provider_rating numeric,
  provider_reviews int,
  provider_verified boolean default false,
  provider_level   text,
  category        text not null,
  subcategory     text,
  title           text not null,
  description     text,
  state           text,
  lga             text,
  tier            int not null default 1,
  pricing_mode    text default 'per_job', -- per_job, per_hour, quote
  price           numeric not null,
  price_note      text,
  fields          jsonb default '{}',
  rating          numeric default 0,
  review_count    int default 0,
  featured        boolean default false,
  active          boolean default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_pro_listings_provider on pro_listings(provider_id);
create index idx_pro_listings_category on pro_listings(category);
create index idx_pro_listings_tier on pro_listings(tier);
create index idx_pro_listings_active on pro_listings(active);

create trigger pro_listings_updated_at before update on pro_listings
  for each row execute function update_updated_at();

alter table pro_listings enable row level security;

create policy "Anyone can read active pro listings"
  on pro_listings for select using (active = true or is_admin());
create policy "Provider owners can insert listings"
  on pro_listings for insert with check (
    exists (select 1 from pro_providers where id = provider_id and user_id = auth.uid())
  );
create policy "Provider owners can update listings"
  on pro_listings for update using (
    exists (select 1 from pro_providers where id = provider_id and user_id = auth.uid())
    or is_admin()
  );


-- ════════════════════════════════════════════════════════════
-- 16. PRO LISTING REVIEWS
-- ════════════════════════════════════════════════════════════

create table pro_listing_reviews (
  id           uuid primary key default gen_random_uuid(),
  listing_id   uuid references pro_listings(id) on delete cascade,
  user_id      uuid references profiles(id) on delete set null,
  user_name    text,
  rating       int not null check (rating between 1 and 5),
  comment      text,
  created_at   timestamptz not null default now()
);

create index idx_pro_listing_reviews_listing on pro_listing_reviews(listing_id);

alter table pro_listing_reviews enable row level security;

create policy "Anyone can read pro listing reviews"
  on pro_listing_reviews for select using (true);
create policy "Authenticated users can write reviews"
  on pro_listing_reviews for insert with check (auth.uid() = user_id);


-- ════════════════════════════════════════════════════════════
-- 17. PRO BOOKINGS (service bookings)
-- ════════════════════════════════════════════════════════════

create table pro_bookings (
  id                  uuid primary key default gen_random_uuid(),
  ref                 text unique,
  service_id          uuid references pro_listings(id),
  category            text,
  tier                int default 1,
  client_id           uuid references profiles(id) on delete set null,
  client_name         text,
  client_phone        text,
  provider_id         uuid references pro_providers(id) on delete set null,
  provider_name       text,
  title               text,
  description         text,
  location            jsonb,
  scheduled_date      timestamptz,
  scheduled_time      text,
  estimated_duration  text,
  price               numeric not null,
  commitment_fee      numeric default 0,
  balance_due         numeric default 0,
  platform_fee        numeric default 0,
  status              text not null default 'pending',
  escrow_status       text default 'pending',
  otp                 text,
  otp_expires_at      timestamptz,
  checked_in_at       timestamptz,
  completed_at        timestamptz,
  observation_ends_at timestamptz,
  milestones          jsonb default '[]',
  cancel_reason       text,
  timeline            jsonb default '[]',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index idx_pro_bookings_client on pro_bookings(client_id);
create index idx_pro_bookings_provider on pro_bookings(provider_id);
create index idx_pro_bookings_status on pro_bookings(status);
create index idx_pro_bookings_created on pro_bookings(created_at desc);

create trigger pro_bookings_updated_at before update on pro_bookings
  for each row execute function update_updated_at();

alter table pro_bookings enable row level security;

create policy "Participants can read own pro bookings"
  on pro_bookings for select using (
    client_id = auth.uid()
    or exists (select 1 from pro_providers where id = provider_id and user_id = auth.uid())
    or is_admin()
  );
create policy "Clients can create pro bookings"
  on pro_bookings for insert with check (client_id = auth.uid());
create policy "Participants can update pro bookings"
  on pro_bookings for update using (
    client_id = auth.uid()
    or exists (select 1 from pro_providers where id = provider_id and user_id = auth.uid())
    or is_admin()
  );


-- ════════════════════════════════════════════════════════════
-- 18. PRO ESCROW
-- ════════════════════════════════════════════════════════════

create table pro_escrow (
  id              uuid primary key default gen_random_uuid(),
  booking_id      uuid references pro_bookings(id) on delete cascade,
  amount          numeric not null,
  client_id       uuid references profiles(id),
  provider_id     uuid references pro_providers(id),
  category        text,
  tier            int,
  status          text not null default 'held',
  commitment_released boolean default false,
  balance_released    boolean default false,
  milestones      jsonb default '[]',
  reason          text,
  frozen_at       timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_pro_escrow_booking on pro_escrow(booking_id);
create index idx_pro_escrow_status on pro_escrow(status);

create trigger pro_escrow_updated_at before update on pro_escrow
  for each row execute function update_updated_at();

alter table pro_escrow enable row level security;

create policy "Participants can read own pro escrow"
  on pro_escrow for select using (
    client_id = auth.uid()
    or exists (select 1 from pro_providers where id = provider_id and user_id = auth.uid())
    or is_admin()
  );
create policy "Admins can manage pro escrow"
  on pro_escrow for all using (is_admin());


-- ════════════════════════════════════════════════════════════
-- 19. RELOCATION PROVIDERS
-- ════════════════════════════════════════════════════════════

create table relocation_providers (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references profiles(id) on delete cascade,
  name           text not null,
  service_types  text[] default '{}',
  state          text,
  description    text,
  rating         numeric default 0,
  review_count   int default 0,
  verified       boolean default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index idx_relocation_providers_state on relocation_providers(state);

create trigger relocation_providers_updated_at before update on relocation_providers
  for each row execute function update_updated_at();

alter table relocation_providers enable row level security;

create policy "Anyone can read relocation providers"
  on relocation_providers for select using (true);
create policy "Owners can manage own relocation provider"
  on relocation_providers for all using (user_id = auth.uid() or is_admin());


-- ════════════════════════════════════════════════════════════
-- 20. RELOCATION QUOTES
-- ════════════════════════════════════════════════════════════

create table relocation_quotes (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references profiles(id),
  provider_id  uuid references relocation_providers(id),
  details      jsonb not null default '{}',
  status       text default 'pending', -- pending, quoted, accepted, rejected
  price        numeric,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index idx_relocation_quotes_user on relocation_quotes(user_id);
create index idx_relocation_quotes_provider on relocation_quotes(provider_id);

create trigger relocation_quotes_updated_at before update on relocation_quotes
  for each row execute function update_updated_at();

alter table relocation_quotes enable row level security;

create policy "Participants can read own quotes"
  on relocation_quotes for select using (
    user_id = auth.uid()
    or exists (select 1 from relocation_providers where id = provider_id and user_id = auth.uid())
    or is_admin()
  );
create policy "Users can create quotes"
  on relocation_quotes for insert with check (user_id = auth.uid());
create policy "Participants can update quotes"
  on relocation_quotes for update using (
    user_id = auth.uid()
    or exists (select 1 from relocation_providers where id = provider_id and user_id = auth.uid())
    or is_admin()
  );


-- ════════════════════════════════════════════════════════════
-- 21. WISHLISTS
-- ════════════════════════════════════════════════════════════

create table wishlists (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references profiles(id) on delete cascade,
  item_id      text not null,
  item_type    text not null, -- property, product, pro_listing
  created_at   timestamptz not null default now()
);

create unique index idx_wishlists_unique on wishlists(user_id, item_id, item_type);
create index idx_wishlists_user on wishlists(user_id);

alter table wishlists enable row level security;

create policy "Users can manage own wishlists"
  on wishlists for all using (user_id = auth.uid());


-- ════════════════════════════════════════════════════════════
-- 22. BROWSING HISTORY
-- ════════════════════════════════════════════════════════════

create table browsing_history (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references profiles(id) on delete cascade,
  item_id    text not null,
  item_type  text not null,
  item_title text,
  viewed_at  timestamptz not null default now()
);

create index idx_browsing_history_user on browsing_history(user_id);
create index idx_browsing_history_viewed on browsing_history(viewed_at desc);

alter table browsing_history enable row level security;

create policy "Users can manage own history"
  on browsing_history for all using (user_id = auth.uid());


-- ════════════════════════════════════════════════════════════
-- 23. AGREEMENTS
-- ════════════════════════════════════════════════════════════

create table agreements (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references profiles(id) on delete cascade,
  type         text not null, -- lease, sale, service
  title        text,
  counterparty text,
  status       text default 'active',
  details      jsonb default '{}',
  signed_at    timestamptz,
  expires_at   timestamptz,
  created_at   timestamptz not null default now()
);

create index idx_agreements_user on agreements(user_id);

alter table agreements enable row level security;

create policy "Users can manage own agreements"
  on agreements for all using (user_id = auth.uid() or is_admin());


-- ════════════════════════════════════════════════════════════
-- 24. AUDIT LOGS
-- ════════════════════════════════════════════════════════════

create table audit_logs (
  id           uuid primary key default gen_random_uuid(),
  action       text not null,
  target_id    text,
  target_type  text,
  details      text,
  admin_id     uuid references profiles(id),
  admin_role   text,
  ip           text,
  created_at   timestamptz not null default now()
);

create index idx_audit_logs_admin on audit_logs(admin_id);
create index idx_audit_logs_action on audit_logs(action);
create index idx_audit_logs_target on audit_logs(target_type, target_id);
create index idx_audit_logs_created on audit_logs(created_at desc);

alter table audit_logs enable row level security;

create policy "Admins can read audit logs"
  on audit_logs for select using (is_admin());
create policy "Admins can create audit logs"
  on audit_logs for insert with check (is_admin());


-- ════════════════════════════════════════════════════════════
-- 25. ESCALATIONS
-- ════════════════════════════════════════════════════════════

create table escalations (
  id           uuid primary key default gen_random_uuid(),
  priority     text not null, -- P1, P2, P3, P4
  status       text not null default 'open', -- open, in_progress, resolved, rejected
  from_admin   jsonb not null, -- { adminId, role, name }
  to_role      text not null,
  assigned_to  jsonb, -- { adminId, name }
  subject      text not null,
  note         text,
  context      jsonb, -- { type, entityId, entityLabel }
  responses    jsonb default '[]',
  resolution   text,
  resolved_at  timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index idx_escalations_status on escalations(status);
create index idx_escalations_priority on escalations(priority);
create index idx_escalations_created on escalations(created_at desc);

create trigger escalations_updated_at before update on escalations
  for each row execute function update_updated_at();

alter table escalations enable row level security;

create policy "Admins can manage escalations"
  on escalations for all using (is_admin());


-- ════════════════════════════════════════════════════════════
-- 26. ADMIN CHANNELS
-- ════════════════════════════════════════════════════════════

create table admin_channels (
  id        uuid primary key default gen_random_uuid(),
  name      text not null,
  type      text default 'panel', -- panel, incident
  members   text[] default '{}',
  unread    int default 0,
  created_at timestamptz not null default now()
);

alter table admin_channels enable row level security;

create policy "Admins can manage channels"
  on admin_channels for all using (is_admin());


-- ════════════════════════════════════════════════════════════
-- 27. ADMIN MESSAGES (Realtime enabled)
-- ════════════════════════════════════════════════════════════

create table admin_messages (
  id            uuid primary key default gen_random_uuid(),
  sender_id     text not null,
  sender_name   text,
  sender_role   text,
  content       text,
  file          jsonb,
  voice_note    jsonb,
  secured       boolean default false,
  type          text not null, -- channel, dm
  channel_id    uuid references admin_channels(id),
  recipient_id  text,
  read          boolean default false,
  created_at    timestamptz not null default now()
);

create index idx_admin_messages_channel on admin_messages(channel_id);
create index idx_admin_messages_type on admin_messages(type);
create index idx_admin_messages_created on admin_messages(created_at);

alter table admin_messages enable row level security;

create policy "Admins can manage admin messages"
  on admin_messages for all using (is_admin());


-- ════════════════════════════════════════════════════════════
-- 28. KYC SUBMISSIONS
-- ════════════════════════════════════════════════════════════

create table kyc_submissions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references profiles(id) on delete cascade,
  document_type text, -- national_id, drivers_license, passport, cac
  document_url  text,
  selfie_url    text,
  selfie_score  numeric,
  status        text default 'pending', -- pending, approved, rejected, flagged
  risk_level    text default 'low',
  reviewer_id   uuid references profiles(id),
  reviewer_notes text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index idx_kyc_user on kyc_submissions(user_id);
create index idx_kyc_status on kyc_submissions(status);

create trigger kyc_submissions_updated_at before update on kyc_submissions
  for each row execute function update_updated_at();

alter table kyc_submissions enable row level security;

create policy "Users can read own KYC"
  on kyc_submissions for select using (user_id = auth.uid() or is_admin());
create policy "Users can submit KYC"
  on kyc_submissions for insert with check (user_id = auth.uid());
create policy "Admins can manage KYC"
  on kyc_submissions for update using (is_admin());


-- ════════════════════════════════════════════════════════════
-- 29. SUPPORT TICKETS
-- ════════════════════════════════════════════════════════════

create table support_tickets (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references profiles(id),
  subject      text not null,
  description  text,
  status       text default 'open', -- open, in_progress, resolved, closed
  priority     text default 'medium',
  category     text,
  assigned_to  uuid references profiles(id),
  responses    jsonb default '[]',
  resolution   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index idx_tickets_user on support_tickets(user_id);
create index idx_tickets_status on support_tickets(status);
create index idx_tickets_priority on support_tickets(priority);

create trigger support_tickets_updated_at before update on support_tickets
  for each row execute function update_updated_at();

alter table support_tickets enable row level security;

create policy "Users can read own tickets"
  on support_tickets for select using (user_id = auth.uid() or is_admin());
create policy "Users can create tickets"
  on support_tickets for insert with check (user_id = auth.uid());
create policy "Admins can manage tickets"
  on support_tickets for update using (is_admin());


-- ════════════════════════════════════════════════════════════
-- 30. REPORTS
-- ════════════════════════════════════════════════════════════

create table reports (
  id          uuid primary key default gen_random_uuid(),
  reporter_id uuid references profiles(id),
  type        text not null, -- listing, user, review, message
  target_id   text not null,
  reason      text,
  details     text,
  status      text default 'pending', -- pending, resolved, dismissed
  resolution  text,
  notes       text,
  resolved_by uuid references profiles(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index idx_reports_status on reports(status);
create index idx_reports_type on reports(type);

create trigger reports_updated_at before update on reports
  for each row execute function update_updated_at();

alter table reports enable row level security;

create policy "Users can create reports"
  on reports for insert with check (reporter_id = auth.uid());
create policy "Users can read own reports"
  on reports for select using (reporter_id = auth.uid() or is_admin());
create policy "Admins can manage reports"
  on reports for update using (is_admin());


-- ════════════════════════════════════════════════════════════
-- 31. PLATFORM SETTINGS
-- ════════════════════════════════════════════════════════════

create table platform_settings (
  key         text primary key,
  value       jsonb not null,
  updated_by  uuid references profiles(id),
  updated_at  timestamptz not null default now()
);

create trigger platform_settings_updated_at before update on platform_settings
  for each row execute function update_updated_at();

alter table platform_settings enable row level security;

create policy "Anyone can read settings"
  on platform_settings for select using (true);
create policy "Admins can manage settings"
  on platform_settings for all using (is_admin());


-- ════════════════════════════════════════════════════════════
-- 32. CALL LOGS
-- ════════════════════════════════════════════════════════════

create table call_logs (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id),
  caller_id       uuid references profiles(id),
  callee_id       uuid references profiles(id),
  status          text default 'initiated', -- initiated, ringing, active, ended, missed, rejected
  started_at      timestamptz,
  ended_at        timestamptz,
  duration_secs   int default 0,
  created_at      timestamptz not null default now()
);

create index idx_call_logs_conversation on call_logs(conversation_id);
create index idx_call_logs_caller on call_logs(caller_id);
create index idx_call_logs_callee on call_logs(callee_id);

alter table call_logs enable row level security;

create policy "Participants can read own call logs"
  on call_logs for select using (caller_id = auth.uid() or callee_id = auth.uid() or is_admin());
create policy "Users can create call logs"
  on call_logs for insert with check (caller_id = auth.uid());
create policy "Participants can update call logs"
  on call_logs for update using (caller_id = auth.uid() or callee_id = auth.uid());


-- ════════════════════════════════════════════════════════════
-- 33. NOTIFICATIONS (Realtime enabled)
-- ════════════════════════════════════════════════════════════

create table notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references profiles(id) on delete cascade,
  type       text not null, -- booking, order, message, system, call
  title      text,
  body       text,
  data       jsonb default '{}',
  read       boolean default false,
  created_at timestamptz not null default now()
);

create index idx_notifications_user on notifications(user_id);
create index idx_notifications_read on notifications(user_id, read);
create index idx_notifications_created on notifications(created_at desc);

alter table notifications enable row level security;

create policy "Users can read own notifications"
  on notifications for select using (user_id = auth.uid());
-- Client-side: users can only self-notify (e.g., test notifications).
-- Cross-user notifications (booking confirmations, etc.) are created server-side
-- via edge functions using the service role key, which bypasses RLS entirely.
create policy "Users can create own notifications"
  on notifications for insert with check (user_id = auth.uid());
create policy "Users can update own notifications"
  on notifications for update using (user_id = auth.uid());


-- ════════════════════════════════════════════════════════════
-- 34. PROVIDER VERIFICATION
-- ════════════════════════════════════════════════════════════

create table provider_verification (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references profiles(id) on delete cascade,
  type          text, -- individual, company
  business_name text,
  cac_number    text,
  documents     jsonb default '[]',
  status        text default 'pending', -- pending, approved, rejected, more_info
  reviewer_id   uuid references profiles(id),
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index idx_provider_verification_user on provider_verification(user_id);
create index idx_provider_verification_status on provider_verification(status);

create trigger provider_verification_updated_at before update on provider_verification
  for each row execute function update_updated_at();

alter table provider_verification enable row level security;

create policy "Users can read own verification"
  on provider_verification for select using (user_id = auth.uid() or is_admin());
create policy "Users can submit verification"
  on provider_verification for insert with check (user_id = auth.uid());
create policy "Admins can manage verification"
  on provider_verification for update using (is_admin());


-- ════════════════════════════════════════════════════════════
-- ENABLE REALTIME on key tables
-- ════════════════════════════════════════════════════════════

alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table admin_messages;
alter publication supabase_realtime add table notifications;
