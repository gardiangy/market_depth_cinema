import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const cardVariants = cva(
  'rounded-lg border text-[var(--text-primary)] transition-all duration-200',
  {
    variants: {
      variant: {
        default:
          'border-[var(--glass-border-color)] bg-[var(--glass-bg-base)] backdrop-blur-md shadow-md hover:border-[var(--glass-border-color-bright)] hover:shadow-lg',
        elevated:
          'border-[var(--glass-border-color-bright)] bg-[var(--glass-bg-elevated)] backdrop-blur-xl shadow-lg hover:shadow-xl',
        glass:
          'glass-inner-glow border-[var(--glass-border-color)] bg-[var(--glass-bg-base)] backdrop-blur-md shadow-sm hover:border-[var(--glass-border-color-bright)] hover:shadow-md',
        flat:
          'border-[var(--glass-border-color)] bg-[var(--surface-2)] shadow-sm hover:bg-[var(--surface-3)] hover:border-[var(--glass-border-color-bright)]',
        outline:
          'border-[var(--glass-border-color)] bg-transparent hover:border-[var(--glass-border-color-bright)]',
        ghost: 'border-transparent bg-transparent',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

function Card({
  className,
  variant,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof cardVariants>) {
  return (
    <div
      data-slot="card"
      className={cn(cardVariants({ variant }), className)}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-header"
      className={cn('flex flex-col gap-1.5 p-4', className)}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<'h3'>) {
  return (
    <h3
      data-slot="card-title"
      className={cn(
        'text-base font-semibold leading-tight tracking-tight',
        className
      )}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<'p'>) {
  return (
    <p
      data-slot="card-description"
      className={cn('text-sm text-[var(--text-secondary)]', className)}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-content"
      className={cn('p-4 pt-0', className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-footer"
      className={cn('flex items-center p-4 pt-0', className)}
      {...props}
    />
  )
}

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, cardVariants }
