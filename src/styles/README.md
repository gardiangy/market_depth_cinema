# Market Depth Cinema - Design System

## Phase 1: Foundation (Completed)

A comprehensive glassmorphism design system with dark cinematic aesthetics for Market Depth Cinema.

---

## Quick Reference

### CSS Custom Properties (Design Tokens)

All design tokens are defined in `tokens.css` and available as CSS variables throughout the application.

#### Surface Colors
```css
var(--surface-base)   /* #030305 - Deepest black */
var(--surface-1)      /* #0a0a0f */
var(--surface-2)      /* #121218 */
var(--surface-3)      /* #1a1a22 */
var(--surface-4)      /* #22222e - Lightest surface */
```

#### Glass Effects
```css
var(--glass-bg-base)      /* rgba(18, 18, 24, 0.7) */
var(--glass-bg-elevated)  /* rgba(26, 26, 34, 0.8) */
var(--glass-blur-sm)      /* 12px */
var(--glass-blur-md)      /* 16px */
var(--glass-blur-lg)      /* 24px */
var(--glass-border-color) /* rgba(255, 255, 255, 0.08) */
```

#### Trading Colors
```css
/* Bid (green) */
var(--color-bid)        /* #10b981 */
var(--color-bid-glow)   /* rgba(16, 185, 129, 0.4) */

/* Ask (red) */
var(--color-ask)        /* #ef4444 */
var(--color-ask-glow)   /* rgba(239, 68, 68, 0.4) */

/* Mid price (yellow) */
var(--color-mid)        /* #fbbf24 */
var(--color-mid-glow)   /* rgba(251, 191, 36, 0.4) */

/* Primary (blue) */
var(--color-primary)    /* #3b82f6 */
var(--color-primary-glow) /* rgba(59, 130, 246, 0.4) */
```

#### Shadows & Glows
```css
var(--shadow-sm)           /* Small elevation */
var(--shadow-md)           /* Medium elevation */
var(--shadow-lg)           /* Large elevation */
var(--shadow-glow-primary) /* Blue glow */
var(--shadow-glow-bid)     /* Green glow */
var(--shadow-glow-ask)     /* Red glow */
```

#### Spacing
```css
var(--spacing-xs)  /* 4px */
var(--spacing-sm)  /* 8px */
var(--spacing-md)  /* 16px */
var(--spacing-lg)  /* 24px */
var(--spacing-xl)  /* 32px */
```

#### Transitions
```css
var(--transition-fast)  /* 150ms */
var(--transition-base)  /* 250ms */
var(--transition-slow)  /* 350ms */
var(--ease-out)         /* cubic-bezier(0, 0, 0.2, 1) */
```

---

## Glass Components

Defined in `glass.css` - Apply these classes to create glassmorphism effects.

### Basic Glass Panels

```jsx
// Standard glass panel with blur and border
<div className="glass-panel">
  <div className="glass-content">Content here</div>
</div>

// More prominent elevated glass
<div className="glass-panel-elevated">
  <div className="glass-content">Important content</div>
</div>

// Card with gradient overlay effect
<div className="glass-card">
  <div className="glass-content-sm">Card content</div>
</div>
```

### Glass Effects & Enhancements

```jsx
// Inner glow for depth
<div className="glass-panel glass-inner-glow">
  Glowing panel
</div>

// Top edge highlight
<div className="glass-panel glass-highlight">
  Highlighted panel
</div>

// Animated gradient border
<div className="glass-gradient-border">
  <div className="glass-content">Fancy border</div>
</div>

// Shimmer animation (for loading states)
<div className="glass-panel glass-shimmer">
  Loading...
</div>
```

### Status Variants

```jsx
// Color-coded glass panels
<div className="glass-panel glass-success">Success state</div>
<div className="glass-panel glass-error">Error state</div>
<div className="glass-panel glass-warning">Warning state</div>
<div className="glass-panel glass-primary">Primary state</div>
```

### Utility Classes

```jsx
// Content wrappers with padding
<div className="glass-content">     /* 24px padding */
<div className="glass-content-sm">  /* 16px padding */
<div className="glass-content-lg">  /* 32px padding */

// Divider line
<div className="glass-divider" />

// Full-screen overlay
<div className="glass-overlay">
  <div className="glass-panel-elevated">Modal content</div>
</div>
```

---

## Button System

Defined in `buttons.css` - Comprehensive button variants with hover states and animations.

### Button Variants

```jsx
// Ghost button (transparent)
<button className="btn btn-ghost btn-md">
  Cancel
</button>

// Subtle glass button
<button className="btn btn-subtle btn-md">
  Secondary Action
</button>

// Primary gradient button
<button className="btn btn-primary btn-md">
  Primary Action
</button>

// Success button (green)
<button className="btn btn-success btn-md">
  Go Live
</button>

// Danger button (red)
<button className="btn btn-danger btn-md">
  Stop Recording
</button>
```

### Button Sizes

```jsx
<button className="btn btn-primary btn-sm">Small</button>
<button className="btn btn-primary btn-md">Medium</button>
<button className="btn btn-primary btn-lg">Large</button>
```

### Icon Buttons

```jsx
// Square icon-only button
<button className="btn btn-ghost btn-icon">
  <PlayIcon />
</button>

// With size variants
<button className="btn btn-subtle btn-icon-sm">
  <SmallIcon />
</button>

<button className="btn btn-primary btn-icon-lg">
  <LargeIcon />
</button>
```

### Special Button Types

```jsx
// Playback control button with glass
<button className="btn btn-playback">
  <PlayIcon />
  Play
</button>

// Active playback state
<button className="btn btn-playback playing">
  <PauseIcon />
  Pause
</button>

// Speed selector
<button className="btn btn-subtle btn-speed">1x</button>
<button className="btn btn-subtle btn-speed active">2x</button>
```

### Button Groups

```jsx
<div className="btn-group">
  <button className="btn btn-subtle">Option 1</button>
  <button className="btn btn-subtle active">Option 2</button>
  <button className="btn btn-subtle">Option 3</button>
</div>
```

### Button States

```jsx
// Disabled state
<button className="btn btn-primary" disabled>
  Disabled
</button>

// Loading state
<button className="btn btn-primary loading">
  Loading...
</button>

// Active/selected state
<button className="btn btn-subtle active">
  Selected
</button>
```

---

## Usage Examples

### Depth Chart Container
```jsx
<div className="glass-panel glass-inner-glow">
  <div className="glass-content">
    <svg ref={chartRef} />
  </div>
</div>
```

### Control Panel
```jsx
<div className="glass-panel-elevated">
  <div className="glass-content-sm">
    <div className="btn-group">
      <button className="btn btn-playback">
        <PlayIcon />
      </button>
      <button className="btn btn-subtle btn-icon">
        <FastForwardIcon />
      </button>
    </div>
  </div>
</div>
```

### Event Card
```jsx
<div className="glass-card glass-success">
  <div className="glass-content-sm">
    <h4>Large Order Detected</h4>
    <p>+5.2 BTC added at $45,320</p>
  </div>
</div>
```

### Modal
```jsx
<div className="glass-overlay">
  <div className="glass-panel-elevated glass-highlight">
    <div className="glass-content-lg">
      <h2>Modal Title</h2>
      <div className="glass-divider" />
      <p>Modal content...</p>
      <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
        <button className="btn btn-ghost btn-md">Cancel</button>
        <button className="btn btn-primary btn-md">Confirm</button>
      </div>
    </div>
  </div>
</div>
```

---

## Animated Background

The cinematic animated gradient background is automatically applied to `<body>` via `index.css`. It features:

- Three radial gradients (blue, purple, green) that slowly drift
- 20-second animation loop
- Subtle opacity (5-12%) to not distract from content
- Fixed positioning, doesn't interfere with scrolling

---

## Custom Scrollbar

Styled scrollbars are automatically applied across the application:

- Thin 8px width
- Dark track matching surface colors
- Hover effect with glass aesthetic
- Active state highlights in primary blue
- Firefox and Webkit support

---

## Best Practices

1. **Layer Glass Panels**: Use `glass-panel` for base containers, `glass-panel-elevated` for overlays
2. **Consistent Spacing**: Use CSS variables like `var(--spacing-md)` for gaps and padding
3. **Shadow for Depth**: Combine glass with shadows to create visual hierarchy
4. **Glow for Focus**: Use glow variants for active/important elements
5. **Smooth Transitions**: All interactive elements have built-in transitions
6. **Button Hierarchy**: Primary > Success/Danger > Subtle > Ghost
7. **Icon Sizing**: Icons automatically size to match button font-size (1em)

---

## Performance Notes

- Backdrop blur has hardware acceleration (`transform: translateZ(0)` applied internally)
- All animations use `transform` and `opacity` for 60fps performance
- Shadow system is optimized to avoid excessive blur radius
- Custom scrollbar styling is lightweight and doesn't impact scroll performance

---

## Browser Support

- **Glass effects**: All modern browsers, Safari 9+
- **Custom scrollbar**: Chrome, Safari, Edge, Firefox
- **Animations**: All modern browsers with CSS3 support
- **Backdrop filter**: Progressive enhancement (graceful fallback without blur)

---

## Next Phases

**Phase 2**: Component migrations (Timeline, Controls, EventPanel)
**Phase 3**: DepthChart polish with enhanced visualizations
**Phase 4**: Final polish with micro-interactions and spring animations

Refer to the architecture plan for full implementation details.
