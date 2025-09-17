'use client'

import React, { useState, useEffect } from 'react'
import { Loader2, ExternalLink } from 'lucide-react'
import { useAppKitProvider } from '@reown/appkit/react'
import { PublicKey, Connection } from '@solana/web3.js'
import { DynamicBondingCurveClient } from '@meteora-ag/dynamic-bonding-curve-sdk'
import { BN } from 'bn.js'
import axios from 'axios'
import { toast } from 'sonner'
import type { Provider } from "@reown/appkit-adapter-solana/react"

// Types
interface TokenData {
  address: string
  name: string
  symbol: string
  price: number
  poolAddress?: string
  tradeStatus: 'active' | 'graduated'
}

interface TradingInterfaceProps {
  tokenData: TokenData
  isConnected: boolean
  onConnectWallet: () => void
  onBuy?: (amount: number) => void
  onSell?: (amount: number) => void
}

interface CustomPoolQuote {
  amountOut: string
  minimumAmountOut: string
  tradingFee: string
  protocolFee: string
}

// Constants
const SOL_USDC_PAIR_ADDRESS = '58oQChx4yWmvKdwLLZzBi4ChoCc2fqbAaGv_2aK_A8p'

const TradingInterface: React.FC<TradingInterfaceProps> = ({
  tokenData,
  isConnected,
  onConnectWallet,
  onBuy,
  onSell
}) => {
  const { walletProvider: solanaWalletProvider } = useAppKitProvider<Provider>('solana')
  
  // Trading state
  const [solAmount, setSolAmount] = useState<string>('0.1')
  const [usdAmount, setUsdAmount] = useState<string>('')
  const [slippage, setSlippage] = useState<number>(0.5)
  const [loading, setLoading] = useState<boolean>(false)
  const [txStatus, setTxStatus] = useState<string>('')
  const [solBalance, setSolBalance] = useState<number | null>(null)
  const [solPrice, setSolPrice] = useState<number>(0)
  const [customPoolQuote, setCustomPoolQuote] = useState<CustomPoolQuote | null>(null)

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

  // Check SOL balance
  const checkSOLBalance = async (walletAddress: string): Promise<number> => {
    const connection = await getSolanaConnection()
    try {
      const publicKey = new PublicKey(walletAddress)
      const balance = await connection.getBalance(publicKey)
      return balance / 1e9
    } catch (error) {
      console.error("Error checking SOL balance:", error)
      throw new Error("Failed to check SOL balance")
    }
  }

  // Fetch SOL price from DexScreener
  const fetchSolPrice = async () => {
    try {
      const response = await axios.get(`https://api.dexscreener.com/latest/dex/pairs/solana/${SOL_USDC_PAIR_ADDRESS}`)
      const pair = response.data.pairs?.[0] || null
      if (pair?.priceUsd) {
        const price = parseFloat(pair.priceUsd)
        setSolPrice(price)
        setUsdAmount((parseFloat(solAmount) * price).toFixed(2))
      }
    } catch (error) {
      console.error('Error fetching SOL price:', error)
    }
  }

  // USD/SOL conversion helpers
  const calculateUsdValue = (amount: string): string => {
    if (!amount || solPrice === 0) return '0.00'
    return (parseFloat(amount) * solPrice).toFixed(2)
  }

  const calculateSolFromUsd = (usdValue: string): string => {
    if (!usdValue || solPrice === 0) return '0'
    return (parseFloat(usdValue) / solPrice).toFixed(6)
  }

  const handleSolAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSolAmount(value)
    setUsdAmount(calculateUsdValue(value))
  }

  const handleUsdAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setUsdAmount(value)
    setSolAmount(calculateSolFromUsd(value))
  }

  // Get quote from Meteora SDK (for active bonding curves)
  const getCustomPoolQuote = async () => {
    if (!tokenData.poolAddress || tokenData.tradeStatus !== 'active') return

    try {
      const amountInLamports = parseFloat(solAmount) * 1e9
      if (isNaN(amountInLamports) || amountInLamports <= 0) {
        setCustomPoolQuote(null)
        return
      }

      setLoading(true)
      const connection = await getSolanaConnection()
      const client = new DynamicBondingCurveClient(connection, "confirmed")
      const poolPublicKey = new PublicKey(tokenData.poolAddress)
      
      const virtualPool = await client.state.getPool(poolPublicKey)
      if (!virtualPool) throw new Error("Pool not found!")
      
      const config = await client.state.getPoolConfig(virtualPool.config)
      const slot = await connection.getSlot()
      const blockTime = await connection.getBlockTime(slot)
      const currentPoint = new BN(blockTime || 0)
      
      const quote = await client.pool.swapQuote({
        virtualPool,
        config,
        swapBaseForQuote: false,
        amountIn: new BN(amountInLamports),
        slippageBps: Math.floor(slippage * 100),
        hasReferral: false,
        currentPoint,
      })
      
      setCustomPoolQuote({
        amountOut: quote.amountOut.toString(),
        minimumAmountOut: quote.minimumAmountOut.toString(),
        tradingFee: quote.fee.trading.toString(),
        protocolFee: quote.fee.protocol.toString(),
      })
    } catch (error) {
      console.error('Error getting custom pool quote:', error)
      setCustomPoolQuote(null)
      toast.error(error instanceof Error ? error.message : "Failed to get quote.")
    } finally {
      setLoading(false)
    }
  }

  // Execute swap transaction (for active bonding curves)
  const executeCustomPoolSwap = async () => {
    if (!tokenData.poolAddress || !isConnected || tokenData.tradeStatus !== 'active') {
      toast.error('Missing required data for swap')
      return
    }

    try {
      setTxStatus('Preparing swap...')
      setLoading(true)
      
      const amountInLamports = parseFloat(solAmount) * 1e9
      if (isNaN(amountInLamports) || amountInLamports <= 0) throw new Error('Invalid amount')
      
      const connection = await getSolanaConnection()
      const client = new DynamicBondingCurveClient(connection, "confirmed")
      const poolPublicKey = new PublicKey(tokenData.poolAddress)
      
      setTxStatus('Creating transaction...')
      // Note: This would need the actual user's wallet address
      // const userAddress = new PublicKey(address) // Get from wallet
      
      // For now, we'll just show success without actually executing
      setTxStatus('Transaction would be executed here...')
      
      setTimeout(() => {
        toast.success('Swap would be successful!')
        onBuy?.(parseFloat(solAmount))
        setTxStatus('')
        setLoading(false)
      }, 2000)
      
    } catch (error) {
      console.error('Swap failed:', error)
      toast.error(error instanceof Error ? error.message : 'Swap failed.')
      setTxStatus('')
      setLoading(false)
    }
  }

  // Handle Jupiter link for graduated tokens
  const handleJupiterTrade = () => {
    const jupiterUrl = `https://jup.ag/tokens/${tokenData.address}`
    window.open(jupiterUrl, '_blank')
  }

  // Effects
  useEffect(() => {
    fetchSolPrice()
    const interval = setInterval(fetchSolPrice, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (tokenData.poolAddress && solAmount && tokenData.tradeStatus === 'active') {
      const debounceTimer = setTimeout(() => getCustomPoolQuote(), 500)
      return () => clearTimeout(debounceTimer)
    }
  }, [solAmount, slippage, tokenData.poolAddress, tokenData.tradeStatus])

  // If token is graduated, show Jupiter link
  if (tokenData.tradeStatus === 'graduated') {
    return (
      <div className="bg-[#040A25] rounded-[30px] p-6">
        <div className="text-center space-y-4">
          <div className="text-4xl mb-2">🎉</div>
          <h3 className="text-white font-semibold">Token Graduated!</h3>
          <p className="text-gray-300 text-sm">
            This token has graduated and is now available for trading on decentralized exchanges.
          </p>
          <button
            onClick={handleJupiterTrade}
            className="w-full px-4 py-3 bg-gradient-to-r from-[#3d71e9] to-[#799ef3] hover:opacity-90 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
          >
            Trade on Jupiter
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#040A25] rounded-[30px] p-6 h-[50vh]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-white text-lg">Trade</h3>
        <span className="text-xs text-gray-400">Slippage: {slippage}%</span>
      </div>

      {/* You Pay Section */}
      <div className="bg-[#3d71e9] rounded-xl p-3 border border-white/20 mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-black font-medium text-sm">You pay</span>
          <div className="text-right text-black text-xs">
            Balance: {solBalance !== null ? solBalance.toFixed(4) : '-'} SOL
          </div>
        </div>
        <div className="flex items-center mb-2">
          <input
            type="number"
            value={solAmount}
            onChange={handleSolAmountChange}
            className="flex-1 bg-transparent text-black text-xl font-medium outline-none placeholder-gray-600"
            placeholder="0.0"
            min="0"
            step="0.1"
          />
          <div className="bg-black/20 rounded-lg px-2 py-1">
            <span className="font-medium text-black text-sm">SOL</span>
          </div>
        </div>
        <div className="flex items-center border-t border-black/10 pt-2">
          <span className="text-black text-sm mr-2">≈</span>
          <input
            type="number"
            value={usdAmount}
            onChange={handleUsdAmountChange}
            className="flex-1 bg-transparent text-black text-sm font-medium outline-none placeholder-gray-600"
            placeholder="0.00"
            min="0"
            step="0.01"
          />
          <div className="bg-black/20 rounded-lg px-2 py-1">
            <span className="font-medium text-black text-xs">USD</span>
          </div>
        </div>
        {solPrice > 0 && (
          <div className="text-xs text-black/70 mt-1">1 SOL ≈ ${solPrice.toFixed(2)} USD</div>
        )}
      </div>

      {/* You Receive Section */}
      <div className="bg-[#3d71e9] rounded-xl p-3 border border-white/20 mb-4">
        <span className="text-black font-medium text-sm">You receive</span>
        <div className="flex items-center">
          <input
            type="text"
            value={customPoolQuote ? (parseFloat(customPoolQuote.amountOut) / 1e9).toFixed(4) : '...'}
            readOnly
            className="flex-1 bg-transparent text-black text-xl font-medium outline-none"
          />
          <div className="bg-black/20 rounded-lg px-2 py-1">
            <span className="font-medium text-black text-sm">{tokenData.symbol}</span>
          </div>
        </div>
        {customPoolQuote && (
          <div className="mt-1 text-xs text-black font-medium">
            Minimum: {(parseFloat(customPoolQuote.minimumAmountOut) / 1e9).toFixed(4)}
          </div>
        )}
      </div>

      {/* Trading Fees */}
      {customPoolQuote && (
        <div className="bg-white/5 rounded-xl p-3 border border-white/10 space-y-2 text-sm mb-4">
          <div className="flex justify-between">
            <span className="text-gray-300">Trading Fee:</span>
            <span className="font-medium text-white">
              {(parseFloat(customPoolQuote.tradingFee) / 1e9).toFixed(6)} SOL
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Protocol Fee:</span>
            <span className="font-medium text-white">
              {(parseFloat(customPoolQuote.protocolFee) / 1e9).toFixed(6)} SOL
            </span>
          </div>
        </div>
      )}

      {/* Transaction Status */}
      {txStatus && (
        <div className="bg-white/5 rounded-xl p-3 border border-white/10 flex items-center space-x-2 mb-4">
          <Loader2 className="animate-spin h-4 w-4 text-[#3d71e9]" />
          <span className="text-white text-sm">{txStatus}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={getCustomPoolQuote}
          disabled={loading}
          className="flex-1 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl disabled:opacity-50 transition-colors text-sm"
        >
          Refresh Quote
        </button>
        
        {isConnected ? (
          <button
            onClick={executeCustomPoolSwap}
            disabled={loading || !customPoolQuote}
            className="flex-1 py-2 bg-gradient-to-r from-[#3d71e9] to-[#799ef3] hover:opacity-90 text-black font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
          >
            {loading ? 'Processing...' : 'Swap'}
          </button>
        ) : (
          <button
            onClick={onConnectWallet}
            className="flex-1 py-2 bg-gradient-to-r from-[#3d71e9] to-[#799ef3] hover:opacity-90 text-black font-semibold rounded-xl transition-all text-sm"
          >
            Connect Wallet
          </button>
        )}
      </div>
    </div>
  )
}

export default TradingInterface