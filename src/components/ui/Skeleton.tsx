/**
 * Skeleton Loading Components
 *
 * Graceful loading states that maintain visual hierarchy during content fetch.
 * Uses the skeleton.css classes for styling and animation.
 */

import type { CSSProperties, ReactNode } from 'react';

/* ==========================================
   BASE SKELETON COMPONENT
   ========================================== */

interface SkeletonProps {
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

/**
 * Base skeleton component with pulsing glass effect.
 * Combines the skeleton class with any additional classes.
 */
export function Skeleton({ className = '', style, children }: SkeletonProps) {
  return (
    <div className={`skeleton ${className}`.trim()} style={style}>
      {children}
    </div>
  );
}

/* ==========================================
   TEXT SKELETON VARIANTS
   ========================================== */

interface SkeletonTextProps {
  size?: 'sm' | 'base' | 'lg';
  width?: string | number;
  className?: string;
}

/**
 * Text line skeleton - mimics lines of text.
 */
export function SkeletonText({ size = 'base', width = '100%', className = '' }: SkeletonTextProps) {
  const sizeClass = size === 'sm' ? 'skeleton-text-sm' : size === 'lg' ? 'skeleton-text-lg' : 'skeleton-text';

  return (
    <div
      className={`skeleton ${sizeClass} ${className}`.trim()}
      style={{ width }}
      aria-hidden="true"
    />
  );
}

/**
 * Heading skeleton - for larger text blocks.
 */
export function SkeletonHeading({ width = '60%', className = '' }: Omit<SkeletonTextProps, 'size'>) {
  return (
    <div
      className={`skeleton skeleton-heading ${className}`.trim()}
      style={{ width }}
      aria-hidden="true"
    />
  );
}

/**
 * Paragraph skeleton - multiple text lines.
 */
export function SkeletonParagraph({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`skeleton-paragraph ${className}`.trim()} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonText key={i} />
      ))}
    </div>
  );
}

/* ==========================================
   SHAPE SKELETON VARIANTS
   ========================================== */

interface SkeletonCircleProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Circle skeleton - for avatars, icons, or round elements.
 */
export function SkeletonCircle({ size = 'md', className = '' }: SkeletonCircleProps) {
  const sizeClass = `skeleton-circle-${size}`;

  return (
    <div
      className={`skeleton skeleton-circle ${sizeClass} ${className}`.trim()}
      aria-hidden="true"
    />
  );
}

interface SkeletonRectProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  width?: string | number;
  height?: string | number;
  className?: string;
}

/**
 * Rectangle skeleton - for cards, images, or block elements.
 */
export function SkeletonRect({ size = 'md', width = '100%', height, className = '' }: SkeletonRectProps) {
  const sizeClass = size ? `skeleton-rect-${size}` : '';
  const style: CSSProperties = { width };
  if (height) style.height = height;

  return (
    <div
      className={`skeleton skeleton-rect ${sizeClass} ${className}`.trim()}
      style={style}
      aria-hidden="true"
    />
  );
}

/**
 * Square skeleton - for square images or icons.
 */
export function SkeletonSquare({ size, className = '' }: { size?: string | number; className?: string }) {
  const style: CSSProperties = {};
  if (size) {
    style.width = size;
    style.height = size;
  }

  return (
    <div
      className={`skeleton skeleton-square ${className}`.trim()}
      style={style}
      aria-hidden="true"
    />
  );
}

/* ==========================================
   SPECIALIZED SKELETON LAYOUTS
   ========================================== */

/**
 * Event card skeleton - matches EventListItem layout.
 */
export function SkeletonEventCard({ className = '' }: { className?: string }) {
  return (
    <div className={`skeleton-event-card ${className}`.trim()} aria-hidden="true">
      <SkeletonCircle size="md" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
        <SkeletonText size="sm" width="70%" />
        <SkeletonText size="sm" width="90%" />
        <SkeletonText size="sm" width="40%" />
      </div>
    </div>
  );
}

/**
 * Chart skeleton - for depth chart loading state.
 */
export function SkeletonChart({ className = '' }: { className?: string }) {
  return (
    <div
      className={`skeleton skeleton-chart ${className}`.trim()}
      style={{ width: '100%', height: '100%', minHeight: '400px' }}
      aria-label="Loading chart..."
      aria-hidden="true"
    />
  );
}

/* ==========================================
   THEME VARIANTS
   ========================================== */

interface SkeletonVariantProps {
  variant?: 'primary' | 'success' | 'warning';
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

/**
 * Skeleton with colored tint for different content types.
 */
export function SkeletonVariant({ variant = 'primary', className = '', style, children }: SkeletonVariantProps) {
  const variantClass = `skeleton-${variant}`;

  return (
    <div
      className={`skeleton ${variantClass} ${className}`.trim()}
      style={style}
      aria-hidden="true"
    >
      {children}
    </div>
  );
}
