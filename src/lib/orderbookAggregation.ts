import type { PriceLevel, DepthPoint } from '../types';

// Default price step for aggregation ($10 buckets)
export const DEFAULT_PRICE_STEP = 10;

/**
 * Aggregate price levels into buckets (e.g., $10 steps)
 * - For bids: rounds down to nearest step
 * - For asks: rounds up to nearest step
 */
export function aggregateLevels(
  levels: PriceLevel[],
  step: number,
  side: 'bid' | 'ask'
): PriceLevel[] {
  if (levels.length === 0) return [];

  const buckets = new Map<number, number>();

  for (const [price, quantity] of levels) {
    // For bids: round down to nearest step (e.g., 97654 -> 97650)
    // For asks: round up to nearest step (e.g., 97654 -> 97660)
    const bucketPrice =
      side === 'bid'
        ? Math.floor(price / step) * step
        : Math.ceil(price / step) * step;

    buckets.set(bucketPrice, (buckets.get(bucketPrice) || 0) + quantity);
  }

  // Convert to array and sort
  const aggregated: PriceLevel[] = Array.from(buckets.entries()).map(
    ([price, quantity]) => [price, quantity] as PriceLevel
  );

  // Sort: bids descending (highest first), asks ascending (lowest first)
  if (side === 'bid') {
    aggregated.sort((a, b) => b[0] - a[0]);
  } else {
    aggregated.sort((a, b) => a[0] - b[0]);
  }

  return aggregated;
}

/**
 * Aggregate both bids and asks with the same price step
 */
export function aggregateOrderbook(
  bids: PriceLevel[],
  asks: PriceLevel[],
  step: number = DEFAULT_PRICE_STEP
): { bids: PriceLevel[]; asks: PriceLevel[] } {
  return {
    bids: aggregateLevels(bids, step, 'bid'),
    asks: aggregateLevels(asks, step, 'ask'),
  };
}

/**
 * Calculate cumulative depth from price levels.
 * Used for depth chart visualization - converts flat price levels
 * to cumulative volume at each price point.
 */
export function calculateDepth(levels: PriceLevel[]): DepthPoint[] {
  let cumulative = 0;
  const depth: DepthPoint[] = [];

  for (const [price, volume] of levels) {
    cumulative += volume;
    depth.push({ price, cumulative });
  }

  return depth;
}
