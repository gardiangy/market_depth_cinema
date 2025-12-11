# Event Detection System

This document describes the Event Detection system implemented for Market Depth Cinema, which automatically identifies and highlights significant market events in the orderbook.

## Overview

The Event Detection system runs off the main thread using a Web Worker, continuously analyzing orderbook snapshots to detect meaningful market events. When detected, events are displayed in the Event Panel, marked on the Timeline, and can be highlighted on the Depth Chart.

## Architecture

### Components

```
src/
├── lib/
│   ├── eventDetectionConfig.ts    # Thresholds and configuration
│   └── eventDetection.ts          # Pure detection functions
├── stores/
│   └── eventsStore.ts             # Event state management
├── workers/
│   └── eventDetector.worker.ts   # Web Worker for detection
├── hooks/
│   └── useEventDetection.ts       # React hook integration
└── components/
    └── EventPanel/
        ├── EventPanel.tsx         # Main event panel
        ├── EventFilter.tsx        # Filter controls
        ├── EventListItem.tsx      # Event list item
        ├── EventIcon.tsx          # Event type icons
        └── EventMarker.tsx        # Timeline markers
```

### Data Flow

1. **Snapshot Collection**: `useDisplayOrderbook` provides current orderbook snapshot
2. **Detection**: `useEventDetection` sends snapshots to Web Worker
3. **Processing**: Worker runs detection algorithms and returns events
4. **Storage**: Events are added to `eventsStore` via Zustand
5. **Display**: Components subscribe to store and render events

## Event Types

### 1. Large Order Added
**Type**: `large_order_added`

Detects when significant volume is added to a single price level.

**Thresholds**:
- Low: ≥ 1.0 BTC
- Medium: ≥ 5.0 BTC
- High: ≥ 10.0 BTC

**Details**:
- `side`: 'bid' | 'ask'
- `price`: Price level
- `volume`: Volume added (BTC)
- `totalVolume`: Total volume at level after addition

### 2. Large Order Removed
**Type**: `large_order_removed`

Detects when significant volume is removed from a single price level.

**Thresholds**:
- Low: ≥ 1.0 BTC
- Medium: ≥ 5.0 BTC
- High: ≥ 10.0 BTC

**Details**:
- `side`: 'bid' | 'ask'
- `price`: Price level
- `volume`: Volume removed (BTC)
- `previousVolume`: Volume before removal

### 3. Spread Change
**Type**: `spread_change`

Detects significant changes in the bid-ask spread.

**Thresholds** (percentage change):
- Low: ≥ 0.1%
- Medium: ≥ 0.5%
- High: ≥ 1.0%

**Details**:
- `oldSpread`: Previous spread value
- `newSpread`: New spread value
- `changePercent`: Percentage change
- `direction`: 'widened' | 'narrowed'

### 4. Liquidity Gap
**Type**: `liquidity_gap`

Detects gaps in the orderbook with no price levels.

**Thresholds** (percentage gap):
- Low: ≥ 0.5%
- Medium: ≥ 1.0%
- High: ≥ 2.0%

**Details**:
- `side`: 'bid' | 'ask'
- `startPrice`: Lower price bound
- `endPrice`: Upper price bound
- `gapPercent`: Size of gap as percentage

### 5. Rapid Cancellations
**Type**: `rapid_cancellations`

Detects multiple order removals in quick succession.

**Thresholds** (count within 1 second):
- Low: ≥ 5 cancellations
- Medium: ≥ 10 cancellations
- High: ≥ 20 cancellations

**Details**:
- `side`: 'bid' | 'ask' | 'both'
- `count`: Total cancellations in window
- `timeWindow`: Detection window (ms)
- `bidRemovals`: Count of bid cancellations
- `askRemovals`: Count of ask cancellations

### 6. Price Level Breakthrough
**Type**: `price_level_breakthrough`

Detects when the mid-price crosses significant support/resistance levels.

**Calculation**: Identifies significant levels based on volume clustering over time, then detects when mid-price crosses these levels.

**Details**:
- `direction`: 'up' | 'down'
- `price`: Breakthrough price level
- `previousMidPrice`: Mid-price before breakthrough
- `currentMidPrice`: Mid-price after breakthrough

## Configuration

Event detection thresholds can be adjusted in `/src/lib/eventDetectionConfig.ts`:

```typescript
export const DEFAULT_THRESHOLDS: EventThresholds = {
  largeOrderBTC: {
    low: 1.0,
    medium: 5.0,
    high: 10.0,
  },
  spreadChange: {
    low: 0.1,    // 0.1%
    medium: 0.5, // 0.5%
    high: 1.0,   // 1.0%
  },
  liquidityGap: {
    low: 0.5,    // 0.5%
    medium: 1.0, // 1.0%
    high: 2.0,   // 2.0%
  },
  rapidCancellations: {
    timeWindow: 1000, // 1 second
    low: 5,
    medium: 10,
    high: 20,
  },
  priceBreakthrough: {
    significantLevel: 0.5, // 0.5%
  },
};
```

## User Interface

### Event Panel

The Event Panel displays all detected events with:
- **Event icon** (type-specific)
- **Severity badge** (color-coded)
- **Description** (human-readable)
- **Timestamp**
- **Filter controls** (by type and severity)

### Timeline Markers

Events are displayed on the Timeline as:
- **Color-coded dots** (based on severity)
- **Hover tooltips** (event details)
- **Pulse animations** (high-severity events)
- **Click to jump** (sets playback to event time)

### Depth Chart Highlights

When an event is selected:
- **Vertical line** at affected price level
- **Pulse animation** for attention
- **Price range highlight** (for gap events)
- **Event label** with type name

## Keyboard Shortcuts

- **N**: Jump to next event
- **P**: Jump to previous event
- **Escape**: Clear event selection

## Performance

The event detection system is optimized for real-time performance:

1. **Web Worker**: Detection runs off the main thread to avoid UI blocking
2. **Throttling**: Significant level updates run every 30 seconds (configurable)
3. **History Limit**: Only last 100 snapshots used for level calculation
4. **Removal Tracking**: Limited to last 100 removal events

## Extensibility

### Adding New Event Types

1. **Define Type**: Add to `EventType` union in `/src/types/index.ts`
2. **Add Metadata**: Update `EVENT_METADATA` in `/src/lib/eventDetectionConfig.ts`
3. **Implement Detection**: Add detection function in `/src/lib/eventDetection.ts`
4. **Update Worker**: Include in `detectEvents()` function
5. **Add Icon**: Create icon in `/src/components/EventPanel/EventIcon.tsx`
6. **Add Description**: Update `getEventDescription()` function

### Example: Adding "Volume Spike" Detection

```typescript
// 1. Add type
export type EventType =
  | 'large_order_added'
  | 'volume_spike'  // New type
  | ...;

// 2. Add metadata
export const EVENT_METADATA: Record<EventType, EventTypeMetadata> = {
  volume_spike: {
    label: 'Volume Spike',
    description: 'Sudden increase in total orderbook volume',
    icon: 'chart-spike',
    color: {
      low: '#06b6d4',
      medium: '#0891b2',
      high: '#0e7490',
    },
  },
  // ...
};

// 3. Implement detection
export function detectVolumeSpike(
  current: OrderbookSnapshot,
  previous: OrderbookSnapshot | null
): DetectedEvent[] {
  // Detection logic here
}

// 4. Update detectEvents()
export function detectEvents(...) {
  events.push(...detectVolumeSpike(current, previous));
  // ...
}
```

## Testing

To test event detection:

1. **Connect to live orderbook**: Events will be detected in real-time
2. **Use replay mode**: Scrub through historical data to see past events
3. **Filter events**: Use Event Panel filters to focus on specific types
4. **Monitor console**: Worker logs errors if detection fails

## Troubleshooting

### No events detected
- Check WebSocket connection status
- Verify orderbook data is flowing (check live chart updates)
- Reduce thresholds in configuration for more sensitive detection
- Check browser console for worker errors

### Too many events
- Increase thresholds in configuration
- Use severity filters to show only medium/high severity
- Reduce `updateSignificantLevelsInterval` for more stable level detection

### Performance issues
- Increase `updateSignificantLevelsInterval` (default: 30000ms)
- Reduce `REMOVAL_HISTORY_LIMIT` in worker
- Disable event detection in `useEventDetection` config

## Future Enhancements

Potential improvements for the event detection system:

1. **Machine Learning**: Train models on historical data to detect anomalies
2. **Custom Alerts**: User-defined thresholds and notifications
3. **Event Correlation**: Detect patterns across multiple event types
4. **Historical Analysis**: Generate reports on event frequency and impact
5. **Export Events**: Save detected events to CSV/JSON for analysis
6. **Audio Alerts**: Sound notifications for high-severity events
7. **Event Annotations**: Allow users to add notes to events
8. **Multi-Pair Detection**: Detect events across multiple trading pairs

## API Reference

### useEventDetection(snapshot, config)

Hook that manages event detection for a given snapshot.

**Parameters**:
- `snapshot`: Current `OrderbookSnapshot | null`
- `config`: Configuration object
  - `enabled`: Boolean to enable/disable detection
  - `updateSignificantLevelsInterval`: Milliseconds between level updates

**Returns**: Object with `reset()` function to clear detection state

### useEventsStore()

Zustand store for event state management.

**State**:
- `events`: Array of all detected events
- `selectedEventId`: Currently selected event ID
- `filters`: Active filter configuration

**Actions**:
- `addEvent(event)`: Add single event
- `addEvents(events)`: Add multiple events
- `removeEvent(eventId)`: Remove event by ID
- `clearEvents()`: Remove all events
- `selectEvent(eventId)`: Select event for highlighting
- `setTypeFilter(type, enabled)`: Toggle event type filter
- `setSeverityFilter(severity, enabled)`: Toggle severity filter
- `getFilteredEvents()`: Get events matching current filters
- `getEventById(eventId)`: Retrieve event by ID
- `getEventsInTimeRange(start, end)`: Get events in time range

## License

Part of Market Depth Cinema project.
