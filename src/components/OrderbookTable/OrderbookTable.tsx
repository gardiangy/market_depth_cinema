import { useState } from 'react';
import { useOrderbookStore } from '../../stores/orderbookStore';
import DepthChart from '../DepthChart/DepthChart';

const OrderbookTable = () => {
  const { bids, asks, spread, midPrice, isConnected, lastUpdate } =
    useOrderbookStore();
  const [showHeatmap, setShowHeatmap] = useState(false);

  const formatPrice = (price: number) => price.toFixed(2);
  const formatVolume = (volume: number) => volume.toFixed(4);

  const displayBids = bids.slice(0, 15);
  const displayAsks = asks.slice(0, 15);

  return (
    <div className="w-full h-full bg-neutral-900 text-neutral-100 p-6 flex flex-col">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Market Depth Cinema</h1>
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            <span className="text-sm text-neutral-400">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 p-4 bg-neutral-800 rounded-lg">
          <div>
            <div className="text-xs text-neutral-500 mb-1">Mid Price</div>
            <div className="text-lg font-mono font-bold text-yellow-400">
              ${formatPrice(midPrice)}
            </div>
          </div>
          <div>
            <div className="text-xs text-neutral-500 mb-1">Spread</div>
            <div className="text-lg font-mono font-bold text-orange-400">
              ${formatPrice(spread)}
            </div>
          </div>
          <div>
            <div className="text-xs text-neutral-500 mb-1">Last Update</div>
            <div className="text-sm font-mono text-neutral-300">
              {lastUpdate ? new Date(lastUpdate).toLocaleTimeString() : '--'}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col flex-1 mb-6 bg-neutral-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">Depth Chart</h2>
          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              showHeatmap
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
            }`}
          >
            {showHeatmap ? 'Hide Heatmap' : 'Show Heatmap'}
          </button>
        </div>
        <div className="w-full flex-1 min-h-[400px]">
          <DepthChart
            bids={bids}
            asks={asks}
            midPrice={midPrice}
            spread={spread}
            showHeatmap={showHeatmap}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-bold mb-3 text-green-400">
            Bids (Buy Orders)
          </h2>
          <div className="bg-neutral-800 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-neutral-700 text-xs text-neutral-400">
                <tr>
                  <th className="px-4 py-2 text-left">Price (USD)</th>
                  <th className="px-4 py-2 text-right">Size (BTC)</th>
                </tr>
              </thead>
              <tbody className="font-mono text-sm">
                {displayBids.length > 0 ? (
                  displayBids.map(([price, volume], idx) => (
                    <tr
                      key={`bid-${price}-${idx}`}
                      className="border-b border-neutral-700 hover:bg-neutral-750"
                    >
                      <td className="px-4 py-2 text-green-400">
                        {formatPrice(price)}
                      </td>
                      <td className="px-4 py-2 text-right text-neutral-300">
                        {formatVolume(volume)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={2}
                      className="px-4 py-8 text-center text-neutral-500"
                    >
                      Waiting for data...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-bold mb-3 text-red-400">
            Asks (Sell Orders)
          </h2>
          <div className="bg-neutral-800 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-neutral-700 text-xs text-neutral-400">
                <tr>
                  <th className="px-4 py-2 text-left">Price (USD)</th>
                  <th className="px-4 py-2 text-right">Size (BTC)</th>
                </tr>
              </thead>
              <tbody className="font-mono text-sm">
                {displayAsks.length > 0 ? (
                  displayAsks.map(([price, volume], idx) => (
                    <tr
                      key={`ask-${price}-${idx}`}
                      className="border-b border-neutral-700 hover:bg-neutral-750"
                    >
                      <td className="px-4 py-2 text-red-400">
                        {formatPrice(price)}
                      </td>
                      <td className="px-4 py-2 text-right text-neutral-300">
                        {formatVolume(volume)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={2}
                      className="px-4 py-8 text-center text-neutral-500"
                    >
                      Waiting for data...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderbookTable;
