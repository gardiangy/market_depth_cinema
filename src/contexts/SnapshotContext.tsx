import { createContext, useContext, useEffect, useRef, useCallback, type ReactNode } from 'react';
import { useOrderbookStore } from '../stores/orderbookStore';
import { CircularBuffer } from '../lib/CircularBuffer';
import type { OrderbookSnapshot } from '../types';

// Record snapshots every 1 second
const SNAPSHOT_INTERVAL = 1000;
// Buffer holds 3600 snapshots = 1 hour at 1 snapshot/second
const BUFFER_CAPACITY = 3600;

interface SnapshotContextValue {
  getSnapshotAt: (timestamp: number) => OrderbookSnapshot | null;
  getSnapshotsInRange: (start: number, end: number) => OrderbookSnapshot[];
  getTimeRange: () => { start: number; end: number } | null;
  clearSnapshots: () => void;
  getStats: () => {
    bufferSize: number;
    bufferCapacity: number;
  };
}

const SnapshotContext = createContext<SnapshotContextValue | null>(null);

interface SnapshotProviderProps {
  children: ReactNode;
}

export const SnapshotProvider = ({ children }: SnapshotProviderProps) => {
  const bufferRef = useRef<CircularBuffer | null>(null);
  const isInitializedRef = useRef<boolean>(false);

  // Initialize buffer ONCE
  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;
    bufferRef.current = new CircularBuffer(BUFFER_CAPACITY);
  }, []);

  // Record snapshots at regular intervals
  useEffect(() => {
    const recordSnapshot = () => {
      const currentState = useOrderbookStore.getState();
      const { bids, asks, spread, midPrice } = currentState;

      if (bids.length > 0 && asks.length > 0) {
        // Deep clone price levels to prevent retaining references to store data
        const snapshot: OrderbookSnapshot = {
          timestamp: Date.now(),
          bids: bids.map(([price, volume]) => [price, volume]),
          asks: asks.map(([price, volume]) => [price, volume]),
          spread,
          midPrice,
        };
        bufferRef.current?.push(snapshot);
      }
    };

    recordSnapshot();
    const interval = setInterval(recordSnapshot, SNAPSHOT_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  const getSnapshotAt = useCallback((timestamp: number): OrderbookSnapshot | null => {
    return bufferRef.current?.getAt(timestamp) ?? null;
  }, []);

  const getSnapshotsInRange = useCallback((start: number, end: number): OrderbookSnapshot[] => {
    return bufferRef.current?.getRange(start, end) ?? [];
  }, []);

  const getTimeRange = useCallback((): { start: number; end: number } | null => {
    return bufferRef.current?.getTimeRange() ?? null;
  }, []);

  const clearSnapshots = useCallback(() => {
    bufferRef.current?.clear();
  }, []);

  const getStats = useCallback(() => {
    return {
      bufferSize: bufferRef.current?.getSize() ?? 0,
      bufferCapacity: bufferRef.current?.getCapacity() ?? 0,
    };
  }, []);

  const value: SnapshotContextValue = {
    getSnapshotAt,
    getSnapshotsInRange,
    getTimeRange,
    clearSnapshots,
    getStats,
  };

  return (
    <SnapshotContext.Provider value={value}>
      {children}
    </SnapshotContext.Provider>
  );
};

export const useSnapshots = (): SnapshotContextValue => {
  const context = useContext(SnapshotContext);
  if (!context) {
    throw new Error('useSnapshots must be used within a SnapshotProvider');
  }
  return context;
};
