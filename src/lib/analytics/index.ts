import { logger } from '@/lib/logger';

export const ANALYTICS_EVENTS = [
  'onboarding_completed',
  'search_started',
  'search_completed',
  'image_uploaded',
  'link_analyzed',
  'recommendation_viewed',
  'store_opened',
  'courier_compared',
  'customs_calculated',
  'customs_risk_checked',
  'lesson_started',
  'lesson_completed',
  'consultation_requested',
  'assisted_order_requested',
  'premium_viewed',
  'premium_activated',
  'ai_feedback_submitted',
] as const;

export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[number];

/** Only non-identifying, low-cardinality values are allowed as properties. */
export type AnalyticsProps = Record<string, string | number | boolean>;

const FORBIDDEN_KEYS = [
  'name',
  'firstname',
  'lastname',
  'username',
  'phone',
  'email',
  'address',
  'passport',
  'card',
  'telegramid',
  'userid',
  'photo',
];

function sanitize(props: AnalyticsProps): AnalyticsProps {
  const result: AnalyticsProps = {};
  for (const [key, value] of Object.entries(props)) {
    const normalised = key.toLowerCase().replace(/[^a-z]/g, '');
    if (FORBIDDEN_KEYS.some((forbidden) => normalised.includes(forbidden))) continue;
    if (typeof value === 'string' && value.length > 64) continue;
    result[key] = value;
  }
  return result;
}

export interface AnalyticsSink {
  capture(event: AnalyticsEvent, props: AnalyticsProps): void;
}

let sink: AnalyticsSink = {
  capture(event, props) {
    logger.debug(`analytics:${event}`, props);
  },
};

export function setAnalyticsSink(next: AnalyticsSink): void {
  sink = next;
}

/** Records a product event. Personal data is stripped before it leaves. */
export function track(event: AnalyticsEvent, props: AnalyticsProps = {}): void {
  sink.capture(event, sanitize(props));
}
