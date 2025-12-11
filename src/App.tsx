import { useKrakenOrderbook } from './hooks/useKrakenOrderbook';
import { useSnapshots } from './hooks/useSnapshots';
import { usePlayback } from './hooks/usePlayback';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useDisplayOrderbook } from './hooks/useDisplayOrderbook';
import { useEventDetection } from './hooks/useEventDetection';
import { useOrderbookStore } from './stores/orderbookStore';
import { Controls } from './components/Controls/Controls';
import { Timeline } from './components/Timeline/Timeline';
import DepthChart from './components/DepthChart/DepthChart';
import { EventPanel } from './components/EventPanel/EventPanel';
import { useState } from 'react';

function App() {
  const [isEventPanelOpen, setIsEventPanelOpen] = useState(true);

  // WebSocket connection (always updates live data for snapshot recording)
  useKrakenOrderbook();

  // Snapshot recording and persistence
  useSnapshots();

  // Playback functionality
  usePlayback();

  // Keyboard shortcuts
  useKeyboardShortcuts();

  // Get connection status from live orderbook
  const { isConnected } = useOrderbookStore();

  // Get display data (live or replay depending on mode)
  const { bids, asks, spread, midPrice, currentSnapshot } = useDisplayOrderbook();

  // Event detection (runs on current snapshot)
  useEventDetection(currentSnapshot, { enabled: true });

  return (
    <div className="w-full h-screen flex flex-col text-white" style={{ background: 'var(--surface-base)' }}>
      {/* Header */}
      <div className="flex-none p-4 glass-panel-elevated relative" style={{
        borderRadius: '0',
        borderTop: 'none',
        borderLeft: 'none',
        borderRight: 'none',
        background: 'linear-gradient(to bottom, var(--glass-bg-elevated), var(--glass-bg-base))',
        borderImage: 'linear-gradient(90deg, rgba(59, 130, 246, 0.3), rgba(139, 92, 246, 0.3), rgba(59, 130, 246, 0.3)) 1',
        borderImageSlice: '0 0 1 0',
      }}>
        <div className="flex items-center justify-between">
          <div className="relative group">
            {/* Animated gradient background behind title */}
            <div
              className="absolute -inset-4 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse at center, rgba(59, 130, 246, 0.3) 0%, rgba(139, 92, 246, 0.2) 50%, transparent 70%)',
                filter: 'blur(20px)',
                zIndex: 0,
              }}
            />
            <h1 className="text-2xl font-bold relative z-10" style={{ color: 'var(--text-primary)' }}>Market Depth Cinema</h1>
            <p className="text-sm relative z-10" style={{ color: 'var(--text-tertiary)' }}>BTC/USD Orderbook Visualizer</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsEventPanelOpen(!isEventPanelOpen)}
              className="btn btn-subtle btn-sm"
            >
              {isEventPanelOpen ? 'Hide Events' : 'Show Events'}
            </button>
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full transition-all ${
                  isConnected ? 'bg-green-500' : 'bg-red-500'
                }`}
                style={isConnected ? {
                  boxShadow: 'var(--shadow-glow-bid)',
                  animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                } : {}}
              />
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 flex gap-4 px-4 py-4">
        {/* Depth Chart */}
        <div className="flex-1 min-w-0 relative">
          <div className="h-full glass-card" style={{ padding: 'var(--spacing-lg)' }}>
            <DepthChart
              bids={bids}
              asks={asks}
              midPrice={midPrice}
              spread={spread}
              showHeatmap={false}
            />
          </div>

          {/* Playback Controls Overlay */}
          <div className="absolute top-4 left-4" style={{ zIndex: 10 }}>
            <div className="glass-card" style={{ padding: 'var(--spacing-md)' }}>
              <Controls />
            </div>
          </div>
        </div>

        {/* Event Panel */}
        {isEventPanelOpen && (
          <div className="w-96 flex-shrink-0">
            <EventPanel />
          </div>
        )}
      </div>

      {/* Timeline Scrubber */}
      <div className="flex-none px-4 pb-4">
        <div className="glass-card" style={{ padding: 'var(--spacing-lg)' }}>
          <Timeline />
        </div>
      </div>

      {/* Footer */}
      <div className="flex-none p-2 text-xs text-center glass-panel" style={{
        borderRadius: '0',
        borderBottom: 'none',
        borderLeft: 'none',
        borderRight: 'none',
        background: 'var(--glass-bg-subtle)',
        opacity: '0.9',
        color: 'var(--text-tertiary)',
      }}>
        Keyboard shortcuts: Space (play/pause) • L (live) • ← / → (step) • Shift + ← / → (step 10s) • N (next event) • P (prev event) • Esc (clear selection)
      </div>
    </div>
  );
}

export default App;
