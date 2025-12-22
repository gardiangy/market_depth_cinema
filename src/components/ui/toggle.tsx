import * as React from 'react'
import * as TogglePrimitive from '@radix-ui/react-toggle'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const toggleVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-all duration-200 hover:bg-white/10 disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg:not([class*="size-"])]:size-4 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--background))]',
  {
    variants: {
      variant: {
        default:
          'bg-transparent text-[var(--text-secondary)] data-[state=on]:bg-[var(--glass-bg-elevated)] data-[state=on]:text-[var(--text-primary)] data-[state=on]:border-[var(--glass-border-color-bright)]',
        outline:
          'border border-[var(--glass-border-color)] bg-transparent text-[var(--text-secondary)] hover:border-[var(--glass-border-color-bright)] data-[state=on]:bg-[var(--glass-bg-base)] data-[state=on]:text-[var(--text-primary)] data-[state=on]:border-[hsl(var(--primary))]',
        glass:
          'bg-[var(--glass-bg-subtle)] backdrop-blur-sm border border-[var(--glass-border-color)] text-[var(--text-secondary)] data-[state=on]:bg-[var(--glass-bg-elevated)] data-[state=on]:text-[var(--text-primary)] data-[state=on]:border-[hsl(var(--primary))] data-[state=on]:shadow-[0_0_8px_rgba(59,130,246,0.2)]',
        success:
          'bg-transparent border border-[var(--color-bid)]/50 text-[var(--color-bid)]/70 hover:border-[var(--color-bid)] hover:text-[var(--color-bid)] focus-visible:ring-[var(--color-bid)] data-[state=on]:bg-[var(--color-bid)] data-[state=on]:text-white data-[state=on]:border-[var(--color-bid)] data-[state=on]:shadow-[0_0_12px_rgba(16,185,129,0.4)]',
        error:
          'bg-transparent border border-[var(--color-ask)]/50 text-[var(--color-ask)]/70 hover:border-[var(--color-ask)] hover:text-[var(--color-ask)] focus-visible:ring-[var(--color-ask)] data-[state=on]:bg-[var(--color-ask)] data-[state=on]:text-white data-[state=on]:border-[var(--color-ask)] data-[state=on]:shadow-[0_0_12px_rgba(239,68,68,0.4)]',
        warning:
          'bg-transparent border border-[var(--color-mid)]/50 text-[var(--color-mid)]/70 hover:border-[var(--color-mid)] hover:text-[var(--color-mid)] focus-visible:ring-[var(--color-mid)] data-[state=on]:bg-[var(--color-mid)] data-[state=on]:text-white data-[state=on]:border-[var(--color-mid)] data-[state=on]:shadow-[0_0_12px_rgba(251,191,36,0.4)]',
        info:
          'bg-transparent border border-[var(--color-primary)]/50 text-[var(--color-primary)]/70 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] focus-visible:ring-[var(--color-primary)] data-[state=on]:bg-[var(--color-primary)] data-[state=on]:text-white data-[state=on]:border-[var(--color-primary)] data-[state=on]:shadow-[0_0_12px_rgba(251,191,36,0.4)]',
      },
      size: {
        default: 'h-9 px-3 min-w-9',
        sm: 'h-8 px-2.5 min-w-8',
        lg: 'h-10 px-4 min-w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    }
  }
)

function Toggle({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof TogglePrimitive.Root> &
  VariantProps<typeof toggleVariants>) {
  return (
    <TogglePrimitive.Root
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Toggle, toggleVariants }
