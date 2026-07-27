import * as React from 'react';
import { ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react';
import type { RiskLevel } from '@/types';
import { cn } from '@/lib/utils';

const CONFIG: Record<RiskLevel, { label: string; tone: string; icon: React.ElementType }> = {
  green: { label: 'Yashil', tone: 'bg-success-bg text-success', icon: ShieldCheck },
  yellow: { label: 'Sariq', tone: 'bg-warning-bg text-warning', icon: ShieldAlert },
  red: { label: 'Qizil', tone: 'bg-danger-bg text-danger', icon: ShieldX },
};

/**
 * Risk is never conveyed by colour alone: the level always carries a text
 * label and a distinct icon (WCAG 1.4.1).
 */
export function RiskBadge({
  level,
  className,
  showLabel = true,
}: {
  level: RiskLevel;
  className?: string;
  showLabel?: boolean;
}) {
  const config = CONFIG[level];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold',
        config.tone,
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {showLabel ? config.label : null}
      <span className="sr-only">Bojxona xavfi darajasi: {config.label}</span>
    </span>
  );
}

export const RISK_LEVEL_LABEL: Record<RiskLevel, string> = {
  green: 'Yashil',
  yellow: 'Sariq',
  red: 'Qizil',
};
