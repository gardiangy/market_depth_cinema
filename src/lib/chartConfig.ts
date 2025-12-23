/**
 * Chart Configuration
 *
 * Shared constants for D3 chart visualizations.
 */

// Chart margins (pixels) - consistent across all charts
export const CHART_MARGINS = {
  top: 20,
  right: 60,
  bottom: 40,
  left: 60,
} as const;

// Gradient colors for depth chart areas
export const DEPTH_GRADIENTS = {
  bid: {
    start: 'rgba(34, 197, 94, 0.4)',
    end: 'rgba(34, 197, 94, 0.05)',
  },
  ask: {
    start: 'rgba(239, 68, 68, 0.4)',
    end: 'rgba(239, 68, 68, 0.05)',
  },
} as const;

// Heatmap color scales
export const HEATMAP_COLORS = {
  bid: {
    min: 'rgba(34, 197, 94, 0)',
    max: 'rgba(34, 197, 94, 0.6)',
  },
  ask: {
    min: 'rgba(239, 68, 68, 0)',
    max: 'rgba(239, 68, 68, 0.6)',
  },
} as const;

// Zoom configuration
export const ZOOM_CONFIG = {
  min: 0.5,
  max: 10,
  step: 1.2,
  wheelStep: 1.1,
} as const;

// Throttle interval for chart updates (ms)
export const CHART_UPDATE_THROTTLE = 500;
