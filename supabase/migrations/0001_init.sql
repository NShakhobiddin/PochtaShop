-- PochtaShop initial schema.
-- Every table uses a UUID primary key, created_at/updated_at, and deleted_at
-- where soft deletion is meaningful.

create extension if not exists "pgcrypto";

create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ---------------------------------------------------------------- users ---

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  telegram_id bigint not null unique,
  first_name text not null,
  last_name text,
  username text,
  photo_url text,
  role text not null default 'user' check (role in ('user', 'courier', 'admin')),
  tier text not null default 'free' check (tier in ('free', 'premium')),
  onboarding_completed boolean not null default false,
  courier_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists user_preferences (
  id uuid primary key default gen_random_uuid(),
  telegram_id bigint not null references users (telegram_id) on delete cascade,
  language text not null default 'uz',
  default_country text,
  priority text check (priority in ('price', 'speed', 'quality')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (telegram_id)
);

create table if not exists user_search_history (
  id uuid primary key default gen_random_uuid(),
  telegram_id bigint not null references users (telegram_id) on delete cascade,
  kind text not null check (kind in ('search', 'ai_analysis', 'customs_risk', 'customs_calculation', 'consultation')),
  title text not null,
  subtitle text,
  created_at timestamptz not null default now()
);
create index if not exists user_search_history_telegram_idx on user_search_history (telegram_id, created_at desc);

create table if not exists saved_items (
  id uuid primary key default gen_random_uuid(),
  telegram_id bigint not null references users (telegram_id) on delete cascade,
  kind text not null check (kind in ('product', 'store', 'courier', 'analysis', 'comparison', 'lesson')),
  ref_id text not null,
  title text not null,
  subtitle text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (telegram_id, kind, ref_id)
);

-- -------------------------------------------------------------- catalog ---
-- Reference entities keep their canonical shape in a jsonb `payload` column so
-- the catalog can evolve without a migration per field, while the columns that
-- are filtered/sorted on stay first-class.

create table if not exists stores (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  country text not null,
  is_demo boolean not null default true,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists store_categories (
  id uuid primary key default gen_random_uuid(),
  store_slug text not null references stores (slug) on delete cascade,
  category text not null,
  created_at timestamptz not null default now(),
  unique (store_slug, category)
);

create table if not exists store_ratings (
  id uuid primary key default gen_random_uuid(),
  store_slug text not null references stores (slug) on delete cascade,
  rating numeric(2, 1) not null,
  review_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists store_links (
  id uuid primary key default gen_random_uuid(),
  store_slug text not null references stores (slug) on delete cascade,
  kind text not null check (kind in ('site', 'affiliate', 'support')),
  url text not null,
  created_at timestamptz not null default now()
);

create table if not exists product_categories (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  category text not null,
  is_demo boolean not null default true,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists product_variants (
  id uuid primary key default gen_random_uuid(),
  product_slug text not null references products (slug) on delete cascade,
  variant_type text not null,
  label text not null,
  value text not null,
  available boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists seller_profiles (
  id uuid primary key default gen_random_uuid(),
  external_id text not null unique,
  store_slug text,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists product_offers (
  id uuid primary key default gen_random_uuid(),
  external_id text not null unique,
  product_slug text,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- ------------------------------------------------------------- couriers ---

create table if not exists couriers (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  is_demo boolean not null default true,
  is_verified boolean not null default false,
  is_sponsored boolean not null default false,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists courier_routes (
  id uuid primary key default gen_random_uuid(),
  courier_slug text not null references couriers (slug) on delete cascade,
  from_country text not null,
  to_country text not null,
  created_at timestamptz not null default now(),
  unique (courier_slug, from_country, to_country)
);

create table if not exists courier_tariffs (
  id uuid primary key default gen_random_uuid(),
  courier_slug text not null references couriers (slug) on delete cascade,
  from_country text not null,
  to_country text not null,
  service_type text not null check (service_type in ('economy', 'standard', 'express')),
  price_per_kg_uzs numeric(12, 2) not null,
  min_charge_uzs numeric(12, 2) not null default 0,
  min_weight_kg numeric(6, 2) not null default 0,
  delivery_days_min integer not null,
  delivery_days_max integer not null,
  volumetric_divisor integer not null default 6000,
  effective_from date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists courier_services (
  id uuid primary key default gen_random_uuid(),
  courier_slug text not null references couriers (slug) on delete cascade,
  code text not null,
  label text not null,
  created_at timestamptz not null default now(),
  unique (courier_slug, code)
);

create table if not exists courier_reviews (
  id uuid primary key default gen_random_uuid(),
  courier_slug text not null references couriers (slug) on delete cascade,
  review_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists courier_change_requests (
  id uuid primary key default gen_random_uuid(),
  courier_id text not null,
  submitted_by text not null,
  field text not null,
  previous_value text not null default '',
  new_value text not null default '',
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -------------------------------------------------------------- customs ---

create table if not exists customs_categories (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists customs_rules (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  label text not null,
  value numeric(12, 4) not null,
  unit text not null,
  legal_source text not null,
  effective_from date not null default current_date,
  previous_value numeric(12, 4),
  changed_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists customs_rules_code_idx on customs_rules (code, effective_from desc);

create table if not exists restricted_goods (
  id uuid primary key default gen_random_uuid(),
  external_id text not null unique,
  status text not null check (status in ('prohibited', 'restricted')),
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists prohibited_goods (
  id uuid primary key default gen_random_uuid(),
  external_id text not null unique,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists customs_calculations (
  id uuid primary key default gen_random_uuid(),
  telegram_id bigint references users (telegram_id) on delete set null,
  input jsonb not null,
  result jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists customs_risk_checks (
  id uuid primary key default gen_random_uuid(),
  telegram_id bigint references users (telegram_id) on delete set null,
  input jsonb not null,
  result jsonb not null,
  risk_level text not null check (risk_level in ('green', 'yellow', 'red')),
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------- learning ---

create table if not exists learning_platforms (
  id uuid primary key default gen_random_uuid(),
  external_id text not null unique,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists learning_courses (
  id uuid primary key default gen_random_uuid(),
  external_id text not null unique,
  platform_external_id text,
  is_premium boolean not null default false,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists learning_steps (
  id uuid primary key default gen_random_uuid(),
  external_id text not null unique,
  course_external_id text not null,
  step_order integer not null,
  kind text not null check (kind in ('reading', 'simulator', 'quiz')),
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists learning_progress (
  id uuid primary key default gen_random_uuid(),
  telegram_id bigint not null references users (telegram_id) on delete cascade,
  course_id text not null,
  completed_step_ids jsonb not null default '[]'::jsonb,
  last_step_id text,
  completed_at timestamptz,
  score integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (telegram_id, course_id)
);

create table if not exists learning_tests (
  id uuid primary key default gen_random_uuid(),
  course_external_id text not null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists learning_test_results (
  id uuid primary key default gen_random_uuid(),
  telegram_id bigint not null references users (telegram_id) on delete cascade,
  course_external_id text not null,
  score integer not null,
  passed boolean not null default false,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------------- ai ---

create table if not exists ai_requests (
  id uuid primary key default gen_random_uuid(),
  telegram_id bigint references users (telegram_id) on delete set null,
  feature text not null,
  provider text not null,
  -- Prompts are stored without user-uploaded binaries; images are deleted
  -- immediately after analysis.
  input_summary text,
  created_at timestamptz not null default now()
);

create table if not exists ai_results (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references ai_requests (id) on delete cascade,
  confidence text check (confidence in ('high', 'medium', 'low')),
  payload jsonb not null,
  error text,
  created_at timestamptz not null default now()
);

create table if not exists ai_feedback (
  id uuid primary key default gen_random_uuid(),
  result_id uuid references ai_results (id) on delete cascade,
  telegram_id bigint references users (telegram_id) on delete set null,
  helpful boolean not null,
  comment text,
  created_at timestamptz not null default now()
);

-- -------------------------------------------------------- consultations ---

create table if not exists consultations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  telegram_id bigint not null,
  type text not null,
  description text not null,
  product_url text,
  attachment_name text,
  contact_method text not null check (contact_method in ('telegram', 'phone')),
  contact_value text not null,
  preferred_time text not null default '',
  price_uzs integer not null default 0,
  status text not null default 'new'
    check (status in ('new', 'reviewing', 'need_info', 'accepted', 'in_progress', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists consultations_status_idx on consultations (status, created_at desc);

create table if not exists consultation_messages (
  id uuid primary key default gen_random_uuid(),
  consultation_id uuid not null references consultations (id) on delete cascade,
  author text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists assisted_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  telegram_id bigint not null,
  product_url text not null,
  variant text not null default '',
  quantity integer not null default 1,
  max_budget_uzs bigint not null default 0,
  note text,
  user_confirmed boolean not null default false,
  status text not null default 'new'
    check (status in ('new', 'reviewing', 'need_info', 'accepted', 'in_progress', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------- subscriptions ----

create table if not exists subscription_plans (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text not null,
  price_uzs integer not null default 0,
  features jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  telegram_id bigint not null references users (telegram_id) on delete cascade,
  plan_code text not null,
  status text not null default 'active' check (status in ('active', 'expired', 'cancelled')),
  activated_by text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  telegram_id bigint references users (telegram_id) on delete set null,
  subscription_id uuid references subscriptions (id) on delete set null,
  provider text not null default 'mock',
  amount_uzs integer not null,
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'refunded')),
  external_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------- promo, ads, social ---

create table if not exists promotions (
  id uuid primary key default gen_random_uuid(),
  external_id text not null unique,
  label text not null check (label in ('ad', 'partnership', 'ai_recommendation', 'verified_courier', 'users_choice')),
  active_until date,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists advertisements (
  id uuid primary key default gen_random_uuid(),
  advertiser text not null,
  target_type text not null check (target_type in ('store', 'courier', 'product')),
  target_id text not null,
  -- Paid placements never change organic ranking; they are only labelled.
  budget_uzs integer not null default 0,
  active_from date not null default current_date,
  active_until date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  subject text not null check (subject in ('store', 'courier')),
  subject_id text not null,
  author_telegram_id bigint not null,
  author_name text not null,
  rating integer not null check (rating between 1 and 5),
  body text not null,
  verified_purchase boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'published', 'rejected')),
  official_reply text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists reviews_subject_idx on reviews (subject_id, status);

create table if not exists review_verifications (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references reviews (id) on delete cascade,
  method text not null check (method in ('receipt', 'tracking', 'screenshot')),
  -- Only the fact of verification is kept; the document itself is deleted.
  verified boolean not null default false,
  verified_by text,
  created_at timestamptz not null default now()
);

create table if not exists review_reports (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references reviews (id) on delete cascade,
  reporter_telegram_id bigint,
  reason text not null,
  status text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- admin ---

create table if not exists admin_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  auth_user_id uuid,
  role text not null default 'admin' check (role in ('admin', 'moderator')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor text not null,
  action text not null,
  entity text not null,
  entity_id text not null,
  previous_value text,
  new_value text,
  created_at timestamptz not null default now()
);
create index if not exists audit_logs_created_idx on audit_logs (created_at desc);

-- ------------------------------------------------------------- triggers ---

do $$
declare
  t text;
begin
  for t in
    select table_name
    from information_schema.columns
    where table_schema = 'public' and column_name = 'updated_at'
  loop
    execute format(
      'drop trigger if exists set_updated_at on %I; create trigger set_updated_at before update on %I for each row execute function set_updated_at();',
      t, t
    );
  end loop;
end;
$$;
