/**
 * Loads the bundled demo catalogue into Supabase.
 *
 * Usage: npm run seed
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. Every record
 * is flagged as demo data and upserted by its stable external id, so the script
 * is safe to re-run.
 */
import { createClient } from '@supabase/supabase-js';
import { SEED_STORES } from '../src/lib/data/seed/stores';
import { SEED_COURIERS } from '../src/lib/data/seed/couriers';
import { SEED_OFFERS, SEED_PRODUCTS, SEED_SELLERS } from '../src/lib/data/seed/products';
import { SEED_LEARNING_COURSES, SEED_LEARNING_PLATFORMS } from '../src/lib/data/seed/learning';
import { SEED_PROMOTIONS, SEED_RESTRICTED_GOODS } from '../src/lib/data/seed/customs';
import { PRODUCT_CATEGORIES, CUSTOMS } from '../src/constants';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error(
    'Seed skipped: set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first.\n' +
      'Without Supabase the app already runs on the bundled demo data.',
  );
  process.exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false } });

async function upsert(table: string, rows: Array<Record<string, unknown>>, conflict: string) {
  if (rows.length === 0) return;
  const { error } = await db.from(table).upsert(rows, { onConflict: conflict });
  if (error) throw new Error(`${table}: ${error.message}`);
  console.log(`  ${table}: ${rows.length} ta yozuv`);
}

async function main() {
  console.log('PochtaShop demo ma’lumotlari yuklanmoqda...');

  await upsert(
    'stores',
    SEED_STORES.map((store) => ({
      slug: store.slug,
      name: store.name,
      country: store.country,
      is_demo: store.isDemo,
      payload: store,
    })),
    'slug',
  );

  await upsert(
    'store_categories',
    SEED_STORES.flatMap((store) =>
      store.categories.map((category) => ({ store_slug: store.slug, category })),
    ),
    'store_slug,category',
  );

  await upsert(
    'product_categories',
    PRODUCT_CATEGORIES.map((category) => ({ code: category.id, label: category.label })),
    'code',
  );

  await upsert(
    'products',
    SEED_PRODUCTS.map((product) => ({
      slug: product.slug,
      title: product.title,
      category: product.category,
      is_demo: product.isDemo,
      payload: product,
    })),
    'slug',
  );

  await upsert(
    'seller_profiles',
    SEED_SELLERS.map((seller) => ({ external_id: seller.id, payload: seller })),
    'external_id',
  );

  await upsert(
    'product_offers',
    SEED_OFFERS.map((offer) => ({ external_id: offer.id, payload: offer })),
    'external_id',
  );

  await upsert(
    'couriers',
    SEED_COURIERS.map((courier) => ({
      slug: courier.slug,
      name: courier.name,
      is_demo: courier.isDemo,
      is_verified: courier.isVerified,
      is_sponsored: courier.isSponsored,
      payload: courier,
    })),
    'slug',
  );

  await upsert(
    'courier_routes',
    SEED_COURIERS.flatMap((courier) =>
      courier.routes.map((route) => ({
        courier_slug: courier.slug,
        from_country: route.from,
        to_country: route.to,
      })),
    ),
    'courier_slug,from_country,to_country',
  );

  await upsert(
    'customs_rules',
    [
      { code: 'duty_free_limit', label: 'Bojsiz limit', value: CUSTOMS.DUTY_FREE_LIMIT_USD, unit: 'USD' },
      { code: 'monthly_allowance', label: "Oylik me'yor", value: CUSTOMS.MONTHLY_ALLOWANCE_USD, unit: 'USD' },
      { code: 'duty_rate', label: 'Boj stavkasi', value: CUSTOMS.DUTY_RATE, unit: 'ratio' },
      { code: 'vat_rate', label: 'QQS stavkasi', value: CUSTOMS.VAT_RATE, unit: 'ratio' },
      { code: 'clearance_fee', label: "Yig'im", value: CUSTOMS.CLEARANCE_FEE_UZS, unit: 'UZS' },
    ].map((rule) => ({
      ...rule,
      legal_source: CUSTOMS.LEGAL_SOURCE,
      effective_from: CUSTOMS.UPDATED_AT,
      changed_by: 'seed',
    })),
    'code',
  );

  await upsert(
    'restricted_goods',
    SEED_RESTRICTED_GOODS.map((good) => ({
      external_id: good.id,
      status: good.status,
      payload: good,
    })),
    'external_id',
  );

  await upsert(
    'prohibited_goods',
    SEED_RESTRICTED_GOODS.filter((good) => good.status === 'prohibited').map((good) => ({
      external_id: good.id,
      payload: good,
    })),
    'external_id',
  );

  await upsert(
    'learning_platforms',
    SEED_LEARNING_PLATFORMS.map((platform) => ({
      external_id: platform.id,
      payload: platform,
    })),
    'external_id',
  );

  await upsert(
    'learning_courses',
    SEED_LEARNING_COURSES.map((course) => ({
      external_id: course.id,
      platform_external_id: course.platformId,
      is_premium: course.isPremium,
      payload: course,
    })),
    'external_id',
  );

  await upsert(
    'learning_steps',
    SEED_LEARNING_COURSES.flatMap((course) =>
      course.steps.map((step) => ({
        external_id: step.id,
        course_external_id: course.id,
        step_order: step.order,
        kind: step.kind,
        payload: step,
      })),
    ),
    'external_id',
  );

  await upsert(
    'promotions',
    SEED_PROMOTIONS.map((promotion) => ({
      external_id: promotion.id,
      label: promotion.label,
      active_until: promotion.activeUntil,
      payload: promotion,
    })),
    'external_id',
  );

  await upsert(
    'subscription_plans',
    [
      { code: 'free', label: 'Bepul', price_uzs: 0 },
      { code: 'premium', label: 'Premium', price_uzs: 49_000 },
    ],
    'code',
  );

  console.log('Tayyor.');
}

main().catch((error: unknown) => {
  console.error('Seed xatosi:', error instanceof Error ? error.message : error);
  process.exit(1);
});
