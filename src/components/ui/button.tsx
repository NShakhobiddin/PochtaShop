import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-[15px] font-semibold transition-all disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
  {
    variants: {
      variant: {
        primary: 'bg-gradient-primary text-white shadow-card hover:brightness-105',
        solid: 'bg-primary text-white hover:bg-primary-dark',
        secondary: 'bg-primary-light text-primary hover:bg-primary-light/70',
        outline: 'border border-border bg-surface text-content hover:bg-surface-muted',
        ghost: 'text-content-secondary hover:bg-surface-muted',
        danger: 'bg-danger text-white hover:brightness-95',
      },
      size: {
        /** Telegram guidance: primary controls stay at least 48px tall. */
        md: 'h-12 px-5',
        lg: 'h-14 px-6 text-base rounded-md',
        sm: 'h-10 px-4 text-sm',
        icon: 'h-12 w-12',
      },
      block: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md', block: false },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, block, loading, children, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size, block }), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden="true"
        />
      ) : null}
      {children}
    </button>
  );
});

export { buttonVariants };
