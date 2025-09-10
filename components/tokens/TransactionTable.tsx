'use client'

import React, { useState, useEffect, useRef } from 'react'
import { ExternalLink, Loader2, AlertCircle, RefreshCw, Wifi, WifiOff, Activity } from 'lucide-react'
import { RealtimeTransactionService, Transaction } from '@/services/RealtimeTransactionService'


interface TransactionTableProps {
  tokenAddress?: string
  transactions?: Transaction[]
  limit?: number
  showRefresh?: boolean
  autoRefresh?: boolean
  enableRealtime?: boolean
}

const TransactionTable: React.FC<TransactionTableProps> = ({ 
  tokenAddress,
  transactions: propTransactions = [],
  limit = 15,
  showRefresh = true,
  autoRefresh = true,
  enableRealtime = true
}) => {
  const [transactions, setTransactions] = useState<Transaction[]>(propTransactions)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [isRealtime, setIsRealtime] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected')
  const [apiHealth, setApiHealth] = useState<Record<string, boolean>>({})
  
  const unsubscribeRef = useRef<(() => void) | null>(null)

  // Load transaction data
  const loadTransactions = async (showLoading = true) => {
    if (!tokenAddress) {
      setError('No token address provided')
      return
    }

    if (showLoading) {
      setIsLoading(true)
      setConnectionStatus('connecting')
    }
    setError(null)

    try {
      const txData = await RealtimeTransactionService.fetchTransactions(tokenAddress, limit)
      
      if (txData.length === 0) {
        setError('No transaction data available from any API')
        setTransactions([])
      } else {
        setTransactions(txData)
        setError(null)
        console.log(`Loaded ${txData.length} transactions for ${tokenAddress}`)
      }
      
      setLastUpdate(new Date())
      setConnectionStatus('connected')
    } catch (err) {
      console.error('Error loading transactions:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to load transactions'
      setError(errorMessage)
      setConnectionStatus('disconnected')
      
      // Keep existing transactions on error
      if (transactions.length === 0) {
        setTransactions([])
      }
    } finally {
      if (showLoading) {
        setIsLoading(false)
      }
    }
  }

  // Set up real-time subscription
  const setupRealtime = () => {
    if (!tokenAddress || !enableRealtime) return

    setIsRealtime(true)
    setConnectionStatus('connecting')

    const unsubscribe = RealtimeTransactionService.subscribeToRealtime(tokenAddress, (newTransactions) => {
      console.log(`Real-time update: ${newTransactions.length} transactions`)
      setTransactions(newTransactions)
      setLastUpdate(new Date())
      setConnectionStatus('connected')
      setError(null)
    })

    unsubscribeRef.current = unsubscribe
  }

  // Check API health
  const checkApiHealth = async () => {
    try {
      const health = await RealtimeTransactionService.checkApiHealth()
      setApiHealth(health)
    } catch (error) {
      console.warn('Failed to check API health:', error)
    }
  }

  // Load data on mount and when tokenAddress changes
  useEffect(() => {
    if (tokenAddress && propTransactions.length === 0) {
      loadTransactions()
      checkApiHealth()

      if (enableRealtime) {
        setupRealtime()
      }
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
        unsubscribeRef.current = null
        setIsRealtime(false)
      }
    }
  }, [tokenAddress, limit, enableRealtime])

  // Auto-refresh fallback (when not using real-time)
  useEffect(() => {
    if (!autoRefresh || !tokenAddress || isRealtime) return

    const interval = setInterval(() => {
      loadTransactions(false) // Don't show loading spinner for auto-refresh
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [autoRefresh, tokenAddress, isRealtime])

  const formatPrice = (price: number) => {
    if (price < 0.001) {
      return `$${price.toFixed(8)}`
    } else if (price < 1) {
      return `$${price.toFixed(6)}`
    } else {
      return `$${price.toFixed(4)}`
    }
  }

  const formatAmount = (amount: number) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(2)}M`
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(2)}K`
    } else if (amount < 0.01) {
      return amount.toFixed(6)
    } else {
      return amount.toFixed(2)
    }
  }

  const openTransaction = (signature?: string) => {
    if (signature) {
      window.open(`https://solscan.io/tx/${signature}`, '_blank')
    }
  }

  const handleManualRefresh = () => {
    loadTransactions(true)
  }

  const toggleRealtime = () => {
    if (isRealtime) {
      // Disable real-time
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
        unsubscribeRef.current = null
      }
      setIsRealtime(false)
      setConnectionStatus('disconnected')
    } else {
      // Enable real-time
      setupRealtime()
    }
  }

  return (
    <div className="w-full">
      {/* Enhanced Header with status indicators */}
      {showRefresh && tokenAddress && (
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {/* Connection Status */}
            <div className="flex items-center gap-2">
              {connectionStatus === 'connected' ? (
                <Wifi className="w-4 h-4 text-green-400" />
              ) : connectionStatus === 'connecting' ? (
                <Loader2 className="w-4 h-4 text-yellow-400 animate-spin" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-400" />
              )}
              <span className={`text-xs ${
                connectionStatus === 'connected' ? 'text-green-400' : 
                connectionStatus === 'connecting' ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {connectionStatus === 'connected' ? 'Live' : 
                 connectionStatus === 'connecting' ? 'Connecting' : 'Offline'}
              </span>
            </div>

            {/* Real-time toggle */}
            {enableRealtime && (
              <button
                onClick={toggleRealtime}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                  isRealtime 
                    ? 'bg-green-600/20 text-green-400 border border-green-600/30' 
                    : 'bg-gray-600/20 text-gray-400 border border-gray-600/30 hover:bg-gray-600/30'
                }`}
                title={isRealtime ? 'Disable real-time updates' : 'Enable real-time updates'}
              >
                <Activity className="w-3 h-3" />
                {isRealtime ? 'Real-time' : 'Manual'}
              </button>
            )}

            {/* Last update time */}
            {lastUpdate && (
              <span className="text-xs text-gray-500">
                Updated: {lastUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* API Health indicators */}
            {Object.keys(apiHealth).length > 0 && (
              <div className="flex items-center gap-1" title="API Status">
                {Object.entries(apiHealth).map(([api, healthy]) => (
                  <div
                    key={api}
                    className={`w-2 h-2 rounded-full ${healthy ? 'bg-green-400' : 'bg-red-400'}`}
                    title={`${api}: ${healthy ? 'healthy' : 'down'}`}
                  />
                ))}
              </div>
            )}

            {/* Manual refresh button */}
            <button
              onClick={handleManualRefresh}
              disabled={isLoading}
              className="p-1 text-gray-400 hover:text-white transition-colors rounded disabled:opacity-50"
              title="Manual refresh"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      )}

      {/* Loading state */}
      {isLoading && transactions.length === 0 && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-blue-400 mr-2" />
          <span className="text-gray-400 text-sm">Loading real-time transactions...</span>
        </div>
      )}

      {/* Error state */}
      {error && transactions.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 text-red-400">
          <AlertCircle className="w-6 h-6 mb-2" />
          <span className="text-sm text-center mb-3">{error}</span>
          <button
            onClick={() => loadTransactions(true)}
            className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-600/30 rounded-lg text-sm transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Transactions table */}
      {transactions.length > 0 && (
        <div className="w-full overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-gray-800/50">
                <th className="text-left py-2 px-2">Time</th>
                <th className="text-left py-2 px-2">Type</th>
                <th className="text-left py-2 px-2">Price</th>
                <th className="text-left py-2 px-2">Amount</th>
                <th className="text-left py-2 px-2">Total</th>
                <th className="text-left py-2 px-2">Wallet</th>
                <th className="text-left py-2 px-2"></th>
              </tr>
            </thead>
            <tbody>
              {transactions.slice(0, limit).map((tx, index) => (
                <tr 
                  key={tx.id} 
                  className={`border-b border-gray-800/30 hover:bg-gray-800/20 transition-colors ${
                    index < 3 && isRealtime ? 'animate-pulse bg-blue-900/10' : ''
                  }`}
                >
                  <td className="py-2 px-2 text-gray-300">{tx.time}</td>
                  <td className={`py-2 px-2 font-medium ${tx.type === 'buy' ? 'text-green-500' : 'text-red-500'}`}>
                    {tx.type === 'buy' ? 'Buy' : 'Sell'}
                  </td>
                  <td className="py-2 px-2 text-white font-mono">{formatPrice(tx.price)}</td>
                  <td className="py-2 px-2 text-gray-300">{formatAmount(tx.amount)}</td>
                  <td className="py-2 px-2 text-white">${formatAmount(tx.total)}</td>
                  <td className="py-2 px-2 text-blue-400 font-mono text-xs">
                    {tx.wallet.length > 12 ? tx.wallet : `${tx.wallet.slice(0, 4)}...${tx.wallet.slice(-4)}`}
                  </td>
                  <td className="py-2 px-2">
                    <button 
                      onClick={() => openTransaction(tx.signature)}
                      className="text-gray-400 hover:text-white transition-colors"
                      title={tx.signature ? "View on Solscan" : "Transaction details"}
                    >
                      {tx.signature ? (
                        <ExternalLink className="w-3.5 h-3.5" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full bg-gray-600" />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* No data state with better messaging */}
      {!isLoading && !error && transactions.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <span className="text-sm">No transactions found</span>
          {tokenAddress && (
            <p className="text-xs text-gray-500 mt-1">
              Token may be new or have low trading activity
            </p>
          )}
        </div>
      )}

      {/* Enhanced footer info */}
      {tokenAddress && (
        <div className="mt-3 text-xs text-gray-600 text-center space-y-1">
          <div>
            Token: {tokenAddress.slice(0, 8)}...{tokenAddress.slice(-8)}
            {transactions.length > 0 && ` • ${transactions.length} recent transactions`}
          </div>
          {error && (
            <div className="text-red-400 text-xs">
              Showing cached data • {error}
            </div>
          )}
          {isRealtime && (
            <div className="text-green-400 text-xs flex items-center justify-center gap-1">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              Live updates enabled
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default TransactionTable
export type { Transaction }