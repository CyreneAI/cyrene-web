'use client'

import React, { useState, useEffect } from 'react'
import { BarChart3, Activity, Loader2 } from 'lucide-react'
import { DynamicBondingCurveClient } from '@meteora-ag/dynamic-bonding-curve-sdk'
import { PublicKey, Connection } from '@solana/web3.js'

interface PoolProgressCardProps {
  poolAddress: string
  refreshInterval?: number
}

const PoolProgressCard: React.FC<PoolProgressCardProps> = ({
  poolAddress,
  refreshInterval = 15000 // 15 seconds
}) => {
  const [poolProgression, setPoolProgression] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isGraduated, setIsGraduated] = useState(false)

  // Get Solana connection
  const getSolanaConnection = async (): Promise<Connection> => {
    const connection = new Connection(
      `https://mainnet.helius-rpc.com/?api-key=${process.env.NEXT_PUBLIC_HELIUS_API_KEY}`,
      {
        commitment: "confirmed",
        confirmTransactionInitialTimeout: 120000,
      }
    )
    try {
      await connection.getEpochInfo()
      return connection
    } catch (error) {
      console.error('Failed to connect to Solana RPC:', error)
      throw new Error('Unable to connect to Solana RPC endpoint')
    }
  }

  const getPoolProgression = async () => {
    if (!poolAddress) return

    setIsLoading(true)
    setError(null)

    try {
      const connection = await getSolanaConnection()
      const client = new DynamicBondingCurveClient(connection, "confirmed")
      const poolPubkey = new PublicKey(poolAddress)
      const progress = await client.state.getPoolCurveProgress(poolPubkey)
      
      const hasGraduated = progress >= 1
      setIsGraduated(hasGraduated)
      
      const progressInPercent = Math.min(progress * 100, 100)
      const formattedProgress = progressInPercent.toFixed(2) + "%"
      setPoolProgression(formattedProgress)
    } catch (error) {
      console.error("Failed to get pool progression:", error)
      setError("Failed to load pool progression")
    } finally {
      setIsLoading(false)
    }
  }

  // Initial load
  useEffect(() => {
    getPoolProgression()
  }, [poolAddress])

  // Set up refresh interval
  useEffect(() => {
    if (!poolAddress || isGraduated) return

    const interval = setInterval(() => {
      getPoolProgression()
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [poolAddress, refreshInterval, isGraduated])

  if (isGraduated) {
    return (
      <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 rounded-xl p-4 border border-green-500/30">
        <div className="text-center">
          <div className="text-4xl mb-2">🎉</div>
          <h3 className="text-white font-semibold mb-1">Pool Graduated!</h3>
          <p className="text-green-400 text-sm">Trading now available on AMM</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-r from-[#3d71e9]/20 to-[#799ef3]/20 rounded-xl p-9 border border-[#3d71e9]/30">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="w-5 h-5 text-[#3d71e9]" />
        <h3 className="text-white font-semibold text-sm">Pool Progress</h3>
        <button
          onClick={getPoolProgression}
          disabled={isLoading}
          className="ml-auto p-1 rounded hover:bg-white/10 transition-colors"
          title="Refresh progression"
        >
          <Activity className={`w-4 h-4 text-[#3d71e9] ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {isLoading && !poolProgression ? (
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 text-[#3d71e9] animate-spin" />
          <span className="text-sm text-gray-300">Loading...</span>
        </div>
      ) : error ? (
        <div className="text-sm text-red-400">{error}</div>
      ) : poolProgression ? (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-300">Progress:</span>
            <span className="font-bold text-lg text-[#3d71e9]">{poolProgression}</span>
          </div>
          
          <div className="relative w-full h-3 bg-black/30 rounded-full overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#3d71e9] to-[#799ef3] transition-all duration-500 ease-out"
              style={{ width: poolProgression || "0%" }}
            />
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#3d71e9]/60 to-[#799ef3]/60 blur-sm"
              style={{ width: poolProgression || "0%" }}
            />
          </div>
          
          <div className="text-xs text-gray-400">
            {parseFloat(poolProgression.replace('%', '')) >= 100
              ? "Pool graduated! Ready for AMM trading"
              : "Pool filling up - help it graduate!"
            }
          </div>
        </div>
      ) : (
        <div className="text-sm text-gray-400">No progression data available</div>
      )}
    </div>
  )
}

export default PoolProgressCard