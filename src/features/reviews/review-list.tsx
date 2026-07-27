'use client';

import * as React from 'react';
import { BadgeCheck, MessageSquareReply, Star } from 'lucide-react';
import type { Review, ReviewSubject } from '@/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/states';
import { ReviewForm } from './review-form';
import { formatDate } from '@/lib/utils';

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`Baho: ${rating} / 5`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={
            index < rating ? 'h-3.5 w-3.5 fill-warning text-warning' : 'h-3.5 w-3.5 text-border'
          }
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

export function ReviewList({
  reviews,
  subject,
  subjectId,
}: {
  reviews: Review[];
  subject: ReviewSubject;
  subjectId: string;
}) {
  const [formOpen, setFormOpen] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);

  // Verified purchases carry more weight, so they are listed first.
  const ordered = [...reviews].sort((a, b) => {
    if (a.verifiedPurchase !== b.verifiedPurchase) return a.verifiedPurchase ? -1 : 1;
    return b.createdAt.localeCompare(a.createdAt);
  });

  return (
    <div className="space-y-3">
      {ordered.length === 0 ? (
        <EmptyState
          title="Hozircha sharhlar yo'q"
          description="Birinchi bo'lib tajribangizni yozing."
        />
      ) : (
        ordered.map((review) => (
          <Card key={review.id} className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-content">{review.authorName}</p>
                <Stars rating={review.rating} />
              </div>
              {review.verifiedPurchase ? (
                <Badge tone="success">
                  <BadgeCheck className="h-3 w-3" aria-hidden="true" />
                  Tasdiqlangan xarid
                </Badge>
              ) : null}
            </div>
            <p className="mt-2 text-[13px] leading-snug text-content-secondary">{review.body}</p>
            {review.officialReply ? (
              <div className="mt-3 rounded-sm bg-surface-muted p-3">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-content">
                  <MessageSquareReply className="h-3.5 w-3.5" aria-hidden="true" />
                  Rasmiy javob
                </p>
                <p className="mt-1 text-[13px] text-content-secondary">{review.officialReply}</p>
              </div>
            ) : null}
            <p className="mt-2 text-[11px] text-content-secondary">{formatDate(review.createdAt)}</p>
          </Card>
        ))
      )}

      {submitted ? (
        <Card className="p-4">
          <p className="text-sm font-semibold text-success">Sharhingiz yuborildi</p>
          <p className="mt-1 text-[13px] text-content-secondary">
            Moderatsiyadan so&apos;ng e&apos;lon qilinadi.
          </p>
        </Card>
      ) : (
        <>
          {formOpen ? (
            <ReviewForm
              subject={subject}
              subjectId={subjectId}
              onSubmitted={() => {
                setSubmitted(true);
                setFormOpen(false);
              }}
              onCancel={() => setFormOpen(false)}
            />
          ) : (
            <Button variant="outline" block onClick={() => setFormOpen(true)}>
              Sharh qoldirish
            </Button>
          )}
        </>
      )}
    </div>
  );
}
