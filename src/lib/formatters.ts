/**
 * Date/Time Formatting Utilities
 *
 * Shared formatting functions using date-fns for consistent
 * time display across the application.
 */

import { format, formatDistanceToNowStrict, intervalToDuration } from 'date-fns';

/**
 * Format a timestamp to HH:mm:ss (24-hour format)
 */
export function formatTime(timestamp: number): string {
  return format(new Date(timestamp), 'HH:mm:ss');
}

/**
 * Format a timestamp with fractional seconds (HH:mm:ss.S)
 */
export function formatTimeWithMs(timestamp: number): string {
  const date = new Date(timestamp);
  const base = format(date, 'HH:mm:ss');
  const ms = Math.floor(date.getMilliseconds() / 100);
  return `${base}.${ms}`;
}

/**
 * Format relative time (e.g., "2h 30m ago", "45s ago")
 * Uses strict formatting for precise time intervals.
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  // For very recent times (< 60 seconds), show seconds
  if (diff < 60000) {
    const seconds = Math.floor(diff / 1000);
    return `${seconds}s ago`;
  }

  // For times under an hour, show minutes and seconds
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes}m ${seconds}s ago`;
  }

  // For longer times, use date-fns strict formatting
  return formatDistanceToNowStrict(new Date(timestamp), { addSuffix: true });
}

/**
 * Format a duration in milliseconds to human-readable format
 * (e.g., "2m 30s", "45s", "1h 15m")
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return '0s';
  }

  const duration = intervalToDuration({ start: 0, end: ms });

  const parts: string[] = [];

  if (duration.hours && duration.hours > 0) {
    parts.push(`${duration.hours}h`);
  }
  if (duration.minutes && duration.minutes > 0) {
    parts.push(`${duration.minutes}m`);
  }
  if (duration.seconds !== undefined && duration.seconds > 0) {
    parts.push(`${duration.seconds}s`);
  }

  // If we have hours but no minutes/seconds shown, still show them for precision
  if (parts.length === 1 && duration.hours && duration.hours > 0) {
    parts.push(`${duration.minutes || 0}m`);
  }

  return parts.length > 0 ? parts.join(' ') : '0s';
}

/**
 * Format a short duration (under 1 minute) with more precision
 * Used for new data indicators, etc.
 */
export function formatShortDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);

  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (remainingSeconds === 0) {
    return `${minutes}m`;
  }

  return `${minutes}m ${remainingSeconds}s`;
}
