'use client'

import React from 'react'

interface FlywheelStatsProps {
  investedUsd?: string
  tokenBurnedPct?: string
  tokenSymbol?: string
  onShare?: () => void
}

const FlywheelStats: React.FC<FlywheelStatsProps> = ({
  investedUsd = '$0',
  tokenBurnedPct = '0.000%',
  tokenSymbol = ''
}) => {
  return (
    <div className="bg-[#040A25] rounded-[30px] p-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-white">Flywheel Statistics</h4>
        <button className="text-xs text-gray-300/80 hover:text-white rounded-md border border-white/10 px-2 py-1">Share</button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-gray-400 text-xs mb-1">Invested</div>
          <div className="text-white text-base">{investedUsd}</div>
        </div>
        <div>
          <div className="text-gray-400 text-xs mb-1">Token burned</div>
          <div className="text-white text-base">{tokenBurnedPct}</div>
        </div>
      </div>
    </div>
  )
}

export default FlywheelStats