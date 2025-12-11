import { useState, useEffect } from 'react';
import { useOrderbookStore } from '../stores/orderbookStore';
import { usePlaybackStore } from '../stores/playbackStore';
import { useSnapshots } from './useSnapshots';
import type { PriceLevel, OrderbookSnapshot } from '../types';

interface DisplayOrderbook {
  bids: PriceLevel[];
  asks: PriceLevel[];
  spread: number;
  midPrice: number;
  currentSnapshot: OrderbookSnapshot | null;
}

/**
 * Hook that provides the correct orderbook data for display
 * - In LIVE mode: returns live orderbook from WebSocket
 * - In REPLAY mode: returns historical snapshot data
 */
export const useDisplayOrderbook = (): DisplayOrderbook => {
  const liveOrderbook = useOrderbookStore();
  const { mode, currentTimestamp } = usePlaybackStore();
  const { getSnapshotAt } = useSnapshots();

  const [displayData, setDisplayData] = useState<DisplayOrderbook>({
    bids: liveOrderbook.bids,
    asks: liveOrderbook.asks,
    spread: liveOrderbook.spread,
    midPrice: liveOrderbook.midPrice,
    currentSnapshot: null,
  });

  // In live mode, use live orderbook data
  useEffect(() => {
    if (mode === 'live') {
      const snapshot: OrderbookSnapshot = {
        timestamp: Date.now(),
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
        currentSnapshot: snapshot,
      });
    }
  }, [mode, liveOrderbook.bids, liveOrderbook.asks, liveOrderbook.spread, liveOrderbook.midPrice]);

  // In replay mode, load snapshot data
  useEffect(() => {
    if (mode === 'replay') {
      const loadSnapshot = async () => {
        const snapshot = await getSnapshotAt(currentTimestamp);
        if (snapshot) {
          setDisplayData({
            bids: snapshot.bids,
            asks: snapshot.asks,
            spread: snapshot.spread,
            midPrice: snapshot.midPrice,
            currentSnapshot: snapshot,
          });
        }
      };

      loadSnapshot();
    }
  }, [mode, currentTimestamp, getSnapshotAt]);

  return displayData;
};
