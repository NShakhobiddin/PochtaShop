import { describe, expect, it } from 'vitest';
import { calculateCustoms } from '@/features/customs-calculator/calculate';
import {
  evaluateCommercialIntent,
  evaluateCustomsRisk,
} from '@/features/customs-risk/risk';
import { explainDuty } from '@/features/customs-risk/duty-explanation';
import { SEED_RESTRICTED_GOODS } from '@/lib/data/seed/customs';
import { CUSTOMS } from '@/constants';
import type { CustomsCalculationInput, CustomsRiskInput } from '@/types';

const baseCalculation: CustomsCalculationInput = {
  category: 'electronics',
  itemName: 'Simsiz quloqchin',
  quantity: 1,
  declaredValue: 80,
  currency: 'USD',
  weightKg: 0.5,
  shippingCostUzs: 50_000,
  fromCountry: 'CN',
  previousMonthlyValueUsd: 0,
  purpose: 'personal',
};

describe('calculateCustoms', () => {
  it('charges nothing below the duty-free limit', () => {
    const result = calculateCustoms(baseCalculation);

    expect(result.goodsValueUsd).toBe(80);
    expect(result.dutyUzs).toBe(0);
    expect(result.vatUzs).toBe(0);
    expect(result.clearanceFeeUzs).toBe(0);
    expect(result.totalCustomsUzs).toBe(0);
    expect(result.riskLevel).toBe('green');
  });

  it('taxes only the amount above the limit', () => {
    const result = calculateCustoms({ ...baseCalculation, declaredValue: 200 });

    expect(result.taxableBaseUsd).toBe(200 - CUSTOMS.DUTY_FREE_LIMIT_USD);
    expect(result.dutyUzs).toBeGreaterThan(0);
    // VAT applies to the base plus the duty.
    expect(result.vatUzs).toBeGreaterThan(0);
    expect(result.clearanceFeeUzs).toBe(CUSTOMS.CLEARANCE_FEE_UZS);
  });

  it('counts earlier shipments in the same month towards the allowance', () => {
    const withoutHistory = calculateCustoms({ ...baseCalculation, declaredValue: 90 });
    const withHistory = calculateCustoms({
      ...baseCalculation,
      declaredValue: 90,
      previousMonthlyValueUsd: 90,
    });

    expect(withoutHistory.totalCustomsUzs).toBe(0);
    expect(withHistory.totalCustomsUzs).toBeGreaterThan(0);
  });

  it('includes goods and shipping in the grand total', () => {
    const result = calculateCustoms(baseCalculation);
    expect(result.grandTotalUzs).toBe(
      result.goodsCostUzs + result.shippingCostUzs + result.totalCustomsUzs,
    );
  });

  it('always attaches the estimate disclaimer and a legal source', () => {
    const result = calculateCustoms(baseCalculation);
    expect(result.disclaimer).toContain('taxminiy');
    expect(result.legalSource.length).toBeGreaterThan(0);
    expect(result.updatedAt).toBe(CUSTOMS.UPDATED_AT);
  });

  it('raises the risk level for commercial purposes', () => {
    expect(calculateCustoms({ ...baseCalculation, purpose: 'resale' }).riskLevel).toBe('red');
  });

  it('multiplies the declared value by the quantity', () => {
    const result = calculateCustoms({ ...baseCalculation, declaredValue: 50, quantity: 4 });
    expect(result.goodsValueUsd).toBe(200);
  });
});

const baseRisk: CustomsRiskInput = {
  itemName: 'Simsiz quloqchin',
  category: 'electronics',
  declaredValue: 50,
  currency: 'USD',
  quantity: 1,
  weightKg: 0.5,
  fromCountry: 'CN',
  purpose: 'personal',
};

describe('evaluateCustomsRisk', () => {
  it('returns green for an ordinary personal purchase', () => {
    const result = evaluateCustomsRisk(baseRisk, SEED_RESTRICTED_GOODS);
    expect(result.level).toBe('green');
    expect(result.needsConsultation).toBe(false);
    expect(result.checkList.length).toBeGreaterThan(0);
  });

  it('returns red for goods matching a prohibited category', () => {
    const result = evaluateCustomsRisk(
      { ...baseRisk, itemName: 'Taktik pichoq' },
      SEED_RESTRICTED_GOODS,
    );
    expect(result.level).toBe('red');
    expect(result.needsConsultation).toBe(true);
  });

  it('flags restricted goods such as power banks', () => {
    const result = evaluateCustomsRisk(
      { ...baseRisk, itemName: 'Powerbank 20000 mAh' },
      SEED_RESTRICTED_GOODS,
    );
    expect(result.level).not.toBe('green');
    expect(result.possibleDocuments.length).toBeGreaterThan(0);
  });

  it('escalates on high quantities', () => {
    const result = evaluateCustomsRisk({ ...baseRisk, quantity: 12 }, SEED_RESTRICTED_GOODS);
    expect(result.score).toBeGreaterThanOrEqual(25);
  });

  it('escalates when the purpose is resale', () => {
    const result = evaluateCustomsRisk({ ...baseRisk, purpose: 'resale' }, SEED_RESTRICTED_GOODS);
    expect(result.reasons.join(' ')).toContain('tijorat');
  });

  it('never returns a score above 100', () => {
    const result = evaluateCustomsRisk(
      {
        ...baseRisk,
        itemName: 'Replica brend dron batareya parfum',
        quantity: 50,
        declaredValue: 5000,
        weightKg: 60,
        purpose: 'business',
        hasBrandLogo: true,
        isBattery: true,
        isLiquid: true,
      },
      SEED_RESTRICTED_GOODS,
    );
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.level).toBe('red');
  });
});

describe('evaluateCommercialIntent', () => {
  it('scores a single personal item as low', () => {
    const result = evaluateCommercialIntent({
      identicalItemCount: 1,
      totalQuantity: 1,
      recentSimilarOrders: 0,
      category: 'clothing',
      declaredValueUsd: 40,
      distinctVariants: 1,
      bulkPackaging: false,
    });
    expect(result.level).toBe('low');
    expect(result.factors.every((factor) => !factor.triggered)).toBe(true);
  });

  it('scores a bulk order as high and lists the triggered factors', () => {
    const result = evaluateCommercialIntent({
      identicalItemCount: 20,
      totalQuantity: 40,
      recentSimilarOrders: 5,
      category: 'clothing',
      declaredValueUsd: 1200,
      distinctVariants: 6,
      bulkPackaging: true,
    });
    expect(result.level).toBe('high');
    expect(result.factors.filter((factor) => factor.triggered).length).toBeGreaterThanOrEqual(5);
  });

  it('never states a legal conclusion', () => {
    const result = evaluateCommercialIntent({
      identicalItemCount: 30,
      totalQuantity: 30,
      recentSimilarOrders: 9,
      category: 'other',
      declaredValueUsd: 3000,
      distinctVariants: 9,
      bulkPackaging: true,
    });
    expect(result.note).toContain('bojxona organi');
  });
});

describe('explainDuty', () => {
  it('reports no gap when the charge matches the calculation', () => {
    const expected = calculateCustoms({ ...baseCalculation, declaredValue: 200 });
    const result = explainDuty({
      itemName: 'Test',
      declaredValue: 200,
      currency: 'USD',
      quantity: 1,
      weightKg: 1,
      chargedAmountUzs: expected.totalCustomsUzs,
    });

    expect(result.differenceUzs).toBe(0);
    expect(result.consultationRecommended).toBe(false);
  });

  it('recommends a consultation when the charge is far higher than expected', () => {
    const result = explainDuty({
      itemName: 'Noutbuk',
      declaredValue: 120,
      currency: 'USD',
      quantity: 1,
      weightKg: 2,
      chargedAmountUzs: 3_000_000,
    });

    expect(result.differenceUzs).toBeGreaterThan(0);
    expect(result.consultationRecommended).toBe(true);
    expect(result.likelyCauses.length).toBeGreaterThan(0);
  });

  it('includes the attached document name in the verification list', () => {
    const result = explainDuty({
      itemName: 'Test',
      declaredValue: 50,
      currency: 'USD',
      quantity: 1,
      weightKg: 1,
      chargedAmountUzs: 0,
      documentName: 'bojxona.pdf',
    });
    expect(result.whatToVerify.join(' ')).toContain('bojxona.pdf');
  });
});
