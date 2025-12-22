/**
 * Aggregated Event List Item Component
 *
 * Displays a group of events of the same type within the same second.
 * Shows count, aggregated summary, and highest severity.
 * Clickable to jump to the first event's timestamp.
 */

import { memo } from 'react'
import type { AggregatedEvent } from '../../types'
import { EventIcon } from './EventIcon'
import { EVENT_METADATA } from '../../lib/eventDetectionConfig'
import { useEventsStore } from '../../stores/eventsStore'
import { usePlaybackStore } from '../../stores/playbackStore'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface AggregatedEventListItemProps {
  event: AggregatedEvent
}

// Memoize to prevent re-renders when other events change
export const AggregatedEventListItem = memo(function AggregatedEventListItem({
  event,
}: AggregatedEventListItemProps) {
  // Use single selector to reduce subscriptions
  const selectedEventId = useEventsStore((state) => state.selectedEventId)

  // Check if any of the aggregated events is selected
  const isSelected = event.events.some((e) => e.id === selectedEventId)
  const metadata = EVENT_METADATA[event.type]

  const handleClick = () => {
    // Select the first event in the group and jump to its timestamp
    const firstEvent = event.events[0]
    useEventsStore.getState().selectEvent(firstEvent.id)
    usePlaybackStore.getState().setCurrentTimestamp(firstEvent.timestamp)
    usePlaybackStore.getState().pause()
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  // Generate aggregated description
  const getAggregatedDescription = (): string => {
    const { type, events: groupEvents, count } = event

    if (count === 1) {
      // Single event - use original description
      const e = groupEvents[0]
      switch (type) {
        case 'large_order_added': {
          const volume = e.details.volume as number
          const price = e.details.price as number
          const side = e.details.side as 'bid' | 'ask'
          return `${volume.toFixed(2)} BTC ${side} added at $${price.toFixed(2)}`
        }
        case 'large_order_removed': {
          const volume = e.details.volume as number
          const price = e.details.price as number
          const side = e.details.side as 'bid' | 'ask'
          return `${volume.toFixed(2)} BTC ${side} removed from $${price.toFixed(2)}`
        }
        case 'spread_change': {
          const oldSpread = e.details.oldSpread as number
          const newSpread = e.details.newSpread as number
          const direction = e.details.direction as string
          return `Spread ${direction} from $${oldSpread.toFixed(2)} to $${newSpread.toFixed(2)}`
        }
        case 'liquidity_gap': {
          const gapSize = e.details.gapPercent as number
          const startPrice = e.details.startPrice as number
          const endPrice = e.details.endPrice as number
          const side = e.details.side as 'bid' | 'ask'
          return `${gapSize.toFixed(2)}% gap in ${side}s ($${startPrice.toFixed(0)}-$${endPrice.toFixed(0)})`
        }
        case 'rapid_cancellations': {
          const cancelCount = e.details.count as number
          const side = e.details.side as string
          return `${cancelCount} ${side} orders cancelled`
        }
        case 'price_level_breakthrough': {
          const price = e.details.price as number
          const direction = e.details.direction as 'up' | 'down'
          return `Price broke ${direction} through $${price.toFixed(2)}`
        }
        default:
          return 'Unknown event'
      }
    }

    // Multiple events - aggregate summary
    switch (type) {
      case 'large_order_added': {
        const totalVolume = groupEvents.reduce(
          (sum, e) => sum + (e.details.volume as number),
          0
        )
        const bidCount = groupEvents.filter((e) => e.details.side === 'bid').length
        const askCount = groupEvents.filter((e) => e.details.side === 'ask').length
        const sides = []
        if (bidCount > 0) sides.push(`${bidCount} bid`)
        if (askCount > 0) sides.push(`${askCount} ask`)
        return `${totalVolume.toFixed(2)} BTC total (${sides.join(', ')})`
      }
      case 'large_order_removed': {
        const totalVolume = groupEvents.reduce(
          (sum, e) => sum + (e.details.volume as number),
          0
        )
        const bidCount = groupEvents.filter((e) => e.details.side === 'bid').length
        const askCount = groupEvents.filter((e) => e.details.side === 'ask').length
        const sides = []
        if (bidCount > 0) sides.push(`${bidCount} bid`)
        if (askCount > 0) sides.push(`${askCount} ask`)
        return `${totalVolume.toFixed(2)} BTC total (${sides.join(', ')})`
      }
      case 'spread_change': {
        // Show range of spread changes
        const firstEvent = groupEvents[0]
        const lastEvent = groupEvents[groupEvents.length - 1]
        const startSpread = firstEvent.details.oldSpread as number
        const endSpread = lastEvent.details.newSpread as number
        return `${count} changes: $${startSpread.toFixed(2)} → $${endSpread.toFixed(2)}`
      }
      case 'liquidity_gap': {
        const bidGaps = groupEvents.filter((e) => e.details.side === 'bid').length
        const askGaps = groupEvents.filter((e) => e.details.side === 'ask').length
        const parts = []
        if (bidGaps > 0) parts.push(`${bidGaps} bid`)
        if (askGaps > 0) parts.push(`${askGaps} ask`)
        return `${count} gaps detected (${parts.join(', ')})`
      }
      case 'rapid_cancellations': {
        const totalCancelled = groupEvents.reduce(
          (sum, e) => sum + (e.details.count as number),
          0
        )
        return `${totalCancelled} orders cancelled total`
      }
      case 'price_level_breakthrough': {
        return `${count} price breakthroughs`
      }
      default:
        return `${count} events`
    }
  }

  const severityBorderColors = {
    low: 'border-l-blue-500/50',
    medium: 'border-l-amber-500/70',
    high: 'border-l-red-500/80',
  }

  const severityBgColors = {
    low: 'bg-blue-500/10',
    medium: 'bg-amber-500/10',
    high: 'bg-red-500/10',
  }

  const severityBadgeVariants = {
    low: 'low' as const,
    medium: 'medium' as const,
    high: 'high' as const,
  }

  return (
    <button
      onClick={handleClick}
      className="w-full text-left transition-transform duration-150 hover:scale-[1.01] active:scale-[0.99]"
    >
      <Card
        variant="flat"
        className={cn(
          'p-3 border-l-[3px] transition-all',
          !isSelected && severityBorderColors[event.severity],
          severityBgColors[event.severity],
          isSelected &&
            'ring-2 ring-[var(--color-primary)] shadow-lg'
        )}
      >
        <div className="flex items-start gap-3">
          {/* Icon with count badge */}
          <div className="flex-shrink-0 mt-0.5 p-1.5 rounded-md bg-white/5 relative">
            <EventIcon type={event.type} severity={event.severity} size="md" />
            {event.count > 1 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold rounded-full bg-[var(--surface-4)] text-[var(--text-primary)] border border-[var(--glass-border-color)]">
                {event.count > 99 ? '99+' : event.count}
              </span>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Event type and severity */}
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold text-[var(--text-primary)]">
                {metadata.label}
              </span>
              <Badge variant={severityBadgeVariants[event.severity]} className="capitalize">
                {event.severity}
              </Badge>
              {event.count > 1 && (
                <span className="text-xs text-[var(--text-tertiary)]">
                  x{event.count}
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-sm mb-2 leading-tight text-[var(--text-secondary)]">
              {getAggregatedDescription()}
            </p>

            {/* Timestamp */}
            <div className="text-xs font-mono text-[var(--text-tertiary)]">
              {formatTime(event.timestamp)}
            </div>
          </div>
        </div>
      </Card>
    </button>
  )
})
