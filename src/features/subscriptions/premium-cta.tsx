'use client';

import * as React from 'react';
import type { SubscriptionTier } from '@/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { apiFetch } from '@/lib/api/client';
import { track } from '@/lib/analytics';
import { haptic } from '@/lib/telegram/webapp';

export function PremiumCta({ tier }: { tier: SubscriptionTier }) {
  const [requested, setRequested] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    track('premium_viewed', { tier });
  }, [tier]);

  if (tier === 'premium') {
    return (
      <Card className="p-4">
        <p className="text-sm font-bold text-success">Premium faol</p>
        <p className="mt-1 text-[13px] text-content-secondary">
          Barcha kengaytirilgan imkoniyatlar ochiq.
        </p>
      </Card>
    );
  }

  async function request() {
    setPending(true);
    setError('');
    try {
      await apiFetch('/api/subscriptions/request', { json: {} });
      haptic('success');
      setRequested(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "So'rov yuborilmadi.");
    } finally {
      setPending(false);
    }
  }

  if (requested) {
    return (
      <Card className="p-4">
        <p className="text-sm font-bold text-content">So&apos;rovingiz yuborildi</p>
        <p className="mt-1 text-[13px] text-content-secondary">
          Admin Premium tarifni faollashtirgach xabar beramiz.
        </p>
      </Card>
    );
  }

  return (
    <>
      <Button block size="lg" loading={pending} onClick={() => void request()}>
        Premium so&apos;rash
      </Button>
      {error ? (
        <p role="alert" className="text-center text-sm font-medium text-danger">
          {error}
        </p>
      ) : null}
    </>
  );
}
