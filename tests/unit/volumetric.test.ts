import { describe, expect, it } from 'vitest';
import { calculateVolumetricWeight } from '@/features/courier-comparison/volumetric';
import { quoteTariff } from '@/features/courier-comparison/quote';
import type { Courier, CourierTariff } from '@/types';

describe('calculateVolumetricWeight', () => {
  it('bills the actual weight when it exceeds the volumetric weight', () => {
    const result = calculateVolumetricWeight({
      lengthCm: 20,
      widthCm: 20,
      heightCm: 10,
      actualWeightKg: 5,
      divisor: 6000,
    });

    // 20*20*10/6000 = 0.67kg
    expect(result.volumetricWeightKg).toBe(0.67);
    expect(result.chargeableWeightKg).toBe(5);
    expect(result.usedVolumetric).toBe(false);
  });

  it('bills the volumetric weight for bulky, light parcels', () => {
    const result = calculateVolumetricWeight({
      lengthCm: 60,
      widthCm: 40,
      heightCm: 30,
      actualWeightKg: 2,
      divisor: 6000,
    });

    // 60*40*30/6000 = 12kg
    expect(result.volumetricWeightKg).toBe(12);
    expect(result.chargeableWeightKg).toBe(12);
    expect(result.usedVolumetric).toBe(true);
  });

  it('changes the result when the courier uses a different divisor', () => {
    const input = { lengthCm: 50, widthCm: 40, heightCm: 30, actualWeightKg: 3 };

    expect(calculateVolumetricWeight({ ...input, divisor: 5000 }).volumetricWeightKg).toBe(12);
    expect(calculateVolumetricWeight({ ...input, divisor: 6000 }).volumetricWeightKg).toBe(10);
  });

  it('falls back to the default divisor when given zero', () => {
    const result = calculateVolumetricWeight({
      lengthCm: 60,
      widthCm: 40,
      heightCm: 30,
      actualWeightKg: 1,
      divisor: 0,
    });
    expect(result.volumetricWeightKg).toBe(12);
  });
});

const tariff: CourierTariff = {
  id: 't1',
  courierId: 'c1',
  fromCountry: 'CN',
  toCountry: 'UZ',
  serviceType: 'standard',
  pricePerKgUzs: 40_000,
  minChargeUzs: 60_000,
  minWeightKg: 1,
  deliveryDays: [10, 15],
  volumetricDivisor: 6000,
  effectiveFrom: '2026-01-01',
  updatedAt: new Date().toISOString(),
};

const courier = { id: 'c1', name: 'Test Cargo' } as Courier;

describe('quoteTariff', () => {
  it('applies the minimum charge for very light parcels', () => {
    const quote = quoteTariff(courier, tariff, { fromCountry: 'CN', actualWeightKg: 0.2 });
    // 1kg minimum weight * 40 000 = 40 000, below the 60 000 minimum charge.
    expect(quote.costUzs).toBe(60_000);
    expect(quote.chargeableWeightKg).toBe(1);
  });

  it('charges per kilogram above the minimum', () => {
    const quote = quoteTariff(courier, tariff, { fromCountry: 'CN', actualWeightKg: 3 });
    expect(quote.costUzs).toBe(120_000);
  });

  it('uses volumetric weight when dimensions make it larger', () => {
    const quote = quoteTariff(courier, tariff, {
      fromCountry: 'CN',
      actualWeightKg: 2,
      dimensionsCm: { length: 60, width: 40, height: 30 },
    });
    expect(quote.chargeableWeightKg).toBe(12);
    expect(quote.costUzs).toBe(480_000);
  });

  it('flags tariffs that have not been refreshed recently', () => {
    const old = { ...tariff, updatedAt: '2024-01-01T00:00:00.000Z' };
    expect(quoteTariff(courier, old, { fromCountry: 'CN', actualWeightKg: 1 }).isStale).toBe(true);
  });
});
