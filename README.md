# Market Depth Cinema

A cinematic time-travel orderbook visualizer for Kraken's BTC/USD market.

![Market Depth Cinema](docs/screenshot.png)

**[Live Demo](https://market-depth-cinema.vercel.app/)** | [GitHub](https://github.com/gardiangy/market_depth_cinema)

## The Problem

Cryptocurrency traders analyzing market depth face a critical limitation: **orderbook data is ephemeral**. The moment passes, and the market microstructure that led to a price movement is lost forever. Existing tools show only the current state, making it impossible to study how liquidity evolved before significant events or to learn from historical market dynamics.

## What I Built

**Market Depth Cinema** transforms the Kraken orderbook into a DVR-like experience. Connect to live BTC/USD data via WebSocket, and the application continuously records orderbook snapshots. Pause at any moment, rewind to study how a whale order appeared, or fast-forward through quiet periods at 10x speed. An intelligent event detection system automatically identifies significant market events—large orders, spread changes, liquidity gaps, and rapid cancellations—marking them on an interactive timeline for instant navigation. The result is a powerful tool for traders, researchers, and anyone wanting to understand market microstructure.

## Key Features

- **Time-Travel Playback** — Rewind, pause, fast-forward (0.1x to 10x) through recorded orderbook history
- **Real-Time Event Detection** — Automatic identification of large orders, spread changes, liquidity gaps, and rapid cancellations via Web Worker
- **Interactive Depth Chart** — D3.js visualization with cumulative volume, zoom controls, and price pinning
- **Live Orderbook Table** — Alternative view showing real-time bid/ask levels with volume and price data
- **Heatmap Overlay** — Toggle liquidity concentration view showing volume distribution across price buckets
- **Timeline with Event Markers** — Severity-colored markers aggregated to prevent overlap, click to jump to any event
- **Keyboard-First UX** — Full keyboard navigation: Space (play/pause), arrows (scrub), N/P (next/prev event), L (go live)

## Technical Highlights

Built with **React 19** and **TypeScript 5** for type safety and modern hooks. **D3.js** handles the depth chart visualization with 150ms transitions for smooth updates, while **Framer Motion** powers UI animations. State management uses **Zustand** for its minimal boilerplate and excellent TypeScript support. The event detection runs in a **Web Worker** to keep the main thread responsive during intensive pattern matching. **react-window** virtualizes the event list to handle thousands of detected events without performance degradation. The entire UI follows a glassmorphism design system with CSS custom properties for consistent theming.

**Performance optimizations:**
- Chart updates throttled to 500ms to balance smoothness with CPU usage
- Orderbook data aggregated into $10 buckets for cleaner visualization
- Circular buffer limits memory usage for snapshot storage
- Event aggregation groups same-type events within 1 second

## How It Works

### Installation

```bash
git clone https://github.com/gardiangy/market_depth_cinema.git
cd market_depth_cinema
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

### Usage

1. **Connect** — The app automatically connects to Kraken's WebSocket and starts recording
2. **Watch** — Observe the live depth chart updating in real-time
3. **Detect** — Events appear in the right panel as they're detected
4. **Travel** — Click the timeline or use arrow keys to enter replay mode
5. **Analyze** — Scrub through history, zoom into price levels, toggle heatmap view

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Play/Pause |
| `←` / `→` | Step 1 second |
| `Shift + ←/→` | Step 10 seconds |
| `L` | Go Live |
| `N` / `P` | Next/Previous event |
| `Esc` | Clear selection |

## Architecture

```
┌─────────────────┐     ┌─────────────────────┐    ┌─────────────────┐
│  Kraken WS API  │────▶│  useKrakenOrderbook │───▶│ orderbookStore  │
└─────────────────┘     └─────────────────────┘    └─────────────────┘
                                │                         │
                                ▼                         ▼
                        ┌──────────────────┐     ┌─────────────────┐
                        │  SnapshotContext │     │   DepthChart    │
                        │  (CircularBuffer)│     │     (D3.js)     │
                        └──────────────────┘     └─────────────────┘
                                │
                                ▼
                        ┌──────────────────┐     ┌─────────────────┐
                        │  Event Detector  │────▶│   eventsStore   │
                        │   (Web Worker)   │     └─────────────────┘
                        └──────────────────┘              │
                                                          ▼
                                                  ┌─────────────────┐
                                                  │   EventPanel    │
                                                  │   + Timeline    │
                                                  └─────────────────┘
```

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | React 19, TypeScript 5 |
| Build | Vite 7 |
| State | Zustand 5 |
| Visualization | D3.js 7 |
| Animation | Framer Motion |
| Styling | Tailwind CSS 4 |
| UI Components | Radix UI |
| WebSocket | reconnecting-websocket |
| Virtualization | react-window |

## Configuration

### Event Detection Thresholds

Customize event sensitivity in `src/lib/eventDetectionConfig.ts`. For detailed documentation on all event types, thresholds, and architecture, see [Event Detection](docs/EVENT_DETECTION.md).

```typescript
export const DEFAULT_THRESHOLDS: EventThresholds = {
  // Large order detection (BTC volume)
  largeOrderBTC: {
    low: 6.0,      // 6 BTC triggers low severity
    medium: 8.0,   // 8 BTC triggers medium severity
    high: 10.0,    // 10 BTC triggers high severity
  },

  // Spread change detection (absolute USD)
  spreadChange: {
    low: 2,        // $2 change in spread
    medium: 5,     // $5 change
    high: 10,      // $10 change
  },

  // Liquidity gap detection (% of price)
  liquidityGap: {
    low: 0.15,     // 0.15% gap (~$130 at $87k)
    medium: 0.3,   // 0.3% gap
    high: 0.5,     // 0.5% gap
    maxDepth: 15,  // Only check top 15 levels
  },

  // Rapid cancellations (orders per second)
  rapidCancellations: {
    timeWindow: 1000,  // 1 second window
    low: 40,           // 40 cancellations/sec
    medium: 60,        // 60 cancellations/sec
    high: 80,          // 80 cancellations/sec
  },
};
```

### Chart Configuration

Adjust chart behavior in `src/lib/chartConfig.ts`:

```typescript
// Zoom limits and speed
export const ZOOM_CONFIG = {
  min: 0.5,        // Maximum zoom out (50%)
  max: 10,         // Maximum zoom in (1000%)
  step: 1.2,       // Zoom button increment
  wheelStep: 1.1,  // Mouse wheel increment
};

// Update frequency (lower = smoother but more CPU)
export const CHART_UPDATE_THROTTLE = 500; // milliseconds
```

### Price Aggregation

Configure orderbook grouping in `src/lib/orderbookAggregation.ts`:

```typescript
// Price bucket size for depth chart
export const DEFAULT_PRICE_STEP = 10; // $10 buckets
```

## Future Enhancements

With more time, I would add:

- **Persistent Storage** — IndexedDB integration to save sessions and replay historical days
- **Multiple Trading Pairs** — Support for ETH/USD, SOL/USD, and other Kraken pairs
- **Event Annotations** — User-added notes and bookmarks on the timeline
- **Export Functionality** — Download snapshots as JSON or generate video recordings
- **Pattern Recognition** — ML-based detection of spoofing, layering, and other patterns
- **Alert System** — Configurable notifications for specific event types

## License

MIT License - see [LICENSE](LICENSE) for details.

---

Built for the **Kraken Forge 2025** by [Gyorgy Gardian](https://github.com/gardiangy)
