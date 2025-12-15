import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default:
          'border-[var(--glass-border-color)] bg-[var(--glass-bg-base)] text-[var(--text-primary)] backdrop-blur-sm',
        secondary:
          'border-transparent bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))]',
        destructive:
          'border-transparent bg-[var(--color-ask)]/20 text-[var(--color-ask-bright)] shadow-[0_0_8px_rgba(239,68,68,0.2)]',
        success:
          'border-transparent bg-[var(--color-bid)]/20 text-[var(--color-bid-bright)] shadow-[0_0_8px_rgba(16,185,129,0.2)]',
        warning:
          'border-transparent bg-[var(--color-mid)]/20 text-[var(--color-mid-bright)] shadow-[0_0_8px_rgba(251,191,36,0.2)]',
        outline:
          'border-[var(--glass-border-color-bright)] bg-transparent text-[var(--text-secondary)]',
        low:
          'border-transparent bg-[var(--severity-low)]/20 text-[var(--severity-low)]',
        medium:
          'border-transparent bg-[var(--severity-medium)]/20 text-[var(--severity-medium)]',
        high:
          'border-transparent bg-[var(--severity-high)]/20 text-[var(--severity-high)] shadow-[0_0_8px_rgba(239,68,68,0.2)]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
