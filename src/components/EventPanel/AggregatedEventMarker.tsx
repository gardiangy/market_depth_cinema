/**
 * Aggregated Event Marker Component
 *
 * Displays clustered event markers on the timeline with count indicator.
 * Shows aggregated tooltip with summary of all events in the cluster.
 */

import { memo } from 'react'
import type { AggregatedTimelineMarker, EventSeverity } from '../../types'
import { EVENT_METADATA } from '../../lib/eventDetectionConfig'
import { useEventsStore } from '../../stores/eventsStore'
import { usePlaybackStore } from '../../stores/playbackStore'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface AggregatedEventMarkerProps {
  marker: AggregatedTimelineMarker
  size?: 'sm' | 'md'
}

// Severity priority for display
const SEVERITY_PRIORITY: Record<EventSeverity, number> = {
  low: 0,
  medium: 1,
  high: 2,
}

// Memoize to prevent re-renders
export const AggregatedEventMarker = memo(function AggregatedEventMarker({
  marker,
  size = 'md',
}: AggregatedEventMarkerProps) {
  const selectedEventId = useEventsStore((state) => state.selectedEventId)

  // Check if any event in this cluster is selected
  const isSelected = marker.events.some((e) => e.id === selectedEventId)

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    // Select the first event and jump to its timestamp
    const firstEvent = marker.events[0]
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

  // Get summary of event types in this cluster
  const getEventSummary = () => {
    const typeCounts = new Map<string, { count: number; severity: EventSeverity }>()

    for (const event of marker.events) {
      const existing = typeCounts.get(event.type)
      if (existing) {
        existing.count++
        if (SEVERITY_PRIORITY[event.severity] > SEVERITY_PRIORITY[existing.severity]) {
          existing.severity = event.severity
        }
      } else {
        typeCounts.set(event.type, { count: 1, severity: event.severity })
      }
    }

    return Array.from(typeCounts.entries())
      .sort((a, b) => SEVERITY_PRIORITY[b[1].severity] - SEVERITY_PRIORITY[a[1].severity])
      .map(([type, data]) => ({
        type,
        label: EVENT_METADATA[type as keyof typeof EVENT_METADATA]?.label || type,
        count: data.count,
        severity: data.severity,
      }))
  }

  const severityConfig = {
    low: {
      color: '#3b82f6', // blue
      glowColor: 'rgba(59, 130, 246, 0.2)',
      glowSpread: 'rgba(59, 130, 246, 0.1)',
    },
    medium: {
      color: '#f59e0b', // amber
      glowColor: 'rgba(245, 158, 11, 0.2)',
      glowSpread: 'rgba(245, 158, 11, 0.1)',
    },
    high: {
      color: '#ef4444', // red
      glowColor: 'rgba(239, 68, 68, 0.2)',
      glowSpread: 'rgba(239, 68, 68, 0.1)',
    },
  }

  const config = severityConfig[marker.severity]
  const isSingleEvent = marker.count === 1

  // Size based on count (capped)
  const baseSize = size === 'sm' ? 8 : 10
  const markerSize = isSingleEvent ? baseSize : Math.min(baseSize + Math.log2(marker.count) * 3, 20)

  // Vertical offset based on severity (high at top, medium in middle, low at bottom)
  const verticalPosition = {
    high: '25%',
    medium: '50%',
    low: '75%',
  }

  const severityBadgeVariants = {
    low: 'low' as const,
    medium: 'medium' as const,
    high: 'high' as const,
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={handleClick}
          className="absolute outline-none transition-transform duration-150 hover:scale-125 active:scale-90 flex items-center justify-center"
          style={{
            left: `${marker.position}%`,
            top: verticalPosition[marker.severity],
            transform: `translate(-50%, -50%) scale(${isSelected ? 1.3 : 1})`,
            width: markerSize,
            height: markerSize,
            backgroundColor: config.color,
            borderRadius: '50%',
            border: isSelected ? '2px solid white' : 'none',
            boxShadow: isSelected
              ? `0 0 8px ${config.glowColor}, 0 0 16px ${config.glowSpread}, 0 0 24px ${config.glowSpread}`
              : marker.severity === 'high' || marker.count > 3
              ? `0 0 8px ${config.glowColor}, 0 0 16px ${config.glowSpread}`
              : 'none',
            cursor: 'pointer',
            zIndex: isSelected ? 30 : marker.severity === 'high' ? 15 : 10,
          }}
          aria-label={`${marker.count} event${marker.count > 1 ? 's' : ''} at ${formatTime(marker.timestamp)}`}
        >
          {/* Count badge for multiple events */}
          {marker.count > 1 && (
            <span
              className="absolute -top-2 -right-2 min-w-[14px] h-[14px] flex items-center justify-center text-[9px] font-bold rounded-full"
              style={{
                backgroundColor: 'var(--surface-4)',
                color: 'var(--text-primary)',
                border: '1px solid var(--glass-border-color)',
              }}
            >
              {marker.count > 99 ? '99+' : marker.count}
            </span>
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        className="min-w-[180px] max-w-[280px] p-3"
        style={{
          borderLeft: `3px solid ${config.color}`,
          boxShadow: `var(--shadow-xl), 0 0 16px ${config.glowSpread}`,
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-semibold text-[var(--text-primary)]">
            {marker.count === 1 ? 'Event' : `${marker.count} Events`}
          </span>
          <Badge variant={severityBadgeVariants[marker.severity]} className="capitalize text-xs">
            {marker.severity}
          </Badge>
        </div>

        {/* Event type breakdown */}
        <div className="space-y-1 mb-2">
          {getEventSummary().slice(0, 5).map((item) => (
            <div key={item.type} className="flex items-center justify-between text-xs">
              <span className="text-[var(--text-secondary)]">{item.label}</span>
              <span className="text-[var(--text-tertiary)] font-mono">
                {item.count > 1 ? `x${item.count}` : ''}
              </span>
            </div>
          ))}
          {getEventSummary().length > 5 && (
            <div className="text-xs text-[var(--text-tertiary)]">
              +{getEventSummary().length - 5} more types...
            </div>
          )}
        </div>

        {/* Time */}
        <div className="text-xs font-mono text-[var(--text-tertiary)]">
          {formatTime(marker.timestamp)}
        </div>
      </TooltipContent>
    </Tooltip>
  )
})
