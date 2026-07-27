import type {
  AIProvider,
  AnalyzeProductInput,
  AnalyzeScreenshotInput,
  AIResult,
  CompatibilityInput,
  CompatibilityResult,
  EvaluateCustomsRiskInput,
  GenerateSellerMessageInput,
  ReviewSummary,
  ScreenshotAnalysis,
  SellerMessageDraft,
  SellerReplyAnalysis,
  SummarizeReviewsInput,
  TranslateSellerMessageInput,
} from '@/types';
import { getDataSource } from '@/lib/data';
import { buildRecommendations } from '@/features/recommendations/engine';
import { evaluateCustomsRisk } from '@/features/customs-risk/risk';
import { checkCompatibility } from '@/features/product-search/compatibility';
import { SELLER_TOPICS, translateTopic } from '@/features/seller-assistant/phrasebook';
import { sanitizeUserText } from './prompt-guard';

/**
 * Deterministic provider used by default and in tests.
 *
 * It produces the same structured envelope as the hosted providers, backed by
 * the rule engines, so the whole product works end-to-end without an API key.
 */
export class MockAIProvider implements AIProvider {
  readonly name = 'mock';

  async analyzeProduct(input: AnalyzeProductInput): Promise<AIResult> {
    const data = getDataSource();
    const [products, stores, couriers, restrictedGoods] = await Promise.all([
      data.listProducts(),
      data.listStores(),
      data.listCouriers(),
      data.listRestrictedGoods(),
    ]);

    const offers = (
      await Promise.all(products.map((product) => data.listOffers(product.id)))
    ).flat();
    const sellerIds = Array.from(new Set(offers.map((offer) => offer.sellerId)));
    const sellers = (await Promise.all(sellerIds.map((id) => data.getSeller(id)))).filter(
      (seller): seller is NonNullable<typeof seller> => seller !== null,
    );

    return buildRecommendations(input.criteria, {
      products,
      offers,
      stores,
      sellers,
      couriers,
      restrictedGoods,
    });
  }

  async generateRecommendations(input: AnalyzeProductInput): Promise<AIResult> {
    return this.analyzeProduct(input);
  }

  async analyzeScreenshot(input: AnalyzeScreenshotInput): Promise<ScreenshotAnalysis> {
    // Without a vision model the assistant explains what it can infer and
    // says plainly what it could not determine.
    return {
      platform: "Aniqlanmadi (demo rejim)",
      stage: 'Mahsulot sahifasi',
      stageExplanation:
        "Screenshot qabul qilindi. Demo rejimda platforma va bosqich taxminan aniqlanadi. To'liq tahlil uchun AI provayderni sozlang.",
      translatedElements: [
        { original: '加入购物车', translated: "Savatchaga qo'shish" },
        { original: '立即购买', translated: 'Hozir sotib olish' },
        { original: '颜色分类', translated: 'Rang tanlash' },
        { original: '运费', translated: 'Yetkazish narxi' },
      ],
      nextStep:
        "Rang va o'lchamni tanlang, so'ng savatchaga qo'shing. Manzil bosqichida kuryer ombori manzilini kiriting.",
      warnings: [
        "Yetkazish manzili sifatida uy manzilingizni emas, kuryer ombori manzilini kiriting.",
        `Yuklangan fayl (${input.fileName}) tahlildan so'ng o'chiriladi.`,
      ],
      confidence: 'low',
    };
  }

  async generateSellerMessage(input: GenerateSellerMessageInput): Promise<SellerMessageDraft> {
    const { text } = sanitizeUserText(input.userText, 1500);
    return translateTopic(input.topicId, text, input.language);
  }

  async translateSellerMessage(input: TranslateSellerMessageInput): Promise<SellerReplyAnalysis> {
    const { text, injectionDetected } = sanitizeUserText(input.sellerText, 3000);
    const warnings: string[] = [];

    if (/预售|pre-?order|ön sipariş/i.test(text)) {
      warnings.push("Sotuvchi oldindan buyurtma (pre-order) haqida yozmoqda — yetkazish kechikadi.");
    }
    if (/仿|replica|copy|1:1/i.test(text)) {
      warnings.push("Javobda nusxa (replica) haqida ishora bor. Original emasligi mumkin.");
    }
    if (/no refund|不退|iade yok/i.test(text)) {
      warnings.push("Sotuvchi qaytarishni qabul qilmasligini yozmoqda.");
    }
    if (injectionDetected) {
      warnings.push("Xabarda tizimga ta'sir qilishga urinish belgilari bor edi, ular olib tashlandi.");
    }

    return {
      translated:
        text.length > 0
          ? `Sotuvchi xabari (demo tarjima): ${text}`
          : "Xabar bo'sh.",
      explanation:
        "Demo rejimda asl matn saqlanadi va asosiy xavf so'zlari tekshiriladi. To'liq tarjima uchun AI provayderni sozlang.",
      warnings,
    };
  }

  async evaluateCustomsRisk(input: EvaluateCustomsRiskInput): Promise<AIResult> {
    const restrictedGoods = await getDataSource().listRestrictedGoods();
    const risk = evaluateCustomsRisk(
      {
        itemName: input.itemName,
        category: input.category,
        declaredValue: input.declaredValue,
        currency: input.currency,
        quantity: input.quantity,
        weightKg: input.weightKg,
        fromCountry: input.fromCountry,
        purpose: input.purpose,
      },
      restrictedGoods,
    );

    return {
      summary: risk.title,
      confidence: risk.reasons.length > 1 ? 'high' : 'medium',
      confidenceReason:
        risk.reasons.length > 1
          ? "Bir nechta xavf omili aniqlandi va ular qoidalar bazasiga asoslangan."
          : "Baholash kiritilgan ma'lumotlarga asoslandi; tovar tavsifi to'liq emas.",
      recommendedOptions: [],
      missingInformation: risk.possibleDocuments,
      nextActions: risk.nextSteps,
    };
  }

  async summarizeReviews(input: SummarizeReviewsInput): Promise<ReviewSummary> {
    const positives: string[] = [];
    const negatives: string[] = [];

    for (const review of input.reviews.slice(0, 50)) {
      const { text } = sanitizeUserText(review, 500);
      if (/yaxshi|zo'r|tez|sifatli|good|great/i.test(text)) positives.push(text);
      else if (/yomon|sekin|sindi|bad|broken|kech/i.test(text)) negatives.push(text);
    }

    const duplicates = input.reviews.length - new Set(input.reviews).size;

    return {
      positives: positives.slice(0, 5),
      negatives: negatives.slice(0, 5),
      fakeReviewSuspicion: duplicates > 3 ? 'high' : duplicates > 0 ? 'medium' : 'low',
      verdict:
        positives.length > negatives.length
          ? "Sharhlar asosan ijobiy, lekin salbiylarini ham o'qing."
          : "Salbiy sharhlar sezilarli — sotuvchini diqqat bilan tekshiring.",
    };
  }

  async checkCompatibility(input: CompatibilityInput): Promise<CompatibilityResult> {
    return checkCompatibility(input.category, input.answers);
  }
}

export { SELLER_TOPICS };
