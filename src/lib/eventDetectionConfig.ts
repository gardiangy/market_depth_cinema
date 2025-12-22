/**
 * Event Detection Configuration
 *
 * Configurable thresholds for event detection algorithms.
 * Adjust these values based on market conditions and desired sensitivity.
 */

import type { EventType, EventSeverity } from '../types';

export interface EventThresholds {
  // Large Order Detection
  largeOrderBTC: {
    low: number;      // BTC volume for low severity
    medium: number;   // BTC volume for medium severity
    high: number;     // BTC volume for high severity
  };

  // Spread Change Detection (absolute dollar thresholds)
  spreadChange: {
    low: number;      // $ change for low severity
    medium: number;   // $ change for medium severity
    high: number;     // $ change for high severity
  };

  // Liquidity Gap Detection
  liquidityGap: {
    low: number;      // % price gap for low severity
    medium: number;   // % price gap for medium severity
    high: number;     // % price gap for high severity
    maxDepth: number; // Only check top N levels from best bid/ask
  };

  // Rapid Cancellations Detection
  rapidCancellations: {
    timeWindow: number;  // milliseconds
    low: number;         // count for low severity
    medium: number;      // count for medium severity
    high: number;        // count for high severity
  };

  // Price Breakthrough Detection
  priceBreakthrough: {
    significantLevel: number;  // % distance from mid price to be significant
  };
}

export const DEFAULT_THRESHOLDS: EventThresholds = {
  largeOrderBTC: {
    low: 6.0,     // 6 BTC for low
    medium: 8.0, // 8 BTC for medium
    high: 10.0,   // 10 BTC for high
  },
  spreadChange: {
    // Absolute dollar thresholds for spread change
    // BTC/USD spread is typically $1-5, changes are usually small
    low: 2,      // $2 change in spread
    medium: 5,  // $5 change in spread
    high: 10,    // $10 change in spread
  },
  liquidityGap: {
    // Gap between adjacent price levels as % of price
    // Only meaningful gaps near top of book matter for trading
    low: 0.15,    // 0.15% = ~$135 gap at $90k
    medium: 0.3,  // 0.3% = ~$270 gap
    high: 0.5,    // 0.5% = ~$450 gap
    maxDepth: 15, // Only check top 15 levels from best bid/ask
  },
  rapidCancellations: {
    timeWindow: 1000, // 1 second
    low: 40,     // 40 removals/sec
    medium: 60,  // 60 removals/sec
    high: 80,    // 80 removals/sec
  },
  priceBreakthrough: {
    significantLevel: 0.5, // 0.5%
  },
};

/**
 * Determines severity based on a numeric value and thresholds
 */
export function determineSeverity(
  value: number,
  thresholds: { low: number; medium: number; high: number }
): EventSeverity {
  if (value >= thresholds.high) return 'high';
  if (value >= thresholds.medium) return 'medium';
  return 'low';
}

/**
 * Event type metadata for UI display
 */
export interface EventTypeMetadata {
  label: string;
  description: string;
  icon: string; // Icon identifier for UI
  color: {
    low: string;
    medium: string;
    high: string;
  };
}

export const EVENT_METADATA: Record<EventType, EventTypeMetadata> = {
  large_order_added: {
    label: 'Large Order Added',
    description: 'Significant order volume added to the orderbook',
    icon: 'plus-circle',
    color: {
      low: '#3b82f6',   // blue
      medium: '#f59e0b', // amber
      high: '#ef4444',   // red
    },
  },
  large_order_removed: {
    label: 'Large Order Removed',
    description: 'Significant order volume removed from the orderbook',
    icon: 'minus-circle',
    color: {
      low: '#6b7280',   // gray
      medium: '#f59e0b', // amber
      high: '#ef4444',   // red
    },
  },
  spread_change: {
    label: 'Spread Change',
    description: 'Bid-ask spread changed significantly',
    icon: 'arrows-expand',
    color: {
      low: '#8b5cf6',   // purple
      medium: '#f59e0b', // amber
      high: '#ef4444',   // red
    },
  },
  liquidity_gap: {
    label: 'Liquidity Gap',
    description: 'Gap detected in orderbook with no price levels',
    icon: 'exclamation-triangle',
    color: {
      low: '#f59e0b',   // amber
      medium: '#f97316', // orange
      high: '#ef4444',   // red
    },
  },
  rapid_cancellations: {
    label: 'Rapid Cancellations',
    description: 'Multiple orders cancelled in quick succession',
    icon: 'flash',
    color: {
      low: '#f59e0b',   // amber
      medium: '#f97316', // orange
      high: '#ef4444',   // red
    },
  },
  price_level_breakthrough: {
    label: 'Price Breakthrough',
    description: 'Price crossed a significant support/resistance level',
    icon: 'trending-up',
    color: {
      low: '#10b981',   // green
      medium: '#f59e0b', // amber
      high: '#ef4444',   // red
    },
  },
};

/**
 * Returns a human-readable description for an event
 */
export function getEventDescription(type: EventType, details: Record<string, unknown>): string {
  switch (type) {
    case 'large_order_added': {
      const volume = details.volume as number;
      const price = details.price as number;
      const side = details.side as 'bid' | 'ask';
      return `${volume.toFixed(2)} BTC ${side} added at $${price.toFixed(2)}`;
    }
    case 'large_order_removed': {
      const volume = details.volume as number;
      const price = details.price as number;
      const side = details.side as 'bid' | 'ask';
      return `${volume.toFixed(2)} BTC ${side} removed from $${price.toFixed(2)}`;
    }
    case 'spread_change': {
      const oldSpread = details.oldSpread as number;
      const newSpread = details.newSpread as number;
      const direction = details.direction as string;
      return `Spread ${direction} from $${oldSpread.toFixed(2)} to $${newSpread.toFixed(2)}`;
    }
    case 'liquidity_gap': {
      const gapSize = details.gapPercent as number;
      const startPrice = details.startPrice as number;
      const endPrice = details.endPrice as number;
      const side = details.side as 'bid' | 'ask';
      return `${gapSize.toFixed(2)}% gap in ${side}s between $${startPrice.toFixed(2)} - $${endPrice.toFixed(2)}`;
    }
    case 'rapid_cancellations': {
      const count = details.count as number;
      const side = details.side as 'bid' | 'ask' | 'both';
      return `${count} ${side} orders cancelled within 1 second`;
    }
    case 'price_level_breakthrough': {
      const price = details.price as number;
      const direction = details.direction as 'up' | 'down';
      return `Price broke ${direction} through $${price.toFixed(2)}`;
    }
    default:
      return 'Unknown event';
  }
}
