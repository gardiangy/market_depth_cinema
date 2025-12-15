import { useEffect, useCallback, useMemo, useRef } from 'react';
import { usePlaybackStore } from '../stores/playbackStore';
import { useSnapshots } from '../contexts/SnapshotContext';

const PLAYBACK_TICK_INTERVAL = 50; // Update every 50ms for smooth playback

/**
 * Hook that manages the playback loop
 */
export const usePlayback = () => {
  const {
    mode,
    currentTimestamp,
    playbackSpeed,
    isPlaying,
    availableRange,
    viewRange,
    setCurrentTimestamp,
    pause,
    setAvailableRange,
    expandViewRange,
  } = usePlaybackStore();

  const { getTimeRange } = useSnapshots();

  // Refs to access current values inside interval without re-creating it
  const currentTimestampRef = useRef(currentTimestamp);
  const playbackSpeedRef = useRef(playbackSpeed);
  const viewRangeRef = useRef(viewRange);
  const availableRangeRef = useRef(availableRange);

  // Keep refs in sync with state
  useEffect(() => {
    currentTimestampRef.current = currentTimestamp;
  }, [currentTimestamp]);

  useEffect(() => {
    playbackSpeedRef.current = playbackSpeed;
  }, [playbackSpeed]);

  useEffect(() => {
    viewRangeRef.current = viewRange;
  }, [viewRange]);

  useEffect(() => {
    availableRangeRef.current = availableRange;
  }, [availableRange]);

  // Update available time range periodically
  useEffect(() => {
    const updateRange = () => {
      const range = getTimeRange();
      setAvailableRange(range);
    };

    updateRange();

    const interval = setInterval(updateRange, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [getTimeRange, setAvailableRange]);

  // Note: Snapshot loading is now handled by useDisplayOrderbook hook

  // Playback loop - advance timestamp when playing
  // Uses refs to avoid recreating interval on every timestamp change
  useEffect(() => {
    if (!isPlaying || mode !== 'replay') {
      return;
    }

    const interval = setInterval(() => {
      // Use refs to get current values without dependency on state
      const rangeToUse = viewRangeRef.current || availableRangeRef.current;
      const timeIncrement = PLAYBACK_TICK_INTERVAL * playbackSpeedRef.current;
      const newTimestamp = currentTimestampRef.current + timeIncrement;

      // Check if we've reached the end of the view range
      if (rangeToUse && newTimestamp >= rangeToUse.end) {
        pause();
        return;
      }

      // Update ref immediately so next interval tick has correct value
      currentTimestampRef.current = newTimestamp;
      setCurrentTimestamp(newTimestamp);
    }, PLAYBACK_TICK_INTERVAL);

    return () => clearInterval(interval);
  }, [isPlaying, mode, setCurrentTimestamp, pause]);

  // When switching back to live mode, ensure we're using live data
  useEffect(() => {
    if (mode === 'live') {
      // The orderbook will automatically update via useKrakenOrderbook
      // We just need to ensure we're not stuck on old data
    }
  }, [mode]);

  // Jump to specific timestamp
  const jumpTo = useCallback(
    async (timestamp: number) => {
      setCurrentTimestamp(timestamp);
    },
    [setCurrentTimestamp]
  );

  // Check if we can go back in time (use viewRange in replay mode)
  const canGoBack = useCallback(() => {
    const rangeToUse = viewRange || availableRange;
    if (!rangeToUse) return false;
    return currentTimestamp > rangeToUse.start;
  }, [currentTimestamp, availableRange, viewRange]);

  // Check if we can go forward in time (use viewRange in replay mode)
  const canGoForward = useCallback(() => {
    const rangeToUse = viewRange || availableRange;
    if (!rangeToUse) return false;
    return currentTimestamp < rangeToUse.end;
  }, [currentTimestamp, availableRange, viewRange]);

  // Calculate new data available beyond viewRange
  const newDataAvailable = useMemo(() => {
    if (!viewRange || !availableRange) return null;

    const newDataMs = availableRange.end - viewRange.end;
    if (newDataMs <= 0) return null;

    return {
      durationMs: newDataMs,
      durationFormatted: formatDuration(newDataMs),
    };
  }, [viewRange, availableRange]);

  return {
    mode,
    currentTimestamp,
    playbackSpeed,
    isPlaying,
    availableRange,
    viewRange,
    jumpTo,
    canGoBack,
    canGoForward,
    expandViewRange,
    newDataAvailable,
  };
};

// Helper to format duration
function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}
