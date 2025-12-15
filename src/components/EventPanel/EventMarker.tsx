/**
 * Event Marker Component
 *
 * Displays event markers on the timeline with tooltips and animations.
 * Color-coded by severity and clickable to jump to event.
 */

import { motion } from 'framer-motion'
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

export function EventMarker({ event, position, size = 'md' }: EventMarkerProps) {
  const selectedEventId = useEventsStore((state) => state.selectedEventId)
  const selectEvent = useEventsStore((state) => state.selectEvent)
  const setCurrentTimestamp = usePlaybackStore((state) => state.setCurrentTimestamp)
  const pause = usePlaybackStore((state) => state.pause)

  const isSelected = selectedEventId === event.id
  const metadata = EVENT_METADATA[event.type]
  const description = getEventDescription(event.type, event.details)

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    selectEvent(event.id)
    setCurrentTimestamp(event.timestamp)
    pause()
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
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: isSelected ? 1.4 : 1,
              opacity: 1,
            }}
            whileHover={{ scale: isSelected ? 1.5 : 1.2 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleClick}
            className="absolute outline-none"
            style={{
              left: `${position}%`,
              top: '50%',
              transform: 'translate(-50%, -50%)',
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

      {/* Pulse animation for high severity events */}
      {event.severity === 'high' && !isSelected && (
        <motion.div
          initial={{ scale: 1, opacity: 0.6 }}
          animate={{
            scale: [1, 1.8, 1],
            opacity: [0.6, 0, 0.6],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
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
}
