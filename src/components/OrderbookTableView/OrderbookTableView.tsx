import { useMemo, useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { PriceLevel } from '../../types';
import { aggregateOrderbook, DEFAULT_PRICE_STEP } from '../../lib/orderbookAggregation';

interface OrderbookTableViewProps {
  bids: PriceLevel[];
  asks: PriceLevel[];
  midPrice: number;
  spread: number;
}

interface ProcessedLevel {
  price: number;
  quantity: number;
  total: number;
  depthPercentage: number;
}

// Number of rows to display on each side
const VISIBLE_ROWS = 20;

const formatPrice = (price: number): string => {
  // For aggregated prices (whole numbers), show without decimals
  // For non-aggregated prices, show with 2 decimals
  const isWholeNumber = price % 1 === 0;
  return price.toLocaleString('en-US', {
    minimumFractionDigits: isWholeNumber ? 0 : 2,
    maximumFractionDigits: isWholeNumber ? 0 : 2,
  });
};

const formatQuantity = (quantity: number): string => {
  if (quantity >= 1) {
    return quantity.toLocaleString('en-US', {
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    });
  }
  return quantity.toLocaleString('en-US', {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  });
};

// Calculate cumulative totals and depth percentages
const processLevels = (
  levels: PriceLevel[],
  maxTotal: number,
  reverse: boolean = false
): ProcessedLevel[] => {
  const processed: ProcessedLevel[] = [];
  let cumulative = 0;

  const orderedLevels = reverse ? [...levels].reverse() : levels;

  for (const [price, quantity] of orderedLevels) {
    cumulative += quantity;
    processed.push({
      price,
      quantity,
      total: cumulative,
      depthPercentage: maxTotal > 0 ? (cumulative / maxTotal) * 100 : 0,
    });
  }

  return reverse ? processed.reverse() : processed;
};

interface OrderRowProps {
  level: ProcessedLevel;
  side: 'bid' | 'ask';
  isNew?: boolean;
}

const OrderRow = ({ level, side }: OrderRowProps) => {
  const isBid = side === 'bid';

  return (
    <motion.div
      initial={{ opacity: 0, x: isBid ? -10 : 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className="relative grid grid-cols-3 text-xs font-mono py-1.5 px-3 hover:bg-white/5 transition-colors group"
    >
      {/* Depth bar background */}
      <div
        className="absolute inset-y-0 right-0 pointer-events-none transition-all duration-300"
        style={{
          width: `${Math.min(level.depthPercentage, 100)}%`,
          background: isBid
            ? 'linear-gradient(to left, rgba(16, 185, 129, 0.25) 0%, rgba(16, 185, 129, 0.02) 100%)'
            : 'linear-gradient(to left, rgba(239, 68, 68, 0.25) 0%, rgba(239, 68, 68, 0.02) 100%)',
        }}
      />

      {/* Depth bar edge glow on hover */}
      <div
        className="absolute inset-y-0 w-[2px] opacity-0 group-hover:opacity-100 transition-opacity"
        style={{
          right: `calc(${Math.min(level.depthPercentage, 100)}% - 1px)`,
          background: isBid ? 'var(--color-bid-bright)' : 'var(--color-ask-bright)',
          boxShadow: isBid
            ? '0 0 8px var(--color-bid-glow)'
            : '0 0 8px var(--color-ask-glow)',
        }}
      />

      {/* Price */}
      <div
        className={`
          relative z-10 text-left font-semibold
          ${isBid ? 'text-[var(--color-bid-bright)]' : 'text-[var(--color-ask-bright)]'}
        `}
      >
        {formatPrice(level.price)}
      </div>

      {/* Quantity */}
      <div className="relative z-10 text-right text-[var(--text-secondary)]">
        {formatQuantity(level.quantity)}
      </div>

      {/* Total (Cumulative) */}
      <div className="relative z-10 text-right text-[var(--text-tertiary)]">
        {formatQuantity(level.total)}
      </div>
    </motion.div>
  );
};

// Flash value component that uses CSS animation with key changes (no setTimeout)
const FlashValue = ({
  value,
  formatFn,
  baseClass,
  upClass,
  downClass,
}: {
  value: number;
  formatFn: (v: number) => string;
  baseClass: string;
  upClass: string;
  downClass: string;
}) => {
  const prevValueRef = useRef(value);
  const [flashKey, setFlashKey] = useState(0);
  const [direction, setDirection] = useState<'up' | 'down' | null>(null);

  useEffect(() => {
    if (prevValueRef.current !== value && prevValueRef.current > 0) {
      setDirection(value > prevValueRef.current ? 'up' : 'down');
      setFlashKey((k) => k + 1);
    }
    prevValueRef.current = value;
  }, [value]);

  return (
    <span
      key={flashKey}
      className={`${baseClass} ${direction === 'up' ? upClass : ''} ${direction === 'down' ? downClass : ''}`}
      style={{
        animation: flashKey > 0 ? 'flash-pulse 300ms ease-out' : 'none',
      }}
      onAnimationEnd={() => setDirection(null)}
    >
      {formatFn(value)}
    </span>
  );
};

const SpreadIndicator = ({ spread, midPrice }: { spread: number; midPrice: number }) => {
  const spreadPercentage = midPrice > 0 ? (spread / midPrice) * 100 : 0;

  return (
    <div className="relative py-3 px-3 bg-[var(--surface-1)]/50">
      {/* CSS animation keyframes */}
      <style>{`
        @keyframes flash-pulse {
          0% { transform: scale(1.08); }
          100% { transform: scale(1); }
        }
      `}</style>

      {/* Divider line with glow */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-gradient-to-r from-transparent via-[var(--color-mid)] to-transparent opacity-30" />

      {/* Spread info container */}
      <div className="relative flex items-center justify-center gap-6">
        {/* Mid price */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--text-tertiary)]">Mid</span>
          <FlashValue
            value={midPrice}
            formatFn={(v) => `$${formatPrice(v)}`}
            baseClass="text-sm font-mono font-bold text-[var(--color-mid-bright)] transition-colors duration-150"
            upClass="!text-[var(--color-bid-bright)]"
            downClass="!text-[var(--color-ask-bright)]"
          />
        </div>

        {/* Separator dot */}
        <div className="w-1 h-1 rounded-full bg-[var(--surface-4)]" />

        {/* Spread */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--text-tertiary)]">Spread</span>
          <FlashValue
            value={spread}
            formatFn={(v) => `$${formatPrice(v)}`}
            baseClass="text-sm font-mono font-semibold text-[var(--color-mid)] transition-colors duration-150"
            upClass="!text-[var(--color-ask-bright)]"
            downClass="!text-[var(--color-bid-bright)]"
          />
          <span className="text-xs font-mono text-[var(--text-tertiary)]">
            ({spreadPercentage.toFixed(3)}%)
          </span>
        </div>
      </div>
    </div>
  );
};

const TableHeader = ({ side }: { side: 'ask' | 'bid' }) => {
  const isBid = side === 'bid';

  return (
    <div className="grid grid-cols-3 text-xs py-2 px-3 border-b border-[var(--glass-border-color)]">
      <div
        className={`text-left font-medium ${
          isBid ? 'text-[var(--color-bid)]' : 'text-[var(--color-ask)]'
        }`}
      >
        Price (USD)
      </div>
      <div className="text-right font-medium text-[var(--text-tertiary)]">
        Qty (BTC)
      </div>
      <div className="text-right font-medium text-[var(--text-tertiary)]">
        Total (BTC)
      </div>
    </div>
  );
};

export const OrderbookTableView = ({
  bids,
  asks,
  midPrice,
  spread,
}: OrderbookTableViewProps) => {
  const asksContainerRef = useRef<HTMLDivElement>(null);

  // Process and limit the visible levels with $10 price aggregation
  const { processedAsks, processedBids, totalBidDepth, totalAskDepth } = useMemo(() => {
    // Aggregate into $10 price buckets using shared utility
    const { bids: aggregatedBids, asks: aggregatedAsks } = aggregateOrderbook(bids, asks, DEFAULT_PRICE_STEP);

    // Take visible rows
    const visibleAsks = aggregatedAsks.slice(0, VISIBLE_ROWS);
    const visibleBids = aggregatedBids.slice(0, VISIBLE_ROWS);

    // Calculate cumulative totals for scaling depth bars
    let asksCumulative = 0;
    let bidsCumulative = 0;

    for (const [, qty] of visibleAsks) asksCumulative += qty;
    for (const [, qty] of visibleBids) bidsCumulative += qty;

    const max = Math.max(asksCumulative, bidsCumulative);

    // Process cumulative totals:
    // Asks: cumulative from lowest to highest (so highest price has largest total)
    // Bids: cumulative from highest to lowest (so lowest price has largest total)
    const processedAsks = processLevels(visibleAsks, max, false);
    const processedBids = processLevels(visibleBids, max, false);

    return {
      processedAsks,
      processedBids,
      totalBidDepth: bidsCumulative,
      totalAskDepth: asksCumulative,
    };
  }, [bids, asks]);

  // Scroll asks container to bottom on initial load to show prices closest to spread
  useEffect(() => {
    if (asksContainerRef.current) {
      asksContainerRef.current.scrollTop = asksContainerRef.current.scrollHeight;
    }
  }, []);

  const hasData = bids.length > 0 || asks.length > 0;

  if (!hasData) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-[var(--text-tertiary)]">Waiting for orderbook data...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full h-full flex flex-col overflow-hidden"
    >
      {/* Asks section (sell orders) - displayed at top */}
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--glass-border-color)] bg-[var(--surface-1)]/50">
          <div className="w-2 h-2 rounded-full bg-[var(--color-ask)]" />
          <span className="text-xs font-semibold text-[var(--color-ask-bright)] uppercase tracking-wider">
            Asks
          </span>
          <span className="text-xs text-[var(--text-tertiary)]">
            ({processedAsks.length} levels)
          </span>
        </div>
        <TableHeader side="ask" />
        <div
          ref={asksContainerRef}
          className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden"
        >
          {/* Display asks reversed: highest price at top, lowest (closest to spread) at bottom */}
          {[...processedAsks].reverse().map((level) => (
            <OrderRow key={`ask-${level.price}`} level={level} side="ask" />
          ))}
        </div>
      </div>

      {/* Spread indicator - center divider */}
      <SpreadIndicator spread={spread} midPrice={midPrice} />

      {/* Bids section (buy orders) - displayed at bottom */}
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--glass-border-color)] bg-[var(--surface-1)]/50">
          <div className="w-2 h-2 rounded-full bg-[var(--color-bid)]" />
          <span className="text-xs font-semibold text-[var(--color-bid-bright)] uppercase tracking-wider">
            Bids
          </span>
          <span className="text-xs text-[var(--text-tertiary)]">
            ({processedBids.length} levels)
          </span>
        </div>
        <TableHeader side="bid" />
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
          {processedBids.map((level) => (
            <OrderRow key={`bid-${level.price}`} level={level} side="bid" />
          ))}
        </div>
      </div>

      {/* Bottom stats bar */}
      <div className="flex-none px-3 py-2 border-t border-[var(--glass-border-color)] bg-[var(--surface-1)]/30">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-1.5 rounded-full bg-gradient-to-r from-[var(--color-bid)] to-[var(--color-bid-bright)]" />
              <span className="text-[var(--text-tertiary)]">Bid Depth:</span>
              <span className="font-mono text-[var(--color-bid-bright)]">
                {formatQuantity(totalBidDepth)} BTC
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-1.5 rounded-full bg-gradient-to-r from-[var(--color-ask)] to-[var(--color-ask-bright)]" />
              <span className="text-[var(--text-tertiary)]">Ask Depth:</span>
              <span className="font-mono text-[var(--color-ask-bright)]">
                {formatQuantity(totalAskDepth)} BTC
              </span>
            </div>
          </div>
          <div className="text-[var(--text-tertiary)]">
            ${DEFAULT_PRICE_STEP} steps · {VISIBLE_ROWS} levels
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default OrderbookTableView;
