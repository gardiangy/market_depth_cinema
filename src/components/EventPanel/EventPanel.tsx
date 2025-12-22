/**
 * Event Panel Component
 *
 * Main panel that displays detected events with filtering capabilities.
 * Shows event list, count, and allows user to interact with events.
 * Uses react-window for virtualized rendering of large event lists.
 */

import { useMemo, useRef, useEffect, useState } from 'react'
import type { CSSProperties, ReactElement } from 'react'
import { List } from 'react-window'
import { Eye, Filter } from 'lucide-react'
import { useEventsStore } from '../../stores/eventsStore'
import { EventFilter } from './EventFilter'
import { AggregatedEventListItem } from './AggregatedEventListItem'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import type { DetectedEvent, AggregatedEvent, EventSeverity } from '../../types'

// Height of each event item in pixels (must match AggregatedEventListItem's actual height)
const EVENT_ITEM_HEIGHT = 100

// Severity priority for determining highest severity in aggregation
const SEVERITY_PRIORITY: Record<EventSeverity, number> = {
  low: 0,
  medium: 1,
  high: 2,
}

/**
 * Aggregates events of the same type within the same second
 */
function aggregateEvents(events: DetectedEvent[]): AggregatedEvent[] {
  const groups = new Map<string, DetectedEvent[]>()

  for (const event of events) {
    // Create key from type + second (truncate milliseconds)
    const second = Math.floor(event.timestamp / 1000)
    const key = `${event.type}-${second}`

    if (!groups.has(key)) {
      groups.set(key, [])
    }
    groups.get(key)!.push(event)
  }

  // Convert groups to aggregated events
  const aggregated: AggregatedEvent[] = []

  for (const [key, groupEvents] of groups) {
    // Find highest severity
    let highestSeverity: EventSeverity = 'low'
    for (const e of groupEvents) {
      if (SEVERITY_PRIORITY[e.severity] > SEVERITY_PRIORITY[highestSeverity]) {
        highestSeverity = e.severity
      }
    }

    aggregated.push({
      id: key,
      type: groupEvents[0].type,
      timestamp: groupEvents[0].timestamp,
      severity: highestSeverity,
      count: groupEvents.length,
      events: groupEvents,
    })
  }

  return aggregated
}

// Custom props passed via rowProps (excludes ariaAttributes, index, style which react-window provides)
interface EventRowCustomProps {
  events: AggregatedEvent[]
}

// Row renderer for virtualized list (react-window v2 API)
function EventRow(props: {
  ariaAttributes: { 'aria-posinset': number; 'aria-setsize': number; role: 'listitem' }
  index: number
  style: CSSProperties
} & EventRowCustomProps): ReactElement {
  const { index, style, events } = props
  const event = events[index]
  return (
    <div style={style} className="px-2 py-1">
      <AggregatedEventListItem event={event} />
    </div>
  )
}

export function EventPanel() {
  const events = useEventsStore((state) => state.events)
  const getFilteredEvents = useEventsStore((state) => state.getFilteredEvents)
  const clearEvents = useEventsStore((state) => state.clearEvents)
  const selectedEventId = useEventsStore((state) => state.selectedEventId)

  // Container ref for measuring available height
  const containerRef = useRef<HTMLDivElement>(null)
  const [listHeight, setListHeight] = useState(400)

  // Measure container height on mount and resize
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        setListHeight(containerRef.current.clientHeight)
      }
    }

    updateHeight()

    const resizeObserver = new ResizeObserver(updateHeight)
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    return () => resizeObserver.disconnect()
  }, [])

  // Get filtered events and aggregate them - moved before scroll effect
  const { aggregatedEvents, rawFilteredCount } = useMemo(() => {
    const all = getFilteredEvents()
    // Reverse to show most recent first, then aggregate
    const reversed = [...all].reverse()
    const aggregated = aggregateEvents(reversed)
    return {
      aggregatedEvents: aggregated,
      rawFilteredCount: all.length,
    }
  }, [getFilteredEvents, events])

  const totalCount = events.length
  const aggregatedCount = aggregatedEvents.length

  // Scroll to selected event when selection changes
  useEffect(() => {
    if (!selectedEventId || !containerRef.current || aggregatedEvents.length === 0) return

    // Find the index of the aggregated event containing the selected event
    const selectedIndex = aggregatedEvents.findIndex((aggEvent) =>
      aggEvent.events.some((e) => e.id === selectedEventId)
    )

    if (selectedIndex !== -1) {
      // Find the scrollable element (react-window creates a div with overflow)
      const scrollContainer = containerRef.current.querySelector('[style*="overflow"]')
      if (scrollContainer) {
        const scrollTop = selectedIndex * EVENT_ITEM_HEIGHT
        // Center the selected item in the visible area
        const centerOffset = Math.max(0, scrollTop - listHeight / 2 + EVENT_ITEM_HEIGHT / 2)
        scrollContainer.scrollTo({ top: centerOffset, behavior: 'smooth' })
      }
    }
  }, [selectedEventId, aggregatedEvents, listHeight])

  return (
    <Card variant="glass" className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <CardHeader className="flex flex-row justify-between flex-shrink-0 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Events</CardTitle>
          {totalCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearEvents}
              className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
            >
              Clear
            </Button>
          )}
        </div>

        {/* Event Count */}
        <div className="flex items-center gap-1.5 text-sm mt-2">
          <span className="font-semibold text-[var(--text-primary)]">
            {rawFilteredCount}
          </span>
          <span className="text-[var(--text-secondary)]">
            {rawFilteredCount === 1 ? 'event' : 'events'}
          </span>
          {aggregatedCount !== rawFilteredCount && (
            <span className="text-[var(--text-tertiary)]">
              ({aggregatedCount} groups)
            </span>
          )}
        </div>
      </CardHeader>

      {/* Filters */}
      <EventFilter />

      <Separator />

      {/* Event List */}
      <CardContent className="flex-1 p-0 overflow-hidden" ref={containerRef}>
        {aggregatedEvents.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center min-h-[200px]">
            {totalCount === 0 ? (
              <>
                <Eye className="size-16 mb-4 text-[var(--text-disabled)]" strokeWidth={1.5} />
                <p className="text-sm mb-1 text-[var(--text-secondary)]">
                  No events detected yet
                </p>
                <p className="text-xs text-[var(--text-tertiary)]">
                  Events will appear here as they are detected in the orderbook
                </p>
              </>
            ) : (
              <>
                <Filter className="size-16 mb-4 text-[var(--text-disabled)]" strokeWidth={1.5} />
                <p className="text-sm mb-1 text-[var(--text-secondary)]">
                  No events match your filters
                </p>
                <p className="text-xs text-[var(--text-tertiary)]">
                  Try adjusting your filter settings
                </p>
              </>
            )}
          </div>
        ) : (
          <List<EventRowCustomProps>
            rowComponent={EventRow}
            rowProps={{ events: aggregatedEvents }}
            rowCount={aggregatedEvents.length}
            rowHeight={EVENT_ITEM_HEIGHT}
            defaultHeight={listHeight}
            className="scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
            style={{ height: listHeight, width: '100%' }}
          />
        )}
      </CardContent>

      {/* Footer with Legend */}
      <CardFooter className="flex-shrink-0 py-3 px-4 border-t border-[var(--glass-border-color)] bg-black/30">
        <span className="text-xs text-[var(--text-tertiary)]">
          Click event to jump to timestamp
        </span>
      </CardFooter>
    </Card>
  )
}
