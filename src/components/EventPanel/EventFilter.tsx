/**
 * Event Filter Component
 *
 * Provides filtering controls for event types and severity levels.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import type { EventType, EventSeverity } from '../../types';
import { useEventsStore } from '../../stores/eventsStore';
import { EVENT_METADATA } from '../../lib/eventDetectionConfig';
import { EventIcon } from './EventIcon';

export function EventFilter() {
  const [isExpanded, setIsExpanded] = useState(false);

  const filters = useEventsStore((state) => state.filters);
  const setTypeFilter = useEventsStore((state) => state.setTypeFilter);
  const setSeverityFilter = useEventsStore((state) => state.setSeverityFilter);
  const resetFilters = useEventsStore((state) => state.resetFilters);

  const eventTypes: EventType[] = [
    'large_order_added',
    'large_order_removed',
    'spread_change',
    'liquidity_gap',
    'rapid_cancellations',
    'price_level_breakthrough',
  ];

  const severityLevels: EventSeverity[] = ['low', 'medium', 'high'];

  const severityColors: Record<EventSeverity, string> = {
    low: 'var(--severity-low)',
    medium: 'var(--severity-medium)',
    high: 'var(--severity-high)',
  };

  const activeFilterCount =
    (6 - filters.types.size) + (3 - filters.severities.size);

  return (
    <div style={{ borderBottom: '1px solid var(--glass-border-color)' }}>
      {/* Filter Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between focus-ring-subtle"
        style={{
          background: 'transparent',
          transition: 'var(--transition-colors)',
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
      >
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4"
            style={{ color: 'var(--text-secondary)' }}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Filters</span>
          {activeFilterCount > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full" style={{
              background: 'var(--color-primary-glow)',
              color: 'var(--color-primary-bright)',
              border: '1px solid var(--color-primary)',
            }}>
              {activeFilterCount}
            </span>
          )}
        </div>

        <motion.svg
          animate={{ rotate: isExpanded ? 180 : 0 }}
          className="w-4 h-4"
          style={{ color: 'var(--text-secondary)', transition: 'var(--transition-transform)' }}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path d="M19 9l-7 7-7-7" />
        </motion.svg>
      </button>

      {/* Filter Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-5" style={{
              background: 'rgba(0, 0, 0, 0.2)',
              backdropFilter: 'blur(8px)',
            }}>
              {/* Severity Filter */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wide" style={{
                    color: 'var(--text-tertiary)',
                    fontSize: 'var(--font-size-xs)',
                    letterSpacing: '0.05em',
                  }}>
                    Severity
                  </span>
                </div>
                <div className="flex gap-2">
                  {severityLevels.map((severity) => {
                    const isActive = filters.severities.has(severity);
                    return (
                      <button
                        key={severity}
                        onClick={() =>
                          setSeverityFilter(
                            severity,
                            !isActive
                          )
                        }
                        className="flex-1 px-3 py-2.5 rounded-md text-xs font-medium focus-ring-subtle"
                        style={{
                          color: isActive ? severityColors[severity] : 'var(--text-disabled)',
                          background: isActive ? `color-mix(in srgb, ${severityColors[severity]} 15%, transparent)` : 'var(--surface-3)',
                          border: `1px solid ${isActive ? `color-mix(in srgb, ${severityColors[severity]} 50%, transparent)` : 'var(--glass-border-color)'}`,
                          boxShadow: isActive ? `0 0 8px color-mix(in srgb, ${severityColors[severity]} 30%, transparent)` : 'none',
                          transition: 'var(--transition-all)',
                        }}
                      >
                        {severity}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Event Type Filter */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wide" style={{
                    color: 'var(--text-tertiary)',
                    fontSize: 'var(--font-size-xs)',
                    letterSpacing: '0.05em',
                  }}>
                    Event Types
                  </span>
                  <button
                    onClick={resetFilters}
                    className="btn btn-ghost btn-sm text-xs focus-ring"
                    style={{
                      color: 'var(--color-primary-bright)',
                      fontSize: 'var(--font-size-xs)',
                      padding: 'var(--spacing-xs)',
                    }}
                  >
                    Reset
                  </button>
                </div>
                <div className="space-y-2">
                  {eventTypes.map((type) => {
                    const metadata = EVENT_METADATA[type];
                    const isActive = filters.types.has(type);

                    return (
                      <button
                        key={type}
                        onClick={() => setTypeFilter(type, !isActive)}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs focus-ring-subtle"
                        style={{
                          background: isActive ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                          color: isActive ? 'var(--text-primary)' : 'var(--text-disabled)',
                          border: isActive ? '1px solid var(--glass-border-color-bright)' : '1px solid transparent',
                          transition: 'var(--transition-all)',
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <EventIcon
                          type={type}
                          severity="medium"
                          size="sm"
                        />
                        <span className="flex-1 text-left">
                          {metadata.label}
                        </span>
                        <div
                          className="w-4 h-4 rounded border flex items-center justify-center"
                          style={{
                            background: isActive ? 'var(--color-primary)' : 'transparent',
                            borderColor: isActive ? 'var(--color-primary-bright)' : 'var(--glass-border-color)',
                            transition: 'var(--transition-all)',
                          }}
                        >
                          {isActive && (
                            <svg
                              className="w-3 h-3"
                              style={{ color: 'white' }}
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3"
                              viewBox="0 0 24 24"
                            >
                              <path d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
