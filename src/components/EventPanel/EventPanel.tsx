/**
 * Event Panel Component
 *
 * Main panel that displays detected events with filtering capabilities.
 * Shows event list, count, and allows user to interact with events.
 */

import { motion, AnimatePresence } from 'framer-motion'
import { useMemo } from 'react'
import { Eye, Filter } from 'lucide-react'
import { useEventsStore } from '../../stores/eventsStore'
import { EventFilter } from './EventFilter'
import { EventListItem } from './EventListItem'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

export function EventPanel() {
  const events = useEventsStore((state) => state.events)
  const getFilteredEvents = useEventsStore((state) => state.getFilteredEvents)
  const clearEvents = useEventsStore((state) => state.clearEvents)

  const filteredEvents = useMemo(() => {
    return getFilteredEvents()
  }, [getFilteredEvents, events])

  const totalCount = events.length
  const filteredCount = filteredEvents.length

  return (
    <Card variant="glass" className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <CardHeader className="flex flex-row justify-between flex-shrink-0 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Events</CardTitle>
          {totalCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearEvents}
              className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
            >
              Clear
            </Button>
          )}
        </div>

        {/* Event Count */}
        <div className="flex items-center gap-1.5 text-sm mt-2">
          <span className="text-[var(--text-secondary)]">Showing</span>
          <motion.span
            key={filteredCount}
            initial={{ scale: 1.2, color: 'var(--color-primary)' }}
            animate={{ scale: 1, color: 'var(--text-primary)' }}
            className="font-semibold"
          >
            {filteredCount}
          </motion.span>
          {filteredCount !== totalCount && (
            <>
              <span className="text-[var(--text-secondary)]">of</span>
              <span className="font-semibold text-[var(--text-secondary)]">{totalCount}</span>
            </>
          )}
          <span className="text-[var(--text-secondary)]">
            {filteredCount === 1 ? 'event' : 'events'}
          </span>
        </div>
      </CardHeader>

      {/* Filters */}
      <EventFilter />

      <Separator />

      {/* Event List */}
      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea className="h-full">
          <AnimatePresence mode="popLayout">
            {filteredEvents.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex flex-col items-center justify-center p-8 text-center min-h-[200px]"
              >
                {totalCount === 0 ? (
                  <>
                    <Eye className="size-16 mb-4 text-[var(--text-disabled)]" strokeWidth={1.5} />
                    <p className="text-sm mb-1 text-[var(--text-secondary)]">
                      No events detected yet
                    </p>
                    <p className="text-xs text-[var(--text-tertiary)]">
                      Events will appear here as they are detected in the orderbook
                    </p>
                  </>
                ) : (
                  <>
                    <Filter className="size-16 mb-4 text-[var(--text-disabled)]" strokeWidth={1.5} />
                    <p className="text-sm mb-1 text-[var(--text-secondary)]">
                      No events match your filters
                    </p>
                    <p className="text-xs text-[var(--text-tertiary)]">
                      Try adjusting your filter settings
                    </p>
                  </>
                )}
              </motion.div>
            ) : (
              <div className="p-2 space-y-2">
                {filteredEvents.map((event) => (
                  <EventListItem key={event.id} event={event} />
                ))}
              </div>
            )}
          </AnimatePresence>
        </ScrollArea>
      </CardContent>

      {/* Footer with Legend */}
      <CardFooter className="flex-shrink-0 py-3 px-4 border-t border-[var(--glass-border-color)] bg-black/30">
        <span className="text-xs text-[var(--text-tertiary)]">
          Click event to jump to timestamp
        </span>
      </CardFooter>
    </Card>
  )
}
