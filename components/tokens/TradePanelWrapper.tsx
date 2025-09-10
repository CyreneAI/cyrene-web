'use client'

import React, { ReactNode } from 'react'

interface TradePanelWrapperProps {
  children: ReactNode
}

const TradePanelWrapper: React.FC<TradePanelWrapperProps> = ({ children }) => {
  return (
    <div className="bg-[#040A25] rounded-[30px] p-6 mb-6 sticky top-24">
      {children}
    </div>
  )
}

export default TradePanelWrapper