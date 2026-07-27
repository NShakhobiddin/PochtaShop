import { DEMO_RATES_TO_UZS, type CurrencyCode } from '@/constants';

const CURRENCY_SUFFIX: Record<CurrencyCode, string> = {
  UZS: "so'm",
  USD: '$',
  CNY: '¥',
  TRY: '₺',
  EUR: '€',
};

/** Formats a number with non-breaking thin spaces, e.g. 1 234 567. */
export function formatNumber(value: number, fractionDigits = 0): string {
  const rounded = Number(value.toFixed(fractionDigits));
  const [integer, fraction] = rounded.toFixed(fractionDigits).split('.');
  const grouped = (integer ?? '0').replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return fraction ? `${grouped},${fraction}` : grouped;
}

export function formatMoney(amount: number, currency: CurrencyCode = 'UZS'): string {
  const fractionDigits = currency === 'UZS' ? 0 : 2;
  const suffix = CURRENCY_SUFFIX[currency];
  if (currency === 'UZS') {
    return `${formatNumber(amount, fractionDigits)} ${suffix}`;
  }
  return `${formatNumber(amount, fractionDigits)} ${suffix}`;
}

export function formatUzs(amount: number): string {
  return formatMoney(Math.round(amount), 'UZS');
}

export function convert(amount: number, from: CurrencyCode, to: CurrencyCode): number {
  if (from === to) return amount;
  const inUzs = amount * DEMO_RATES_TO_UZS[from];
  return inUzs / DEMO_RATES_TO_UZS[to];
}

export function toUzs(amount: number, from: CurrencyCode): number {
  return convert(amount, from, 'UZS');
}

export function toUsd(amount: number, from: CurrencyCode): number {
  return convert(amount, from, 'USD');
}

export function formatDeliveryDays(range: readonly [number, number]): string {
  const [min, max] = range;
  return min === max ? `${min} kun` : `${min}–${max} kun`;
}
