/**
 * Event Filter Component
 *
 * Provides filtering controls for event types and severity levels.
 */

import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { Filter, ChevronDown } from 'lucide-react'
import type { EventType, EventSeverity } from '../../types'
import { useEventsStore } from '../../stores/eventsStore'
import { EVENT_METADATA } from '../../lib/eventDetectionConfig'
import { EventIcon } from './EventIcon'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Toggle } from '@/components/ui/toggle'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'

export function EventFilter() {
  const [isExpanded, setIsExpanded] = useState(false)

  const filters = useEventsStore((state) => state.filters)
  const setTypeFilter = useEventsStore((state) => state.setTypeFilter)
  const setSeverityFilter = useEventsStore((state) => state.setSeverityFilter)
  const resetFilters = useEventsStore((state) => state.resetFilters)

  const eventTypes: EventType[] = [
    'large_order_added',
    'large_order_removed',
    'spread_change',
    'liquidity_gap',
    'rapid_cancellations',
    'price_level_breakthrough',
  ]

  const severityLevels: EventSeverity[] = ['low', 'medium', 'high']

  const activeFilterCount = 6 - filters.types.size + (3 - filters.severities.size)

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      {/* Filter Header */}
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="w-full px-4 py-3 flex items-center justify-between rounded-none h-auto hover:bg-white/3"
        >
          <div className="flex items-center gap-2">
            <Filter className="size-4 text-[var(--text-secondary)]" />
            <span className="text-sm font-medium text-[var(--text-primary)]">Filters</span>
            {activeFilterCount > 0 && (
              <Badge variant="low" className="text-xs">
                {activeFilterCount}
              </Badge>
            )}
          </div>

          <motion.div animate={{ rotate: isExpanded ? 180 : 0 }}>
            <ChevronDown className="size-4 text-[var(--text-secondary)]" />
          </motion.div>
        </Button>
      </CollapsibleTrigger>

      {/* Filter Content */}
      <AnimatePresence>
        {isExpanded && (
          <CollapsibleContent forceMount asChild>
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="p-4 space-y-5 bg-black/20 backdrop-blur-sm">
                {/* Severity Filter */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                      Severity
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {severityLevels.map((severity) => {
                      const isActive = filters.severities.has(severity)
                      return (
                        <Toggle
                          key={severity}
                          variant={severity === 'low' ? 'info' : severity === 'medium' ? 'warning' : 'error'}
                          size="sm"
                          pressed={isActive}
                          onPressedChange={(pressed) => setSeverityFilter(severity, pressed)}
                          className={cn('flex-1 capitalize', isActive && 'isActive')}
                        >
                          {severity}
                        </Toggle>
                      )
                    })}
                  </div>
                </div>

                {/* Event Type Filter */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                      Event Types
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetFilters}
                      className="text-xs text-[hsl(var(--primary))] h-auto py-1 px-2"
                    >
                      Reset
                    </Button>
                  </div>
                  <div className="space-y-1">
                    {eventTypes.map((type) => {
                      const metadata = EVENT_METADATA[type]
                      const isActive = filters.types.has(type)

                      return (
                        <button
                          key={type}
                          onClick={() => setTypeFilter(type, !isActive)}
                          className={cn(
                            'w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all',
                            'hover:bg-white/5',
                            isActive
                              ? 'bg-white/5 text-[var(--text-primary)] border border-[var(--glass-border-color-bright)]'
                              : 'bg-transparent text-[var(--text-disabled)] border border-transparent'
                          )}
                        >
                          <EventIcon type={type} severity="medium" size="sm" />
                          <span className="flex-1 text-left">{metadata.label}</span>
                          <Checkbox
                            checked={isActive}
                            onCheckedChange={(checked) => setTypeFilter(type, !!checked)}
                            className="pointer-events-none"
                          />
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          </CollapsibleContent>
        )}
      </AnimatePresence>
    </Collapsible>
  )
}
