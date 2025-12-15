import { useEffect, useRef, useState, useMemo } from 'react';
import { usePlaybackStore } from '../../stores/playbackStore';
import { usePlayback } from '../../hooks/usePlayback';
import { useEventsStore } from '../../stores/eventsStore';
import { EventMarker } from '../EventPanel/EventMarker';
import { Button } from '@/components/ui/button';
import { ChevronsRight } from 'lucide-react';

export const Timeline = () => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const { setCurrentTimestamp, pause } = usePlaybackStore();
  const { mode, currentTimestamp, availableRange, viewRange, expandViewRange, newDataAvailable } = usePlayback();

  // Use viewRange for display in replay mode, availableRange otherwise
  const displayRange = mode === 'replay' && viewRange ? viewRange : availableRange;

  // Select events directly from store (stable selector)
  const events = useEventsStore((state) => state.events);
  const filters = useEventsStore((state) => state.filters);

  // Get events that fall within the display time range - properly memoized
  const visibleEvents = useMemo(() => {
    if (!displayRange) return [];

    // Apply filters inline instead of calling getFilteredEvents()
    return events.filter((event) => {
      // Time range filter
      if (event.timestamp < displayRange.start || event.timestamp > displayRange.end) {
        return false;
      }
      // Type filter
      if (!filters.types.has(event.type)) return false;
      // Severity filter
      if (!filters.severities.has(event.severity)) return false;
      // Search query
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const typeMatch = event.type.toLowerCase().includes(query);
        const detailsMatch = JSON.stringify(event.details).toLowerCase().includes(query);
        if (!typeMatch && !detailsMatch) return false;
      }
      return true;
    });
  }, [displayRange, events, filters]);

  // Calculate position percentage (0-100)
  const getPositionPercentage = (): number => {
    if (!displayRange) return 0;

    const { start, end } = displayRange;
    const range = end - start;

    if (range === 0) return 0;

    const position = ((currentTimestamp - start) / range) * 100;
    return Math.max(0, Math.min(100, position));
  };

  // Calculate timestamp from mouse position
  const getTimestampFromPosition = (clientX: number): number => {
    if (!timelineRef.current || !displayRange) return Date.now();

    const rect = timelineRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));

    const { start, end } = displayRange;
    return start + percentage * (end - start);
  };

  // Handle mouse down on timeline
  const handleMouseDown = (e: React.MouseEvent) => {
    // Use displayRange for replay, availableRange otherwise
    const rangeToCheck = displayRange || availableRange;
    if (!rangeToCheck) return; // Don't allow interaction if no data

    setIsDragging(true);
    pause();

    const timestamp = getTimestampFromPosition(e.clientX);
    setCurrentTimestamp(timestamp);
  };

  // Handle mouse move (scrubbing)
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const timestamp = getTimestampFromPosition(e.clientX);
      setCurrentTimestamp(timestamp);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, setCurrentTimestamp]);

  // Format time for display
  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  // Format relative time (e.g., "2m ago")
  const formatRelativeTime = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ago`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s ago`;
    } else {
      return `${seconds}s ago`;
    }
  };

  // Format duration
  const formatDuration = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  const positionPercentage = getPositionPercentage();

  // Calculate event marker positions
  const getEventPosition = (eventTimestamp: number): number => {
    if (!displayRange) return 0;

    const { start, end } = displayRange;
    const range = end - start;

    if (range === 0) return 0;

    const position = ((eventTimestamp - start) / range) * 100;
    return Math.max(0, Math.min(100, position));
  };

  return (
    <div>
      {/* Time Labels */}
      <div className="flex justify-between items-center mb-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
        <div>
          {displayRange ? (
            <>
              <span className="font-mono" style={{
                color: 'var(--text-primary)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 'var(--font-weight-medium)'
              }}>{formatTime(displayRange.start)}</span>
              {mode === 'replay' && (
                <span className="ml-2" style={{
                  color: 'var(--text-tertiary)',
                  fontSize: 'var(--font-size-xs)'
                }}>
                  ({formatRelativeTime(displayRange.start)})
                </span>
              )}
            </>
          ) : (
            <span style={{ color: 'var(--text-disabled)' }}>No data</span>
          )}
        </div>

        <div className="text-center">
          {mode === 'replay' && displayRange && (
            <div>
              <div className="font-mono font-medium" style={{
                color: 'var(--text-primary)',
                fontSize: 'var(--font-size-base)',
                fontWeight: 'var(--font-weight-semibold)'
              }}>
                {formatTime(currentTimestamp)}
              </div>
              <div className="text-xs font-mono" style={{ color: 'var(--text-tertiary)' }}>
                {formatRelativeTime(currentTimestamp)}
              </div>
            </div>
          )}
        </div>

        <div className="text-right flex items-center gap-2 justify-end">
          {displayRange ? (
            <>
              <span className="font-mono" style={{
                color: 'var(--text-primary)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 'var(--font-weight-medium)'
              }}>{formatTime(displayRange.end)}</span>
              {mode === 'replay' && (
                <span className="ml-2" style={{
                  color: 'var(--text-tertiary)',
                  fontSize: 'var(--font-size-xs)'
                }}>
                  (Duration: {formatDuration(displayRange.end - displayRange.start)})
                </span>
              )}
            </>
          ) : (
            <span>—</span>
          )}
          {/* New Data Available Indicator */}
          {newDataAvailable && (
            <Button
              variant="outline"
              size="sm"
              onClick={expandViewRange}
              className="ml-2 text-xs gap-1 h-7 px-2 border-[var(--color-bid-bright)]/50 text-[var(--color-bid-bright)] hover:bg-[var(--color-bid-bright)]/10 hover:border-[var(--color-bid-bright)]"
            >
              <span>+{newDataAvailable.durationFormatted}</span>
              <ChevronsRight className="size-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Timeline Track */}
      <div
        ref={timelineRef}
        className={`relative h-12 rounded-lg overflow-visible ${
          !displayRange && !availableRange ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        }`}
        style={{
          background: 'linear-gradient(to bottom, var(--surface-3), var(--surface-2))',
          boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.4)',
          border: '1px solid var(--glass-border-color)',
          transition: 'var(--transition-all)',
        }}
        onMouseDown={handleMouseDown}
        title={
          !displayRange && !availableRange
            ? 'Waiting for data...'
            : mode === 'live'
            ? 'Click to enter replay mode'
            : 'Drag to scrub through time'
        }
      >
        {/* Progress Bar with Shimmer */}
        {mode === 'replay' && (
        <div
          className="absolute top-0 left-0 h-full rounded-lg transition-all duration-100 glass-shimmer"
          style={{
            width: `${positionPercentage}%`,
            background: 'linear-gradient(135deg, var(--color-primary-dim) 0%, var(--color-primary) 50%, var(--color-primary-bright) 100%)',
            boxShadow: 'var(--shadow-glow-primary)',
          }}
        />
        )}

        {/* Timeline Grid Lines */}
        <div className="absolute inset-0 flex rounded-lg overflow-hidden pointer-events-none">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="flex-1 last:border-r-0"
              style={{
                borderRight: '1px solid rgba(255, 255, 255, 0.05)'
              }}
            />
          ))}
        </div>

        {/* Event Markers */}
        {displayRange && (
          <div className="absolute inset-0 pointer-events-none">
            {visibleEvents.map((event) => (
              <div key={event.id} className="pointer-events-auto">
                <EventMarker
                  event={event}
                  position={getEventPosition(event.timestamp)}
                  size="md"
                />
              </div>
            ))}
          </div>
        )}

        {/* Playhead */}
        {mode === 'replay' && (
          <div
            className="absolute top-0 h-full w-1 transition-all duration-100 pointer-events-none"
            style={{
              left: `${positionPercentage}%`,
              zIndex: 40,
              background: 'var(--text-primary)',
              boxShadow: 'var(--shadow-glow-primary), var(--shadow-lg)',
            }}
          >
            {/* Playhead Handle */}
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-8 rounded-full glass-panel-elevated"
              style={{
                background: 'var(--glass-bg-elevated)',
                border: '2px solid var(--color-primary-bright)',
                boxShadow: 'var(--shadow-glow-primary), var(--shadow-lg)',
              }}
            />
          </div>
        )}
      </div>

      {/* Help Text */}
      {!availableRange && (
        <div className="mt-2 text-xs text-center" style={{ color: 'var(--text-tertiary)' }}>
          Recording orderbook data... Timeline will be available shortly.
        </div>
      )}

      {availableRange && mode === 'live' && (
        <div className="mt-2 text-xs text-center" style={{ color: 'var(--color-primary-bright)' }}>
          ✨ Click anywhere on the timeline to enter replay mode
        </div>
      )}

      {mode === 'replay' && (
        <div className="mt-2 text-xs text-center" style={{ color: 'var(--text-tertiary)' }}>
          Drag the playhead to scrub through time • Use keyboard shortcuts for precise control
          {newDataAvailable && (
            <span style={{ color: 'var(--color-bid-bright)' }}> • New data available</span>
          )}
        </div>
      )}
    </div>
  );
};
