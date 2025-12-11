import { create } from 'zustand';
import type { PlaybackState } from '../types';

const PLAYBACK_SPEEDS = [0.1, 0.5, 1, 2, 5, 10] as const;
export type PlaybackSpeed = (typeof PLAYBACK_SPEEDS)[number];

interface PlaybackStoreState extends PlaybackState {
  // Time range available for playback
  availableRange: { start: number; end: number } | null;

  // Actions
  play: () => void;
  pause: () => void;
  stop: () => void;
  goLive: () => void;
  setSpeed: (speed: PlaybackSpeed) => void;
  setCurrentTimestamp: (timestamp: number) => void;
  setAvailableRange: (range: { start: number; end: number } | null) => void;
  stepForward: (milliseconds: number) => void;
  stepBackward: (milliseconds: number) => void;
  togglePlayPause: () => void;
}

export const usePlaybackStore = create<PlaybackStoreState>((set) => ({
  mode: 'live',
  currentTimestamp: Date.now(),
  playbackSpeed: 1,
  isPlaying: false,
  availableRange: null,

  play: () =>
    set((state) => {
      // If we're in live mode, don't start playing
      if (state.mode === 'live') {
        return state;
      }

      return {
        isPlaying: true,
      };
    }),

  pause: () =>
    set({
      isPlaying: false,
    }),

  stop: () =>
    set({
      mode: 'live',
      isPlaying: false,
      currentTimestamp: Date.now(),
    }),

  goLive: () =>
    set({
      mode: 'live',
      isPlaying: false,
      currentTimestamp: Date.now(),
    }),

  setSpeed: (speed: PlaybackSpeed) =>
    set({
      playbackSpeed: speed,
    }),

  setCurrentTimestamp: (timestamp: number) =>
    set((state) => {
      // When timestamp is set manually (e.g., scrubbing), switch to replay mode
      const newMode = state.mode === 'live' ? 'replay' : state.mode;

      // Clamp timestamp to available range
      const { availableRange } = state;
      let clampedTimestamp = timestamp;

      if (availableRange) {
        clampedTimestamp = Math.max(
          availableRange.start,
          Math.min(availableRange.end, timestamp)
        );
      }

      return {
        mode: newMode,
        currentTimestamp: clampedTimestamp,
      };
    }),

  setAvailableRange: (range) =>
    set({
      availableRange: range,
    }),

  stepForward: (milliseconds: number) =>
    set((state) => {
      const newTimestamp = state.currentTimestamp + milliseconds;

      // Clamp to available range
      const { availableRange } = state;
      let clampedTimestamp = newTimestamp;

      if (availableRange) {
        clampedTimestamp = Math.min(availableRange.end, newTimestamp);
      }

      return {
        mode: 'replay',
        currentTimestamp: clampedTimestamp,
        isPlaying: false,
      };
    }),

  stepBackward: (milliseconds: number) =>
    set((state) => {
      const newTimestamp = state.currentTimestamp - milliseconds;

      // Clamp to available range
      const { availableRange } = state;
      let clampedTimestamp = newTimestamp;

      if (availableRange) {
        clampedTimestamp = Math.max(availableRange.start, newTimestamp);
      }

      return {
        mode: 'replay',
        currentTimestamp: clampedTimestamp,
        isPlaying: false,
      };
    }),

  togglePlayPause: () =>
    set((state) => {
      if (state.mode === 'live') {
        return state;
      }

      return {
        isPlaying: !state.isPlaying,
      };
    }),
}));
