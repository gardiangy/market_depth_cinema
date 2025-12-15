import { useState, useEffect, useRef } from 'react';
import { useOrderbookStore } from '../stores/orderbookStore';
import { usePlaybackStore } from '../stores/playbackStore';
import { useSnapshots } from '../contexts/SnapshotContext';
import type { PriceLevel } from '../types';

// Debounce delay for replay mode timestamp changes (ms)
const REPLAY_DEBOUNCE_MS = 50;

interface DisplayOrderbook {
  bids: PriceLevel[];
  asks: PriceLevel[];
  spread: number;
  midPrice: number;
}

/**
 * Hook that provides the correct orderbook data for display
 * - In LIVE mode: returns live orderbook from WebSocket
 * - In REPLAY mode: returns historical snapshot data (debounced)
 */
export const useDisplayOrderbook = (): DisplayOrderbook => {
  const liveOrderbook = useOrderbookStore();
  const { mode, currentTimestamp } = usePlaybackStore();
  const { getSnapshotAt } = useSnapshots();

  // Track previous values to avoid unnecessary state updates
  const prevValuesRef = useRef<{
    bids: PriceLevel[];
    asks: PriceLevel[];
    spread: number;
    midPrice: number;
  } | null>(null);

  // Debounce timer ref for replay mode
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);

  const [displayData, setDisplayData] = useState<DisplayOrderbook>({
    bids: liveOrderbook.bids,
    asks: liveOrderbook.asks,
    spread: liveOrderbook.spread,
    midPrice: liveOrderbook.midPrice,
  });

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, []);

  // In live mode, use live orderbook data - but only update if values changed
  useEffect(() => {
    if (mode === 'live') {
      // Clear any pending debounce timer when switching to live
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }

      const prev = prevValuesRef.current;

      // Skip update if nothing changed (shallow compare)
      if (
        prev &&
        prev.bids === liveOrderbook.bids &&
        prev.asks === liveOrderbook.asks &&
        prev.spread === liveOrderbook.spread &&
        prev.midPrice === liveOrderbook.midPrice
      ) {
        return;
      }

      prevValuesRef.current = {
        bids: liveOrderbook.bids,
        asks: liveOrderbook.asks,
        spread: liveOrderbook.spread,
        midPrice: liveOrderbook.midPrice,
      };

      setDisplayData({
        bids: liveOrderbook.bids,
        asks: liveOrderbook.asks,
        spread: liveOrderbook.spread,
        midPrice: liveOrderbook.midPrice,
      });
    }
  }, [mode, liveOrderbook.bids, liveOrderbook.asks, liveOrderbook.spread, liveOrderbook.midPrice]);

  // In replay mode, load snapshot data with throttling
  // Use a ref to track the last loaded timestamp to avoid redundant loads
  const lastLoadedTimestampRef = useRef<number>(0);

  useEffect(() => {
    if (mode !== 'replay') {
      return;
    }

    // Clear any pending timer when we get a new timestamp
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    // Throttle: only load if enough time has passed OR timestamp jumped significantly
    // This allows smooth playback while still debouncing rapid scrubbing
    const timeSinceLastLoad = Date.now() - lastLoadedTimestampRef.current;
    const timestampJump = Math.abs(currentTimestamp - lastLoadedTimestampRef.current);

    // Load immediately if:
    // - First load (lastLoadedTimestampRef is 0)
    // - Enough real time has passed (throttle window)
    // - User jumped to a significantly different time (scrubbing)
    const shouldLoadImmediately =
      lastLoadedTimestampRef.current === 0 ||
      timeSinceLastLoad >= REPLAY_DEBOUNCE_MS ||
      timestampJump > 1000; // Jump of more than 1 second

    const loadSnapshot = () => {
      const snapshot = getSnapshotAt(currentTimestamp);

      // Check if still mounted and still in replay mode
      if (!isMountedRef.current) return;

      if (snapshot) {
        lastLoadedTimestampRef.current = Date.now();
        // Clone the snapshot data to prevent retaining references to buffer objects
        // This allows the original buffer objects to be garbage collected
        setDisplayData({
          bids: snapshot.bids.map(level => [...level] as PriceLevel),
          asks: snapshot.asks.map(level => [...level] as PriceLevel),
          spread: snapshot.spread,
          midPrice: snapshot.midPrice,
        });
      }
    };

    if (shouldLoadImmediately) {
      loadSnapshot();
    } else {
      // Schedule load after debounce delay
      debounceTimerRef.current = setTimeout(loadSnapshot, REPLAY_DEBOUNCE_MS);
    }
  }, [mode, currentTimestamp, getSnapshotAt]);

  return displayData;
};
