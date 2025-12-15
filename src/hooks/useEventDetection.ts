/**
 * Event Detection Hook
 *
 * Manages the event detector Web Worker and integrates with the events store.
 * Processes orderbook snapshots and adds detected events to the store.
 */

import { useEffect, useRef, useCallback } from 'react';
import type { OrderbookSnapshot } from '../types';
import { useEventsStore } from '../stores/eventsStore';

interface EventDetectionConfig {
  enabled: boolean;
  updateSignificantLevelsInterval?: number; // milliseconds, default 30000 (30s)
}

const SNAPSHOT_HISTORY_SIZE = 100;

class SnapshotHistoryBuffer {
  private buffer: (OrderbookSnapshot | null)[];
  private head: number = 0;
  private size: number = 0;
  private readonly capacity: number;

  constructor(capacity: number = SNAPSHOT_HISTORY_SIZE) {
    this.capacity = capacity;
    this.buffer = new Array(capacity).fill(null);
  }

  push(snapshot: OrderbookSnapshot): void {
    this.buffer[this.head] = snapshot;
    this.head = (this.head + 1) % this.capacity;
    if (this.size < this.capacity) {
      this.size++;
    }
  }

  getAll(): OrderbookSnapshot[] {
    if (this.size === 0) return [];

    const result: OrderbookSnapshot[] = [];
    const startIndex = this.size < this.capacity ? 0 : this.head;

    for (let i = 0; i < this.size; i++) {
      const index = (startIndex + i) % this.capacity;
      const snapshot = this.buffer[index];
      if (snapshot) {
        result.push(snapshot);
      }
    }

    return result;
  }

  clear(): void {
    this.buffer = new Array(this.capacity).fill(null);
    this.head = 0;
    this.size = 0;
  }

  getSize(): number {
    return this.size;
  }
}

export function useEventDetection(
  currentSnapshot: OrderbookSnapshot | null,
  config: EventDetectionConfig = { enabled: true }
) {
  const workerRef = useRef<Worker | null>(null);
  const previousSnapshotRef = useRef<OrderbookSnapshot | null>(null);
  const snapshotHistoryRef = useRef<SnapshotHistoryBuffer>(new SnapshotHistoryBuffer());
  const lastSignificantLevelsUpdateRef = useRef<number>(0);

  const addEvents = useEventsStore((state) => state.addEvents);

  const { enabled, updateSignificantLevelsInterval = 30000 } = config;

  /**
   * Initialize Web Worker
   */
  useEffect(() => {
    if (!enabled) return;

    // Create worker
    const worker = new Worker(
      new URL('../workers/eventDetector.worker.ts', import.meta.url),
      { type: 'module' }
    );

    workerRef.current = worker;

    // Handle worker messages
    worker.onmessage = (event: MessageEvent) => {
      const { type, data } = event.data;

      switch (type) {
        case 'events':
          if (data?.events && data.events.length > 0) {
            addEvents(data.events);
          }
          break;

        case 'significantLevels':
          // Significant levels updated in worker
          // Could store in state if needed for UI display
          break;

        case 'error':
          console.error('Event detector worker error:', data?.error);
          break;

        default:
          console.warn('Unknown worker message type:', type);
      }
    };

    worker.onerror = (error) => {
      console.error('Event detector worker error:', error);
    };

    // Cleanup
    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, [enabled, addEvents]);

  /**
   * Process new snapshot for event detection
   */
  const detectEventsInSnapshot = useCallback(
    (snapshot: OrderbookSnapshot) => {
      if (!workerRef.current || !enabled) return;

      // Send to worker for processing
      workerRef.current.postMessage({
        type: 'detect',
        data: {
          current: snapshot,
          previous: previousSnapshotRef.current,
        },
      });

      // Update refs
      previousSnapshotRef.current = snapshot;

      // Add to circular buffer (O(1) instead of O(n) shift)
      snapshotHistoryRef.current.push(snapshot);
    },
    [enabled]
  );

  /**
   * Update significant price levels periodically
   */
  const updateSignificantLevels = useCallback(() => {
    if (!workerRef.current || !enabled) return;

    const now = Date.now();
    const timeSinceLastUpdate = now - lastSignificantLevelsUpdateRef.current;

    if (timeSinceLastUpdate >= updateSignificantLevelsInterval) {
      if (snapshotHistoryRef.current.getSize() > 0) {
        workerRef.current.postMessage({
          type: 'updateSignificantLevels',
          data: {
            snapshots: snapshotHistoryRef.current.getAll(),
          },
        });

        lastSignificantLevelsUpdateRef.current = now;
      }
    }
  }, [enabled, updateSignificantLevelsInterval]);

  /**
   * Process current snapshot when it changes
   */
  useEffect(() => {
    if (currentSnapshot && enabled) {
      detectEventsInSnapshot(currentSnapshot);
      updateSignificantLevels();
    }
  }, [currentSnapshot, enabled, detectEventsInSnapshot, updateSignificantLevels]);

  /**
   * Reset detection state
   */
  const reset = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.postMessage({ type: 'reset' });
    }
    previousSnapshotRef.current = null;
    snapshotHistoryRef.current.clear();
    lastSignificantLevelsUpdateRef.current = 0;
  }, []);

  return {
    reset,
  };
}
