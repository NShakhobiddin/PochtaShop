import * as React from 'react';
import { CircleCheck, CircleHelp, CircleAlert } from 'lucide-react';
import type { AIConfidence } from '@/types';
import { cn } from '@/lib/utils';

const CONFIG: Record<AIConfidence, { label: string; tone: string; icon: React.ElementType }> = {
  high: { label: 'Yuqori ishonchlilik', tone: 'bg-success-bg text-success', icon: CircleCheck },
  medium: { label: "O'rtacha ishonchlilik", tone: 'bg-warning-bg text-warning', icon: CircleHelp },
  low: { label: 'Past ishonchlilik', tone: 'bg-danger-bg text-danger', icon: CircleAlert },
};

/**
 * Confidence is always shown together with the reason for it — a bare level
 * would tell the user nothing actionable.
 */
export function ConfidenceBadge({
  confidence,
  reason,
  className,
}: {
  confidence: AIConfidence;
  reason?: string;
  className?: string;
}) {
  const config = CONFIG[confidence];
  const Icon = config.icon;

  return (
    <div className={cn('rounded-sm p-3', config.tone, className)}>
      <p className="flex items-center gap-1.5 text-[13px] font-bold">
        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
        {config.label}
      </p>
      {reason ? <p className="mt-1 text-[13px] leading-snug opacity-90">{reason}</p> : null}
    </div>
  );
}
