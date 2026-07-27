import type { Courier, CourierTariff, ShippingQuote } from '@/types';
import type { CountryCode } from '@/constants';
import { isStale } from '@/lib/utils';
import { calculateVolumetricWeight } from './volumetric';

export interface QuoteInput {
  fromCountry: CountryCode;
  actualWeightKg: number;
  dimensionsCm?: { length: number; width: number; height: number };
}

/** Cost for one tariff, taking the courier's minimum charge into account. */
export function quoteTariff(
  courier: Courier,
  tariff: CourierTariff,
  input: QuoteInput,
): ShippingQuote {
  const chargeable = input.dimensionsCm
    ? calculateVolumetricWeight({
        lengthCm: input.dimensionsCm.length,
        widthCm: input.dimensionsCm.width,
        heightCm: input.dimensionsCm.height,
        actualWeightKg: input.actualWeightKg,
        divisor: tariff.volumetricDivisor,
      }).chargeableWeightKg
    : input.actualWeightKg;

  const billedWeight = Math.max(chargeable, tariff.minWeightKg);
  const raw = billedWeight * tariff.pricePerKgUzs;
  const costUzs = Math.max(raw, tariff.minChargeUzs);

  return {
    courierId: courier.id,
    courierName: courier.name,
    serviceType: tariff.serviceType,
    chargeableWeightKg: Math.round(billedWeight * 100) / 100,
    costUzs: Math.round(costUzs),
    deliveryDays: tariff.deliveryDays,
    tariffUpdatedAt: tariff.updatedAt,
    isStale: isStale(tariff.updatedAt),
  };
}

/** Every quote a courier can offer on the requested route. */
export function quoteCourier(courier: Courier, input: QuoteInput): ShippingQuote[] {
  return courier.tariffs
    .filter((tariff) => tariff.fromCountry === input.fromCountry)
    .map((tariff) => quoteTariff(courier, tariff, input));
}

export function quoteAll(couriers: Courier[], input: QuoteInput): ShippingQuote[] {
  return couriers.flatMap((courier) => quoteCourier(courier, input));
}

export function cheapestQuote(quotes: ShippingQuote[]): ShippingQuote | null {
  return quotes.reduce<ShippingQuote | null>(
    (best, quote) => (best === null || quote.costUzs < best.costUzs ? quote : best),
    null,
  );
}

export function fastestQuote(quotes: ShippingQuote[]): ShippingQuote | null {
  return quotes.reduce<ShippingQuote | null>((best, quote) => {
    if (best === null) return quote;
    if (quote.deliveryDays[1] !== best.deliveryDays[1]) {
      return quote.deliveryDays[1] < best.deliveryDays[1] ? quote : best;
    }
    return quote.costUzs < best.costUzs ? quote : best;
  }, null);
}

/**
 * "Most reliable" weighs the courier's service quality, not its price:
 * rating, tracking, insurance and customs support.
 */
export function reliabilityScore(courier: Courier): number {
  let score = courier.rating * 10;
  if (courier.trackingAvailable) score += 8;
  if (courier.insuranceAvailable) score += 8;
  if (courier.customsSupport) score += 6;
  if (courier.isVerified) score += 6;
  // Sponsorship deliberately contributes nothing.
  return Math.round(score);
}
