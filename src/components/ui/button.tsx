import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-200 ease-out disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg:not([class*="size-"])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--background))] active:scale-[0.98]',
  {
    variants: {
      variant: {
        default:
          'bg-gradient-to-br from-[hsl(var(--primary))] via-[hsl(217,91%,55%)] to-[hsl(217,91%,65%)] text-white border border-white/20 shadow-md hover:shadow-[0_0_20px_rgba(59,130,246,0.3),0_4px_8px_rgba(0,0,0,0.4)] focus-visible:ring-[hsl(var(--primary))]',
        destructive:
          'bg-gradient-to-br from-[hsl(var(--destructive))] via-[hsl(0,84%,55%)] to-[hsl(0,84%,65%)] text-white border border-white/20 shadow-md hover:shadow-[0_0_20px_rgba(239,68,68,0.3),0_4px_8px_rgba(0,0,0,0.4)] focus-visible:ring-[hsl(var(--destructive))]',
        success:
          'bg-gradient-to-br from-[var(--color-bid-dim)] via-[var(--color-bid)] to-[var(--color-bid-bright)] text-white border border-white/20 shadow-md hover:shadow-[0_0_20px_rgba(16,185,129,0.3),0_4px_8px_rgba(0,0,0,0.4)] focus-visible:ring-[var(--color-bid)]',
        outline:
          'border border-[var(--glass-border-color)] bg-transparent hover:bg-white/5 hover:border-[var(--glass-border-color-bright)] focus-visible:ring-[hsl(var(--ring))]',
        secondary:
          'bg-[var(--glass-bg-subtle)] backdrop-blur-sm border border-[var(--glass-border-color)] text-[var(--text-primary)] hover:bg-[var(--glass-bg-base)] hover:border-[var(--glass-border-color-bright)] focus-visible:ring-[hsl(var(--ring))]',
        ghost:
          'bg-transparent text-[var(--text-secondary)] border border-transparent hover:bg-white/5 hover:text-[var(--text-primary)] hover:border-[var(--glass-border-color)] focus-visible:ring-[hsl(var(--ring))]',
        link: 'text-[hsl(var(--primary))] underline-offset-4 hover:underline focus-visible:ring-[hsl(var(--primary))]',
        glass:
          'bg-[var(--glass-bg-base)] backdrop-blur-md border border-[var(--glass-border-color)] text-[var(--text-primary)] shadow-md hover:bg-[var(--glass-bg-elevated)] hover:border-[var(--glass-border-color-bright)] hover:shadow-lg focus-visible:ring-[hsl(var(--ring))]',
      },
      size: {
        default: 'h-9 px-4 py-2 rounded-lg',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-lg px-6 text-base',
        icon: 'size-9 rounded-lg',
        'icon-sm': 'size-8 rounded-md',
        'icon-lg': 'size-10 rounded-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
