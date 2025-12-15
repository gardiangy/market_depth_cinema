import { usePlaybackStore, type PlaybackSpeed } from '../../stores/playbackStore'
import { usePlayback } from '../../hooks/usePlayback'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Play,
  Pause,
} from 'lucide-react'

const PLAYBACK_SPEEDS: PlaybackSpeed[] = [0.1, 0.5, 1, 2, 5, 10]

export const Controls = () => {
  const {
    goLive,
    setSpeed,
    stepForward,
    stepBackward,
    togglePlayPause,
  } = usePlaybackStore()

  const { mode, playbackSpeed, isPlaying, canGoBack, canGoForward } = usePlayback()

  const handleSpeedChange = (value: string) => {
    setSpeed(Number(value) as PlaybackSpeed)
  }

  return (
    <div className="flex items-center gap-4">
      {/* Mode Indicator */}
      <div className="flex items-center gap-2">
        <div className="relative size-3 mr-2">
          {/* Inner core - always visible */}
          <div
            className={`absolute inset-[2px] rounded-full transition-all ${
              mode === 'live' ? 'bg-emerald-500' : 'bg-amber-500'
            }`}
            style={
              mode === 'live'
                ? {
                    boxShadow: 'var(--shadow-glow-bid)',
                  }
                : {}
            }
          />
          {/* Pulse rings - expand outward */}
          {mode === 'live' && (
            <div
              className="absolute inset-[-4px] rounded-full bg-emerald-500/60"
              style={{
                animation: 'live-pulse 1.5s ease-out infinite',
              }}
            />
          )}
          {mode === 'live' && (
            <div
              className="absolute inset-[-4px] rounded-full bg-emerald-400/40"
              style={{
                animation: 'live-pulse 1.5s ease-out infinite',
                animationDelay: '0.75s',
              }}
            />
          )}
        </div>
        <Badge variant={mode === 'live' ? 'success' : 'warning'} className="uppercase tracking-wider text-xs font-semibold">
          {mode === 'live' ? 'LIVE' : 'REPLAY'}
        </Badge>
      </div>

      {/* Transport Controls - only show in replay mode */}
      {mode === 'replay' && (
        <div className="flex items-center gap-1 rounded-lg border border-[var(--glass-border-color)] bg-[var(--glass-bg-base)] backdrop-blur-md p-1">
          {/* Step Backward 10s */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => stepBackward(10000)}
                disabled={!canGoBack()}
              >
                <ChevronsLeft className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Step back 10 seconds (Shift + Left)</TooltipContent>
          </Tooltip>

          {/* Step Back 1 Second */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => stepBackward(1000)}
                disabled={!canGoBack()}
              >
                <ChevronLeft className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Step back 1 second (Left)</TooltipContent>
          </Tooltip>

          {/* Play/Pause */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="default"
                size="sm"
                onClick={togglePlayPause}
                className="px-3 glass-shimmer"
              >
                {isPlaying ? (
                  <Pause className="size-4" />
                ) : (
                  <Play className="size-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isPlaying ? 'Pause (Space)' : 'Play (Space)'}</TooltipContent>
          </Tooltip>

          {/* Step Forward 1 Second */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => stepForward(1000)}
                disabled={!canGoForward()}
              >
                <ChevronRight className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Step forward 1 second (Right)</TooltipContent>
          </Tooltip>

          {/* Step Forward 10 Seconds */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => stepForward(10000)}
                disabled={!canGoForward()}
              >
                <ChevronsRight className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Step forward 10 seconds (Shift + Right)</TooltipContent>
          </Tooltip>
        </div>
      )}

      {/* Playback Speed */}
      {mode === 'replay' && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-[var(--text-secondary)]">Speed:</span>
          <Select value={String(playbackSpeed)} onValueChange={handleSpeedChange}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PLAYBACK_SPEEDS.map((speed) => (
                <SelectItem key={speed} value={String(speed)}>
                  {speed}x
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Go Live Button (when in replay mode) */}
      {mode === 'replay' && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="success" onClick={goLive} className="ml-auto glass-shimmer">
              GO LIVE
            </Button>
          </TooltipTrigger>
          <TooltipContent>Return to live mode (L)</TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}
