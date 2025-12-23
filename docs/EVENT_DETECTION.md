# Event Detection System

Market Depth Cinema includes an intelligent event detection system that automatically identifies significant market events in real-time. This document explains how the detection works and how to customize it.

## Overview

The event detection runs in a **Web Worker** (`src/workers/eventDetector.worker.ts`) to keep the main thread responsive. It analyzes orderbook snapshots and compares them to detect meaningful changes.

## Event Types

### 1. Large Order Added

Detects when a significant order is added to the orderbook.

| Severity | Threshold |
|----------|-----------|
| Low | >= 6 BTC |
| Medium | >= 8 BTC |
| High | >= 10 BTC |

**Details captured:**
- `volume` - Size of the order in BTC
- `price` - Price level
- `side` - "bid" or "ask"

**Example:** "6.06 BTC ask added at $87524.80"

---

### 2. Large Order Removed

Detects when a significant order is removed (filled or cancelled).

| Severity | Threshold |
|----------|-----------|
| Low | >= 6 BTC |
| Medium | >= 8 BTC |
| High | >= 10 BTC |

**Details captured:**
- `volume` - Size of the removed order
- `price` - Price level
- `side` - "bid" or "ask"

**Example:** "6.06 BTC ask removed from $87524.80"

---

### 3. Spread Change

Detects significant changes in the bid-ask spread.

| Severity | Threshold |
|----------|-----------|
| Low | >= $2 change |
| Medium | >= $5 change |
| High | >= $10 change |

**Details captured:**
- `oldSpread` - Previous spread value
- `newSpread` - New spread value
- `direction` - "widened" or "narrowed"

**Example:** "Spread widened from $1.25 to $3.50"

---

### 4. Liquidity Gap

Detects gaps in the orderbook where no orders exist within a price range.

| Severity | Threshold |
|----------|-----------|
| Low | >= 0.15% of price |
| Medium | >= 0.30% of price |
| High | >= 0.50% of price |

At $87,000 BTC price:
- Low: ~$130 gap
- Medium: ~$260 gap
- High: ~$435 gap

**Details captured:**
- `gapPercent` - Size of gap as percentage
- `startPrice` - Start of gap
- `endPrice` - End of gap
- `side` - "bid" or "ask"

**Example:** "0.25% gap in asks between $87,500 - $87,720"

---

### 5. Rapid Cancellations

Detects when many orders are cancelled in quick succession, which may indicate algorithmic activity or market manipulation.

| Severity | Threshold (per second) |
|----------|------------------------|
| Low | >= 40 cancellations |
| Medium | >= 60 cancellations |
| High | >= 80 cancellations |

**Details captured:**
- `count` - Number of cancellations
- `side` - "bid", "ask", or "both"
- `timeWindow` - Detection window (1000ms)

**Example:** "45 ask orders cancelled within 1 second"

---

### 6. Price Level Breakthrough

Detects when price crosses a significant support or resistance level.

**Details captured:**
- `price` - The breakthrough price
- `direction` - "up" or "down"

**Example:** "Price broke up through $88,000.00"

## Configuration

All thresholds are configurable in `src/lib/eventDetectionConfig.ts`:

```typescript
export const DEFAULT_THRESHOLDS: EventThresholds = {
  largeOrderBTC: {
    low: 6.0,
    medium: 8.0,
    high: 10.0,
  },
  spreadChange: {
    low: 2,
    medium: 5,
    high: 10,
  },
  liquidityGap: {
    low: 0.15,
    medium: 0.3,
    high: 0.5,
    maxDepth: 15,  // Only analyze top 15 levels
  },
  rapidCancellations: {
    timeWindow: 1000,
    low: 40,
    medium: 60,
    high: 80,
  },
  priceBreakthrough: {
    significantLevel: 0.5,
  },
};
```

## Severity Levels

Events are classified into three severity levels:

| Level | Color | Meaning |
|-------|-------|---------|
| **Low** | Blue | Notable but common occurrence |
| **Medium** | Amber | Significant event worth attention |
| **High** | Red | Major event, potential market impact |

## Event Aggregation

To prevent UI clutter, events are aggregated in two ways:

### 1. Event List Aggregation
Events of the same type within the same second are grouped together:
- Shows total count
- Displays highest severity in the group
- Aggregates details (e.g., total BTC volume)

### 2. Timeline Marker Aggregation
Events that would visually overlap on the timeline are clustered:
- Grouped by severity (high, medium, low displayed in separate lanes)
- Shows count badge when multiple events exist
- Click to see all events in the cluster

## Architecture

```
┌─────────────────────┐
│  Orderbook Update   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Snapshot Context   │ ──── Stores snapshots in circular buffer
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  useEventDetection  │ ──── Hook that sends data to worker
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Web Worker        │ ──── Runs detection algorithms off main thread
│  (eventDetector)    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Events Store      │ ──── Zustand store with filtering
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  EventPanel +       │ ──── React components for display
│  Timeline Markers   │
└─────────────────────┘
```

## Filtering Events

Users can filter displayed events by:

- **Event Type** — Show/hide specific event types
- **Severity** — Filter by low/medium/high
- **Search** — Text search in event details

Filters are managed in the Events Store (`src/stores/eventsStore.ts`).

## Performance Considerations

1. **Web Worker** — Detection runs off the main thread
2. **Throttling** — Snapshots are processed at controlled intervals
3. **Circular Buffer** — Memory-efficient storage of recent snapshots
4. **Virtualized List** — react-window handles large event counts efficiently

## Customizing Detection

To add a new event type:

1. Add the type to `EventType` in `src/types/index.ts`
2. Add thresholds to `EventThresholds` interface
3. Add default values to `DEFAULT_THRESHOLDS`
4. Add metadata to `EVENT_METADATA` (label, icon, colors)
5. Implement detection logic in the worker
6. Add description formatter in `getEventDescription()`
