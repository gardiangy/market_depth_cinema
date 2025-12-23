import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PanelRightClose, PanelRight, Wifi, WifiOff } from 'lucide-react'
import krakenLogo from './assets/kraken.svg'
import { useKrakenOrderbook } from './hooks/useKrakenOrderbook'
import { usePlayback } from './hooks/usePlayback'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { useDisplayOrderbook } from './hooks/useDisplayOrderbook'
import { useOrderbookStore } from './stores/orderbookStore'
import { useUIStore } from './stores/uiStore'
import { Controls } from './components/Controls/Controls'
import { Timeline } from './components/Timeline/Timeline'
import DepthChart from './components/DepthChart/DepthChart'
import { OrderbookTableView } from './components/OrderbookTableView/OrderbookTableView'
import { ViewToggle } from './components/ViewToggle/ViewToggle'
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
import { useIsMobile } from './hooks/useIsMobile'

function App() {
  const isMobile = useIsMobile()
  const [isEventPanelOpen, setIsEventPanelOpen] = useState(!isMobile)

  // WebSocket connection (always updates live data for snapshot recording)
  useKrakenOrderbook()

  // Playback functionality (snapshot recording now handled by SnapshotProvider)
  usePlayback()

  // Keyboard shortcuts
  useKeyboardShortcuts()

  // Get connection status from live orderbook
  const { isConnected } = useOrderbookStore()

  // Get current view mode
  const viewMode = useUIStore((state) => state.viewMode)

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
      <header className="flex-none p-2 sm:p-4 border-b border-[var(--glass-border-color)] bg-gradient-to-b from-[var(--glass-bg-elevated)] to-[var(--glass-bg-base)] backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
          <div className="relative group flex items-center justify-between w-full sm:w-auto">
            <div>
              <h1 className="text-lg sm:text-2xl font-bold relative z-10 text-[var(--text-primary)]">
                Market Depth Cinema
              </h1>
              <p className="text-xs sm:text-sm relative z-10 text-[var(--text-tertiary)]">
                BTC/USD Orderbook Visualizer
              </p>
            </div>
            {/* Connection Badge - shown in header row on mobile */}
            <div className="flex sm:hidden items-center">
              <Badge
                variant={isConnected ? "success" : "destructive"}
                className="gap-1 text-xs"
              >
                {isConnected ? (
                  <>
                    <Wifi className="size-3" />
                    <img src={krakenLogo} alt="Kraken" className="h-3" />
                  </>
                ) : (
                  <>
                    <WifiOff className="size-3" />
                    <span className="hidden">Disconnected</span>
                  </>
                )}
              </Badge>
            </div>
          </div>
          {/* View Mode Toggle */}
          <div className="hidden sm:flex ">
            <ViewToggle />
          </div>
          {/* Controls row */}
          <div className="flex items-center justify-between w-full sm:w-auto gap-2 sm:gap-4">
            <div className="sm:hidden">
              <ViewToggle />
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsEventPanelOpen(!isEventPanelOpen)}
                  className="text-xs sm:text-sm"
                >
                  {isEventPanelOpen ? (
                    <>
                      <PanelRightClose className="size-4 sm:mr-2" />
                      <span className="hidden sm:inline">Hide Events</span>
                    </>
                  ) : (
                    <>
                      <PanelRight className="size-4 sm:mr-2" />
                      <span className="hidden sm:inline">Show Events</span>
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isEventPanelOpen ? "Hide event panel" : "Show event panel"}
              </TooltipContent>
            </Tooltip>

            {/* Connection Badge - hidden on mobile, shown on larger screens */}
            <div className="hidden sm:flex items-center gap-2">
              <Badge
                variant={isConnected ? "success" : "destructive"}
                className="gap-1.5"
              >
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
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-2 sm:gap-4 p-2 sm:p-4">
        {/* Visualization Area - hidden on mobile when events panel is open */}
        {!(isMobile && isEventPanelOpen) && (
          <div className="flex-1 min-w-0 min-h-[250px] lg:min-h-0 relative">
            <Card variant="ghost" className="h-full p-2 sm:p-4 overflow-hidden">
              <AnimatePresence mode="wait">
                {viewMode === "depth-chart" ? (
                  <motion.div
                    key="depth-chart"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{
                      duration: 0.3,
                      ease: [0.4, 0, 0.2, 1],
                    }}
                    className="w-full h-full"
                  >
                    <DepthChart
                      bids={bids}
                      asks={asks}
                      midPrice={midPrice}
                      spread={spread}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="orderbook-table"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{
                      duration: 0.3,
                      ease: [0.4, 0, 0.2, 1],
                    }}
                    className="w-full h-full mt-16"
                  >
                    <OrderbookTableView
                      bids={bids}
                      asks={asks}
                      midPrice={midPrice}
                      spread={spread}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>

            {/* Playback Controls Overlay */}
            <div className="absolute top-0 left-0 z-10">
              <Card variant="glass" className="p-2 sm:p-4">
                <Controls />
              </Card>
            </div>
          </div>
        )}

        {/* Event Panel - full height on mobile when open */}
        <AnimatePresence mode="wait">
          {isEventPanelOpen && (
            <motion.div
              className={`w-full lg:w-96 flex-shrink-0 overflow-auto ${
                isMobile ? "flex-1" : "lg:h-full"
              }`}
              initial={{ opacity: 0, y: isMobile ? 0 : 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: isMobile ? 0 : 20 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            >
              <EventPanel />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Timeline Scrubber */}
      <div className="flex-none px-2 sm:px-4 pb-2 sm:pb-4">
        <Card variant="default" className="p-2 sm:p-4">
          <Timeline />
        </Card>
      </div>

      {/* Footer - simplified on mobile */}
      <footer className="flex-none p-2 text-xs text-center border-t border-[var(--glass-border-color)] bg-[var(--glass-bg-subtle)] text-[var(--text-tertiary)]">
        <span className="hidden sm:inline">
          Keyboard shortcuts: Space (play/pause) - L (live) -
          ArrowLeft/ArrowRight (step) - Shift+Arrows (step 10s) - N (next event)
          - P (prev event) - Esc (clear selection)
        </span>
        <span className="sm:hidden">
          Space: play/pause · L: live · Arrows: step · N/P: events
        </span>
      </footer>
    </div>
  );
}

export default App
