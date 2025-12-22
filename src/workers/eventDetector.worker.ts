/**
 * Event Detector Web Worker
 *
 * Runs event detection algorithms off the main thread to avoid blocking UI.
 * Receives orderbook snapshots and returns detected events.
 */

import type { OrderbookSnapshot, DetectedEvent } from '../types';
import { detectEvents, calculateSignificantLevels } from '../lib/eventDetection';

interface WorkerMessage {
  type: 'detect' | 'updateSignificantLevels' | 'reset';
  data?: {
    current?: OrderbookSnapshot;
    previous?: OrderbookSnapshot | null;
    recentRemovals?: Array<{ timestamp: number; side: 'bid' | 'ask' }>;
    significantLevels?: number[];
    snapshots?: OrderbookSnapshot[];
  };
}

interface WorkerResponse {
  type: 'events' | 'significantLevels' | 'error';
  data?: {
    events?: DetectedEvent[];
    significantLevels?: number[];
    error?: string;
  };
}

// Worker state
let previousSnapshot: OrderbookSnapshot | null = null;
let recentRemovals: Array<{ timestamp: number; side: 'bid' | 'ask' }> = [];
let significantLevels: number[] = [];

// Cooldown tracking to prevent duplicate events
const eventCooldowns: Map<string, number> = new Map();
const COOLDOWN_MS = 5000; // 5 second cooldown for similar events

const REMOVAL_HISTORY_LIMIT = 100; // Keep last 100 removal events

/**
 * Track order removals for rapid cancellation detection
 */
function trackRemovals(
  current: OrderbookSnapshot,
  previous: OrderbookSnapshot | null
): void {
  if (!previous) return;

  const currentTimestamp = current.timestamp;

  // Check for removed bids
  for (const [price, volume] of previous.bids) {
    const currentLevel = current.bids.find(([p]) => p === price);
    if (!currentLevel || currentLevel[1] < volume) {
      recentRemovals.push({ timestamp: currentTimestamp, side: 'bid' });
    }
  }

  // Check for removed asks
  for (const [price, volume] of previous.asks) {
    const currentLevel = current.asks.find(([p]) => p === price);
    if (!currentLevel || currentLevel[1] < volume) {
      recentRemovals.push({ timestamp: currentTimestamp, side: 'ask' });
    }
  }

  // Limit removal history size
  if (recentRemovals.length > REMOVAL_HISTORY_LIMIT) {
    recentRemovals = recentRemovals.slice(-REMOVAL_HISTORY_LIMIT);
  }
}

/**
 * Clean up old removal events outside the detection window
 */
function cleanupOldRemovals(currentTimestamp: number): void {
  const cutoffTime = currentTimestamp - 2000; // Keep 2 seconds of history
  recentRemovals = recentRemovals.filter(r => r.timestamp >= cutoffTime);
}

/**
 * Generate a cooldown key for an event to prevent duplicates
 */
function getCooldownKey(event: DetectedEvent): string {
  switch (event.type) {
    case 'liquidity_gap': {
      // Round price to nearest $100 to group similar gaps
      const side = event.details.side as string;
      const startPrice = Math.round((event.details.startPrice as number) / 100) * 100;
      return `${event.type}-${side}-${startPrice}`;
    }
    case 'spread_change': {
      // Group by direction (widened/narrowed)
      const direction = event.details.direction as string;
      return `${event.type}-${direction}`;
    }
    case 'large_order_added':
    case 'large_order_removed': {
      // Round price to nearest $50 to group similar price levels
      const side = event.details.side as string;
      const price = Math.round((event.details.price as number) / 50) * 50;
      return `${event.type}-${side}-${price}`;
    }
    case 'rapid_cancellations': {
      // Group by side
      const side = event.details.side as string;
      return `${event.type}-${side}`;
    }
    default:
      return `${event.type}-${event.id}`;
  }
}

/**
 * Filter events based on cooldown to prevent duplicates
 */
function filterByCooldown(events: DetectedEvent[], currentTimestamp: number): DetectedEvent[] {
  // Clean up expired cooldowns
  for (const [key, expiry] of eventCooldowns.entries()) {
    if (expiry < currentTimestamp) {
      eventCooldowns.delete(key);
    }
  }

  return events.filter(event => {
    const key = getCooldownKey(event);
    const cooldownExpiry = eventCooldowns.get(key);

    if (cooldownExpiry && cooldownExpiry > currentTimestamp) {
      // Still in cooldown, skip this event
      return false;
    }

    // Set cooldown for this event type/key
    eventCooldowns.set(key, currentTimestamp + COOLDOWN_MS);
    return true;
  });
}

/**
 * Handle incoming messages from main thread
 */
self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const { type, data } = event.data;

  try {
    switch (type) {
      case 'detect': {
        if (!data?.current) {
          throw new Error('Current snapshot is required');
        }

        const current = data.current;
        const previous = data.previous ?? previousSnapshot;

        // Track removals
        trackRemovals(current, previous);

        // Clean up old removals periodically
        cleanupOldRemovals(current.timestamp);

        // Run event detection
        const rawEvents = detectEvents(
          current,
          previous,
          recentRemovals,
          data.significantLevels ?? significantLevels
        );

        // Filter events by cooldown to prevent duplicates
        const events = filterByCooldown(rawEvents, current.timestamp);

        // Update previous snapshot
        previousSnapshot = current;

        // Send detected events back to main thread
        const response: WorkerResponse = {
          type: 'events',
          data: { events },
        };
        self.postMessage(response);
        break;
      }

      case 'updateSignificantLevels': {
        if (!data?.snapshots) {
          throw new Error('Snapshots are required for calculating significant levels');
        }

        // Calculate significant levels in worker
        const levels = calculateSignificantLevels(data.snapshots, 5);
        significantLevels = levels;

        const response: WorkerResponse = {
          type: 'significantLevels',
          data: { significantLevels: levels },
        };
        self.postMessage(response);
        break;
      }

      case 'reset': {
        // Reset worker state
        previousSnapshot = null;
        recentRemovals = [];
        significantLevels = [];
        eventCooldowns.clear();
        break;
      }

      default:
        throw new Error(`Unknown message type: ${type}`);
    }
  } catch (error) {
    const response: WorkerResponse = {
      type: 'error',
      data: {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    };
    self.postMessage(response);
  }
};

// Export empty object to make TypeScript happy
export {};
