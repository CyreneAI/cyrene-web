'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Loader2, RefreshCw, AlertCircle, Users, TrendingUp, Copy, Check } from 'lucide-react'

// Import the service (make sure the path matches your file structure)
import { HolderData, RealtimeHoldersService, TokenSupplyInfo } from '@/services/RealtimeHoldersService'

interface HoldersDistributionProps {
  tokenAddress?: string
  holders?: HolderData[]
  title?: string
  showRefresh?: boolean
  enableRealtime?: boolean
}

const HoldersDistribution: React.FC<HoldersDistributionProps> = ({
  tokenAddress,
  holders: propHolders = [],
  title = "Top 3 Holders",
  showRefresh = true,
  enableRealtime = true
}) => {
  const [holders, setHolders] = useState<HolderData[]>(propHolders)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [isRealtime, setIsRealtime] = useState(false)
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null)
  
  const unsubscribeRef = useRef<(() => void) | null>(null)

  // Load holders data
  const loadHolders = async (showLoading = true) => {
    if (!tokenAddress) return

    if (showLoading) setIsLoading(true)
    setError(null)

    try {
      const { holders: holdersData } = await RealtimeHoldersService.fetchHolders(tokenAddress)
      setHolders(holdersData)
      setError(null)
      setLastUpdate(new Date())
    } catch (err) {
      console.error('Error loading holders:', err)
      setError('Failed to load')
    } finally {
      if (showLoading) setIsLoading(false)
    }
  }

  // Set up real-time subscription
  const setupRealtime = () => {
    if (!tokenAddress || !enableRealtime) return

    setIsRealtime(true)
    const unsubscribe = RealtimeHoldersService.subscribeToHolderUpdates(tokenAddress, ({ holders: newHolders }) => {
      setHolders(newHolders)
      setLastUpdate(new Date())
      setError(null)
    })
    unsubscribeRef.current = unsubscribe
  }

  useEffect(() => {
    if (tokenAddress) {
      loadHolders()
      if (enableRealtime) setupRealtime()
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
        unsubscribeRef.current = null
        setIsRealtime(false)
      }
    }
  }, [tokenAddress, enableRealtime])

  // Get top 3 holders
  const top3Holders = [...holders]
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 10)

  const handleManualRefresh = () => loadHolders(true)

  const toggleRealtime = () => {
    if (isRealtime) {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
        unsubscribeRef.current = null
      }
      setIsRealtime(false)
    } else {
      setupRealtime()
    }
  }

  // Copy wallet address to clipboard
  const copyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address)
      setCopiedAddress(address)
      setTimeout(() => setCopiedAddress(null), 2000)
    } catch (err) {
      console.error('Failed to copy address:', err)
    }
  }

  // Mask wallet address (show first 4 and last 4 characters)
  const maskAddress = (address: string) => {
    if (address.length <= 8) return address
    return `${address.slice(0, 4)}...${address.slice(-4)}`
  }

  return (
    <div>
      {/* Compact Header */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-white flex items-center gap-2">
          <Users className="w-4 h-4" />
          {title}
        </h4>
        
        {showRefresh && tokenAddress && (
          <div className="flex items-center gap-2">
            {enableRealtime && (
              <button
                onClick={toggleRealtime}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                  isRealtime 
                    ? 'bg-green-600/20 text-green-400 border border-green-600/30' 
                    : 'bg-gray-600/20 text-gray-400 border border-gray-600/30 hover:bg-gray-600/30'
                }`}
              >
                <TrendingUp className="w-3 h-3" />
                {isRealtime ? 'Live' : 'Manual'}
              </button>
            )}

            <button
              onClick={handleManualRefresh}
              disabled={isLoading}
              className="p-1 text-gray-400 hover:text-white transition-colors rounded disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        )}
      </div>

      <div className="bg-[#040A25] p-3 rounded-lg">
        {/* Loading state */}
        {isLoading && holders.length === 0 ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-4 h-4 animate-spin text-blue-400 mr-2" />
            <span className="text-gray-400 text-sm">Loading...</span>
          </div>
        ) : top3Holders.length === 0 ? (
          <div className="text-center py-4 text-gray-400">
            <span className="text-sm">
              {error ? error : 'No holder data'}
            </span>
            {error && (
              <button
                onClick={() => loadHolders(true)}
                className="ml-2 text-blue-400 hover:text-blue-300 text-sm underline"
              >
                Retry
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Top 3 Holders - One Line Each */}
            <div className="space-y-2">
              {top3Holders.map((holder, index) => (
                <div 
                  key={`${holder.address}-${index}`} 
                  className="flex items-center justify-between text-sm"
                >
                  {/* Left: Rank and Address */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-gray-400 text-xs w-4">
                      #{index + 1}
                    </span>
                    
                    <span 
                      className="font-mono text-white cursor-pointer hover:text-blue-400 transition-colors"
                      onClick={() => copyAddress(holder.address)}
                      title={`Click to copy: ${holder.address}`}
                    >
                      {maskAddress(holder.address)}
                    </span>
                    
                    <button
                      onClick={() => copyAddress(holder.address)}
                      className="text-gray-500 hover:text-white transition-colors"
                    >
                      {copiedAddress === holder.address ? (
                        <Check className="w-3 h-3 text-green-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>

                  {/* Right: Percentage */}
                  <div className="text-right">
                    <span className="text-white font-medium">
                      {holder.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Summary Line */}
            <div className="pt-2 mt-2 border-t border-gray-700/50 flex justify-between items-center text-xs text-gray-500">
              <span>Top 10 holders</span>
              <span>
                {top3Holders.reduce((sum, h) => sum + h.percentage, 0).toFixed(1)}% total
              </span>
            </div>

            {/* Live indicator */}
            {isRealtime && (
              <div className="mt-2 text-xs text-green-400 flex items-center justify-center gap-1">
                <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse" />
                Live
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default HoldersDistribution