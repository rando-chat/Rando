// app/src/components/ui/Badge.tsx
import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-rando-input text-text-primary',
        guest: 'bg-gradient-to-r from-rando-purple to-rando-purple-600 text-white',
        student: 'bg-gradient-to-r from-rando-gold to-rando-gold-600 text-rando-bg',
        premium: 'bg-gradient-to-r from-rando-coral to-rando-coral-600 text-white',
        success: 'bg-success/20 text-success',
        warning: 'bg-warning/20 text-warning',
        danger: 'bg-danger/20 text-danger',
        info: 'bg-info/20 text-info',
        campus: 'bg-gradient-to-r from-blue-600 to-purple-600 text-white',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-3 py-1 text-xs',
        lg: 'px-4 py-1.5 text-sm',
      },
      dot: {
        true: 'pl-2.5',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  leftIcon?: React.ReactNode;
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, size, dot, leftIcon, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(badgeVariants({ variant, size, dot, className }))}
        {...props}
      >
        {dot && (
          <span
            className={cn(
              'mr-1.5 h-2 w-2 rounded-full',
              variant === 'guest' && 'bg-white',
              variant === 'student' && 'bg-rando-bg',
              variant === 'premium' && 'bg-white',
              variant === 'success' && 'bg-success',
              variant === 'warning' && 'bg-warning',
              variant === 'danger' && 'bg-danger',
              variant === 'info' && 'bg-info',
              variant === 'default' && 'bg-text-primary',
            )}
          />
        )}
        {leftIcon && <span className="mr-1.5">{leftIcon}</span>}
        {children}
      </div>
    );
  }
);

Badge.displayName = 'Badge';

export { Badge, badgeVariants };