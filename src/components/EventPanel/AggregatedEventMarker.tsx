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
import { formatTime } from '@/lib/formatters'
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
      colorBright: '#60a5fa',
      colorDark: '#1d4ed8',
      glowColor: 'rgba(59, 130, 246, 0.4)',
      glowSpread: 'rgba(59, 130, 246, 0.2)',
    },
    medium: {
      color: '#f59e0b', // amber
      colorBright: '#fbbf24',
      colorDark: '#d97706',
      glowColor: 'rgba(245, 158, 11, 0.4)',
      glowSpread: 'rgba(245, 158, 11, 0.2)',
    },
    high: {
      color: '#ef4444', // red
      colorBright: '#f87171',
      colorDark: '#dc2626',
      glowColor: 'rgba(239, 68, 68, 0.5)',
      glowSpread: 'rgba(239, 68, 68, 0.3)',
    },
  }

  const config = severityConfig[marker.severity]
  const isSingleEvent = marker.count === 1

  // Size based on severity and count
  // When showing count inside, marker needs to be larger
  const baseSizeByServerity = {
    low: size === 'sm' ? 8 : 10,
    medium: size === 'sm' ? 9 : 12,
    high: size === 'sm' ? 10 : 14,
  }
  const baseSize = baseSizeByServerity[marker.severity]

  // For multiple events, make marker large enough to show count inside
  const markerSize = isSingleEvent
    ? baseSize
    : Math.max(18, Math.min(baseSize + Math.log2(marker.count) * 3, 26))

  // Vertical offset based on severity (high at top, medium in middle, low at bottom)
  const verticalPosition = {
    high: '20%',
    medium: '50%',
    low: '80%',
  }

  const severityBadgeVariants = {
    low: 'low' as const,
    medium: 'medium' as const,
    high: 'high' as const,
  }

  // Determine if this marker should pulse (high severity or selected)
  const shouldPulse = marker.severity === 'high' && !isSelected

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={handleClick}
          className={`absolute outline-none transition-all duration-200 hover:scale-125 active:scale-95 flex items-center justify-center ${
            shouldPulse ? 'animate-pulse' : ''
          }`}
          style={{
            left: `${marker.position}%`,
            top: verticalPosition[marker.severity],
            transform: `translate(-50%, -50%) scale(${isSelected ? 1.4 : 1})`,
            width: markerSize,
            height: markerSize,
            // Radial gradient for 3D depth effect
            background: `radial-gradient(circle at 30% 30%, ${config.colorBright}, ${config.color} 50%, ${config.colorDark})`,
            borderRadius: '50%',
            border: isSelected
              ? '2px solid white'
              : `1px solid ${config.colorBright}`,
            // Enhanced glow - all markers get some glow
            boxShadow: isSelected
              ? `0 0 0 3px ${config.glowSpread}, 0 0 12px ${config.glowColor}, 0 0 24px ${config.glowSpread}, inset 0 1px 2px rgba(255,255,255,0.3)`
              : `0 0 ${marker.severity === 'high' ? '12px' : '6px'} ${config.glowColor}, 0 0 ${marker.severity === 'high' ? '20px' : '10px'} ${config.glowSpread}, inset 0 1px 2px rgba(255,255,255,0.2)`,
            cursor: 'pointer',
            zIndex: isSelected ? 30 : marker.severity === 'high' ? 20 : marker.severity === 'medium' ? 15 : 10,
          }}
          aria-label={`${marker.count} event${marker.count > 1 ? 's' : ''} at ${formatTime(marker.timestamp)}`}
        >
          {/* Count shown inside marker for multiple events */}
          {marker.count > 1 && (
            <span
              className="font-bold select-none"
              style={{
                fontSize: marker.count > 99 ? '7px' : marker.count > 9 ? '9px' : '10px',
                color: '#fff',
                textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                letterSpacing: '-0.5px',
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
