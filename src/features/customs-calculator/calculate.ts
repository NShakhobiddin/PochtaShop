import { CUSTOMS, CUSTOMS_DISCLAIMER } from '@/constants';
import type { CustomsCalculationInput, CustomsCalculationResult, RiskLevel } from '@/types';
import { toUsd, toUzs } from '@/lib/currency';
import { formatUzs } from '@/lib/currency';

/**
 * Estimates the customs cost of a personal international courier shipment.
 *
 * Model (demo parameters, see CUSTOMS in constants):
 *   taxable base = max(0, goods value in USD + already used monthly allowance
 *                       − duty-free limit)
 *   duty = base × duty rate
 *   VAT  = (base + duty) × VAT rate
 *   plus a fixed clearance fee.
 *
 * The result is explicitly an estimate — the customs authority decides.
 */
export function calculateCustoms(input: CustomsCalculationInput): CustomsCalculationResult {
  const goodsValueUsd = toUsd(input.declaredValue, input.currency) * input.quantity;
  const goodsCostUzs = toUzs(input.declaredValue, input.currency) * input.quantity;

  const cumulativeUsd = goodsValueUsd + input.previousMonthlyValueUsd;
  const taxableBaseUsd = Math.max(0, cumulativeUsd - CUSTOMS.DUTY_FREE_LIMIT_USD);
  // Only the portion belonging to this shipment is charged here.
  const shipmentShare = cumulativeUsd > 0 ? Math.min(1, goodsValueUsd / cumulativeUsd) : 0;
  const chargeableUsd = taxableBaseUsd * shipmentShare;

  const chargeableUzs = toUzs(chargeableUsd, 'USD');
  const dutyUzs = chargeableUzs * CUSTOMS.DUTY_RATE;
  const vatUzs = (chargeableUzs + dutyUzs) * CUSTOMS.VAT_RATE;
  const clearanceFeeUzs = chargeableUsd > 0 ? CUSTOMS.CLEARANCE_FEE_UZS : 0;
  const totalCustomsUzs = dutyUzs + vatUzs + clearanceFeeUzs;

  const explanation = buildExplanation({
    goodsValueUsd,
    chargeableUsd,
    dutyUzs,
    vatUzs,
    clearanceFeeUzs,
    input,
  });

  return {
    goodsValueUsd: round2(goodsValueUsd),
    dutyFreeLimitUsd: CUSTOMS.DUTY_FREE_LIMIT_USD,
    taxableBaseUsd: round2(chargeableUsd),
    dutyUzs: Math.round(dutyUzs),
    vatUzs: Math.round(vatUzs),
    clearanceFeeUzs: Math.round(clearanceFeeUzs),
    totalCustomsUzs: Math.round(totalCustomsUzs),
    shippingCostUzs: Math.round(input.shippingCostUzs),
    goodsCostUzs: Math.round(goodsCostUzs),
    grandTotalUzs: Math.round(goodsCostUzs + input.shippingCostUzs + totalCustomsUzs),
    riskLevel: estimateLevel(goodsValueUsd, input),
    explanation,
    legalSource: CUSTOMS.LEGAL_SOURCE,
    updatedAt: CUSTOMS.UPDATED_AT,
    disclaimer: CUSTOMS_DISCLAIMER,
  };
}

interface ExplanationInput {
  goodsValueUsd: number;
  chargeableUsd: number;
  dutyUzs: number;
  vatUzs: number;
  clearanceFeeUzs: number;
  input: CustomsCalculationInput;
}

function buildExplanation({
  goodsValueUsd,
  chargeableUsd,
  dutyUzs,
  vatUzs,
  clearanceFeeUzs,
  input,
}: ExplanationInput): string[] {
  const lines: string[] = [];
  lines.push(
    `Tovar qiymati: ${goodsValueUsd.toFixed(2)} USD (${input.quantity} dona × ${input.declaredValue} ${input.currency}).`,
  );

  if (input.previousMonthlyValueUsd > 0) {
    lines.push(
      `Oy davomidagi oldingi jo'natmalar: ${input.previousMonthlyValueUsd.toFixed(2)} USD. Ular ham limitga qo'shiladi.`,
    );
  }

  if (chargeableUsd <= 0) {
    lines.push(
      `Qiymat bojsiz limitdan (${CUSTOMS.DUTY_FREE_LIMIT_USD} USD) oshmadi — boj kutilmaydi.`,
    );
    return lines;
  }

  lines.push(
    `Limitdan oshgan qism: ${chargeableUsd.toFixed(2)} USD. Boj va QQS shu qismdan hisoblanadi.`,
  );
  lines.push(`Bojxona boji (${Math.round(CUSTOMS.DUTY_RATE * 100)}%): ${formatUzs(dutyUzs)}.`);
  lines.push(`QQS (${Math.round(CUSTOMS.VAT_RATE * 100)}%): ${formatUzs(vatUzs)}.`);
  if (clearanceFeeUzs > 0) lines.push(`Rasmiylashtirish yig'imi: ${formatUzs(clearanceFeeUzs)}.`);
  return lines;
}

function estimateLevel(goodsValueUsd: number, input: CustomsCalculationInput): RiskLevel {
  if (input.purpose === 'resale' || input.purpose === 'business') return 'red';
  if (goodsValueUsd + input.previousMonthlyValueUsd > CUSTOMS.MONTHLY_ALLOWANCE_USD) return 'red';
  if (goodsValueUsd > CUSTOMS.DUTY_FREE_LIMIT_USD) return 'yellow';
  if (input.quantity >= 5) return 'yellow';
  return 'green';
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
