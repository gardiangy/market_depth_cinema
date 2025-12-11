import { useEffect, useCallback } from 'react';
import { usePlaybackStore } from '../stores/playbackStore';
import { useSnapshots } from './useSnapshots';

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
    setCurrentTimestamp,
    pause,
    setAvailableRange,
  } = usePlaybackStore();

  const { getTimeRange } = useSnapshots();

  // Update available time range periodically
  useEffect(() => {
    const updateRange = async () => {
      const range = await getTimeRange();
      setAvailableRange(range);
    };

    updateRange();

    const interval = setInterval(updateRange, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [getTimeRange, setAvailableRange]);

  // Note: Snapshot loading is now handled by useDisplayOrderbook hook

  // Playback loop - advance timestamp when playing
  useEffect(() => {
    if (!isPlaying || mode !== 'replay') {
      return;
    }

    const interval = setInterval(() => {
      const timeIncrement = PLAYBACK_TICK_INTERVAL * playbackSpeed;
      const newTimestamp = currentTimestamp + timeIncrement;

      // Check if we've reached the end of available data
      if (availableRange && newTimestamp >= availableRange.end) {
        pause();
        return;
      }

      setCurrentTimestamp(newTimestamp);
    }, PLAYBACK_TICK_INTERVAL);

    return () => clearInterval(interval);
  }, [
    isPlaying,
    mode,
    currentTimestamp,
    playbackSpeed,
    availableRange,
    setCurrentTimestamp,
    pause,
  ]);

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

  // Check if we can go back in time
  const canGoBack = useCallback(() => {
    if (!availableRange) return false;
    return currentTimestamp > availableRange.start;
  }, [currentTimestamp, availableRange]);

  // Check if we can go forward in time
  const canGoForward = useCallback(() => {
    if (!availableRange) return false;
    return currentTimestamp < availableRange.end;
  }, [currentTimestamp, availableRange]);

  return {
    mode,
    currentTimestamp,
    playbackSpeed,
    isPlaying,
    availableRange,
    jumpTo,
    canGoBack,
    canGoForward,
  };
};
