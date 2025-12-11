import { useEffect } from 'react';
import { usePlaybackStore } from '../stores/playbackStore';
import { useEventsStore } from '../stores/eventsStore';

/**
 * Hook that sets up keyboard shortcuts for playback control and event navigation
 *
 * Shortcuts:
 * - Space: Play/Pause
 * - L: Go Live
 * - ←: Step backward 1 second
 * - →: Step forward 1 second
 * - Shift + ←: Step backward 10 seconds
 * - Shift + →: Step forward 10 seconds
 * - N: Jump to next event
 * - P: Jump to previous event
 * - Escape: Clear event selection
 */
export const useKeyboardShortcuts = () => {
  const { togglePlayPause, goLive, stepForward, stepBackward, setCurrentTimestamp, pause, currentTimestamp } = usePlaybackStore();
  const { getFilteredEvents, selectEvent } = useEventsStore();

  const jumpToNextEvent = () => {
    const events = getFilteredEvents();
    if (events.length === 0) return;

    // Find the next event after current timestamp
    const nextEvent = events.find(e => e.timestamp > currentTimestamp);

    if (nextEvent) {
      selectEvent(nextEvent.id);
      setCurrentTimestamp(nextEvent.timestamp);
      pause();
    }
  };

  const jumpToPreviousEvent = () => {
    const events = getFilteredEvents();
    if (events.length === 0) return;

    // Find the previous event before current timestamp
    const reversedEvents = [...events].reverse();
    const prevEvent = reversedEvents.find(e => e.timestamp < currentTimestamp);

    if (prevEvent) {
      selectEvent(prevEvent.id);
      setCurrentTimestamp(prevEvent.timestamp);
      pause();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlayPause();
          break;

        case 'l':
        case 'L':
          e.preventDefault();
          goLive();
          break;

        case 'ArrowLeft':
          e.preventDefault();
          if (e.shiftKey) {
            stepBackward(10000); // 10 seconds
          } else {
            stepBackward(1000); // 1 second
          }
          break;

        case 'ArrowRight':
          e.preventDefault();
          if (e.shiftKey) {
            stepForward(10000); // 10 seconds
          } else {
            stepForward(1000); // 1 second
          }
          break;

        case 'n':
        case 'N':
          e.preventDefault();
          jumpToNextEvent();
          break;

        case 'p':
        case 'P':
          e.preventDefault();
          jumpToPreviousEvent();
          break;

        case 'Escape':
          e.preventDefault();
          selectEvent(null);
          break;

        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [togglePlayPause, goLive, stepForward, stepBackward, currentTimestamp, getFilteredEvents, selectEvent, setCurrentTimestamp, pause]);
};
