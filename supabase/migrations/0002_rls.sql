-- Row Level Security.
--
-- Mini App traffic never reaches PostgREST directly: every request is
-- authenticated by Telegram initData on the Next.js server, which then talks to
-- Supabase with the service-role key. RLS is therefore configured to deny the
-- anon/authenticated roles by default, and to open read access only to the
-- public reference catalog.

alter table users enable row level security;
alter table user_preferences enable row level security;
alter table user_search_history enable row level security;
alter table saved_items enable row level security;
alter table consultations enable row level security;
alter table consultation_messages enable row level security;
alter table assisted_orders enable row level security;
alter table subscriptions enable row level security;
alter table payments enable row level security;
alter table learning_progress enable row level security;
alter table learning_test_results enable row level security;
alter table ai_requests enable row level security;
alter table ai_results enable row level security;
alter table ai_feedback enable row level security;
alter table customs_calculations enable row level security;
alter table customs_risk_checks enable row level security;
alter table review_verifications enable row level security;
alter table review_reports enable row level security;
alter table courier_change_requests enable row level security;
alter table admin_users enable row level security;
alter table audit_logs enable row level security;

-- Public, read-only reference data.
alter table stores enable row level security;
alter table store_categories enable row level security;
alter table store_ratings enable row level security;
alter table store_links enable row level security;
alter table products enable row level security;
alter table product_variants enable row level security;
alter table product_offers enable row level security;
alter table product_categories enable row level security;
alter table seller_profiles enable row level security;
alter table couriers enable row level security;
alter table courier_routes enable row level security;
alter table courier_tariffs enable row level security;
alter table courier_services enable row level security;
alter table customs_rules enable row level security;
alter table customs_categories enable row level security;
alter table restricted_goods enable row level security;
alter table prohibited_goods enable row level security;
alter table learning_platforms enable row level security;
alter table learning_courses enable row level security;
alter table learning_steps enable row level security;
alter table learning_tests enable row level security;
alter table promotions enable row level security;
alter table advertisements enable row level security;
alter table reviews enable row level security;
alter table subscription_plans enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array[
    'stores', 'store_categories', 'store_ratings', 'store_links',
    'products', 'product_variants', 'product_offers', 'product_categories',
    'seller_profiles', 'couriers', 'courier_routes', 'courier_tariffs',
    'courier_services', 'customs_rules', 'customs_categories',
    'restricted_goods', 'prohibited_goods', 'learning_platforms',
    'learning_courses', 'learning_steps', 'learning_tests', 'promotions',
    'advertisements', 'subscription_plans'
  ]
  loop
    execute format('drop policy if exists "public read" on %I;', t);
    execute format(
      'create policy "public read" on %I for select to anon, authenticated using (deleted_at is null);',
      t
    );
  exception
    when undefined_column then
      execute format(
        'create policy "public read" on %I for select to anon, authenticated using (true);',
        t
      );
  end loop;
end;
$$;

-- Published reviews are public; pending/rejected ones are not.
drop policy if exists "public read" on reviews;
create policy "public read published reviews" on reviews
  for select to anon, authenticated
  using (status = 'published' and deleted_at is null);

-- Admin panel signs in with Supabase Auth; admins may read operational tables.
create or replace function is_admin() returns boolean as $$
  select exists (
    select 1 from admin_users
    where auth_user_id = auth.uid() and deleted_at is null
  );
$$ language sql stable security definer;

do $$
declare
  t text;
begin
  foreach t in array array[
    'users', 'consultations', 'assisted_orders', 'reviews', 'audit_logs',
    'courier_change_requests', 'ai_requests', 'ai_results', 'subscriptions',
    'payments'
  ]
  loop
    execute format('drop policy if exists "admin read" on %I;', t);
    execute format('create policy "admin read" on %I for select to authenticated using (is_admin());', t);
    execute format('drop policy if exists "admin write" on %I;', t);
    execute format('create policy "admin write" on %I for all to authenticated using (is_admin()) with check (is_admin());', t);
  end loop;
end;
$$;
