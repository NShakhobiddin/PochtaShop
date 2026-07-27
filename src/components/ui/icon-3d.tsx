import * as React from 'react';
import {
  Calculator,
  GraduationCap,
  Headset,
  PackageCheck,
  Plane,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Soft 3D category icons. They are rendered from layered gradients rather than
 * bitmap assets so every icon shares one material, one light direction
 * (top-left) and the indigo/white palette.
 */
export const ICON_3D_GLYPHS = {
  store: ShoppingBag,
  courier: Plane,
  customs: ShieldCheck,
  ai: Sparkles,
  calculator: Calculator,
  learning: GraduationCap,
  consultation: Headset,
  order: PackageCheck,
} satisfies Record<string, LucideIcon>;

export type Icon3DName = keyof typeof ICON_3D_GLYPHS;

const SIZES = {
  sm: 'h-10 w-10 rounded-[12px]',
  md: 'h-14 w-14 rounded-[18px]',
  lg: 'h-20 w-20 rounded-[24px]',
} as const;

const GLYPH_SIZES = {
  sm: 'h-5 w-5',
  md: 'h-7 w-7',
  lg: 'h-10 w-10',
} as const;

export interface Icon3DProps {
  name: Icon3DName;
  size?: keyof typeof SIZES;
  className?: string;
  /** Decorative by default; pass a label when the icon carries meaning alone. */
  label?: string;
}

export function Icon3D({ name, size = 'md', className, label }: Icon3DProps) {
  const Glyph = ICON_3D_GLYPHS[name];
  return (
    <span
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden',
        'bg-gradient-to-br from-[#6366F1] via-[#5B54EA] to-[#4338CA]',
        'shadow-[0_10px_20px_-8px_rgba(79,70,229,0.55),inset_0_1px_0_rgba(255,255,255,0.45)]',
        SIZES[size],
        className,
      )}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <span className="pointer-events-none absolute -left-1/4 -top-1/2 h-full w-3/4 rotate-12 rounded-full bg-white/25 blur-md" />
      <Glyph className={cn('relative text-white drop-shadow-sm', GLYPH_SIZES[size])} strokeWidth={1.75} />
    </span>
  );
}
