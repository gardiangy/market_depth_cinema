/**
 * Event Marker Component
 *
 * Displays event markers on the timeline with tooltips and animations.
 * Color-coded by severity and clickable to jump to event.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import type { DetectedEvent } from '../../types';
import { EVENT_METADATA, getEventDescription } from '../../lib/eventDetectionConfig';
import { useEventsStore } from '../../stores/eventsStore';
import { usePlaybackStore } from '../../stores/playbackStore';

interface EventMarkerProps {
  event: DetectedEvent;
  position: number; // 0-100, percentage position on timeline
  size?: 'sm' | 'md';
}

export function EventMarker({ event, position, size = 'md' }: EventMarkerProps) {
  const [isHovered, setIsHovered] = useState(false);
  const selectedEventId = useEventsStore((state) => state.selectedEventId);
  const selectEvent = useEventsStore((state) => state.selectEvent);
  const setCurrentTimestamp = usePlaybackStore((state) => state.setCurrentTimestamp);
  const pause = usePlaybackStore((state) => state.pause);

  const isSelected = selectedEventId === event.id;
  const metadata = EVENT_METADATA[event.type];
  const description = getEventDescription(event.type, event.details);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    selectEvent(event.id);
    setCurrentTimestamp(event.timestamp);
    pause();
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

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
  };

  const config = severityConfig[event.severity];

  return (
    <>
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{
          scale: isSelected ? 1.4 : 1,
          opacity: 1,
        }}
        whileHover={{ scale: isSelected ? 1.5 : 1.2 }}
        whileTap={{ scale: 0.9 }}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          position: 'absolute',
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
          zIndex: isSelected ? 30 : isHovered ? 20 : 10,
          transition: 'var(--transition-all)',
        }}
        aria-label={`Event: ${metadata.label} at ${formatTime(event.timestamp)}`}
      />

      {/* Tooltip */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute',
              left: `${position}%`,
              top: '-8px',
              transform: 'translate(-50%, -100%)',
              pointerEvents: 'none',
              zIndex: 50,
            }}
          >
            <div
              className="glass-panel-elevated"
              style={{
                padding: 'var(--spacing-md)',
                borderLeft: `3px solid ${config.color}`,
                minWidth: '200px',
                maxWidth: '300px',
                boxShadow: `var(--shadow-xl), 0 0 16px ${config.glowSpread}`,
              }}
            >
              {/* Event Type */}
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold" style={{
                  color: 'var(--text-primary)',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 'var(--font-weight-semibold)'
                }}>
                  {metadata.label}
                </span>
                <span
                  className="text-xs font-medium px-1.5 py-0.5 rounded"
                  style={{
                    color: config.color,
                    backgroundColor: `${config.color}20`,
                    border: `1px solid ${config.color}40`,
                    fontSize: 'var(--font-size-xs)',
                  }}
                >
                  {event.severity}
                </span>
              </div>

              {/* Description */}
              <p className="text-xs mb-1.5 leading-tight" style={{
                color: 'var(--text-secondary)',
                fontSize: 'var(--font-size-xs)',
              }}>
                {description}
              </p>

              {/* Time */}
              <div className="text-xs font-mono" style={{
                color: 'var(--text-tertiary)',
                fontSize: 'var(--font-size-xs)',
              }}>
                {formatTime(event.timestamp)}
              </div>

              {/* Tooltip Arrow */}
              <div
                className="absolute left-1/2 bottom-0 transform -translate-x-1/2 translate-y-full"
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: '6px solid transparent',
                  borderRight: '6px solid transparent',
                  borderTop: `6px solid ${config.color}`,
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
  );
}
