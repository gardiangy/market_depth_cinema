/**
 * Pure Event Detection Functions
 *
 * These functions analyze orderbook snapshots to detect significant market events.
 * All functions are pure and side-effect free for easy testing.
 */

import type { OrderbookSnapshot, DetectedEvent } from '../types';
import { DEFAULT_THRESHOLDS, determineSeverity } from './eventDetectionConfig';

/**
 * Generates a unique event ID
 */
export function generateEventId(timestamp: number, type: string): string {
  return `${type}-${timestamp}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Detects large orders added to the orderbook
 */
export function detectLargeOrdersAdded(
  current: OrderbookSnapshot,
  previous: OrderbookSnapshot | null
): DetectedEvent[] {
  if (!previous) return [];

  const events: DetectedEvent[] = [];
  const { largeOrderBTC } = DEFAULT_THRESHOLDS;

  // Check for new or increased bid volumes
  for (const [price, volume] of current.bids) {
    const previousLevel = previous.bids.find(([p]) => p === price);
    const volumeChange = previousLevel ? volume - previousLevel[1] : volume;

    if (volumeChange >= largeOrderBTC.low) {
      const severity = determineSeverity(volumeChange, largeOrderBTC);
      events.push({
        id: generateEventId(current.timestamp, 'large_order_added'),
        type: 'large_order_added',
        timestamp: current.timestamp,
        severity,
        details: {
          side: 'bid',
          price,
          volume: volumeChange,
          totalVolume: volume,
        },
      });
    }
  }

  // Check for new or increased ask volumes
  for (const [price, volume] of current.asks) {
    const previousLevel = previous.asks.find(([p]) => p === price);
    const volumeChange = previousLevel ? volume - previousLevel[1] : volume;

    if (volumeChange >= largeOrderBTC.low) {
      const severity = determineSeverity(volumeChange, largeOrderBTC);
      events.push({
        id: generateEventId(current.timestamp, 'large_order_added'),
        type: 'large_order_added',
        timestamp: current.timestamp,
        severity,
        details: {
          side: 'ask',
          price,
          volume: volumeChange,
          totalVolume: volume,
        },
      });
    }
  }

  return events;
}

/**
 * Detects large orders removed from the orderbook
 */
export function detectLargeOrdersRemoved(
  current: OrderbookSnapshot,
  previous: OrderbookSnapshot | null
): DetectedEvent[] {
  if (!previous) return [];

  const events: DetectedEvent[] = [];
  const { largeOrderBTC } = DEFAULT_THRESHOLDS;

  // Check for removed or decreased bid volumes
  for (const [price, volume] of previous.bids) {
    const currentLevel = current.bids.find(([p]) => p === price);
    const volumeChange = currentLevel ? volume - currentLevel[1] : volume;

    if (volumeChange >= largeOrderBTC.low) {
      const severity = determineSeverity(volumeChange, largeOrderBTC);
      events.push({
        id: generateEventId(current.timestamp, 'large_order_removed'),
        type: 'large_order_removed',
        timestamp: current.timestamp,
        severity,
        details: {
          side: 'bid',
          price,
          volume: volumeChange,
          previousVolume: volume,
        },
      });
    }
  }

  // Check for removed or decreased ask volumes
  for (const [price, volume] of previous.asks) {
    const currentLevel = current.asks.find(([p]) => p === price);
    const volumeChange = currentLevel ? volume - currentLevel[1] : volume;

    if (volumeChange >= largeOrderBTC.low) {
      const severity = determineSeverity(volumeChange, largeOrderBTC);
      events.push({
        id: generateEventId(current.timestamp, 'large_order_removed'),
        type: 'large_order_removed',
        timestamp: current.timestamp,
        severity,
        details: {
          side: 'ask',
          price,
          volume: volumeChange,
          previousVolume: volume,
        },
      });
    }
  }

  return events;
}

/**
 * Detects significant spread changes
 * Uses absolute dollar thresholds for reliable detection
 */
export function detectSpreadChange(
  current: OrderbookSnapshot,
  previous: OrderbookSnapshot | null
): DetectedEvent[] {
  if (!previous) return [];

  const events: DetectedEvent[] = [];
  const { spreadChange } = DEFAULT_THRESHOLDS;

  // Ensure spreads are positive (safety check)
  const oldSpread = Math.abs(previous.spread);
  const newSpread = Math.abs(current.spread);

  // Skip if spreads seem invalid (e.g., > $500 for BTC is unrealistic)
  if (oldSpread > 500 || newSpread > 500 || oldSpread === 0) return [];

  const spreadDiff = newSpread - oldSpread;
  const absSpreadDiff = Math.abs(spreadDiff);

  // Use absolute dollar change for thresholds
  if (absSpreadDiff >= spreadChange.low) {
    const severity = determineSeverity(absSpreadDiff, spreadChange);

    events.push({
      id: generateEventId(current.timestamp, 'spread_change'),
      type: 'spread_change',
      timestamp: current.timestamp,
      severity,
      details: {
        oldSpread,
        newSpread,
        spreadChange: spreadDiff,
        direction: spreadDiff > 0 ? 'widened' : 'narrowed',
      },
    });
  }

  return events;
}

/**
 * Detects liquidity gaps in the orderbook
 * Only checks top N levels and reports most significant gap per side
 */
export function detectLiquidityGaps(
  current: OrderbookSnapshot
): DetectedEvent[] {
  const events: DetectedEvent[] = [];
  const { liquidityGap } = DEFAULT_THRESHOLDS;
  const maxDepth = liquidityGap.maxDepth || 15;

  // Track largest gap per side (only report most significant)
  let largestBidGap: { gapPercent: number; startPrice: number; endPrice: number } | null = null;
  let largestAskGap: { gapPercent: number; startPrice: number; endPrice: number } | null = null;

  // Check for gaps in bids (only top N levels)
  const bidsToCheck = Math.min(current.bids.length - 1, maxDepth);
  for (let i = 0; i < bidsToCheck; i++) {
    const [upperPrice] = current.bids[i];
    const [lowerPrice] = current.bids[i + 1];
    const gapPercent = ((upperPrice - lowerPrice) / lowerPrice) * 100;

    if (gapPercent >= liquidityGap.low) {
      if (!largestBidGap || gapPercent > largestBidGap.gapPercent) {
        largestBidGap = { gapPercent, startPrice: lowerPrice, endPrice: upperPrice };
      }
    }
  }

  // Check for gaps in asks (only top N levels)
  const asksToCheck = Math.min(current.asks.length - 1, maxDepth);
  for (let i = 0; i < asksToCheck; i++) {
    const [lowerPrice] = current.asks[i];
    const [upperPrice] = current.asks[i + 1];
    const gapPercent = ((upperPrice - lowerPrice) / lowerPrice) * 100;

    if (gapPercent >= liquidityGap.low) {
      if (!largestAskGap || gapPercent > largestAskGap.gapPercent) {
        largestAskGap = { gapPercent, startPrice: lowerPrice, endPrice: upperPrice };
      }
    }
  }

  // Only emit the largest gap per side
  if (largestBidGap) {
    const severity = determineSeverity(largestBidGap.gapPercent, liquidityGap);
    events.push({
      id: generateEventId(current.timestamp, 'liquidity_gap'),
      type: 'liquidity_gap',
      timestamp: current.timestamp,
      severity,
      details: {
        side: 'bid',
        startPrice: largestBidGap.startPrice,
        endPrice: largestBidGap.endPrice,
        gapPercent: largestBidGap.gapPercent,
      },
    });
  }

  if (largestAskGap) {
    const severity = determineSeverity(largestAskGap.gapPercent, liquidityGap);
    events.push({
      id: generateEventId(current.timestamp, 'liquidity_gap'),
      type: 'liquidity_gap',
      timestamp: current.timestamp,
      severity,
      details: {
        side: 'ask',
        startPrice: largestAskGap.startPrice,
        endPrice: largestAskGap.endPrice,
        gapPercent: largestAskGap.gapPercent,
      },
    });
  }

  return events;
}

/**
 * Detects rapid order cancellations
 * Tracks removal events over a sliding time window
 */
export function detectRapidCancellations(
  recentRemovals: Array<{ timestamp: number; side: 'bid' | 'ask' }>,
  currentTimestamp: number
): DetectedEvent[] {
  const events: DetectedEvent[] = [];
  const { rapidCancellations } = DEFAULT_THRESHOLDS;

  // Filter removals within the time window
  const windowStart = currentTimestamp - rapidCancellations.timeWindow;
  const removalsInWindow = recentRemovals.filter(r => r.timestamp >= windowStart);

  if (removalsInWindow.length >= rapidCancellations.low) {
    const bidRemovals = removalsInWindow.filter(r => r.side === 'bid').length;
    const askRemovals = removalsInWindow.filter(r => r.side === 'ask').length;

    let side: 'bid' | 'ask' | 'both';
    let count: number;

    if (bidRemovals >= rapidCancellations.low && askRemovals >= rapidCancellations.low) {
      side = 'both';
      count = removalsInWindow.length;
    } else if (bidRemovals >= rapidCancellations.low) {
      side = 'bid';
      count = bidRemovals;
    } else {
      side = 'ask';
      count = askRemovals;
    }

    const severity = determineSeverity(count, rapidCancellations);
    events.push({
      id: generateEventId(currentTimestamp, 'rapid_cancellations'),
      type: 'rapid_cancellations',
      timestamp: currentTimestamp,
      severity,
      details: {
        side,
        count,
        timeWindow: rapidCancellations.timeWindow,
        bidRemovals,
        askRemovals,
      },
    });
  }

  return events;
}

/**
 * Detects price level breakthroughs
 * Identifies when the mid-price crosses significant price levels
 */
export function detectPriceBreakthrough(
  current: OrderbookSnapshot,
  previous: OrderbookSnapshot | null,
  significantLevels: number[] // Pre-calculated support/resistance levels
): DetectedEvent[] {
  if (!previous) return [];

  const events: DetectedEvent[] = [];

  for (const level of significantLevels) {
    // Check if price crossed the level
    const previousBelow = previous.midPrice < level;
    const currentAbove = current.midPrice >= level;
    const previousAbove = previous.midPrice > level;
    const currentBelow = current.midPrice <= level;

    if (previousBelow && currentAbove) {
      // Broke through upward
      events.push({
        id: generateEventId(current.timestamp, 'price_level_breakthrough'),
        type: 'price_level_breakthrough',
        timestamp: current.timestamp,
        severity: 'medium', // Could be calculated based on level significance
        details: {
          direction: 'up',
          price: level,
          previousMidPrice: previous.midPrice,
          currentMidPrice: current.midPrice,
        },
      });
    } else if (previousAbove && currentBelow) {
      // Broke through downward
      events.push({
        id: generateEventId(current.timestamp, 'price_level_breakthrough'),
        type: 'price_level_breakthrough',
        timestamp: current.timestamp,
        severity: 'medium',
        details: {
          direction: 'down',
          price: level,
          previousMidPrice: previous.midPrice,
          currentMidPrice: current.midPrice,
        },
      });
    }
  }

  return events;
}

/**
 * Calculates significant price levels from historical data
 * These represent support/resistance levels based on volume clusters
 */
export function calculateSignificantLevels(
  snapshots: OrderbookSnapshot[],
  numLevels: number = 5
): number[] {
  if (snapshots.length === 0) return [];

  // Aggregate volume at each price level across all snapshots
  const volumeByPrice = new Map<number, number>();

  for (const snapshot of snapshots) {
    for (const [price, volume] of snapshot.bids) {
      volumeByPrice.set(price, (volumeByPrice.get(price) || 0) + volume);
    }
    for (const [price, volume] of snapshot.asks) {
      volumeByPrice.set(price, (volumeByPrice.get(price) || 0) + volume);
    }
  }

  // Sort by volume and take top N levels
  const sortedLevels = Array.from(volumeByPrice.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, numLevels)
    .map(([price]) => price)
    .sort((a, b) => a - b);

  return sortedLevels;
}

/**
 * Main detection function that runs all detection algorithms
 */
export function detectEvents(
  current: OrderbookSnapshot,
  previous: OrderbookSnapshot | null,
  recentRemovals: Array<{ timestamp: number; side: 'bid' | 'ask' }>,
  significantLevels: number[] = []
): DetectedEvent[] {
  const events: DetectedEvent[] = [];

  // Run all detection algorithms
  events.push(...detectLargeOrdersAdded(current, previous));
  events.push(...detectLargeOrdersRemoved(current, previous));
  events.push(...detectSpreadChange(current, previous));
  events.push(...detectLiquidityGaps(current));
  events.push(...detectRapidCancellations(recentRemovals, current.timestamp));
  events.push(...detectPriceBreakthrough(current, previous, significantLevels));

  return events;
}
