import type {
  AIConfidence,
  AIRecommendationOption,
  AIResult,
  Courier,
  Product,
  ProductOffer,
  ProductSearchCriteria,
  RecommendationType,
  RestrictedGood,
  SellerProfile,
  Store,
} from '@/types';
import { toUzs } from '@/lib/currency';
import { cheapestQuote, quoteCourier, reliabilityScore } from '@/features/courier-comparison/quote';
import { calculateCustoms } from '@/features/customs-calculator/calculate';
import { evaluateCustomsRisk } from '@/features/customs-risk/risk';

export interface RecommendationContext {
  products: Product[];
  offers: ProductOffer[];
  stores: Store[];
  sellers: SellerProfile[];
  couriers: Courier[];
  restrictedGoods: RestrictedGood[];
}

interface Candidate {
  product: Product;
  offer: ProductOffer;
  store: Store;
  seller: SellerProfile;
  courier: Courier;
  shippingUzs: number;
  deliveryDays: [number, number];
  productUzs: number;
  customsUzs: number;
  totalUzs: number;
  reliability: number;
  customsLevel: 'green' | 'yellow' | 'red';
  customsNote: string;
}

/**
 * Deterministic recommendation engine.
 *
 * It scores every (offer × courier) combination on the catalogue and returns
 * the cheapest, fastest and most reliable option. The AI layer wraps this with
 * natural-language reasoning, but the numbers always come from here so the
 * figures a user sees are reproducible.
 */
export function buildRecommendations(
  criteria: ProductSearchCriteria,
  context: RecommendationContext,
): AIResult {
  const products = matchProducts(criteria, context.products);

  if (products.length === 0) {
    return {
      summary:
        "Mahsulotni aniq taniy olmadim. Nomini boshqacha yozing, rasm yuboring yoki do'kon havolasini kiriting.",
      confidence: 'low',
      confidenceReason:
        "Katalogdan mos mahsulot topilmadi, shuning uchun narx va yetkazish hisoblanmadi.",
      recommendedOptions: [],
      missingInformation: ["Mahsulotning aniq nomi yoki havolasi"],
      nextActions: [
        "Mahsulot nomini brend va model bilan yozing",
        "Mahsulot rasmini yoki screenshotini yuklang",
        "Do'kon havolasini yuboring",
      ],
    };
  }

  const candidates = buildCandidates(criteria, products, context);

  if (candidates.length === 0) {
    return {
      summary: "Tanlangan shartlar bo'yicha mos variant topilmadi.",
      confidence: 'low',
      confidenceReason: "Filtrlarga (budjet, davlat, muddat) mos taklif qolmadi.",
      recommendedOptions: [],
      missingInformation: [],
      nextActions: ['Budjetni oshiring yoki davlat filtrini kengaytiring'],
    };
  }

  const cheapest = pickBy(candidates, (a, b) => a.totalUzs - b.totalUzs);
  const fastest = pickBy(
    candidates,
    (a, b) => a.deliveryDays[1] - b.deliveryDays[1] || a.totalUzs - b.totalUzs,
  );
  const safest = pickBy(
    candidates,
    (a, b) => safetyScore(b) - safetyScore(a) || a.totalUzs - b.totalUzs,
  );

  const options: AIRecommendationOption[] = [];
  const seen = new Set<string>();
  for (const [type, candidate] of [
    ['cheapest', cheapest],
    ['fastest', fastest],
    ['safest', safest],
  ] as Array<[RecommendationType, Candidate]>) {
    const key = `${type}:${candidate.offer.id}:${candidate.courier.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    options.push(toOption(type, candidate));
  }

  const missing = collectMissingInformation(criteria);
  const confidence = deriveConfidence(criteria, candidates.length, missing.length);

  return {
    summary: buildSummary(cheapest, fastest, safest),
    confidence,
    confidenceReason: buildConfidenceReason(confidence, missing),
    recommendedOptions: options,
    missingInformation: missing,
    nextActions: [
      "Uchta variantni taqqoslang",
      "Tanlagan kuryeringiz tarifini tekshiring",
      "Bojxona xavfini ko'rib chiqing",
    ],
  };
}

function matchProducts(criteria: ProductSearchCriteria, products: Product[]): Product[] {
  const query = criteria.query.trim().toLowerCase();
  if (!query) return criteria.category ? products.filter((p) => p.category === criteria.category) : products;

  const words = query.split(/\s+/).filter((word) => word.length > 2);
  const scored = products
    .map((product) => {
      const haystack = `${product.title} ${product.brand ?? ''} ${product.description} ${product.keywords.join(' ')}`.toLowerCase();
      const score = words.reduce((sum, word) => (haystack.includes(word) ? sum + 1 : sum), 0);
      return { product, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length > 0) return scored.map((entry) => entry.product);
  return criteria.category ? products.filter((p) => p.category === criteria.category) : [];
}

function buildCandidates(
  criteria: ProductSearchCriteria,
  products: Product[],
  context: RecommendationContext,
): Candidate[] {
  const candidates: Candidate[] = [];
  const quantity = criteria.quantity ?? 1;

  for (const product of products) {
    const offers = context.offers.filter((offer) => offer.productId === product.id && offer.inStock);

    for (const offer of offers) {
      if (criteria.countries?.length && !criteria.countries.includes(offer.shippingFrom)) continue;

      const store = context.stores.find((item) => item.id === offer.storeId);
      const seller = context.sellers.find((item) => item.id === offer.sellerId);
      if (!store || !seller) continue;
      if (criteria.requireAuthentic && store.authenticityScore < 70) continue;

      const productUzs = toUzs(offer.price.amount, offer.price.currency) * quantity;

      for (const courier of context.couriers) {
        const quotes = quoteCourier(courier, {
          fromCountry: offer.shippingFrom,
          actualWeightKg: product.weightKg * quantity,
          dimensionsCm: product.dimensionsCm,
        });
        const quote = cheapestQuote(quotes);
        if (!quote) continue;
        if (product.category === 'electronics' && !courier.acceptsElectronics) continue;

        const totalDelivery: [number, number] = [
          offer.estimatedDeliveryDays[0] + quote.deliveryDays[0],
          offer.estimatedDeliveryDays[1] + quote.deliveryDays[1],
        ];
        if (criteria.maxDeliveryDays && totalDelivery[1] > criteria.maxDeliveryDays) continue;

        const customs = calculateCustoms({
          category: product.category,
          itemName: product.title,
          quantity,
          declaredValue: offer.price.amount,
          currency: offer.price.currency,
          weightKg: product.weightKg * quantity,
          shippingCostUzs: quote.costUzs,
          fromCountry: offer.shippingFrom,
          courierId: courier.id,
          previousMonthlyValueUsd: 0,
          purpose: 'personal',
        });

        const totalUzs = productUzs + quote.costUzs + customs.totalCustomsUzs;
        if (criteria.maxBudgetUzs && totalUzs > criteria.maxBudgetUzs) continue;

        const risk = evaluateCustomsRisk(
          {
            itemName: product.title,
            category: product.category,
            declaredValue: offer.price.amount,
            currency: offer.price.currency,
            quantity,
            weightKg: product.weightKg * quantity,
            fromCountry: offer.shippingFrom,
            purpose: 'personal',
            hasBrandLogo: Boolean(product.brand),
          },
          context.restrictedGoods,
        );

        candidates.push({
          product,
          offer,
          store,
          seller,
          courier,
          shippingUzs: quote.costUzs,
          deliveryDays: totalDelivery,
          productUzs,
          customsUzs: customs.totalCustomsUzs,
          totalUzs,
          reliability: reliabilityScore(courier),
          customsLevel: risk.level,
          customsNote: risk.reasons[0] ?? risk.title,
        });
      }
    }
  }

  return candidates;
}

function safetyScore(candidate: Candidate): number {
  let score = candidate.reliability;
  score += candidate.store.authenticityScore / 2;
  score += candidate.seller.rating * 6;
  if (candidate.seller.officialStore) score += 15;
  if (candidate.store.buyerProtection) score += 8;
  if (candidate.store.returnsSupported) score += 6;
  if (candidate.customsLevel === 'yellow') score -= 10;
  if (candidate.customsLevel === 'red') score -= 40;
  return score;
}

function pickBy(candidates: Candidate[], compare: (a: Candidate, b: Candidate) => number): Candidate {
  const sorted = [...candidates].sort(compare);
  const first = sorted[0];
  // buildCandidates guarantees a non-empty list before this is called.
  if (!first) throw new Error('No candidates available');
  return first;
}

function toOption(type: RecommendationType, candidate: Candidate): AIRecommendationOption {
  return {
    type,
    product: {
      id: candidate.product.id,
      title: candidate.product.title,
      imageEmoji: candidate.product.imageEmoji,
      variantNote: candidate.product.variants[0]?.label,
    },
    store: {
      id: candidate.store.id,
      name: candidate.store.name,
      logoEmoji: candidate.store.logoEmoji,
      country: candidate.store.country,
      url: candidate.store.url,
    },
    seller: {
      id: candidate.seller.id,
      name: candidate.seller.name,
      rating: candidate.seller.rating,
      salesCount: candidate.seller.salesCount,
      officialStore: candidate.seller.officialStore,
    },
    courier: {
      id: candidate.courier.id,
      name: candidate.courier.name,
      logoEmoji: candidate.courier.logoEmoji,
      deliveryDays: candidate.deliveryDays,
    },
    estimatedCost: {
      productUzs: Math.round(candidate.productUzs),
      shippingUzs: Math.round(candidate.shippingUzs),
      customsUzs: Math.round(candidate.customsUzs),
      totalUzs: Math.round(candidate.totalUzs),
    },
    customsRisk: { level: candidate.customsLevel, note: candidate.customsNote },
    reasons: buildReasons(type, candidate),
    warnings: buildWarnings(candidate),
    sponsored: candidate.offer.isSponsored,
    affiliateUrl: candidate.offer.affiliateUrl,
  };
}

function buildReasons(type: RecommendationType, candidate: Candidate): string[] {
  const reasons: string[] = [];
  if (type === 'cheapest') {
    reasons.push(
      `Jami xarajat eng past: mahsulot, yetkazish va taxminiy bojxona birga hisoblandi.`,
    );
  }
  if (type === 'fastest') {
    reasons.push(
      `Eng qisqa muddat: ${candidate.courier.name} orqali ${candidate.deliveryDays[0]}–${candidate.deliveryDays[1]} kun.`,
    );
  }
  if (type === 'safest') {
    reasons.push(
      `Sotuvchi reytingi ${candidate.seller.rating.toFixed(1)}, ${candidate.seller.salesCount.toLocaleString('uz-UZ')} sotuv.`,
    );
    if (candidate.seller.officialStore) reasons.push("Rasmiy do'kon — original ehtimoli yuqoriroq.");
    if (candidate.store.buyerProtection) reasons.push('Xaridor himoyasi mavjud.');
  }
  if (candidate.courier.trackingAvailable) reasons.push('Kuryerda kuzatuv mavjud.');
  return reasons;
}

function buildWarnings(candidate: Candidate): string[] {
  const warnings: string[] = [];
  if (!candidate.store.returnsSupported) warnings.push("Bu do'konda qaytarish qo'llab-quvvatlanmaydi.");
  if (!candidate.store.shipsDirectToUzbekistan) {
    warnings.push("Do'kon O'zbekistonga to'g'ridan-to'g'ri yubormaydi — kuryer ombori kerak.");
  }
  if (candidate.store.authenticityScore < 60) {
    warnings.push("Bu platformada soxta tovar ehtimoli yuqoriroq. Sotuvchini alohida tekshiring.");
  }
  if (candidate.customsLevel !== 'green') warnings.push(candidate.customsNote);
  if (!candidate.courier.insuranceAvailable) warnings.push("Kuryerda sug'urta yo'q.");
  return warnings;
}

function buildSummary(cheapest: Candidate, fastest: Candidate, safest: Candidate): string {
  return (
    `Eng arzon variant — ${cheapest.store.name} (${cheapest.courier.name}). ` +
    `Eng tez — ${fastest.courier.name}, ${fastest.deliveryDays[0]}–${fastest.deliveryDays[1]} kun. ` +
    `Eng ishonchli — ${safest.store.name}, sotuvchi reytingi ${safest.seller.rating.toFixed(1)}.`
  );
}

function collectMissingInformation(criteria: ProductSearchCriteria): string[] {
  const missing: string[] = [];
  if (!criteria.maxBudgetUzs) missing.push('Maksimal budjet');
  if (criteria.requireAuthentic === undefined) missing.push('Original bo‘lishi shartmi');
  if (!criteria.countries?.length) missing.push('Qaysi davlatlardan qidirish');
  if (!criteria.size && !criteria.color && !criteria.model) missing.push('Rang, o‘lcham yoki model');
  return missing;
}

function deriveConfidence(
  criteria: ProductSearchCriteria,
  candidateCount: number,
  missingCount: number,
): AIConfidence {
  if (candidateCount >= 3 && missingCount <= 1) return 'high';
  if (candidateCount >= 2 && missingCount <= 3) return 'medium';
  if (criteria.imageProvided && missingCount > 3) return 'low';
  return candidateCount > 0 ? 'medium' : 'low';
}

function buildConfidenceReason(confidence: AIConfidence, missing: string[]): string {
  if (confidence === 'high') {
    return "Mahsulot, narx va kuryer tariflari aniqlandi, muhim ma'lumotlar to'liq.";
  }
  if (confidence === 'medium') {
    return missing.length > 0
      ? `Narx va yetkazish hisoblandi, lekin quyidagilar noaniq: ${missing.join(', ')}.`
      : 'Narx tasdiqlangan, lekin ba’zi ma’lumotlar taxminiy.';
  }
  return "Mahsulot yoki uning xususiyatlari aniq emas — natija taxminiy.";
}
