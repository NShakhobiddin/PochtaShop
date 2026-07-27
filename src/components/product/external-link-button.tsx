'use client';

import * as React from 'react';
import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { openExternal, haptic } from '@/lib/telegram/webapp';
import { track } from '@/lib/analytics';

export function ExternalLinkButton({
  url,
  label,
  storeId,
  isAffiliate,
}: {
  url: string;
  label: string;
  storeId?: string;
  isAffiliate?: boolean;
}) {
  return (
    <div className="flex-1">
      <Button
        block
        onClick={() => {
          haptic('light');
          if (storeId) track('store_opened', { store: storeId });
          openExternal(url);
        }}
      >
        <ExternalLink className="h-4 w-4" aria-hidden="true" />
        {label}
      </Button>
      {isAffiliate ? (
        <p className="mt-1 text-center text-[11px] text-content-secondary">
          Bu havola hamkorlik havolasi
        </p>
      ) : null}
    </div>
  );
}
