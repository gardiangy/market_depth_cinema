/**
 * Event Icon Component
 *
 * Displays appropriate icon for each event type with severity-based styling.
 */

import type { EventType, EventSeverity } from '../../types';
import { EVENT_METADATA } from '../../lib/eventDetectionConfig';

interface EventIconProps {
  type: EventType;
  severity: EventSeverity;
  size?: 'sm' | 'md' | 'lg';
}

export function EventIcon({ type, severity, size = 'md' }: EventIconProps) {
  const metadata = EVENT_METADATA[type];
  const color = metadata.color[severity];

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const iconSize = sizeClasses[size];

  // Icon SVGs based on event type
  const icons: Record<EventType, React.ReactElement> = {
    large_order_added: (
      <svg
        className={iconSize}
        fill="none"
        stroke={color}
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v8m-4-4h8" />
      </svg>
    ),
    large_order_removed: (
      <svg
        className={iconSize}
        fill="none"
        stroke={color}
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M8 12h8" />
      </svg>
    ),
    spread_change: (
      <svg
        className={iconSize}
        fill="none"
        stroke={color}
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path d="M8 18l4-6-4-6m8 12l-4-6 4-6" />
      </svg>
    ),
    liquidity_gap: (
      <svg
        className={iconSize}
        fill="none"
        stroke={color}
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    rapid_cancellations: (
      <svg
        className={iconSize}
        fill="none"
        stroke={color}
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    price_level_breakthrough: (
      <svg
        className={iconSize}
        fill="none"
        stroke={color}
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
  };

  return (
    <div
      className="flex items-center justify-center"
      style={{ color }}
      title={metadata.label}
    >
      {icons[type]}
    </div>
  );
}
