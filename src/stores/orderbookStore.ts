import { create } from 'zustand';
import type { PriceLevel } from '../types';

interface OrderbookState {
  bids: PriceLevel[];
  asks: PriceLevel[];
  spread: number;
  midPrice: number;
  lastUpdate: number;
  isConnected: boolean;

  setBids: (bids: PriceLevel[]) => void;
  setAsks: (asks: PriceLevel[]) => void;
  updateOrderbook: (bids: PriceLevel[], asks: PriceLevel[]) => void;
  setConnectionStatus: (isConnected: boolean) => void;
}

const calculateSpread = (bids: PriceLevel[], asks: PriceLevel[]): number => {
  if (bids.length === 0 || asks.length === 0) return 0;
  const bestBid = bids[0][0];
  const bestAsk = asks[0][0];
  // Spread should always be positive (bestAsk > bestBid in a normal market)
  // Use Math.abs as a safety measure
  return Math.abs(bestAsk - bestBid);
};

const calculateMidPrice = (bids: PriceLevel[], asks: PriceLevel[]): number => {
  if (bids.length === 0 || asks.length === 0) return 0;
  const bestBid = bids[0][0];
  const bestAsk = asks[0][0];
  return (bestBid + bestAsk) / 2;
};

export const useOrderbookStore = create<OrderbookState>((set) => ({
  bids: [],
  asks: [],
  spread: 0,
  midPrice: 0,
  lastUpdate: 0,
  isConnected: false,

  setBids: (bids) =>
    set((state) => {
      const spread = calculateSpread(bids, state.asks);
      const midPrice = calculateMidPrice(bids, state.asks);
      return {
        bids,
        spread,
        midPrice,
        lastUpdate: Date.now(),
      };
    }),

  setAsks: (asks) =>
    set((state) => {
      const spread = calculateSpread(state.bids, asks);
      const midPrice = calculateMidPrice(state.bids, asks);
      return {
        asks,
        spread,
        midPrice,
        lastUpdate: Date.now(),
      };
    }),

  updateOrderbook: (bids, asks) =>
    set(() => {
      const spread = calculateSpread(bids, asks);
      const midPrice = calculateMidPrice(bids, asks);
      return {
        bids,
        asks,
        spread,
        midPrice,
        lastUpdate: Date.now(),
      };
    }),

  setConnectionStatus: (isConnected) =>
    set({ isConnected }),
}));
