/**
 * Event Panel Component
 *
 * Main panel that displays detected events with filtering capabilities.
 * Shows event list, count, and allows user to interact with events.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { useMemo } from 'react';
import { useEventsStore } from '../../stores/eventsStore';
import { EventFilter } from './EventFilter';
import { EventListItem } from './EventListItem';

export function EventPanel() {
  const events = useEventsStore((state) => state.events);
  const getFilteredEvents = useEventsStore((state) => state.getFilteredEvents);
  const clearEvents = useEventsStore((state) => state.clearEvents);

  const filteredEvents = useMemo(() => {
    return getFilteredEvents();
  }, [getFilteredEvents, events]); // Include events to trigger re-computation

  const totalCount = events.length;
  const filteredCount = filteredEvents.length;

  return (
    <div className="h-full flex flex-col glass-card relative" style={{
      background: 'var(--glass-bg-elevated)',
      borderImage: 'linear-gradient(180deg, rgba(59, 130, 246, 0.3), rgba(139, 92, 246, 0.3), rgba(59, 130, 246, 0.3)) 1',
      borderImageSlice: '0 0 0 1',
    }}>
      {/* Header */}
      <div className="flex-shrink-0" style={{
        borderBottom: '1px solid var(--glass-border-color)',
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)',
      }}>
        <div style={{ padding: 'var(--spacing-lg)' }}>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Events</h2>
            {totalCount > 0 && (
              <button
                onClick={clearEvents}
                className="btn btn-ghost btn-sm"
                style={{
                  color: 'var(--text-tertiary)',
                  fontSize: 'var(--font-size-xs)',
                }}
                title="Clear all events"
              >
                Clear
              </button>
            )}
          </div>

          {/* Event Count */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-sm">
              <span style={{ color: 'var(--text-secondary)' }}>Showing</span>
              <motion.span
                key={filteredCount}
                initial={{ scale: 1.2, color: 'var(--color-primary)' }}
                animate={{ scale: 1, color: 'var(--text-primary)' }}
                className="font-semibold"
                style={{ color: 'var(--text-primary)', fontWeight: 'var(--font-weight-semibold)' }}
              >
                {filteredCount}
              </motion.span>
              {filteredCount !== totalCount && (
                <>
                  <span style={{ color: 'var(--text-secondary)' }}>of</span>
                  <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>
                    {totalCount}
                  </span>
                </>
              )}
              <span style={{ color: 'var(--text-secondary)' }}>
                {filteredCount === 1 ? 'event' : 'events'}
              </span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <EventFilter />
      </div>

      {/* Event List */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {filteredEvents.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex flex-col items-center justify-center p-8 text-center"
            >
              {totalCount === 0 ? (
                <>
                  <svg
                    className="w-16 h-16 mb-4"
                    style={{ color: 'var(--text-disabled)' }}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    viewBox="0 0 24 24"
                  >
                    <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
                    No events detected yet
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    Events will appear here as they are detected in the orderbook
                  </p>
                </>
              ) : (
                <>
                  <svg
                    className="w-16 h-16 mb-4"
                    style={{ color: 'var(--text-disabled)' }}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    viewBox="0 0 24 24"
                  >
                    <path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
                    No events match your filters
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    Try adjusting your filter settings
                  </p>
                </>
              )}
            </motion.div>
          ) : (
            <div className="p-2 space-y-2">
              {filteredEvents.map((event) => (
                <EventListItem key={event.id} event={event} />
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer with Legend */}
      <div className="flex-shrink-0 p-3 glass-panel" style={{
        borderTop: '1px solid var(--glass-border-color)',
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '0',
        borderLeft: 'none',
        borderRight: 'none',
        borderBottom: 'none',
      }}>
        <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-tertiary)' }}>
          <span>Click event to jump to timestamp</span>
        </div>
      </div>
    </div>
  );
}
