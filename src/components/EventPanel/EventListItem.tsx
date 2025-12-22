/**
 * Event List Item Component
 *
 * Displays a single event with icon, timestamp, description, and severity indicator.
 * Clickable to jump to event timestamp and highlight on chart.
 */

import { memo } from 'react'
import type { DetectedEvent } from '../../types'
import { EventIcon } from './EventIcon'
import { EVENT_METADATA, getEventDescription } from '../../lib/eventDetectionConfig'
import { useEventsStore } from '../../stores/eventsStore'
import { usePlaybackStore } from '../../stores/playbackStore'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface EventListItemProps {
  event: DetectedEvent
}

// Memoize to prevent re-renders when other events change
export const EventListItem = memo(function EventListItem({ event }: EventListItemProps) {
  // Use single selector to reduce subscriptions
  const selectedEventId = useEventsStore((state) => state.selectedEventId)

  const isSelected = selectedEventId === event.id
  const metadata = EVENT_METADATA[event.type]
  const description = getEventDescription(event.type, event.details)

  const handleClick = () => {
    // Access store methods directly to avoid extra subscriptions
    useEventsStore.getState().selectEvent(event.id)
    usePlaybackStore.getState().setCurrentTimestamp(event.timestamp)
    usePlaybackStore.getState().pause()
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 1,
    })
  }

  const severityBorderColors = {
    low: 'border-l-blue-500/50',
    medium: 'border-l-amber-500/70',
    high: 'border-l-red-500/80',
  }

  const severityBgColors = {
    low: 'bg-blue-500/5',
    medium: 'bg-amber-500/5',
    high: 'bg-red-500/5',
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
          isSelected && 'ring-2 ring-primary/20 shadow-lg'
        )}
      >
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="flex-shrink-0 mt-0.5 p-1.5 rounded-md bg-white/5">
            <EventIcon type={event.type} severity={event.severity} size="md" />
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
            </div>

            {/* Description */}
            <p className="text-sm mb-2 leading-tight text-[var(--text-secondary)]">
              {description}
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
