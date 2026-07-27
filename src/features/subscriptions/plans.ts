import type { SubscriptionTier } from '@/types';

export interface PlanFeature {
  label: string;
  free: boolean;
  premium: boolean;
}

export const PLAN_FEATURES: PlanFeature[] = [
  { label: "Internet-do'konlar katalogi", free: true, premium: true },
  { label: 'Asosiy darslar', free: true, premium: true },
  { label: "Kuryerlarni ko'rish va taqqoslash", free: true, premium: true },
  { label: 'Oddiy kalkulyator', free: true, premium: true },
  { label: 'Tayyor sotuvchi iboralari', free: true, premium: true },
  { label: 'Saqlanganlar', free: true, premium: true },
  { label: 'Oddiy bojxona xavfi', free: true, premium: true },
  { label: "Kunlik AI tahlili (3 ta)", free: true, premium: false },
  { label: "Cheksiz AI tahlili", free: false, premium: true },
  { label: 'Kengaytirilgan mahsulot qidiruvi', free: false, premium: true },
  { label: 'Sharhlarni AI tahlili', free: false, premium: true },
  { label: 'Screenshot yordamchisi', free: false, premium: true },
  { label: 'Sotuvchi bilan AI tarjima', free: false, premium: true },
  { label: 'Batafsil yakuniy xarajat', free: false, premium: true },
  { label: 'Rivojlangan bojxona xavfi', free: false, premium: true },
  { label: 'Shaxsiy tavsiyalar', free: false, premium: true },
  { label: "To'liq interaktiv kurslar", free: false, premium: true },
  { label: 'PDF hisobot', free: false, premium: true },
  { label: 'Ustuvor konsultatsiya', free: false, premium: true },
];

export const PREMIUM_PRICE_UZS = 49_000;

export interface PaymentIntent {
  id: string;
  provider: string;
  amountUzs: number;
  status: 'pending' | 'paid' | 'failed';
  checkoutUrl?: string;
}

/**
 * Payment provider seam. The first release activates Premium manually through
 * the admin panel; a real provider only has to implement this interface.
 */
export interface PaymentProvider {
  readonly name: string;
  createIntent(input: { telegramId: number; amountUzs: number }): Promise<PaymentIntent>;
}

export class MockPaymentProvider implements PaymentProvider {
  readonly name = 'mock';

  async createIntent(input: { telegramId: number; amountUzs: number }): Promise<PaymentIntent> {
    return {
      id: `mock_${input.telegramId}_${Date.now()}`,
      provider: this.name,
      amountUzs: input.amountUzs,
      // Nothing is charged in the first version; an admin flips the tier.
      status: 'pending',
    };
  }
}

let provider: PaymentProvider = new MockPaymentProvider();

export function getPaymentProvider(): PaymentProvider {
  return provider;
}

export function setPaymentProvider(next: PaymentProvider): void {
  provider = next;
}

export function tierLabel(tier: SubscriptionTier): string {
  return tier === 'premium' ? 'Premium' : 'Bepul';
}
