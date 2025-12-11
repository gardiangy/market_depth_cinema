import { useEffect, useRef, useCallback } from 'react';
import { useOrderbookStore } from '../stores/orderbookStore';
import { CircularBuffer } from '../lib/CircularBuffer';
import { initSnapshotDB, type SnapshotDB } from '../lib/snapshotDB';
import type { OrderbookSnapshot } from '../types';

const SNAPSHOT_INTERVAL = 100; // 100ms between snapshots
const OFFLOAD_THRESHOLD = 5500; // Start offloading when buffer reaches 5500 (out of 6000)
const OFFLOAD_COUNT = 1000; // Offload 1000 snapshots at a time
const MAX_DB_SNAPSHOTS = 100000; // Maximum snapshots in IndexedDB (~2.7 hours at 100ms)

export const useSnapshots = () => {
  const bufferRef = useRef<CircularBuffer | null>(null);
  const dbRef = useRef<SnapshotDB | null>(null);
  const offloadingRef = useRef<boolean>(false);

  // Initialize buffer and database
  useEffect(() => {
    if (!bufferRef.current) {
      bufferRef.current = new CircularBuffer(6000);
    }

    if (!dbRef.current) {
      initSnapshotDB().then((db) => {
        dbRef.current = db;
      });
    }
  }, []);

  // Record snapshots at regular intervals using a timer
  useEffect(() => {
    const recordSnapshot = () => {
      const currentState = useOrderbookStore.getState();
      const { bids, asks, spread, midPrice } = currentState;

      // Only create snapshot if we have data
      if (bids.length > 0 && asks.length > 0) {
        const snapshot: OrderbookSnapshot = {
          timestamp: Date.now(),
          bids: [...bids],
          asks: [...asks],
          spread,
          midPrice,
        };

        bufferRef.current?.push(snapshot);

        // Check if we need to offload to IndexedDB
        if (
          bufferRef.current &&
          bufferRef.current.getSize() >= OFFLOAD_THRESHOLD &&
          !offloadingRef.current
        ) {
          offloadSnapshots();
        }
      }
    };

    // Record initial snapshot
    recordSnapshot();

    // Set up interval to record snapshots
    const interval = setInterval(recordSnapshot, SNAPSHOT_INTERVAL);

    return () => clearInterval(interval);
  }, []); // Empty deps - runs once on mount

  // Offload old snapshots from buffer to IndexedDB
  const offloadSnapshots = useCallback(async () => {
    if (!bufferRef.current || !dbRef.current || offloadingRef.current) {
      return;
    }

    offloadingRef.current = true;

    try {
      const allSnapshots = bufferRef.current.getAll();
      const toOffload = allSnapshots.slice(0, OFFLOAD_COUNT);

      if (toOffload.length > 0) {
        await dbRef.current.addSnapshots(toOffload);

        // Check if we need to delete old snapshots from DB
        const dbCount = await dbRef.current.getCount();
        if (dbCount > MAX_DB_SNAPSHOTS) {
          const deleteCount = dbCount - MAX_DB_SNAPSHOTS;
          await dbRef.current.deleteOldest(deleteCount);
        }
      }
    } catch (error) {
      console.error('Error offloading snapshots to IndexedDB:', error);
    } finally {
      offloadingRef.current = false;
    }
  }, []);

  // Get snapshot at specific timestamp (checks buffer first, then DB)
  const getSnapshotAt = useCallback(
    async (timestamp: number): Promise<OrderbookSnapshot | null> => {
      // Try buffer first (faster)
      const bufferSnapshot = bufferRef.current?.getAt(timestamp);
      if (bufferSnapshot) {
        return bufferSnapshot;
      }

      // Fall back to IndexedDB
      if (dbRef.current) {
        try {
          return await dbRef.current.getSnapshotAt(timestamp);
        } catch (error) {
          console.error('Error retrieving snapshot from IndexedDB:', error);
          return null;
        }
      }

      return null;
    },
    []
  );

  // Get snapshots in time range (combines buffer and DB)
  const getSnapshotsInRange = useCallback(
    async (start: number, end: number): Promise<OrderbookSnapshot[]> => {
      const bufferSnapshots = bufferRef.current?.getRange(start, end) || [];

      if (!dbRef.current) {
        return bufferSnapshots;
      }

      try {
        const dbSnapshots = await dbRef.current.getSnapshotsInRange(start, end);

        // Merge and deduplicate by timestamp
        const merged = new Map<number, OrderbookSnapshot>();

        [...dbSnapshots, ...bufferSnapshots].forEach((snapshot) => {
          merged.set(snapshot.timestamp, snapshot);
        });

        return Array.from(merged.values()).sort((a, b) => a.timestamp - b.timestamp);
      } catch (error) {
        console.error('Error retrieving snapshots from IndexedDB:', error);
        return bufferSnapshots;
      }
    },
    []
  );

  // Get time range covered by all snapshots
  const getTimeRange = useCallback(async (): Promise<{
    start: number;
    end: number;
  } | null> => {
    const bufferRange = bufferRef.current?.getTimeRange();

    if (!dbRef.current) {
      return bufferRange ?? null;
    }

    try {
      const oldestDB = await dbRef.current.getOldestTimestamp();
      const newestDB = await dbRef.current.getNewestTimestamp();

      const start = oldestDB ?? bufferRange?.start;
      const end = newestDB ?? bufferRange?.end;

      if (start === undefined || start === null || end === undefined || end === null) {
        return null;
      }

      return { start, end };
    } catch (error) {
      console.error('Error getting time range from IndexedDB:', error);
      return bufferRange ?? null;
    }
  }, []);

  // Clear all snapshots
  const clearSnapshots = useCallback(async () => {
    bufferRef.current?.clear();

    if (dbRef.current) {
      try {
        await dbRef.current.clearAll();
      } catch (error) {
        console.error('Error clearing IndexedDB:', error);
      }
    }
  }, []);

  // Get statistics
  const getStats = useCallback(async () => {
    const bufferSize = bufferRef.current?.getSize() || 0;
    const dbSize = dbRef.current ? await dbRef.current.getCount() : 0;

    return {
      bufferSize,
      dbSize,
      totalSize: bufferSize + dbSize,
      bufferCapacity: bufferRef.current?.getCapacity() || 0,
    };
  }, []);

  return {
    getSnapshotAt,
    getSnapshotsInRange,
    getTimeRange,
    clearSnapshots,
    getStats,
  };
};
