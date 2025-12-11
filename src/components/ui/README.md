# UI Components - Usage Guide

## Skeleton Loading Components

Beautiful, themeable loading states that maintain visual hierarchy during content fetch.

### Import

```tsx
import {
  Skeleton,
  SkeletonText,
  SkeletonHeading,
  SkeletonParagraph,
  SkeletonCircle,
  SkeletonRect,
  SkeletonSquare,
  SkeletonEventCard,
  SkeletonChart,
  DepthChartSkeleton,
  EventListSkeleton,
} from '@/components/ui';
```

---

## Basic Skeleton Components

### Skeleton (Base)
Generic skeleton wrapper. Use for custom loading states.

```tsx
<Skeleton className="w-64 h-8" />
<Skeleton style={{ width: '100%', height: '200px' }} />
```

### SkeletonText
Mimics lines of text. Perfect for paragraphs and descriptions.

```tsx
<SkeletonText />                          // Base size
<SkeletonText size="sm" />                // Small text
<SkeletonText size="lg" />                // Large text
<SkeletonText width="70%" />              // Custom width
```

### SkeletonHeading
Larger text block for headings.

```tsx
<SkeletonHeading />                       // 60% width by default
<SkeletonHeading width="80%" />           // Custom width
```

### SkeletonParagraph
Multiple text lines for paragraph blocks.

```tsx
<SkeletonParagraph lines={3} />           // 3 lines
<SkeletonParagraph lines={5} />           // 5 lines
```

---

## Shape Components

### SkeletonCircle
For avatars, icons, or circular elements.

```tsx
<SkeletonCircle size="sm" />              // Small circle (2rem)
<SkeletonCircle size="md" />              // Medium circle (3rem)
<SkeletonCircle size="lg" />              // Large circle (4rem)
```

### SkeletonRect
For cards, images, or rectangular blocks.

```tsx
<SkeletonRect size="sm" />                // Height: 8rem
<SkeletonRect size="md" />                // Height: 12rem
<SkeletonRect size="lg" />                // Height: 16rem
<SkeletonRect size="xl" />                // Height: 24rem
<SkeletonRect width="100%" height="300px" /> // Custom size
```

### SkeletonSquare
Square aspect ratio elements.

```tsx
<SkeletonSquare />                        // Auto size
<SkeletonSquare size="100px" />           // 100x100
```

---

## Specialized Layouts

### SkeletonEventCard
Matches EventListItem structure perfectly.

```tsx
<SkeletonEventCard />
```

### SkeletonChart
Loading state for the depth chart.

```tsx
<SkeletonChart />
```

### DepthChartSkeleton
Complete loading state with chart structure hint and loading indicator.

```tsx
<DepthChartSkeleton />
```

### EventListSkeleton
Multiple event card skeletons for the event list.

```tsx
<EventListSkeleton count={5} />           // 5 skeleton cards
<EventListSkeleton count={3} />           // 3 skeleton cards
```

---

## Theme Variants

### SkeletonVariant
Colored tint for different content types.

```tsx
<SkeletonVariant variant="primary">      // Blue tint
  <SkeletonText />
</SkeletonVariant>

<SkeletonVariant variant="success">      // Green tint
  <SkeletonText />
</SkeletonVariant>

<SkeletonVariant variant="warning">      // Yellow tint
  <SkeletonText />
</SkeletonVariant>
```

---

## Real-World Examples

### Event Panel Loading
```tsx
function EventPanel() {
  const { events, isLoading } = useEventsStore();

  return (
    <div className="glass-panel-elevated">
      {isLoading ? (
        <EventListSkeleton count={5} />
      ) : (
        <div className="p-2 space-y-2">
          {events.map(event => (
            <EventListItem key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
```

### Depth Chart Loading
```tsx
function ChartContainer() {
  const { bids, asks, isConnected } = useOrderbookStore();

  return (
    <div className="w-full h-full">
      {!isConnected || bids.length === 0 ? (
        <DepthChartSkeleton />
      ) : (
        <DepthChart bids={bids} asks={asks} />
      )}
    </div>
  );
}
```

### Custom Profile Card
```tsx
function ProfileCardSkeleton() {
  return (
    <div className="glass-card p-4">
      <div className="flex items-start gap-4">
        <SkeletonCircle size="lg" />
        <div className="flex-1 space-y-2">
          <SkeletonHeading width="70%" />
          <SkeletonParagraph lines={2} />
          <div className="flex gap-2 mt-4">
            <SkeletonRect width="80px" height="32px" />
            <SkeletonRect width="80px" height="32px" />
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Stats Grid
```tsx
function StatsGridSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="glass-card p-4">
          <SkeletonText size="sm" width="40%" />
          <SkeletonHeading width="80%" className="mt-2" />
          <SkeletonText size="sm" width="60%" className="mt-1" />
        </div>
      ))}
    </div>
  );
}
```

---

## Styling & Customization

### Custom Classes
All components accept `className` prop:

```tsx
<SkeletonText className="my-4" />
<SkeletonCircle className="mx-auto" />
```

### Custom Styles
All components accept `style` prop:

```tsx
<Skeleton style={{ borderRadius: '16px' }} />
<SkeletonRect style={{ aspectRatio: '16/9' }} />
```

### Combining Components
Build complex layouts:

```tsx
<div className="space-y-4">
  <div className="flex items-center gap-3">
    <SkeletonCircle size="md" />
    <div className="flex-1">
      <SkeletonText width="60%" />
      <SkeletonText size="sm" width="40%" />
    </div>
  </div>
  <SkeletonRect size="lg" />
  <SkeletonParagraph lines={3} />
</div>
```

---

## Animations

All skeleton components include:
- **Pulse animation** - Gentle breathing opacity (2s loop)
- **Shimmer effect** - Sweeping light reflection (2s loop)
- **Respects reduced motion** - Animations disabled if user prefers

---

## Accessibility

- `aria-hidden="true"` - Hidden from screen readers (loading state is temporary)
- `aria-label` on specialized components (DepthChartSkeleton, EventListSkeleton)
- No interactive elements (pointer-events: none)
- Semantic HTML maintained

---

## Best Practices

### 1. Match Real Content Structure
Your skeleton should mimic the actual content layout:

```tsx
// Good - matches EventListItem
<SkeletonEventCard />

// Bad - generic rectangle
<SkeletonRect size="lg" />
```

### 2. Use Appropriate Counts
Show a reasonable number of skeleton items:

```tsx
// Good - typical list length
<EventListSkeleton count={5} />

// Bad - too many, wastes rendering
<EventListSkeleton count={50} />
```

### 3. Fade Transition
Add smooth transition when content loads:

```tsx
<AnimatePresence mode="wait">
  {isLoading ? (
    <motion.div
      key="skeleton"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <EventListSkeleton count={5} />
    </motion.div>
  ) : (
    <motion.div
      key="content"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <EventList events={events} />
    </motion.div>
  )}
</AnimatePresence>
```

### 4. Progressive Loading
Show partial content + skeleton for remaining:

```tsx
<div className="space-y-2">
  {loadedEvents.map(event => (
    <EventListItem key={event.id} event={event} />
  ))}
  {isLoadingMore && <EventListSkeleton count={3} />}
</div>
```

---

## Performance Notes

- Skeleton components are lightweight (no complex logic)
- CSS animations are GPU-accelerated (transform, opacity)
- `will-change` managed automatically for performance
- No unnecessary re-renders (pure components)

---

## Theme Integration

All skeleton components use CSS variables from `tokens.css`:
- Background: `var(--glass-bg-base)`
- Borders: `var(--glass-border-color)`
- Shimmer: Gradient with white opacity
- Fully themeable by changing CSS variables

---

Need help? Check the main codebase for examples:
- EventPanel uses EventListSkeleton
- DepthChart uses DepthChartSkeleton
- All components are pre-built and ready to use
