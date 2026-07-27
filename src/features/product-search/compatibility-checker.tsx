'use client';

import * as React from 'react';
import { Check, CircleAlert, TriangleAlert } from 'lucide-react';
import type { ProductCategoryId } from '@/constants';
import type { CompatibilityVerdict } from '@/types';
import { Card } from '@/components/ui/card';
import { Chip, SectionHeader } from '@/components/ui/misc';
import {
  checkCompatibility,
  getCompatibilityQuestions,
  COMPATIBILITY_LABELS,
} from './compatibility';
import { cn } from '@/lib/utils';

const VERDICT_STYLE: Record<
  CompatibilityVerdict,
  { tone: string; icon: React.ElementType }
> = {
  fits: { tone: 'bg-success-bg text-success', icon: Check },
  check: { tone: 'bg-warning-bg text-warning', icon: CircleAlert },
  may_not_fit: { tone: 'bg-danger-bg text-danger', icon: TriangleAlert },
};

/**
 * Guided compatibility check. Runs entirely on the client from the same rule
 * set the server uses, so a user gets immediate feedback while answering.
 */
export function CompatibilityChecker({ category }: { category: ProductCategoryId }) {
  const questions = React.useMemo(() => getCompatibilityQuestions(category), [category]);
  const [answers, setAnswers] = React.useState<Record<string, string>>({});

  const answered = Object.keys(answers).length;
  const result = answered > 0 ? checkCompatibility(category, answers) : null;
  const overall = result ? VERDICT_STYLE[result.verdict] : null;
  const OverallIcon = overall?.icon;

  return (
    <Card className="p-4">
      <SectionHeader title="Moslik tekshiruvi" className="mb-1" />
      <p className="mb-3 text-[13px] text-content-secondary">
        Noto&apos;g&apos;ri variant tanlash xavfini kamaytiring — savollarga javob bering.
      </p>

      <div className="space-y-4">
        {questions.map((question) => (
          <fieldset key={question.id}>
            <legend className="mb-1.5 text-sm font-medium text-content">{question.label}</legend>
            {question.hint ? (
              <p className="mb-2 text-xs text-content-secondary">{question.hint}</p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              {question.options.map((option) => (
                <Chip
                  key={option.value}
                  selected={answers[question.id] === option.value}
                  onClick={() =>
                    setAnswers((current) => ({ ...current, [question.id]: option.value }))
                  }
                >
                  {option.label}
                </Chip>
              ))}
            </div>
          </fieldset>
        ))}
      </div>

      {result && overall && OverallIcon ? (
        <div className="mt-4">
          <div className={cn('flex items-center gap-2 rounded-sm p-3', overall.tone)}>
            <OverallIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
            <p className="text-sm font-bold">Natija: {COMPATIBILITY_LABELS[result.verdict]}</p>
          </div>
          <ul className="mt-3 space-y-2">
            {result.items.map((item) => {
              const style = VERDICT_STYLE[item.verdict];
              const Icon = style.icon;
              return (
                <li key={item.id} className="flex gap-2 text-[13px] leading-snug">
                  <Icon
                    className={cn(
                      'mt-0.5 h-4 w-4 shrink-0',
                      item.verdict === 'fits' && 'text-success',
                      item.verdict === 'check' && 'text-warning',
                      item.verdict === 'may_not_fit' && 'text-danger',
                    )}
                    aria-hidden="true"
                  />
                  <span>
                    <span className="font-medium text-content">{item.label}:</span>{' '}
                    <span className="text-content-secondary">{item.reason}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </Card>
  );
}
