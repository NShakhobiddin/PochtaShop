'use client';

import * as React from 'react';
import { ThumbsDown, ThumbsUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { track } from '@/lib/analytics';
import { haptic } from '@/lib/telegram/webapp';

/** Lightweight thumbs feedback used to measure AI answer quality. */
export function AiFeedback({ context }: { context: string }) {
  const [sent, setSent] = React.useState(false);

  function submit(helpful: boolean) {
    haptic('selection');
    track('ai_feedback_submitted', { context, helpful });
    setSent(true);
  }

  if (sent) {
    return (
      <Card className="p-3 text-center text-[13px] text-content-secondary">
        Fikringiz uchun rahmat.
      </Card>
    );
  }

  return (
    <Card className="flex items-center justify-between gap-3 p-3">
      <p className="text-[13px] text-content-secondary">Bu javob foydali bo&apos;ldimi?</p>
      <div className="flex gap-2">
        <button
          type="button"
          aria-label="Ha, foydali"
          onClick={() => submit(true)}
          className="flex h-10 w-10 items-center justify-center rounded-sm border border-border text-content-secondary"
        >
          <ThumbsUp className="h-4 w-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label="Yo'q, foydali emas"
          onClick={() => submit(false)}
          className="flex h-10 w-10 items-center justify-center rounded-sm border border-border text-content-secondary"
        >
          <ThumbsDown className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </Card>
  );
}
