'use client'

import React, { ReactNode } from 'react'

interface TradeContainerProps {
  children: ReactNode
}

const TradeContainer: React.FC<TradeContainerProps> = ({ children }) => {
  return (
    <div className="bg-[#242F5466] backdrop-blur-[70px] rounded-[40px] p-6 shadow-lg border border-gray-800/30">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {children}
      </div>
    </div>
  )
}

export default TradeContainer