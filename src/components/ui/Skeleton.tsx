/**
 * Skeleton Loading Components - shadcn/ui style
 *
 * Graceful loading states with liquid glass aesthetic.
 * Uses Tailwind classes for styling with shimmer animations.
 */

import { cn } from '@/lib/utils'

/* ==========================================
   BASE SKELETON COMPONENT
   ========================================== */

interface SkeletonProps extends React.ComponentProps<'div'> {
  className?: string
}

/**
 * Base skeleton component with pulsing glass effect.
 */
function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        'relative overflow-hidden rounded-md bg-[var(--glass-bg-base)] backdrop-blur-sm',
        'before:absolute before:inset-0 before:animate-pulse before:bg-gradient-to-r before:from-transparent before:via-white/5 before:to-transparent',
        'after:absolute after:inset-0 after:-translate-x-full after:animate-[shimmer_2s_infinite] after:bg-gradient-to-r after:from-transparent after:via-white/10 after:to-transparent',
        className
      )}
      aria-hidden="true"
      {...props}
    />
  )
}

/* ==========================================
   TEXT SKELETON VARIANTS
   ========================================== */

interface SkeletonTextProps extends React.ComponentProps<'div'> {
  size?: 'sm' | 'base' | 'lg'
  width?: string | number
}

/**
 * Text line skeleton - mimics lines of text.
 */
function SkeletonText({
  size = 'base',
  width = '100%',
  className,
  style,
  ...props
}: SkeletonTextProps) {
  const heights = {
    sm: 'h-3',
    base: 'h-4',
    lg: 'h-5',
  }

  return (
    <Skeleton
      className={cn(heights[size], 'w-full rounded', className)}
      style={{ width, ...style }}
      {...props}
    />
  )
}

/**
 * Heading skeleton - for larger text blocks.
 */
function SkeletonHeading({
  width = '60%',
  className,
  style,
  ...props
}: Omit<SkeletonTextProps, 'size'>) {
  return (
    <Skeleton
      className={cn('h-7 rounded', className)}
      style={{ width, ...style }}
      {...props}
    />
  )
}

/**
 * Paragraph skeleton - multiple text lines.
 */
function SkeletonParagraph({
  lines = 3,
  className,
  ...props
}: React.ComponentProps<'div'> & { lines?: number }) {
  return (
    <div className={cn('space-y-2', className)} aria-hidden="true" {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonText
          key={i}
          className={i === lines - 1 ? 'w-4/5' : 'w-full'}
        />
      ))}
    </div>
  )
}

/* ==========================================
   SHAPE SKELETON VARIANTS
   ========================================== */

interface SkeletonCircleProps extends React.ComponentProps<'div'> {
  size?: 'sm' | 'md' | 'lg'
}

/**
 * Circle skeleton - for avatars, icons, or round elements.
 */
function SkeletonCircle({ size = 'md', className, ...props }: SkeletonCircleProps) {
  const sizes = {
    sm: 'size-8',
    md: 'size-10',
    lg: 'size-12',
  }

  return (
    <Skeleton
      className={cn(sizes[size], 'rounded-full', className)}
      {...props}
    />
  )
}

interface SkeletonRectProps extends React.ComponentProps<'div'> {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  width?: string | number
  height?: string | number
}

/**
 * Rectangle skeleton - for cards, images, or block elements.
 */
function SkeletonRect({
  size = 'md',
  width = '100%',
  height,
  className,
  style,
  ...props
}: SkeletonRectProps) {
  const heights = {
    sm: 'h-16',
    md: 'h-24',
    lg: 'h-32',
    xl: 'h-48',
  }

  return (
    <Skeleton
      className={cn(heights[size], 'w-full rounded-lg', className)}
      style={{ width, height, ...style }}
      {...props}
    />
  )
}

/**
 * Square skeleton - for square images or icons.
 */
function SkeletonSquare({
  size,
  className,
  style,
  ...props
}: React.ComponentProps<'div'> & { size?: string | number }) {
  return (
    <Skeleton
      className={cn('aspect-square rounded-lg', className)}
      style={{ width: size, height: size, ...style }}
      {...props}
    />
  )
}

/* ==========================================
   SPECIALIZED SKELETON LAYOUTS
   ========================================== */

/**
 * Event card skeleton - matches EventListItem layout.
 */
function SkeletonEventCard({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'flex gap-3 rounded-lg border border-[var(--glass-border-color)] bg-[var(--glass-bg-base)] p-3',
        className
      )}
      aria-hidden="true"
      {...props}
    >
      <SkeletonCircle size="sm" />
      <div className="flex flex-1 flex-col gap-2">
        <SkeletonText size="sm" className="w-[70%]" />
        <SkeletonText size="sm" className="w-[90%]" />
        <SkeletonText size="sm" className="w-[40%]" />
      </div>
    </div>
  )
}

/**
 * Chart skeleton - for depth chart loading state.
 */
function SkeletonChart({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <Skeleton
      className={cn('h-full min-h-[400px] w-full rounded-lg', className)}
      aria-label="Loading chart..."
      {...props}
    />
  )
}

/* ==========================================
   THEME VARIANTS
   ========================================== */

interface SkeletonVariantProps extends React.ComponentProps<'div'> {
  variant?: 'primary' | 'success' | 'warning'
}

/**
 * Skeleton with colored tint for different content types.
 */
function SkeletonVariant({
  variant = 'primary',
  className,
  ...props
}: SkeletonVariantProps) {
  const variantStyles = {
    primary: 'before:via-blue-500/10 after:via-blue-500/15',
    success: 'before:via-emerald-500/10 after:via-emerald-500/15',
    warning: 'before:via-amber-500/10 after:via-amber-500/15',
  }

  return (
    <Skeleton
      className={cn(variantStyles[variant], className)}
      {...props}
    />
  )
}

export {
  Skeleton,
  SkeletonText,
  SkeletonHeading,
  SkeletonParagraph,
  SkeletonCircle,
  SkeletonRect,
  SkeletonSquare,
  SkeletonEventCard,
  SkeletonChart,
  SkeletonVariant,
}
