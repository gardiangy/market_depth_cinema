import { useEffect, useRef } from 'react';
import ReconnectingWebSocket from 'reconnecting-websocket';
import { useOrderbookStore } from '../stores/orderbookStore';
import type { PriceLevel, KrakenBookSnapshot, KrakenBookUpdate } from '../types';

const KRAKEN_WS_URL = 'wss://ws.kraken.com';
const PAIR = 'XBT/USD';
const DEPTH = 100;

export const useKrakenOrderbook = () => {
  const wsRef = useRef<ReconnectingWebSocket | null>(null);
  const { updateOrderbook, setConnectionStatus } = useOrderbookStore();

  useEffect(() => {
    const ws = new ReconnectingWebSocket(KRAKEN_WS_URL, [], {
      maxReconnectionDelay: 10000,
      minReconnectionDelay: 1000,
      reconnectionDelayGrowFactor: 1.3,
      connectionTimeout: 4000,
      maxRetries: Infinity,
      debug: false,
    });

    wsRef.current = ws;

    ws.addEventListener('open', () => {
      console.log('WebSocket connected to Kraken');
      setConnectionStatus(true);

      const subscribeMessage = {
        event: 'subscribe',
        pair: [PAIR],
        subscription: {
          name: 'book',
          depth: DEPTH,
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

    ws.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data);

        if (Array.isArray(data)) {
          const [, payload, channelName] = data;

          if (channelName === 'book-100') {
            if ('as' in payload && 'bs' in payload) {
              const snapshot = payload as KrakenBookSnapshot;
              const bids = sortAndFormat(snapshot.bs, 'desc');
              const asks = sortAndFormat(snapshot.as, 'asc');
              updateOrderbook(bids, asks);
            } else {
              const update = payload as KrakenBookUpdate;
              const currentState = useOrderbookStore.getState();
              let newBids = [...currentState.bids];
              let newAsks = [...currentState.asks];

              if (update.b && update.b.length > 0) {
                newBids = applyUpdates(newBids, update.b, 'desc');
              }

              if (update.a && update.a.length > 0) {
                newAsks = applyUpdates(newAsks, update.a, 'asc');
              }

              updateOrderbook(newBids, newAsks);
            }
          }
        } else if (data.event === 'subscriptionStatus') {
          console.log('Subscription status:', data);
        } else if (data.event === 'systemStatus') {
          console.log('System status:', data);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [updateOrderbook, setConnectionStatus]);

  return wsRef.current;
};

function sortAndFormat(
  levels: PriceLevel[],
  order: 'asc' | 'desc'
): PriceLevel[] {
  const sorted = [...levels].sort((a, b) => {
    if (order === 'desc') {
      return b[0] - a[0];
    }
    return a[0] - b[0];
  });

  return sorted.map(([price, volume]) => [
    parseFloat(price.toString()),
    parseFloat(volume.toString()),
  ]);
}

function applyUpdates(
  currentLevels: PriceLevel[],
  updates: PriceLevel[],
  order: 'asc' | 'desc'
): PriceLevel[] {
  const levelMap = new Map<number, number>();

  currentLevels.forEach(([price, volume]) => {
    levelMap.set(price, volume);
  });

  updates.forEach(([price, volume]) => {
    const parsedPrice = parseFloat(price.toString());
    const parsedVolume = parseFloat(volume.toString());

    if (parsedVolume === 0) {
      levelMap.delete(parsedPrice);
    } else {
      levelMap.set(parsedPrice, parsedVolume);
    }
  });

  const result: PriceLevel[] = Array.from(levelMap.entries());

  return result.sort((a, b) => {
    if (order === 'desc') {
      return b[0] - a[0];
    }
    return a[0] - b[0];
  });
}
