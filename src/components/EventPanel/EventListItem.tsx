/**
 * Event List Item Component
 *
 * Displays a single event with icon, timestamp, description, and severity indicator.
 * Clickable to jump to event timestamp and highlight on chart.
 */

import { motion } from 'framer-motion';
import type { DetectedEvent } from '../../types';
import { EventIcon } from './EventIcon';
import { EVENT_METADATA, getEventDescription } from '../../lib/eventDetectionConfig';
import { useEventsStore } from '../../stores/eventsStore';
import { usePlaybackStore } from '../../stores/playbackStore';

interface EventListItemProps {
  event: DetectedEvent;
}

export function EventListItem({ event }: EventListItemProps) {
  const selectedEventId = useEventsStore((state) => state.selectedEventId);
  const selectEvent = useEventsStore((state) => state.selectEvent);
  const setCurrentTimestamp = usePlaybackStore((state) => state.setCurrentTimestamp);
  const pause = usePlaybackStore((state) => state.pause);

  const isSelected = selectedEventId === event.id;
  const metadata = EVENT_METADATA[event.type];
  const description = getEventDescription(event.type, event.details);

  const handleClick = () => {
    // Select event for highlighting
    selectEvent(event.id);

    // Jump to event timestamp
    setCurrentTimestamp(event.timestamp);

    // Pause playback to focus on event
    pause();
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 1,
    });
  };

  const severityColors = {
    low: { border: 'rgba(59, 130, 246, 0.5)', bg: 'rgba(59, 130, 246, 0.05)' },
    medium: { border: 'rgba(245, 158, 11, 0.7)', bg: 'rgba(245, 158, 11, 0.05)' },
    high: { border: 'rgba(239, 68, 68, 0.8)', bg: 'rgba(239, 68, 68, 0.05)' },
  };

  const severityTextColors = {
    low: 'var(--severity-low)',
    medium: 'var(--severity-medium)',
    high: 'var(--severity-high)',
  };

  const severityBorderWidth = '3px';
  const config = severityColors[event.severity];

  return (
    <motion.button
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={handleClick}
      className="w-full text-left glass-card focus-ring-subtle"
      style={{
        padding: 'var(--spacing-md)',
        borderLeft: `${severityBorderWidth} solid ${config.border}`,
        background: isSelected
          ? `linear-gradient(to right, ${config.bg}, transparent)`
          : config.bg,
        transition: 'var(--transition-all)',
        boxShadow: isSelected
          ? `0 0 0 2px rgba(255, 255, 255, 0.2), var(--shadow-lg)`
          : 'var(--shadow-sm)',
      }}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5 glass-panel" style={{
          padding: 'var(--spacing-xs)',
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: 'var(--radius-md)',
        }}>
          <EventIcon type={event.type} severity={event.severity} size="md" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Event type and severity */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold" style={{
              color: 'var(--text-primary)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 'var(--font-weight-semibold)'
            }}>
              {metadata.label}
            </span>
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{
                color: severityTextColors[event.severity],
                background: `${severityTextColors[event.severity]}20`,
                border: `1px solid ${severityTextColors[event.severity]}40`,
                fontSize: 'var(--font-size-xs)',
              }}
            >
              {event.severity}
            </span>
          </div>

          {/* Description */}
          <p className="text-sm mb-2 leading-tight" style={{
            color: 'var(--text-secondary)',
            fontSize: 'var(--font-size-sm)',
          }}>
            {description}
          </p>

          {/* Timestamp */}
          <div className="text-xs font-mono" style={{
            color: 'var(--text-tertiary)',
            fontSize: 'var(--font-size-xs)'
          }}>
            {formatTime(event.timestamp)}
          </div>
        </div>
      </div>
    </motion.button>
  );
}
