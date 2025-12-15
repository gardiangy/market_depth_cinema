import { create } from 'zustand';
import type { PlaybackState } from '../types';

const PLAYBACK_SPEEDS = [0.1, 0.5, 1, 2, 5, 10] as const;
export type PlaybackSpeed = (typeof PLAYBACK_SPEEDS)[number];

interface PlaybackStoreState extends PlaybackState {
  // Time range available for playback (continuously updated)
  availableRange: { start: number; end: number } | null;

  // Frozen view range for replay mode (stable for timeline display)
  viewRange: { start: number; end: number } | null;

  // Actions
  play: () => void;
  pause: () => void;
  stop: () => void;
  goLive: () => void;
  setSpeed: (speed: PlaybackSpeed) => void;
  setCurrentTimestamp: (timestamp: number) => void;
  setAvailableRange: (range: { start: number; end: number } | null) => void;
  expandViewRange: () => void;
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
  viewRange: null,

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
      viewRange: null,
    }),

  goLive: () =>
    set({
      mode: 'live',
      isPlaying: false,
      currentTimestamp: Date.now(),
      viewRange: null,
    }),

  setSpeed: (speed: PlaybackSpeed) =>
    set({
      playbackSpeed: speed,
    }),

  setCurrentTimestamp: (timestamp: number) =>
    set((state) => {
      // When timestamp is set manually (e.g., scrubbing), switch to replay mode
      const wasLive = state.mode === 'live';
      const newMode = wasLive ? 'replay' : state.mode;

      // Use viewRange for clamping in replay mode, availableRange otherwise
      const rangeToUse = state.viewRange || state.availableRange;
      let clampedTimestamp = timestamp;

      if (rangeToUse) {
        clampedTimestamp = Math.max(
          rangeToUse.start,
          Math.min(rangeToUse.end, timestamp)
        );
      }

      // Freeze viewRange when entering replay mode from live
      const newViewRange = wasLive && state.availableRange
        ? { ...state.availableRange }
        : state.viewRange;

      return {
        mode: newMode,
        currentTimestamp: clampedTimestamp,
        viewRange: newViewRange,
      };
    }),

  setAvailableRange: (range) =>
    set({
      availableRange: range,
    }),

  expandViewRange: () =>
    set((state) => {
      // Expand viewRange to include all available data
      if (!state.availableRange) return state;

      return {
        viewRange: { ...state.availableRange },
      };
    }),

  stepForward: (milliseconds: number) =>
    set((state) => {
      const newTimestamp = state.currentTimestamp + milliseconds;

      // Clamp to viewRange (frozen range in replay mode)
      const rangeToUse = state.viewRange || state.availableRange;
      let clampedTimestamp = newTimestamp;

      if (rangeToUse) {
        clampedTimestamp = Math.min(rangeToUse.end, newTimestamp);
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

      // Clamp to viewRange (frozen range in replay mode)
      const rangeToUse = state.viewRange || state.availableRange;
      let clampedTimestamp = newTimestamp;

      if (rangeToUse) {
        clampedTimestamp = Math.max(rangeToUse.start, newTimestamp);
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
