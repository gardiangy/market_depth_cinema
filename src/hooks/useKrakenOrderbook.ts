import { useEffect, useRef } from 'react';
import ReconnectingWebSocket from 'reconnecting-websocket';
import { useOrderbookStore } from '../stores/orderbookStore';
import type { PriceLevel } from '../types';

// Kraken WebSocket V2 API
const KRAKEN_WS_V2_URL = 'wss://ws.kraken.com/v2';
const SYMBOL = 'BTC/USD';
const DEPTH = 100;

// Batch updates over 1000ms window to reduce React renders
const UPDATE_BATCH_INTERVAL = 1000;

// V2 API types
interface KrakenV2Level {
  price: number;
  qty: number;
}

interface KrakenV2BookData {
  symbol: string;
  bids: KrakenV2Level[];
  asks: KrakenV2Level[];
  checksum: number;
  timestamp?: string;
}

interface KrakenV2Message {
  channel: string;
  type: 'snapshot' | 'update';
  data: KrakenV2BookData[];
}

interface KrakenV2SubscriptionStatus {
  method: string;
  result?: {
    channel: string;
    symbol: string;
    depth: number;
    snapshot: boolean;
  };
  success: boolean;
  time_in: string;
  time_out: string;
}

export const useKrakenOrderbook = () => {
  const wsRef = useRef<ReconnectingWebSocket | null>(null);
  const { updateOrderbook, setConnectionStatus } = useOrderbookStore();

  // Store current orderbook state for applying updates
  const bidsMapRef = useRef<Map<number, number>>(new Map());
  const asksMapRef = useRef<Map<number, number>>(new Map());

  // Batching state
  const batchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasPendingUpdatesRef = useRef(false);

  useEffect(() => {
    const ws = new ReconnectingWebSocket(KRAKEN_WS_V2_URL, [], {
      maxReconnectionDelay: 10000,
      minReconnectionDelay: 1000,
      reconnectionDelayGrowFactor: 1.3,
      connectionTimeout: 4000,
      maxRetries: Infinity,
      debug: false,
    });

    wsRef.current = ws;

    ws.addEventListener('open', () => {
      console.log('WebSocket V2 connected to Kraken');
      setConnectionStatus(true);

      // V2 API subscription format
      const subscribeMessage = {
        method: 'subscribe',
        params: {
          channel: 'book',
          symbol: [SYMBOL],
          depth: DEPTH,
          snapshot: true,
        },
      };

      ws.send(JSON.stringify(subscribeMessage));
    });

    ws.addEventListener('close', () => {
      console.log('WebSocket disconnected');
      setConnectionStatus(false);
    });

    ws.addEventListener('error', (error) => {
      console.error('WebSocket error:', error);
      setConnectionStatus(false);
    });

    // Convert map to sorted PriceLevel array
    const mapToSortedArray = (map: Map<number, number>, descending: boolean): PriceLevel[] => {
      const entries = Array.from(map.entries()) as PriceLevel[];
      return entries.sort((a, b) => descending ? b[0] - a[0] : a[0] - b[0]);
    };

    // Flush batched updates to store
    const flushBatchedUpdates = () => {
      if (!hasPendingUpdatesRef.current) return;

      const bids = mapToSortedArray(bidsMapRef.current, true);
      const asks = mapToSortedArray(asksMapRef.current, false);

      updateOrderbook(bids, asks);
      hasPendingUpdatesRef.current = false;
      batchTimerRef.current = null;
    };

    // Schedule batch flush
    const scheduleBatchFlush = () => {
      if (!batchTimerRef.current) {
        batchTimerRef.current = setTimeout(flushBatchedUpdates, UPDATE_BATCH_INTERVAL);
      }
    };

    // Apply V2 levels to map (handles both snapshot and update)
    const applyLevelsToMap = (map: Map<number, number>, levels: KrakenV2Level[]) => {
      for (const level of levels) {
        if (level.qty === 0) {
          // Remove price level
          map.delete(level.price);
        } else {
          // Add or update price level
          map.set(level.price, level.qty);
        }
      }
    };

    ws.addEventListener('message', (event) => {
      try {
        const message = JSON.parse(event.data);

        // Handle subscription status
        if (message.method === 'subscribe') {
          const status = message as KrakenV2SubscriptionStatus;
          if (status.success) {
            console.log('Subscribed to book channel:', status.result);
          } else {
            console.error('Subscription failed:', message);
          }
          return;
        }

        // Handle heartbeat
        if (message.channel === 'heartbeat') {
          return;
        }

        // Handle book messages
        if (message.channel === 'book') {
          const bookMessage = message as KrakenV2Message;

          for (const data of bookMessage.data) {
            if (bookMessage.type === 'snapshot') {
              // Clear and rebuild orderbook from snapshot
              bidsMapRef.current.clear();
              asksMapRef.current.clear();

              applyLevelsToMap(bidsMapRef.current, data.bids);
              applyLevelsToMap(asksMapRef.current, data.asks);

              // Immediately update store with snapshot
              const bids = mapToSortedArray(bidsMapRef.current, true);
              const asks = mapToSortedArray(asksMapRef.current, false);
              updateOrderbook(bids, asks);

            } else if (bookMessage.type === 'update') {
              // Apply incremental updates to maps
              applyLevelsToMap(bidsMapRef.current, data.bids);
              applyLevelsToMap(asksMapRef.current, data.asks);

              // Schedule batched update
              hasPendingUpdatesRef.current = true;
              scheduleBatchFlush();
            }
          }
        }

      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });

    return () => {
      // Clear batch timer on cleanup
      if (batchTimerRef.current) {
        clearTimeout(batchTimerRef.current);
        batchTimerRef.current = null;
      }
      hasPendingUpdatesRef.current = false;

      // Clear maps
      bidsMapRef.current.clear();
      asksMapRef.current.clear();

      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [updateOrderbook, setConnectionStatus]);

  return wsRef.current;
};
