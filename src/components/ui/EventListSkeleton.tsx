/**
 * Event List Skeleton Component
 *
 * Loading state for event list items.
 * Matches the EventListItem structure with icon, title, description, and timestamp.
 */

import { SkeletonEventCard } from './Skeleton';

interface EventListSkeletonProps {
  count?: number;
}

/**
 * Renders multiple skeleton event cards to fill the list during loading.
 */
export function EventListSkeleton({ count = 5 }: EventListSkeletonProps) {
  return (
    <div className="p-2 space-y-2" aria-label="Loading events...">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonEventCard key={i} />
      ))}
    </div>
  );
}

/**
 * Single event list item skeleton.
 * Use when you need just one loading placeholder.
 */
export function EventListItemSkeleton() {
  return <SkeletonEventCard />;
}
