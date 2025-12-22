import { useEffect, useRef, useState, useCallback } from 'react'
import * as d3 from 'd3'
import { Plus, Minus, X } from 'lucide-react'
import type { PriceLevel } from '../../types'
import { useEventsStore } from '../../stores/eventsStore'
import { EVENT_METADATA } from '../../lib/eventDetectionConfig'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface DepthChartProps {
  bids: PriceLevel[];
  asks: PriceLevel[];
  midPrice: number;
  spread: number;
  showHeatmap?: boolean;
}

interface DepthPoint {
  price: number;
  cumulative: number;
}

const DepthChart = ({ bids, asks, midPrice, spread, showHeatmap = false }: DepthChartProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const gRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);
  const isInitialized = useRef(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [tooltip, setTooltip] = useState<{ x: number; y: number; price: number; volume: number } | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [pinnedPrice, setPinnedPrice] = useState<number | null>(null);
  const lastUpdateTime = useRef(0);
  const animationFrame = useRef<number | null>(null);
  const pulseAnimationRef = useRef<d3.Selection<SVGCircleElement, unknown, null, undefined> | null>(null);

  // Event selection state
  const selectedEventId = useEventsStore((state) => state.selectedEventId);
  const getEventById = useEventsStore((state) => state.getEventById);
  const selectedEvent = selectedEventId ? getEventById(selectedEventId) : null;

  const initializeChart = useCallback((width: number, height: number) => {
    if (!svgRef.current || !containerRef.current) return;

    const svg = d3.select(svgRef.current);

    // Interrupt all ongoing transitions before removing elements
    svg.selectAll('*').interrupt();
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 60, bottom: 40, left: 60 };

    svg.attr('width', width).attr('height', height);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    gRef.current = g;

    const defs = g.append('defs');

    const bidGradient = defs
      .append('linearGradient')
      .attr('id', 'bidGradient')
      .attr('x1', '0%')
      .attr('x2', '0%')
      .attr('y1', '0%')
      .attr('y2', '100%');

    bidGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', 'rgba(34, 197, 94, 0.4)');
    bidGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', 'rgba(34, 197, 94, 0.05)');

    const askGradient = defs
      .append('linearGradient')
      .attr('id', 'askGradient')
      .attr('x1', '0%')
      .attr('x2', '0%')
      .attr('y1', '0%')
      .attr('y2', '100%');

    askGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', 'rgba(239, 68, 68, 0.4)');
    askGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', 'rgba(239, 68, 68, 0.05)');

    g.append('g').attr('class', 'heatmap-bids');
    g.append('g').attr('class', 'heatmap-asks');
    g.append('path').attr('class', 'bid-area');
    g.append('path').attr('class', 'ask-area');
    g.append('rect').attr('class', 'spread-indicator');
    g.append('line').attr('class', 'mid-price-line');
    g.append('text').attr('class', 'mid-price-text');
    g.append('line').attr('class', 'pinned-price-line');
    g.append('text').attr('class', 'pinned-price-text');
    g.append('g').attr('class', 'event-highlights');
    g.append('line').attr('class', 'crosshair-x');
    g.append('line').attr('class', 'crosshair-y');
    g.append('g').attr('class', 'x-axis');
    g.append('g').attr('class', 'y-axis');
    g.append('text').attr('class', 'x-label');
    g.append('text').attr('class', 'y-label');

    g.append('rect')
      .attr('class', 'overlay')
      .attr('fill', 'transparent')
      .style('pointer-events', 'all');

    isInitialized.current = true;
  }, []);

  const updateChart = useCallback(() => {
    if (!gRef.current || !isInitialized.current) return;
    if (bids.length === 0 || asks.length === 0) return;

    const now = Date.now();
    // Throttle to 250ms - no transitions so we can be less frequent
    if (now - lastUpdateTime.current < 250) {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
      animationFrame.current = requestAnimationFrame(updateChart);
      return;
    }
    lastUpdateTime.current = now;

    const g = gRef.current;

    // Get CSS variables from document root for consistent theming
    const rootStyles = getComputedStyle(document.documentElement);
    const colorBid = rootStyles.getPropertyValue('--color-bid').trim() || '#10b981';
    const colorAsk = rootStyles.getPropertyValue('--color-ask').trim() || '#ef4444';
    const colorMid = rootStyles.getPropertyValue('--color-mid-bright').trim() || '#fbbf24';
    const colorSecondary = rootStyles.getPropertyValue('--color-secondary').trim() || '#8b5cf6';
    const textSecondary = rootStyles.getPropertyValue('--text-secondary').trim() || '#a3a3a3';
    const textTertiary = rootStyles.getPropertyValue('--text-tertiary').trim() || '#737373';
    const surfaceBorder = rootStyles.getPropertyValue('--surface-4').trim() || '#404040';

    g.selectAll('*').interrupt();

    const margin = { top: 20, right: 60, bottom: 40, left: 60 };
    const innerWidth = dimensions.width - margin.left - margin.right;
    const innerHeight = dimensions.height - margin.top - margin.bottom;

    const bidDepth = calculateDepth(bids);
    const askDepth = calculateDepth(asks);

    const allPrices = [...bidDepth.map((d) => d.price), ...askDepth.map((d) => d.price)];
    const allVolumes = [...bidDepth.map((d) => d.cumulative), ...askDepth.map((d) => d.cumulative)];

    const minPrice = d3.min(allPrices) || 0;
    const maxPrice = d3.max(allPrices) || 0;
    const priceRange = maxPrice - minPrice;
    const center = (minPrice + maxPrice) / 2;
    const zoomedRange = priceRange / zoomLevel;

    const xScale = d3
      .scaleLinear()
      .domain([center - zoomedRange / 2, center + zoomedRange / 2])
      .range([0, innerWidth]);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(allVolumes) || 0])
      .range([innerHeight, 0]);

    const area = d3
      .area<DepthPoint>()
      .x((d) => xScale(d.price))
      .y0(innerHeight)
      .y1((d) => yScale(d.cumulative))
      .curve(d3.curveStepAfter);

    g.select<SVGPathElement>('.bid-area')
      .datum(bidDepth)
      .transition()
      .duration(150)
      .attr('d', area)
      .attr('fill', 'url(#bidGradient)')
      .attr('stroke', colorBid)
      .attr('stroke-width', 2);

    g.select<SVGPathElement>('.ask-area')
      .datum(askDepth)
      .transition()
      .duration(150)
      .attr('d', area)
      .attr('fill', 'url(#askGradient)')
      .attr('stroke', colorAsk)
      .attr('stroke-width', 2);

    if (bids.length > 0 && asks.length > 0) {
      const bestBid = bids[0][0];
      const bestAsk = asks[0][0];

      // Calculate spread indicator positions and ensure non-negative width
      const bidX = xScale(bestBid);
      const askX = xScale(bestAsk);
      const spreadX = Math.min(bidX, askX);
      const spreadWidth = Math.max(0, Math.abs(askX - bidX));

      g.select<SVGRectElement>('.spread-indicator')
        .transition()
        .duration(150)
        .attr('x', spreadX)
        .attr('y', 0)
        .attr('width', spreadWidth)
        .attr('height', innerHeight)
        .attr('fill', '#fbbf24')
        .attr('opacity', 0.08);
    }

    if (showHeatmap) {
      const maxBidVolume = d3.max(bids, (d) => d[1]) || 1;
      const maxAskVolume = d3.max(asks, (d) => d[1]) || 1;

      const bidColorScale = d3.scaleLinear<string>()
        .domain([0, maxBidVolume])
        .range(['rgba(34, 197, 94, 0)', 'rgba(34, 197, 94, 0.6)']);

      const askColorScale = d3.scaleLinear<string>()
        .domain([0, maxAskVolume])
        .range(['rgba(239, 68, 68, 0)', 'rgba(239, 68, 68, 0.6)']);

      const barWidth = Math.max(1, Math.abs(innerWidth / (bids.length + asks.length)));

      const bidHeatmap = g.select('.heatmap-bids')
        .selectAll<SVGRectElement, PriceLevel>('rect')
        .data(bids.slice(0, 25), (d) => `bid-${d[0]}`);

      bidHeatmap.exit().remove();

      bidHeatmap.enter()
        .append('rect')
        .merge(bidHeatmap)
        .transition()
        .duration(150)
        .attr('x', (d) => xScale(d[0]))
        .attr('y', 0)
        .attr('width', barWidth)
        .attr('height', Math.max(0, innerHeight))
        .attr('fill', (d) => bidColorScale(d[1]))
        .attr('opacity', 0.8);

      const askHeatmap = g.select('.heatmap-asks')
        .selectAll<SVGRectElement, PriceLevel>('rect')
        .data(asks.slice(0, 25), (d) => `ask-${d[0]}`);

      askHeatmap.exit().remove();

      askHeatmap.enter()
        .append('rect')
        .merge(askHeatmap)
        .transition()
        .duration(150)
        .attr('x', (d) => xScale(d[0]))
        .attr('y', 0)
        .attr('width', barWidth)
        .attr('height', Math.max(0, innerHeight))
        .attr('fill', (d) => askColorScale(d[1]))
        .attr('opacity', 0.8);
    } else {
      g.select('.heatmap-bids').selectAll('rect').remove();
      g.select('.heatmap-asks').selectAll('rect').remove();
    }

    if (midPrice > 0) {
      g.select<SVGLineElement>('.mid-price-line')
        .transition()
        .duration(150)
        .attr('x1', xScale(midPrice))
        .attr('x2', xScale(midPrice))
        .attr('y1', 0)
        .attr('y2', innerHeight)
        .attr('stroke', colorMid)
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '4,4')
        .attr('opacity', 0.7);

      g.select<SVGTextElement>('.mid-price-text')
        .transition()
        .duration(150)
        .attr('x', xScale(midPrice))
        .attr('y', -5)
        .attr('text-anchor', 'middle')
        .attr('fill', colorMid)
        .attr('font-size', '12px')
        .attr('font-weight', 'bold')
        .text(`$${midPrice.toFixed(2)}`);
    }

    if (pinnedPrice !== null) {
      g.select<SVGLineElement>('.pinned-price-line')
        .transition()
        .duration(150)
        .attr('x1', xScale(pinnedPrice))
        .attr('x2', xScale(pinnedPrice))
        .attr('y1', 0)
        .attr('y2', innerHeight)
        .attr('stroke', colorSecondary)
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '2,2')
        .attr('opacity', 0.8);

      g.select<SVGTextElement>('.pinned-price-text')
        .transition()
        .duration(150)
        .attr('x', xScale(pinnedPrice))
        .attr('y', innerHeight + 15)
        .attr('text-anchor', 'middle')
        .attr('fill', colorSecondary)
        .attr('font-size', '11px')
        .attr('font-weight', 'bold')
        .text(`$${pinnedPrice.toFixed(2)}`);
    } else {
      g.select('.pinned-price-line').attr('opacity', 0);
      g.select('.pinned-price-text').attr('opacity', 0);
    }

    const xAxis = d3.axisBottom(xScale).ticks(8).tickFormat(d3.format(',.0f'));
    const yAxis = d3.axisLeft(yScale).ticks(6).tickFormat(d3.format('.2f'));

    g.select<SVGGElement>('.x-axis')
      .attr('transform', `translate(0,${innerHeight})`)
      .transition()
      .duration(150)
      .call(xAxis);

    g.select('.x-axis')
      .selectAll('text')
      .attr('fill', textSecondary)
      .attr('font-size', '11px');

    g.select('.x-axis')
      .selectAll('line, path')
      .attr('stroke', surfaceBorder);

    g.select<SVGGElement>('.y-axis')
      .transition()
      .duration(150)
      .call(yAxis);

    g.select('.y-axis')
      .selectAll('text')
      .attr('fill', textSecondary)
      .attr('font-size', '11px');

    g.select('.y-axis')
      .selectAll('line, path')
      .attr('stroke', surfaceBorder);

    g.select('.x-label')
      .attr('x', innerWidth / 2)
      .attr('y', innerHeight + 35)
      .attr('text-anchor', 'middle')
      .attr('fill', textTertiary)
      .attr('font-size', '12px')
      .text('Price (USD)');

    g.select('.y-label')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerHeight / 2)
      .attr('y', -45)
      .attr('text-anchor', 'middle')
      .attr('fill', textTertiary)
      .attr('font-size', '12px')
      .text('Cumulative Volume (BTC)');

    // Render event highlights
    const highlightsGroup = g.select('.event-highlights');

    // Stop any existing pulse animation before clearing
    if (pulseAnimationRef.current) {
      pulseAnimationRef.current.interrupt();
      pulseAnimationRef.current = null;
    }
    highlightsGroup.selectAll('*').interrupt();
    highlightsGroup.selectAll('*').remove(); // Clear previous highlights

    if (selectedEvent) {
      const metadata = EVENT_METADATA[selectedEvent.type];
      const color = metadata.color[selectedEvent.severity];

      // Highlight affected price level(s)
      if (selectedEvent.details.price) {
        const price = selectedEvent.details.price as number;

        // Vertical highlight line
        highlightsGroup
          .append('line')
          .attr('x1', xScale(price))
          .attr('x2', xScale(price))
          .attr('y1', 0)
          .attr('y2', innerHeight)
          .attr('stroke', color)
          .attr('stroke-width', 3)
          .attr('opacity', 0.8);

        // Animated pulse circle
        highlightsGroup
          .append('circle')
          .attr('cx', xScale(price))
          .attr('cy', innerHeight / 2)
          .attr('r', 15)
          .attr('fill', 'none')
          .attr('stroke', color)
          .attr('stroke-width', 2)
          .attr('class', 'svg-pulse-ring');

        // Label
        highlightsGroup
          .append('text')
          .attr('x', xScale(price))
          .attr('y', -10)
          .attr('text-anchor', 'middle')
          .attr('fill', color)
          .attr('font-size', '11px')
          .attr('font-weight', 'bold')
          .text(metadata.label);
      }

      // Highlight price range for gap events
      if (selectedEvent.type === 'liquidity_gap') {
        const startPrice = selectedEvent.details.startPrice as number;
        const endPrice = selectedEvent.details.endPrice as number;
        const x1 = xScale(startPrice);
        const x2 = xScale(endPrice);

        highlightsGroup
          .append('rect')
          .attr('x', Math.min(x1, x2))
          .attr('y', 0)
          .attr('width', Math.abs(x2 - x1))
          .attr('height', innerHeight)
          .attr('fill', color)
          .attr('opacity', 0.15);
      }

      // Highlight mid-price for breakthrough events
      if (selectedEvent.type === 'price_level_breakthrough') {
        const breakthroughPrice = selectedEvent.details.price as number;

        highlightsGroup
          .append('line')
          .attr('x1', 0)
          .attr('x2', innerWidth)
          .attr('y1', innerHeight / 2)
          .attr('y2', innerHeight / 2)
          .attr('stroke', color)
          .attr('stroke-width', 2)
          .attr('stroke-dasharray', '5,5')
          .attr('opacity', 0.5);

        highlightsGroup
          .append('line')
          .attr('x1', xScale(breakthroughPrice))
          .attr('x2', xScale(breakthroughPrice))
          .attr('y1', 0)
          .attr('y2', innerHeight)
          .attr('stroke', color)
          .attr('stroke-width', 2)
          .attr('opacity', 0.7);
      }
    }

    // Remove old event handlers to prevent memory leaks
    const overlay = g.select('.overlay');
    overlay.on('mousemove', null);
    overlay.on('mouseleave', null);
    overlay.on('wheel', null);
    overlay.on('click', null);

    // Set up new event handlers
    overlay
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .on('mousemove', function(event) {
        const [mouseX, mouseY] = d3.pointer(event);
        const price = xScale.invert(mouseX);

        const allLevels = [...bids, ...asks];
        if (allLevels.length === 0) return;

        const closestLevel = allLevels.reduce((prev, curr) => {
          return Math.abs(curr[0] - price) < Math.abs(prev[0] - price) ? curr : prev;
        }, allLevels[0]);

        if (closestLevel) {
          g.select('.crosshair-x')
            .attr('x1', mouseX)
            .attr('x2', mouseX)
            .attr('y1', 0)
            .attr('y2', innerHeight)
            .attr('stroke', surfaceBorder)
            .attr('stroke-width', 1)
            .attr('stroke-dasharray', '3,3')
            .attr('opacity', 0.7);

          g.select('.crosshair-y')
            .attr('x1', 0)
            .attr('x2', innerWidth)
            .attr('y1', mouseY)
            .attr('y2', mouseY)
            .attr('stroke', surfaceBorder)
            .attr('stroke-width', 1)
            .attr('stroke-dasharray', '3,3')
            .attr('opacity', 0.7);

          setTooltip({
            x: mouseX,
            y: mouseY,
            price: closestLevel[0],
            volume: closestLevel[1],
          });
        }
      })
      .on('mouseleave', function() {
        g.select('.crosshair-x').attr('opacity', 0);
        g.select('.crosshair-y').attr('opacity', 0);
        setTooltip(null);
      })
      .on('wheel', function(event) {
        event.preventDefault();
        const delta = event.deltaY;
        setZoomLevel((prev) => {
          const newZoom = delta > 0 ? prev / 1.1 : prev * 1.1;
          return Math.max(0.5, Math.min(10, newZoom));
        });
      })
      .on('click', function(event) {
        const [mouseX] = d3.pointer(event);
        const price = xScale.invert(mouseX);
        setPinnedPrice(price);
      });

  }, [bids, asks, midPrice, spread, dimensions, showHeatmap, zoomLevel, pinnedPrice, selectedEvent]);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    setDimensions({ width, height });
    initializeChart(width, height);

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: newWidth, height: newHeight } = entry.contentRect;

        if (newWidth > 0 && newHeight > 0) {
          setDimensions({ width: newWidth, height: newHeight });
          isInitialized.current = false;
          initializeChart(newWidth, newHeight);
        }
      }
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [initializeChart]);

  useEffect(() => {
    if (isInitialized.current) {
      updateChart();
    }
  }, [updateChart]);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
        animationFrame.current = null;
      }

      // Stop pulse animation
      if (pulseAnimationRef.current) {
        pulseAnimationRef.current.interrupt();
        pulseAnimationRef.current = null;
      }

      // Remove all event listeners and interrupt transitions
      if (gRef.current) {
        gRef.current.selectAll('*').interrupt();
        gRef.current.select('.overlay').on('mousemove', null);
        gRef.current.select('.overlay').on('mouseleave', null);
        gRef.current.select('.overlay').on('wheel', null);
        gRef.current.select('.overlay').on('click', null);
      }

      // Clear SVG to release memory
      if (svgRef.current) {
        const svg = d3.select(svgRef.current);
        svg.selectAll('*').interrupt();
        svg.selectAll('*').remove();
      }

      // Reset refs
      gRef.current = null;
      isInitialized.current = false;
    }
  }, []);

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(10, prev * 1.2));
  }

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(0.5, prev / 1.2));
  }

  const handleResetZoom = () => {
    setZoomLevel(1);
  }

  return (
    <div ref={containerRef} className="w-full h-full relative">
      <svg ref={svgRef} className="w-full h-full" />

      {/* Zoom Controls */}
      <div className="absolute top-2 right-2 flex flex-col gap-2 z-10">
        <Card variant="glass" className="p-2 flex flex-row gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" onClick={handleZoomIn}>
                <Plus className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">Zoom In</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" onClick={handleResetZoom} className="text-xs">
                1:1
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">Reset Zoom</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" onClick={handleZoomOut}>
                <Minus className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">Zoom Out</TooltipContent>
          </Tooltip>
        </Card>

        {pinnedPrice !== null && (

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPinnedPrice(null)}
                  className="text-xs w-full bg-purple-500/20 border-purple-500/40 text-purple-300 hover:bg-purple-500/30"
                >
                  <X className="size-3 mr-1" />
                  Clear Pin
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">Clear Pinned Price</TooltipContent>
            </Tooltip>
          
        )}
      </div>

      {/* Chart Tooltip */}
      {tooltip && (
        <Card
          variant="glass"
          className="absolute pointer-events-none p-3 border-l-[3px]"
          style={{
            left: tooltip.x + 80,
            top: tooltip.y + 20,
          }}
        >
          <div className="font-mono text-sm">
            <div className="text-[var(--text-tertiary)] text-xs">Price:</div>
            <div className="text-[var(--color-mid-bright)] font-bold">${tooltip.price.toFixed(2)}</div>
            <div className="text-[var(--text-tertiary)] text-xs mt-1">Volume:</div>
            <div className="text-[var(--color-secondary-bright)] font-bold">{tooltip.volume.toFixed(4)} BTC</div>
          </div>
        </Card>
      )}
    </div>
  )
}

function calculateDepth(levels: PriceLevel[]): DepthPoint[] {
  let cumulative = 0;
  const depth: DepthPoint[] = [];

  for (const [price, volume] of levels) {
    cumulative += volume;
    depth.push({ price, cumulative });
  }

  return depth;
}

export default DepthChart;
