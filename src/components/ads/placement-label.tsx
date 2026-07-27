import * as React from 'react';
import { Megaphone, Handshake, Sparkles, ShieldCheck, Users } from 'lucide-react';
import type { PlacementLabel } from '@/types';
import { cn } from '@/lib/utils';

const LABELS: Record<PlacementLabel, { text: string; icon: React.ElementType; tone: string }> = {
  ad: { text: 'Reklama', icon: Megaphone, tone: 'bg-warning-bg text-warning' },
  partnership: { text: 'Hamkorlik asosida', icon: Handshake, tone: 'bg-surface-muted text-content-secondary' },
  ai_recommendation: { text: 'AI tavsiyasi', icon: Sparkles, tone: 'bg-primary-light text-primary' },
  verified_courier: { text: 'Tasdiqlangan kuryer', icon: ShieldCheck, tone: 'bg-success-bg text-success' },
  users_choice: { text: 'Foydalanuvchilar tanlovi', icon: Users, tone: 'bg-primary-light text-primary' },
};

/**
 * Paid placements must always be visually distinguishable from organic ones.
 * The label never affects ranking — it only discloses the relationship.
 */
export function PlacementLabelBadge({
  label,
  onDark,
  className,
}: {
  label: PlacementLabel;
  onDark?: boolean;
  className?: string;
}) {
  const config = LABELS[label];
  const Icon = config.icon;
  return (
    <span
      className={cn(
        'inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold',
        onDark ? 'bg-white/20 text-white' : config.tone,
        className,
      )}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      {config.text}
    </span>
  );
}
