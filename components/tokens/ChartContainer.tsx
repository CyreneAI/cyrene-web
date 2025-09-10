'use client'

import React, { useState } from 'react'
import { BarChart3 } from 'lucide-react'

interface ChartContainerProps {
  tokenAddress?: string
  price: number
  timeFrames?: string[]
  defaultTimeFrame?: string
  height?: number
}

const ChartContainer: React.FC<ChartContainerProps> = ({ 
  tokenAddress,
  price, 
  timeFrames = ['1H', '1D', '1W', '1M'], 
  defaultTimeFrame = '1D',
  height = 320 
}) => {
  const [activeTimeFrame, setActiveTimeFrame] = useState(defaultTimeFrame)

  // Create BirdEye chart URL if token address is available
  const getBirdEyeChartUrl = () => {
    if (!tokenAddress) return null
    
    const timeframeMap: { [key: string]: string } = {
      '1H': '1',
      '1D': '15', 
      '1W': '60',
      '1M': '240'
    }
    
    const interval = timeframeMap[activeTimeFrame] || '15'
    
    return `https://birdeye.so/tv-widget/${tokenAddress}?chain=solana&viewMode=pair&chartInterval=${interval}&chartType=Candle&chartTimezone=America%2FNew_York&chartLeftToolbar=show&theme=dark`
  }

  const chartUrl = getBirdEyeChartUrl()

  return (
    <div className="bg-[#040A25] rounded-[20px] p-4 mb-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex space-x-4">
          {timeFrames.map((timeFrame) => (
            <button 
              key={timeFrame}
              onClick={() => setActiveTimeFrame(timeFrame)}
              className={`px-3 py-1 text-xs font-medium ${
                activeTimeFrame === timeFrame 
                  ? 'bg-blue-500 text-white' 
                  : 'text-gray-400 hover:text-white'
              } rounded-md transition-colors`}
            >
              {timeFrame}
            </button>
          ))}
        </div>
        <div className="text-sm text-gray-400">
          Last Price: <span className="text-white">
            {price > 0 ? (price < 1 ? `$${price.toFixed(6)}` : `$${price.toFixed(2)}`) : 'N/A'}
          </span>
        </div>
      </div>
      
      <div className="relative" style={{ height: `${height}px` }}>
        {chartUrl ? (
          <iframe
            key={`${tokenAddress}-${activeTimeFrame}`}
            src={chartUrl}
            width="100%"
            height="100%"
            style={{ border: 'none', borderRadius: '12px' }}
            allowFullScreen
            title={`Chart for ${tokenAddress}`}
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-gray-800/50 rounded-xl">
            <div className="text-center text-gray-400">
              <BarChart3 className="w-12 h-12 mx-auto mb-4" />
              <p>Chart not available</p>
              <p className="text-sm">Token address required for live chart</p>
            </div>
          </div>
        )}
      </div>
      
      {tokenAddress && (
        <div className="mt-2 text-xs text-gray-500 text-center">
          Real-time data from BirdEye • Token: {tokenAddress.slice(0, 8)}...{tokenAddress.slice(-8)}
        </div>
      )}
    </div>
  )
}

export default ChartContainer