import { usePlaybackStore, type PlaybackSpeed } from '../../stores/playbackStore';
import { usePlayback } from '../../hooks/usePlayback';

const PLAYBACK_SPEEDS: PlaybackSpeed[] = [0.1, 0.5, 1, 2, 5, 10];

export const Controls = () => {
  const {
    goLive,
    setSpeed,
    stepForward,
    stepBackward,
    togglePlayPause,
  } = usePlaybackStore();

  const { mode, playbackSpeed, isPlaying, canGoBack, canGoForward } = usePlayback();

  const handleSpeedChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSpeed(Number(e.target.value) as PlaybackSpeed);
  };

  return (
    <div className="flex items-center gap-4">

      {/* Mode Indicator */}
      <div className="flex items-center gap-2">
        <div className="relative w-3 h-3">
          {/* Inner core - always visible */}
          <div
            className={`absolute inset-0 rounded-full transition-all ${
              mode === 'live' ? 'bg-green-500' : 'bg-yellow-500'
            }`}
            style={mode === 'live' ? {
              boxShadow: 'var(--shadow-glow-bid)',
            } : {}}
          />
          {/* First pulse ring - faster */}
          {mode === 'live' && (
            <div
              className="absolute inset-0 rounded-full bg-green-500"
              style={{
                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                opacity: 0.6,
              }}
            />
          )}
          {/* Second pulse ring - slower, more subtle */}
          {mode === 'live' && (
            <div
              className="absolute inset-0 rounded-full bg-green-400"
              style={{
                animation: 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                opacity: 0.3,
                animationDelay: '0.5s',
              }}
            />
          )}
        </div>
        <span className="text-sm font-medium uppercase tracking-wide" style={{
          color: 'var(--text-primary)',
          letterSpacing: '0.05em'
        }}>
          {mode === 'live' ? 'LIVE' : 'REPLAY'}
        </span>
      </div>

      {/* Transport Controls */}
      <div className="flex items-center gap-2 glass-card px-3 py-2">
        {/* Step Backward */}
        <button
          onClick={() => stepBackward(10000)}
          disabled={mode === 'live' || !canGoBack()}
          className="btn btn-ghost btn-icon focus-ring"
          title="Step back 10 seconds (Shift + ←)"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z"
            />
          </svg>
        </button>

        {/* Step Back 1 Second */}
        <button
          onClick={() => stepBackward(1000)}
          disabled={mode === 'live' || !canGoBack()}
          className="btn btn-ghost btn-icon focus-ring"
          title="Step back 1 second (←)"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        {/* Play/Pause */}
        {mode === 'replay' && (
          <button
            onClick={togglePlayPause}
            className="btn btn-primary btn-md focus-ring"
            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
          >
            {isPlaying ? (
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
        )}

        {/* Stop (Go Live) - hidden as we have the separate Go Live button */}

        {/* Step Forward 1 Second */}
        <button
          onClick={() => stepForward(1000)}
          disabled={mode === 'live' || !canGoForward()}
          className="btn btn-ghost btn-icon focus-ring"
          title="Step forward 1 second (→)"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>

        {/* Step Forward 10 Seconds */}
        <button
          onClick={() => stepForward(10000)}
          disabled={mode === 'live' || !canGoForward()}
          className="btn btn-ghost btn-icon focus-ring"
          title="Step forward 10 seconds (Shift + →)"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z"
            />
          </svg>
        </button>
      </div>

      {/* Playback Speed */}
      {mode === 'replay' && (
        <div className="flex items-center gap-2">
          <label htmlFor="speed" className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Speed:
          </label>
          <select
            id="speed"
            value={playbackSpeed}
            onChange={handleSpeedChange}
            className="glass-panel focus-ring-inset"
            style={{
              padding: 'var(--spacing-sm) var(--spacing-md)',
              fontSize: 'var(--font-size-sm)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              transition: 'var(--transition-all)',
            }}
          >
            {PLAYBACK_SPEEDS.map((speed) => (
              <option key={speed} value={speed} style={{ background: 'var(--surface-3)' }}>
                {speed}x
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Go Live Button (when in replay mode) */}
      {mode === 'replay' && (
        <button
          onClick={goLive}
          className="ml-auto btn btn-success btn-md focus-ring-success"
          title="Return to live mode (L)"
        >
          GO LIVE
        </button>
      )}
    </div>
  );
};
