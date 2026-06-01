import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-secondary text-secondary-foreground',
        outline: 'border-border text-foreground',
        success: 'border-transparent bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
        warning: 'border-transparent bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
        danger: 'border-transparent bg-rose-50 text-rose-800 dark:bg-rose-950 dark:text-rose-200',
        info: 'border-transparent bg-sky-50 text-sky-800 dark:bg-sky-950 dark:text-sky-200',
        muted: 'border-transparent bg-muted text-muted-foreground',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export function Avatar({
  name,
  className,
  size = 36,
}: {
  name: string | null | undefined;
  className?: string;
  size?: number;
}) {
  const initials =
    (name ?? '?')
      .split(' ')
      .filter(Boolean)
      .map((s) => s[0]?.toUpperCase())
      .slice(0, 2)
      .join('') || '?';
  // stable hue from name
  const hue = [...(name ?? 'x')].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full font-medium text-xs',
        className,
      )}
      style={{
        width: size,
        height: size,
        background: `hsl(${hue} 70% 92%)`,
        color: `hsl(${hue} 60% 25%)`,
      }}
    >
      {initials}
    </span>
  );
}
