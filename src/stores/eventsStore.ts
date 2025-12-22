/**
 * Events Store
 *
 * Manages detected events state and provides filtering/selection functionality.
 * Events are pruned to prevent unbounded memory growth.
 */

import { create } from 'zustand';
import type { DetectedEvent, EventType, EventSeverity } from '../types';

// Maximum number of events to keep in memory
const MAX_EVENTS = 1000;
// Keep events from the last 1 hour
const MAX_EVENT_AGE_MS = 60 * 60 * 1000;

interface EventFilters {
  types: Set<EventType>;
  severities: Set<EventSeverity>;
  searchQuery: string;
}

interface EventsState {
  // All detected events
  events: DetectedEvent[];

  // Currently selected event (for highlighting on chart)
  selectedEventId: string | null;

  // Active filters
  filters: EventFilters;

  // Actions
  addEvent: (event: DetectedEvent) => void;
  addEvents: (events: DetectedEvent[]) => void;
  removeEvent: (eventId: string) => void;
  clearEvents: () => void;
  selectEvent: (eventId: string | null) => void;
  setTypeFilter: (type: EventType, enabled: boolean) => void;
  setSeverityFilter: (severity: EventSeverity, enabled: boolean) => void;
  setSearchQuery: (query: string) => void;
  resetFilters: () => void;
  getFilteredEvents: () => DetectedEvent[];
  getEventById: (eventId: string) => DetectedEvent | undefined;
  getEventsInTimeRange: (startTime: number, endTime: number) => DetectedEvent[];
}

const DEFAULT_FILTERS: EventFilters = {
  types: new Set<EventType>([
    'large_order_added',
    'large_order_removed',
    'spread_change',
    'liquidity_gap',
    'rapid_cancellations',
    'price_level_breakthrough',
  ]),
  severities: new Set<EventSeverity>(['low', 'medium', 'high']),
  searchQuery: '',
};

export const useEventsStore = create<EventsState>((set, get) => ({
  events: [],
  selectedEventId: null,
  filters: DEFAULT_FILTERS,

  addEvent: (event) =>
    set((state) => {
      // Avoid duplicate events
      const exists = state.events.some((e) => e.id === event.id);
      if (exists) return state;

      let events = [...state.events, event].sort((a, b) => a.timestamp - b.timestamp);

      // Prune old events by time
      const cutoffTime = Date.now() - MAX_EVENT_AGE_MS;
      events = events.filter((e) => e.timestamp >= cutoffTime);

      // Prune by count - keep only the newest MAX_EVENTS
      if (events.length > MAX_EVENTS) {
        events = events.slice(-MAX_EVENTS);
      }

      return { events };
    }),

  addEvents: (newEvents) =>
    set((state) => {
      // Filter out duplicates
      const existingIds = new Set(state.events.map((e) => e.id));
      const uniqueEvents = newEvents.filter((e) => !existingIds.has(e.id));

      if (uniqueEvents.length === 0) return state;

      let events = [...state.events, ...uniqueEvents].sort(
        (a, b) => a.timestamp - b.timestamp
      );

      // Prune old events by time
      const cutoffTime = Date.now() - MAX_EVENT_AGE_MS;
      events = events.filter((e) => e.timestamp >= cutoffTime);

      // Prune by count - keep only the newest MAX_EVENTS
      if (events.length > MAX_EVENTS) {
        events = events.slice(-MAX_EVENTS);
      }

      return { events };
    }),

  removeEvent: (eventId) =>
    set((state) => ({
      events: state.events.filter((e) => e.id !== eventId),
      selectedEventId: state.selectedEventId === eventId ? null : state.selectedEventId,
    })),

  clearEvents: () =>
    set({
      events: [],
      selectedEventId: null,
    }),

  selectEvent: (eventId) =>
    set({
      selectedEventId: eventId,
    }),

  setTypeFilter: (type, enabled) =>
    set((state) => {
      const newTypes = new Set(state.filters.types);
      if (enabled) {
        newTypes.add(type);
      } else {
        newTypes.delete(type);
      }
      return {
        filters: {
          ...state.filters,
          types: newTypes,
        },
      };
    }),

  setSeverityFilter: (severity, enabled) =>
    set((state) => {
      const newSeverities = new Set(state.filters.severities);
      if (enabled) {
        newSeverities.add(severity);
      } else {
        newSeverities.delete(severity);
      }
      return {
        filters: {
          ...state.filters,
          severities: newSeverities,
        },
      };
    }),

  setSearchQuery: (query) =>
    set((state) => ({
      filters: {
        ...state.filters,
        searchQuery: query,
      },
    })),

  resetFilters: () =>
    set({
      filters: DEFAULT_FILTERS,
    }),

  getFilteredEvents: () => {
    const { events, filters } = get();

    return events.filter((event) => {
      // Type filter
      if (!filters.types.has(event.type)) return false;

      // Severity filter
      if (!filters.severities.has(event.severity)) return false;

      // Search query (searches in event type and details)
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const typeMatch = event.type.toLowerCase().includes(query);
        const detailsMatch = JSON.stringify(event.details).toLowerCase().includes(query);
        if (!typeMatch && !detailsMatch) return false;
      }

      return true;
    });
  },

  getEventById: (eventId) => {
    return get().events.find((e) => e.id === eventId);
  },

  getEventsInTimeRange: (startTime, endTime) => {
    return get().events.filter(
      (event) => event.timestamp >= startTime && event.timestamp <= endTime
    );
  },
}));
