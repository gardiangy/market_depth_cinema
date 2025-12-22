/**
 * Event Marker Component
 *
 * Displays event markers on the timeline with tooltips and animations.
 * Color-coded by severity and clickable to jump to event.
 */

import { memo } from 'react'
import type { DetectedEvent } from '../../types'
import { EVENT_METADATA, getEventDescription } from '../../lib/eventDetectionConfig'
import { useEventsStore } from '../../stores/eventsStore'
import { usePlaybackStore } from '../../stores/playbackStore'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface EventMarkerProps {
  event: DetectedEvent
  position: number // 0-100, percentage position on timeline
  size?: 'sm' | 'md'
}

// Memoize to prevent re-renders when other events change
export const EventMarker = memo(function EventMarker({ event, position, size = 'md' }: EventMarkerProps) {
  // Single selector to reduce subscriptions
  const selectedEventId = useEventsStore((state) => state.selectedEventId)

  const isSelected = selectedEventId === event.id
  const metadata = EVENT_METADATA[event.type]
  const description = getEventDescription(event.type, event.details)

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
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
    })
  }

  const severityConfig = {
    low: {
      color: metadata.color.low,
      glowColor: 'rgba(59, 130, 246, 0.15)',
      glowSpread: 'rgba(59, 130, 246, 0.08)',
      size: size === 'sm' ? 6 : 8,
    },
    medium: {
      color: metadata.color.medium,
      glowColor: 'rgba(245, 158, 11, 0.15)',
      glowSpread: 'rgba(245, 158, 11, 0.08)',
      size: size === 'sm' ? 7 : 10,
    },
    high: {
      color: metadata.color.high,
      glowColor: 'rgba(239, 68, 68, 0.15)',
      glowSpread: 'rgba(239, 68, 68, 0.08)',
      size: size === 'sm' ? 8 : 12,
    },
  }

  const config = severityConfig[event.severity]

  const severityBadgeVariants = {
    low: 'low' as const,
    medium: 'medium' as const,
    high: 'high' as const,
  }

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleClick}
            className="absolute outline-none transition-transform duration-150 hover:scale-125 active:scale-90"
            style={{
              left: `${position}%`,
              top: '50%',
              transform: `translate(-50%, -50%) scale(${isSelected ? 1.4 : 1})`,
              width: config.size,
              height: config.size,
              backgroundColor: config.color,
              borderRadius: '50%',
              border: isSelected ? '2px solid white' : 'none',
              boxShadow: isSelected
                ? `0 0 8px ${config.glowColor}, 0 0 16px ${config.glowSpread}, 0 0 24px ${config.glowSpread}`
                : event.severity === 'high'
                ? `0 0 8px ${config.glowColor}, 0 0 16px ${config.glowSpread}`
                : 'none',
              cursor: 'pointer',
              zIndex: isSelected ? 30 : 10,
            }}
            aria-label={`Event: ${metadata.label} at ${formatTime(event.timestamp)}`}
          />
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className={cn(
            'min-w-[200px] max-w-[300px] p-3',
            'border-l-[3px]'
          )}
          style={{
            borderLeftColor: config.color,
            boxShadow: `var(--shadow-xl), 0 0 16px ${config.glowSpread}`,
          }}
        >
          {/* Event Type */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-[var(--text-primary)]">
              {metadata.label}
            </span>
            <Badge variant={severityBadgeVariants[event.severity]} className="capitalize text-xs">
              {event.severity}
            </Badge>
          </div>

          {/* Description */}
          <p className="text-xs mb-1.5 leading-tight text-[var(--text-secondary)]">
            {description}
          </p>

          {/* Time */}
          <div className="text-xs font-mono text-[var(--text-tertiary)]">
            {formatTime(event.timestamp)}
          </div>
        </TooltipContent>
      </Tooltip>

      {/* Pulse animation for high severity events - using CSS animation to avoid memory leaks */}
      {event.severity === 'high' && !isSelected && (
        <div
          className="animate-pulse-ring"
          style={{
            position: 'absolute',
            left: `${position}%`,
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: config.size,
            height: config.size,
            backgroundColor: config.color,
            borderRadius: '50%',
            pointerEvents: 'none',
            zIndex: 5,
          }}
        />
      )}
    </>
  )
})
