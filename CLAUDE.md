# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Market Depth Cinema is a cinematic time-travel orderbook visualizer for Kraken's BTC/USD trading pair. It allows users to rewind, pause, fast-forward, and analyze market depth with intelligent auto-detection of significant market events.

**Key Features:**
- Real-time orderbook depth chart from Kraken WebSocket API
- Time-travel: record, replay, scrub through historical orderbook states
- Playback controls (0.1x to 10x speed)
- Auto-detected events (large orders, spread changes, liquidity gaps, rapid cancellations)
- Event markers on timeline for quick navigation
- Heatmap visualization of liquidity concentration (toggleable)
- Aggregated event display with severity-based grouping

## Tech Stack

- **Framework:** React 19 + TypeScript 5
- **Build Tool:** Vite 7
- **State Management:** Zustand 5
- **Visualization:** D3.js 7
- **Animations:** Framer Motion
- **Date/Time:** date-fns
- **Virtualization:** react-window (for event list)
- **WebSocket:** reconnecting-websocket
- **Styling:** Tailwind CSS 4 (dark theme with glassmorphism)
- **UI Components:** Radix UI primitives

## Common Commands

```bash
# Development
npm install              # Install dependencies
npm run dev              # Start dev server (localhost:5173)

# Build
npm run build            # Production build (tsc + vite)
npm run preview          # Preview production build

# Linting & Formatting
npm run lint             # Run ESLint
npm run format           # Run Prettier
```

## Architecture

### High-Level Structure

The application follows a component-based architecture with clear separation of concerns:

1. **WebSocket Layer** (`hooks/useKrakenOrderbook.ts`): Manages connection to Kraken's WebSocket API, subscribes to the `book` channel for XBT/USD, parses snapshot and delta messages, and maintains sorted bids/asks arrays.

2. **Storage Layer** (`lib/CircularBuffer.ts`, `contexts/SnapshotContext.tsx`): In-memory circular buffer stores recent snapshots for time-travel functionality.

3. **State Management** (Zustand stores):
   - `orderbookStore.ts`: Current orderbook state (bids, asks, spread, midPrice)
   - `playbackStore.ts`: Playback mode (live/replay), current timestamp, speed, play state
   - `eventsStore.ts`: Detected events with timestamps, filtering, and selection
   - `uiStore.ts`: UI state (panel visibility, view toggles)

4. **Visualization Layer** (D3.js + React):
   - `DepthChart`: Main depth chart with cumulative volume, heatmap overlay, zoom controls
   - `Timeline`: Scrubber with aggregated event markers and severity lanes
   - `OrderbookTableView`: Alternative table view of orderbook data

5. **Event Detection** (`workers/eventDetector.worker.ts`): Web Worker that runs off the main thread to detect market events in real-time.

### Folder Structure

```
src/
├── components/
│   ├── Controls/           # Play/pause/speed controls
│   │   └── Controls.tsx
│   ├── DepthChart/         # D3 depth chart visualization
│   │   └── DepthChart.tsx
│   ├── EventPanel/         # Detected events list and filtering
│   │   ├── AggregatedEventListItem.tsx
│   │   ├── AggregatedEventMarker.tsx
│   │   ├── EventFilter.tsx
│   │   ├── EventIcon.tsx
│   │   ├── EventPanel.tsx
│   │   └── index.ts
│   ├── OrderbookTableView/ # Table view alternative
│   │   └── OrderbookTableView.tsx
│   ├── Timeline/           # Scrubber and playback timeline
│   │   └── Timeline.tsx
│   ├── ViewToggle/         # Chart/table view switcher
│   │   └── ViewToggle.tsx
│   └── ui/                 # Shared UI primitives (Radix-based)
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── checkbox.tsx
│       ├── collapsible.tsx
│       ├── select.tsx
│       ├── separator.tsx
│       ├── toggle.tsx
│       └── tooltip.tsx
├── contexts/
│   └── SnapshotContext.tsx # Snapshot storage context
├── hooks/
│   ├── useDisplayOrderbook.ts  # Orderbook data for current view
│   ├── useEventDetection.ts    # Event detection hook
│   ├── useKeyboardShortcuts.ts # Keyboard shortcut handling
│   ├── useKrakenOrderbook.ts   # WebSocket connection
│   └── usePlayback.ts          # Playback state and controls
├── lib/
│   ├── CircularBuffer.ts       # In-memory snapshot storage
│   ├── chartConfig.ts          # Chart constants (margins, colors, zoom)
│   ├── cssUtils.ts             # CSS variable helpers
│   ├── eventDetection.ts       # Event detection algorithms
│   ├── eventDetectionConfig.ts # Event thresholds and metadata
│   ├── formatters.ts           # Date/time formatting (date-fns)
│   ├── orderbookAggregation.ts # Price level aggregation, depth calculation
│   └── utils.ts                # General utilities (cn, etc.)
├── stores/
│   ├── eventsStore.ts      # Event state and filtering
│   ├── orderbookStore.ts   # Orderbook data
│   ├── playbackStore.ts    # Playback controls
│   └── uiStore.ts          # UI state
├── styles/
│   ├── focus.css           # Focus ring utilities
│   ├── glass.css           # Glassmorphism effects
│   └── tokens.css          # Design tokens (colors, spacing)
├── types/
│   └── index.ts            # TypeScript interfaces
├── workers/
│   └── eventDetector.worker.ts # Background event detection
├── App.tsx
├── main.tsx
└── index.css
```

## Key Data Structures

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

### AggregatedEvent
```typescript
interface AggregatedEvent {
  id: string;
  type: EventType;
  timestamp: number;
  severity: EventSeverity;
  count: number;           // Number of events aggregated
  events: DetectedEvent[]; // Individual events in group
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

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Play/pause |
| `←` / `→` | Step backward/forward 1 second |
| `Shift + ←` / `→` | Step 10 seconds |
| `L` | Go live |
| `N` | Next event |
| `P` | Previous event |
| `Esc` | Clear selection |

## Event Detection Thresholds

Configurable in `lib/eventDetectionConfig.ts`:

| Event Type | Threshold | Notes |
|------------|-----------|-------|
| Large Order | > 1 BTC | Configurable per-event |
| Spread Change | > 0.1% | Relative to previous spread |
| Liquidity Gap | > 0.5% price gap | No orders in range |
| Rapid Cancellations | > 5 in 1 second | Sliding window |
| Price Breakthrough | Crosses significant level | Based on recent price action |

## Chart Configuration

Chart constants in `lib/chartConfig.ts`:

```typescript
CHART_MARGINS = { top: 20, right: 60, bottom: 40, left: 60 }
ZOOM_CONFIG = { min: 0.5, max: 10, step: 1.2 }
CHART_UPDATE_THROTTLE = 500 // ms
DEFAULT_PRICE_STEP = 10 // $10 aggregation buckets
```

## Styling

The app uses a dark theme with glassmorphism effects:

- **Design tokens:** `src/styles/tokens.css` - CSS custom properties for colors, spacing
- **Glass effects:** `src/styles/glass.css` - Backdrop blur, inner glows
- **CSS utilities:** `src/lib/cssUtils.ts` - Helper to read CSS variables in JS

Key CSS variables:
- `--color-bid` / `--color-ask` - Green/red for buy/sell
- `--color-mid-bright` - Yellow for mid price
- `--surface-*` - Background surfaces (0-4 depth)
- `--text-primary/secondary/tertiary` - Text hierarchy

## Performance Considerations

- **Rendering:** Chart updates throttled to 500ms via `CHART_UPDATE_THROTTLE`
- **Virtualization:** Event list uses react-window for large lists
- **Event Detection:** Runs in Web Worker to avoid blocking main thread
- **Animations:** Framer Motion with reduced motion support
- **D3 Transitions:** 150ms duration for smooth updates

## Development Notes

- **D3 + React:** Use `useEffect` + refs pattern. D3 handles DOM manipulation inside React refs.
- **WebSocket Reconnection:** Handled by reconnecting-websocket library with status indicator.
- **Event Aggregation:** Events of same type within 1 second are grouped for cleaner display.
- **Timeline Markers:** Aggregated by severity and position to prevent overlap.
- **Heatmap:** Toggle in chart controls; hides area fills when enabled for clarity.
