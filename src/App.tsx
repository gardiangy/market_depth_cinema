import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PanelRightClose, PanelRight, Wifi, WifiOff } from 'lucide-react'
import krakenLogo from './assets/kraken.svg'
import { useKrakenOrderbook } from './hooks/useKrakenOrderbook'
import { usePlayback } from './hooks/usePlayback'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { useDisplayOrderbook } from './hooks/useDisplayOrderbook'
import { useOrderbookStore } from './stores/orderbookStore'
import { Controls } from './components/Controls/Controls'
import { Timeline } from './components/Timeline/Timeline'
import DepthChart from './components/DepthChart/DepthChart'
import { EventPanel } from './components/EventPanel/EventPanel'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useEventDetection } from './hooks/useEventDetection'

function App() {
  const [isEventPanelOpen, setIsEventPanelOpen] = useState(true)

  // WebSocket connection (always updates live data for snapshot recording)
  useKrakenOrderbook()

  // Playback functionality (snapshot recording now handled by SnapshotProvider)
  usePlayback()

  // Keyboard shortcuts
  useKeyboardShortcuts()

  // Get connection status from live orderbook
  const { isConnected } = useOrderbookStore()

  // Get display data (live or replay depending on mode)
  const { bids, asks, spread, midPrice } = useDisplayOrderbook()

  // Memoize snapshot to prevent infinite re-renders and memory leak
  const currentSnapshot = useMemo(
    () => (bids.length > 0 ? { timestamp: Date.now(), bids, asks, spread, midPrice } : null),
    [bids, asks, spread, midPrice]
  );

  useEventDetection(currentSnapshot);

  return (
    <div className="w-full h-screen flex flex-col text-white">
      {/* Header */}
      <header className="flex-none p-4 border-b border-[var(--glass-border-color)] bg-gradient-to-b from-[var(--glass-bg-elevated)] to-[var(--glass-bg-base)] backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div className="relative group">
            {/* Animated gradient background behind title */}
            <div
              className="absolute -inset-4 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none blur-xl"
              style={{
                background:
                  'radial-gradient(ellipse at center, rgba(59, 130, 246, 0.3) 0%, rgba(139, 92, 246, 0.2) 50%, transparent 70%)',
              }}
            />
            <h1 className="text-2xl font-bold relative z-10 text-[var(--text-primary)]">
              Market Depth Cinema
            </h1>
            <p className="text-sm relative z-10 text-[var(--text-tertiary)]">
              BTC/USD Orderbook Visualizer
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsEventPanelOpen(!isEventPanelOpen)}
                >
                  {isEventPanelOpen ? (
                    <>
                      <PanelRightClose className="size-4 mr-2" />
                      Hide Events
                    </>
                  ) : (
                    <>
                      <PanelRight className="size-4 mr-2" />
                      Show Events
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isEventPanelOpen ? 'Hide event panel' : 'Show event panel'}
              </TooltipContent>
            </Tooltip>

            <div className="flex items-center gap-2">
              <Badge variant={isConnected ? 'success' : 'destructive'} className="gap-1.5">
                {isConnected ? (
                  <>
                    <Wifi className="size-3" />
                    Connected to
                    <img src={krakenLogo} alt="Kraken" className="h-3" />
                  </>
                ) : (
                  <>
                    <WifiOff className="size-3" />
                    Disconnected from
                    <img src={krakenLogo} alt="Kraken" className="h-3" />
                  </>
                )}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 flex gap-4 p-4">
        {/* Depth Chart */}
        <div className="flex-1 min-w-0 relative">
          <Card variant="ghost" className="h-full p-4">
            <DepthChart
              bids={bids}
              asks={asks}
              midPrice={midPrice}
              spread={spread}
              showHeatmap={false}
            />
          </Card>

          {/* Playback Controls Overlay */}
          <div className="absolute top-0 left-0 z-10">
            <Card variant="glass" className="p-4">
              <Controls />
            </Card>
          </div>
        </div>

        {/* Event Panel */}
        <AnimatePresence mode="wait">
          {isEventPanelOpen && (
            <motion.div
              className="w-96 flex-shrink-0 h-full"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 384, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            >
              <EventPanel />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Timeline Scrubber */}
      <div className="flex-none px-4 pb-4">
        <Card variant="default" className="p-4">
          <Timeline showEventMarkers={isEventPanelOpen} />
        </Card>
      </div>

      {/* Footer */}
      <footer className="flex-none p-2 text-xs text-center border-t border-[var(--glass-border-color)] bg-[var(--glass-bg-subtle)] text-[var(--text-tertiary)]">
        Keyboard shortcuts: Space (play/pause) - L (live) - ArrowLeft/ArrowRight (step) - Shift+Arrows (step 10s) - N (next event) - P (prev event) - Esc (clear selection)
      </footer>
    </div>
  )
}

export default App
