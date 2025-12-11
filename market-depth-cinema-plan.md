# Market Depth Cinema — Implementation Plan

## Project Overview

**Hackathon:** Kraken Orderbook Visualizer (Track #2)
**Duration:** 16 days, solo
**Trading Pair:** BTC/USD (XBT/USD on Kraken)

### Concept

A cinematic time-travel orderbook visualizer that lets users rewind, pause, fast-forward, and analyze market depth like a video editor. Includes intelligent auto-detection of significant market events.

### Key Features

- Real-time orderbook depth chart from Kraken WebSocket API
- Time-travel: record, replay, scrub through historical orderbook states
- Playback controls (0.1x to 10x speed)
- Auto-detected events (large orders, spread changes, liquidity gaps)
- Event markers on timeline for quick navigation
- Heatmap visualization of liquidity concentration

---

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | React 18 + TypeScript 5 |
| Build Tool | Vite |
| State Management | Zustand |
| Visualization | D3.js |
| Animations | Framer Motion |
| Storage | IndexedDB (via `idb` library) |
| WebSocket | reconnecting-websocket |
| Styling | Tailwind CSS (dark theme) |
| Documentation | Storybook + Markdown |

### Package.json Dependencies

```json
{
  "dependencies": {
    "react": "^18.x",
    "react-dom": "^18.x",
    "d3": "^7.x",
    "zustand": "^4.x",
    "framer-motion": "^11.x",
    "idb": "^8.x",
    "reconnecting-websocket": "^4.x"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "vite": "^5.x",
    "@vitejs/plugin-react": "^4.x",
    "@storybook/react": "^8.x",
    "tailwindcss": "^3.x",
    "autoprefixer": "^10.x",
    "postcss": "^8.x",
    "@types/d3": "^7.x",
    "@types/react": "^18.x",
    "@types/react-dom": "^18.x",
    "eslint": "^8.x",
    "prettier": "^3.x"
  }
}
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        App Shell                            │
├─────────────┬─────────────────────────────┬─────────────────┤
│  Controls   │      Depth Chart (D3)       │  Event Panel    │
│  Panel      │                             │  (detected      │
│  - Play     │   ┌─────────────────────┐   │   events list)  │
│  - Pause    │   │   Bids  │   Asks    │   │                 │
│  - Speed    │   │   ███   │   ███     │   │  • Large bid    │
│  - Scrub    │   │   ██    │   ████    │   │  • Spread ↓     │
│             │   └─────────────────────┘   │  • Liquidity gap│
├─────────────┴─────────────────────────────┴─────────────────┤
│                    Timeline Scrubber                        │
│  ◀──●────────────[thumb]──────────────────────────────────▶ │
│     │              │                                        │
│   events marked as dots on timeline                         │
└─────────────────────────────────────────────────────────────┘
```

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
├── types/                # TypeScript interfaces
│   └── index.ts
├── styles/               # Global styles
│   └── globals.css
├── App.tsx
└── main.tsx
```

---

## Data Structures

### Orderbook Snapshot

```typescript
interface OrderbookSnapshot {
  timestamp: number;
  bids: [price: number, volume: number][];
  asks: [price: number, volume: number][];
  spread: number;
  midPrice: number;
}
```

### Playback State

```typescript
interface PlaybackState {
  mode: 'live' | 'replay';
  currentTimestamp: number;
  playbackSpeed: number; // 0.1, 0.5, 1, 2, 5, 10
  isPlaying: boolean;
}
```

### Detected Event

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

---

## Kraken WebSocket API Reference

### Connection

```
wss://ws.kraken.com
```

### Subscribe to Orderbook

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

### Message Types

1. **Snapshot:** Initial full orderbook state
2. **Update:** Delta updates (adds, removes, changes)

Refer to: https://docs.kraken.com/websockets/

---

## Phase 1: Foundation + Learning (Days 1-3)

### Day 1 — Project Scaffold

- [ ] Initialize Vite + React + TypeScript project
  ```bash
  npm create vite@latest market-depth-cinema -- --template react-ts
  cd market-depth-cinema
  npm install
  ```
- [ ] Install dependencies
  ```bash
  npm install d3 zustand framer-motion idb reconnecting-websocket
  npm install -D tailwindcss postcss autoprefixer @types/d3
  npx tailwindcss init -p
  ```
- [ ] Set up Tailwind CSS with dark theme
- [ ] Configure ESLint + Prettier
- [ ] Create folder structure (see Architecture section)
- [ ] Deploy empty shell to Vercel/Netlify (CI/CD from day 1)

### Day 2 — Kraken WebSocket Integration

- [ ] Read Kraken WS API docs: https://docs.kraken.com/websockets/
- [ ] Create `useKrakenOrderbook` hook:
  - Connect to `wss://ws.kraken.com`
  - Subscribe to `book` channel for XBT/USD
  - Parse snapshot messages (initial state)
  - Parse delta messages (updates)
  - Maintain sorted bids/asks arrays in state
- [ ] Display raw orderbook data in a simple table (proof of life)
- [ ] Handle reconnection gracefully

### Day 3 — D3 Fundamentals

- [ ] Learn D3 basics: scales, axes, area generators, transitions
- [ ] Recommended tutorial: https://observablehq.com/@d3/learn-d3
- [ ] Build a static depth chart component with hardcoded data
- [ ] Understand how to structure D3 code in React (useEffect pattern)
- [ ] Connect static chart to live orderbook data

**Phase 1 Deliverable:** Live depth chart updating in real-time from Kraken WS.

---

## Phase 2: Core Visualization (Days 4-7)

### Day 4 — Depth Chart Polish

- [ ] Implement smooth D3 transitions on data updates
- [ ] Color scheme: green gradient for bids, red gradient for asks
- [ ] Show midpoint price line
- [ ] Show spread indicator (numeric + visual)
- [ ] Make chart responsive to container size

### Day 5 — Heatmap Layer

- [ ] Add heatmap overlay showing liquidity concentration
- [ ] Color intensity = order size at each price level
- [ ] Use D3 color scales (e.g., `d3.interpolateGreens`, `d3.interpolateReds`)
- [ ] Add toggle to show/hide heatmap

### Day 6 — Interactivity

- [ ] Hover tooltips showing exact price/volume at cursor
- [ ] Crosshair following mouse position
- [ ] Click to "pin" a price level for tracking
- [ ] Zoom in/out on price axis (mouse wheel or buttons)
- [ ] Current price marker with last trade price

### Day 7 — Performance Optimization

- [ ] Throttle render updates (target 60fps, update every 100ms max)
- [ ] Use `requestAnimationFrame` for smooth animations
- [ ] Profile with React DevTools and Chrome Performance tab
- [ ] Check for memory leaks (especially in WS message handlers)
- [ ] Consider using Canvas instead of SVG if SVG is slow

**Phase 2 Deliverable:** Polished, interactive, performant live depth chart.

---

## Phase 3: Time Travel Engine (Days 8-11)

### Day 8 — Snapshot Recording

- [ ] Implement circular buffer class for in-memory snapshots
  - Capacity: 6000 snapshots (~10 min at 100ms intervals)
  - Methods: `push()`, `getRange(startTime, endTime)`, `getAt(timestamp)`
- [ ] Create snapshot on each meaningful orderbook update
- [ ] Calculate and store derived values (spread, midPrice)
- [ ] Add timestamp to each snapshot

### Day 9 — IndexedDB Persistence

- [ ] Set up IndexedDB using `idb` library
- [ ] Create database schema:
  ```typescript
  // Database: market-depth-cinema
  // Store: snapshots
  // Index: by timestamp
  ```
- [ ] Background task to offload old snapshots from RAM to IndexedDB
- [ ] Implement retrieval functions:
  - `getSnapshotsInRange(start, end)`
  - `getSnapshotAt(timestamp)` (nearest match)
- [ ] Handle storage quota (delete oldest when full)

### Day 10 — Playback Controls

- [ ] Create Zustand store for playback state
- [ ] Implement control components:
  - Play button (starts replay from current position)
  - Pause button
  - Stop button (returns to live mode)
  - Speed selector dropdown: 0.1x, 0.5x, 1x, 2x, 5x, 10x
  - "Go Live" button
- [ ] Playback loop using `setInterval` adjusted for playback speed
- [ ] Visual indicator showing current mode (LIVE vs timestamp)

### Day 11 — Timeline Scrubber

- [ ] Timeline bar component showing full recorded range
- [ ] Draggable playhead for scrubbing
- [ ] Time labels (relative: "2m ago" or absolute: "14:32:05")
- [ ] Minimap showing spread over time (sparkline)
- [ ] Keyboard shortcuts:
  - `Space` = play/pause
  - `←` / `→` = step backward/forward 1 second
  - `Shift + ←` / `→` = step 10 seconds
  - `L` = go live

**Phase 3 Deliverable:** Full time-travel functionality — record, replay, scrub.

---

## Phase 4: Event Detection (Days 12-14)

### Day 12 — Event Detection Engine

- [ ] Create Web Worker for off-main-thread detection
- [ ] Implement detection algorithms:

  **Large Order Added/Removed**
  - Threshold: > 1 BTC at single price level
  - Compare current snapshot to previous
  - Detect new orders above threshold or removed orders

  **Spread Change**
  - Threshold: > 0.1% change in spread
  - Compare spread to rolling average

  **Liquidity Gap**
  - Threshold: > 0.5% price gap with no orders
  - Scan orderbook for gaps between price levels

  **Rapid Cancellations**
  - Threshold: > 5 order removals in 1 second window
  - Track removal count with sliding window

  **Price Level Breakthrough**
  - Detect when price crosses significant support/resistance

- [ ] Store detected events with timestamps and metadata

### Day 13 — Event UI

- [ ] Event panel component (sidebar or drawer)
- [ ] List of detected events with:
  - Icon for event type
  - Severity indicator (color coded)
  - Timestamp
  - Brief description
- [ ] Click event → jump to that timestamp in replay
- [ ] Filter controls:
  - By event type (checkboxes)
  - By severity (low/medium/high)
- [ ] Event count badge

### Day 14 — Event Visualization on Chart

- [ ] Event markers on timeline scrubber (dots/ticks)
- [ ] Color-coded by severity
- [ ] Hover on marker → preview tooltip
- [ ] When event selected:
  - Highlight affected price levels on depth chart
  - Animated pulse/glow effect for high severity
  - "What happened" tooltip with explanation

**Phase 4 Deliverable:** Smart event detection with integrated UI.

---

## Phase 5: Polish + Documentation (Days 15-16)

### Day 15 — UX Polish

- [ ] Loading states:
  - Initial connection spinner
  - "Connecting to Kraken..." message
- [ ] Error handling:
  - Connection failed state
  - Reconnecting indicator
  - "Data unavailable" for missing history
- [ ] Connection status indicator (green dot = connected)
- [ ] Empty states (no events detected yet, etc.)
- [ ] Mobile responsiveness OR graceful "Desktop recommended" message
- [ ] Keyboard accessibility audit (focus states, ARIA labels)
- [ ] Final visual polish:
  - Consistent spacing
  - Typography hierarchy
  - Subtle animations and transitions

### Day 16 — Documentation + Demo Prep

- [ ] Write comprehensive README.md:
  ```markdown
  # Market Depth Cinema
  
  [Screenshot or GIF here]
  
  ## Features
  ## Quick Start
  ## Architecture
  ## Components API
  ## Event Detection
  ## Contributing
  ## License
  ```
- [ ] Set up Storybook:
  - DepthChart component with controls
  - Timeline component
  - EventPanel component
  ```bash
  npx storybook@latest init
  ```
- [ ] Write stories for key components
- [ ] Record demo video (2-3 minutes):
  - Show live orderbook
  - Demonstrate time travel
  - Show event detection in action
  - Highlight reusability
- [ ] Prepare presentation talking points
- [ ] Final deployment and cross-browser testing
- [ ] Test on fresh browser (incognito) to catch any issues

**Phase 5 Deliverable:** Hackathon submission ready.

---

## Event Detection Thresholds (Configurable)

| Event Type | Default Threshold | Notes |
|------------|-------------------|-------|
| Large Order | > 1 BTC | Adjust based on typical market depth |
| Spread Change | > 0.1% | Relative to previous spread |
| Liquidity Gap | > 0.5% price gap | No orders in range |
| Rapid Cancellations | > 5 in 1 second | Sliding window |
| Price Breakthrough | Crosses 24h high/low | Requires additional data |

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| D3 learning curve | Day 3 is dedicated to learning; can simplify to basic chart if needed |
| Kraken WS issues | Build mock data generator as fallback for demos |
| IndexedDB complexity | In-memory only is acceptable for MVP; skip persistence if needed |
| Performance problems | Reduce snapshot frequency (250ms), simplify visualization |
| Running out of time | Phases 1-3 = complete submission; Phase 4 is "nice to have" |

---

## Daily Routine (Suggested)

- **Morning (highest energy):** Build new features
- **Afternoon:** Debug, refine, test
- **Evening (30 min):** Research/learn for next day

**Habits:**
- Commit often, push daily
- Deploy continuously (every push)
- Test on real Kraken data frequently
- Take breaks — 16 days is a marathon

---

## Resources

- Kraken WebSocket API: https://docs.kraken.com/websockets/
- D3.js Documentation: https://d3js.org/
- D3 Depth Chart Examples: https://observablehq.com/@d3/
- Zustand: https://github.com/pmndrs/zustand
- idb (IndexedDB): https://github.com/jakearchibald/idb
- Framer Motion: https://www.framer.com/motion/
- Tailwind CSS: https://tailwindcss.com/docs

---

## Submission Checklist

- [ ] Live demo URL
- [ ] GitHub repository (public)
- [ ] README with setup instructions
- [ ] Demo video (2-3 min)
- [ ] Storybook deployment (optional but impressive)
- [ ] Clean, documented code
- [ ] No API keys or secrets in repo

---

Good luck! 🚀
