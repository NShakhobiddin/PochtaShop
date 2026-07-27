import type { SellerReplyAnalysis } from '@/types';
import { sanitizeUserText } from '@/lib/ai/prompt-guard';

/**
 * Rule-based reading of a seller's reply.
 *
 * Kept free of server-only imports so it runs identically in the API route, in
 * the mock AI provider and in the browser-side static demo.
 */
export function analyseSellerReply(sellerText: string): SellerReplyAnalysis {
  const { text, injectionDetected } = sanitizeUserText(sellerText, 3000);
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
    translated: text.length > 0 ? `Sotuvchi xabari (demo tarjima): ${text}` : "Xabar bo'sh.",
    explanation:
      "Demo rejimda asl matn saqlanadi va asosiy xavf so'zlari tekshiriladi. To'liq tarjima uchun AI provayderni sozlang.",
    warnings,
  };
}
