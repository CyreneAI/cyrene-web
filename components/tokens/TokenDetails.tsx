'use client'

import React, { ReactNode } from 'react'

interface TokenDetailsProps {
  children: ReactNode
}

const TokenDetails: React.FC<TokenDetailsProps> = ({ children }) => {
  return (
    <div className="lg:col-span-3">
      <div className="bg-[#040A25] rounded-[30px] p-6 mb-6">
        {children}
      </div>
    </div>
  )
}

export default TokenDetails