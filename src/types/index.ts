export type PriceLevel = [price: number, volume: number];

export interface OrderbookSnapshot {
  timestamp: number;
  bids: PriceLevel[];
  asks: PriceLevel[];
  spread: number;
  midPrice: number;
}

export interface PlaybackState {
  mode: 'live' | 'replay';
  currentTimestamp: number;
  playbackSpeed: number; // 0.1, 0.5, 1, 2, 5, 10
  isPlaying: boolean;
}

export type EventType =
  | 'large_order_added'
  | 'large_order_removed'
  | 'spread_change'
  | 'liquidity_gap'
  | 'rapid_cancellations'
  | 'price_level_breakthrough';

export type EventSeverity = 'low' | 'medium' | 'high';

export interface DetectedEvent {
  id: string;
  type: EventType;
  timestamp: number;
  severity: EventSeverity;
  details: Record<string, unknown>;
}

export interface KrakenSubscription {
  event: 'subscribe' | 'unsubscribe';
  pair: string[];
  subscription: {
    name: string;
    depth?: number;
  };
}

export interface KrakenMessage {
  event?: string;
  status?: string;
  pair?: string;
  channelID?: number;
  channelName?: string;
  subscription?: {
    name: string;
  };
}

export interface KrakenBookSnapshot {
  as: PriceLevel[];
  bs: PriceLevel[];
}

export interface KrakenBookUpdate {
  a?: PriceLevel[];
  b?: PriceLevel[];
  c?: string;
}
