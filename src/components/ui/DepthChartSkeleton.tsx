/**
 * Depth Chart Skeleton Component
 *
 * Loading state for the depth chart visualization.
 * Shows a glass panel with subtle gradient overlay suggesting chart structure.
 */

import { SkeletonChart } from './Skeleton';

export function DepthChartSkeleton() {
  return (
    <div className="w-full h-full relative glass-panel">
      <SkeletonChart />

      {/* Overlay showing chart structure hint */}
      <div
        className="absolute inset-0 flex items-end justify-center p-8 pointer-events-none"
        style={{ zIndex: 1 }}
      >
        <div className="flex items-end gap-1 w-full max-w-4xl" style={{ height: '60%' }}>
          {/* Simulate depth chart bars with varying heights */}
          {Array.from({ length: 20 }).map((_, i) => {
            const height = Math.random() * 60 + 20; // 20-80% height
            const isBid = i < 10;
            const opacity = 0.1 + (i % 10) * 0.03; // Gradual opacity

            return (
              <div
                key={i}
                className="flex-1 rounded-t-sm"
                style={{
                  height: `${height}%`,
                  background: isBid
                    ? `rgba(34, 197, 94, ${opacity})`
                    : `rgba(239, 68, 68, ${opacity})`,
                  animation: `skeleton-pulse ${2 + i * 0.1}s ease-in-out infinite`,
                  animationDelay: `${i * 0.05}s`,
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Loading text */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{ zIndex: 2 }}
      >
        <div
          className="glass-panel-elevated px-6 py-3"
          style={{
            background: 'var(--glass-bg-elevated)',
            border: '1px solid var(--glass-border-color-bright)',
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-5 h-5 border-2 border-t-transparent rounded-full"
              style={{
                borderColor: 'var(--color-primary)',
                borderTopColor: 'transparent',
                animation: 'spin 0.8s linear infinite',
              }}
            />
            <span
              className="text-sm font-medium"
              style={{
                color: 'var(--text-secondary)',
                fontSize: 'var(--font-size-sm)',
              }}
            >
              Loading orderbook data...
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
