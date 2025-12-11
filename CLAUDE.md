# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Market Depth Cinema is a cinematic time-travel orderbook visualizer for Kraken's BTC/USD trading pair. It allows users to rewind, pause, fast-forward, and analyze market depth with intelligent auto-detection of significant market events.

**Key Features:**
- Real-time orderbook depth chart from Kraken WebSocket API
- Time-travel: record, replay, scrub through historical orderbook states
- Playback controls (0.1x to 10x speed)
- Auto-detected events (large orders, spread changes, liquidity gaps)
- Event markers on timeline for quick navigation
- Heatmap visualization of liquidity concentration

## Tech Stack

- **Framework:** React 19 + TypeScript 5
- **Build Tool:** Vite
- **State Management:** Zustand
- **Visualization:** D3.js
- **Animations:** Framer Motion
- **Storage:** IndexedDB (via `idb` library)
- **WebSocket:** reconnecting-websocket
- **Styling:** Tailwind CSS (dark theme)

## Common Commands

```bash
# Development
npm install              # Install dependencies
npm run dev              # Start dev server

# Build
npm run build            # Production build
npm run preview          # Preview production build

# Linting & Formatting
npm run lint             # Run ESLint
npm run format           # Run Prettier
```

## Architecture

### High-Level Structure

The application follows a component-based architecture with clear separation of concerns:

1. **WebSocket Layer** (`hooks/useKrakenOrderbook.ts`): Manages connection to Kraken's WebSocket API, subscribes to the `book` channel for XBT/USD, parses snapshot and delta messages, and maintains sorted bids/asks arrays.

2. **Storage Layer**: Two-tier system for time travel:
   - **In-Memory Circular Buffer**: Stores last ~10 minutes of snapshots (6000 snapshots at 100ms intervals)
   - **IndexedDB**: Persists older snapshots beyond the buffer capacity, with automatic offloading

3. **State Management** (Zustand stores):
   - `orderbookStore.ts`: Current orderbook state (bids, asks, spread, midPrice)
   - `playbackStore.ts`: Playback mode (live/replay), current timestamp, speed, play state
   - `eventsStore.ts`: Detected events with timestamps and metadata

4. **Visualization Layer** (D3.js components):
   - `DepthChart`: Main depth chart with smooth transitions, heatmap overlay, and interactivity
   - `Timeline`: Scrubber with event markers and minimap showing spread over time

5. **Event Detection** (`workers/eventDetector.worker.ts`): Web Worker that runs off the main thread to detect:
   - Large orders (>1 BTC threshold)
   - Spread changes (>0.1% threshold)
   - Liquidity gaps (>0.5% price gap)
   - Rapid cancellations (>5 in 1 second)
   - Price level breakthroughs

### Folder Structure

```
src/
├── components/           # React components
│   ├── DepthChart/       # D3 depth chart visualization
│   ├── Timeline/         # Scrubber and playback timeline
│   ├── Controls/         # Play/pause/speed controls
│   ├── EventPanel/       # Detected events list
│   └── ui/               # Shared UI primitives
├── hooks/                # Custom React hooks
│   ├── useKrakenOrderbook.ts
│   ├── usePlayback.ts
│   ├── useSnapshots.ts
│   └── useEventDetection.ts
├── lib/                  # Pure functions
│   ├── eventDetection.ts
│   ├── orderbookUtils.ts
│   └── formatters.ts
├── workers/              # Web Workers
│   └── eventDetector.worker.ts
├── stores/               # Zustand stores
│   ├── orderbookStore.ts
│   ├── playbackStore.ts
│   └── eventsStore.ts
└── types/                # TypeScript interfaces
    └── index.ts
```

## Data Structures

### OrderbookSnapshot
```typescript
interface OrderbookSnapshot {
  timestamp: number;
  bids: [price: number, volume: number][];
  asks: [price: number, volume: number][];
  spread: number;
  midPrice: number;
}
```

### PlaybackState
```typescript
interface PlaybackState {
  mode: 'live' | 'replay';
  currentTimestamp: number;
  playbackSpeed: number; // 0.1, 0.5, 1, 2, 5, 10
  isPlaying: boolean;
}
```

### DetectedEvent
```typescript
type EventType =
  | 'large_order_added'
  | 'large_order_removed'
  | 'spread_change'
  | 'liquidity_gap'
  | 'rapid_cancellations'
  | 'price_level_breakthrough';

interface DetectedEvent {
  id: string;
  type: EventType;
  timestamp: number;
  severity: 'low' | 'medium' | 'high';
  details: Record<string, unknown>;
}
```

## Kraken WebSocket API

**Endpoint:** `wss://ws.kraken.com`

**Subscribe to orderbook:**
```json
{
  "event": "subscribe",
  "pair": ["XBT/USD"],
  "subscription": {
    "name": "book",
    "depth": 100
  }
}
```

**Message types:**
1. **Snapshot:** Initial full orderbook state
2. **Update:** Delta updates (adds, removes, changes)

**Documentation:** https://docs.kraken.com/websockets/

## Performance Considerations

- **Rendering:** Throttle render updates to 60fps (max every 100ms) using `requestAnimationFrame`
- **D3 Visualization:** Consider Canvas instead of SVG if performance degrades with high update frequency
- **Event Detection:** Run in Web Worker to avoid blocking main thread
- **Storage:** Circular buffer limits memory usage; oldest snapshots offloaded to IndexedDB
- **WebSocket:** Use reconnecting-websocket library to handle connection drops gracefully

## Keyboard Shortcuts

- `Space`: Play/pause
- `←` / `→`: Step backward/forward 1 second
- `Shift + ←` / `→`: Step 10 seconds
- `L`: Go live

## Event Detection Thresholds

These are configurable defaults:

| Event Type | Threshold | Notes |
|------------|-----------|-------|
| Large Order | > 1 BTC | Adjust based on typical market depth |
| Spread Change | > 0.1% | Relative to previous spread |
| Liquidity Gap | > 0.5% price gap | No orders in range |
| Rapid Cancellations | > 5 in 1 second | Sliding window |
| Price Breakthrough | Crosses 24h high/low | Requires additional data |

## Development Notes

- **D3 + React:** Use `useEffect` pattern for D3 code. D3 handles DOM manipulation inside React refs.
- **WebSocket Reconnection:** Always handle reconnection gracefully. Show connection status indicator.
- **Snapshot Recording:** Capture snapshots on meaningful orderbook updates, not every message (reduces memory).
- **IndexedDB Schema:** Database name: `market-depth-cinema`, Store: `snapshots`, Index: by timestamp
- **Circular Buffer:** Implements `push()`, `getRange(startTime, endTime)`, `getAt(timestamp)` methods
- **Playback Loop:** Use `setInterval` adjusted for playback speed. Update chart from historical snapshots.
- **Mock Data:** Build mock data generator as fallback for demos if Kraken WS has issues.
