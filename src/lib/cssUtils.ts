/**
 * CSS Utilities
 *
 * Helpers for working with CSS custom properties (variables).
 */

/**
 * Get a CSS variable value from the document root.
 * Falls back to the provided default if the variable is not defined.
 */
export function getCssVar(name: string, fallback: string = ''): string {
  const rootStyles = getComputedStyle(document.documentElement);
  return rootStyles.getPropertyValue(name).trim() || fallback;
}

/**
 * Common chart theme colors from CSS variables.
 * Memoized per-call - useful when you need multiple values at once.
 */
export function getChartTheme() {
  return {
    colorBid: getCssVar('--color-bid', '#10b981'),
    colorAsk: getCssVar('--color-ask', '#ef4444'),
    colorMid: getCssVar('--color-mid-bright', '#fbbf24'),
    colorSecondary: getCssVar('--color-secondary', '#8b5cf6'),
    textSecondary: getCssVar('--text-secondary', '#a3a3a3'),
    textTertiary: getCssVar('--text-tertiary', '#737373'),
    surfaceBorder: getCssVar('--surface-4', '#404040'),
  };
}
