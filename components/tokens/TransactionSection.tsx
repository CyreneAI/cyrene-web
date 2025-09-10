'use client'

import React from 'react'
// Import the enhanced TransactionTable (you'll need to update the path)
import TransactionTable from './TransactionTable' // Update this path to your enhanced component

export interface Transaction {
  id: string
  time: string
  type: 'buy' | 'sell'
  price: number
  amount: number
  total: number
  wallet: string
  signature?: string
  timestamp: number
  priceUsd?: number
  volumeUsd?: number
}

interface TransactionSectionProps {
  title?: string
  tokenAddress?: string
  transactions?: Transaction[]
  limit?: number
  className?: string
  showRefresh?: boolean
  autoRefresh?: boolean
  enableRealtime?: boolean
}

const TransactionSection: React.FC<TransactionSectionProps> = ({ 
  title = "Recent Transactions",
  tokenAddress,
  transactions = [],
  limit = 15,
  className = '',
  showRefresh = true,
  autoRefresh = true,
  enableRealtime = true
}) => {
  return (
    <div className={`flex flex-col ${className}`}>
      <h3 className="font-bold text-white text-lg mb-3">{title}</h3>
      
      {/* Enhanced Transaction table container with real-time data */}
      <div className="overflow-auto flex-1">
        <TransactionTable 
          tokenAddress={tokenAddress}
          transactions={transactions}
          limit={limit}
          showRefresh={showRefresh}
          autoRefresh={autoRefresh}
          enableRealtime={enableRealtime}
        />
      </div>
      
      {/* Enhanced footer info */}
      {tokenAddress && (
        <div className="mt-3 pt-2 border-t border-gray-700/30">
          <p className="text-xs text-gray-500 text-center">
            {enableRealtime ? 'Real-time live data' : 'Cached data'} • Updates automatically
          </p>
        </div>
      )}
    </div>
  )
}

export default TransactionSection
