'use client'

import React, { useState, useEffect } from 'react'
import { Loader2, ExternalLink } from 'lucide-react'
import { useAppKitProvider } from '@reown/appkit/react'
import { PublicKey, Connection, VersionedTransaction } from '@solana/web3.js'
import axios from 'axios'
import { toast } from 'sonner'
import type { Provider } from "@reown/appkit-adapter-solana/react"
import { initializeSDK, getQuotes, createTransaction, getNextTxn, checkStatus, Quote } from '@blockend/compass-sdk'

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

// Using Quote type from SDK

// Constants
const SOL_USDC_PAIR_ADDRESS = '58oQChx4yWmvKdwLLZzBi4ChoCc2fqbAaGv_2aK_A8p'
const SOL_NATIVE_ADDRESS = 'So11111111111111111111111111111111111111112'

// Initialize SDK once
let sdkInitialized = false
const initializeCompassSDK = () => {
  if (!sdkInitialized && process.env.NEXT_PUBLIC_BLOCKEND_API_KEY) {
    initializeSDK({
      apiKey: process.env.NEXT_PUBLIC_BLOCKEND_API_KEY,
      integratorId: process.env.NEXT_PUBLIC_BLOCKEND_INTEGRATOR_ID || 'default',
    })
    sdkInitialized = true
  }
}

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
  const [compassQuote, setCompassQuote] = useState<Quote | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Initialize SDK on mount
  useEffect(() => {
    initializeCompassSDK()
  }, [])

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
  const fetchSolPrice = React.useCallback(async () => {
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
  }, [solAmount])

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

  // Get quote using Blockend Compass SDK
  const getCompassQuote = React.useCallback(async (walletAddress?: string) => {
    if (!tokenData.address || tokenData.tradeStatus !== 'active') return

    try {
      const amountInSol = parseFloat(solAmount)
      if (isNaN(amountInSol) || amountInSol <= 0) {
        setCompassQuote(null)
        return
      }

      setLoading(true)
      setError(null)
      
      // Calculate input amount in smallest unit (lamports for SOL)
      const inputAmount = (amountInSol * 1e9).toString()
      
      const quotes = await getQuotes({
        fromChainId: 'sol',
        fromAssetAddress: SOL_NATIVE_ADDRESS,
        toChainId: 'sol',
        toAssetAddress: tokenData.address,
        inputAmount: inputAmount, // Amount in lamports
        inputAmountDisplay: solAmount,
        userWalletAddress: walletAddress || '11111111111111111111111111111111',
        recipient: walletAddress || '11111111111111111111111111111111',
        slippage: Math.floor(slippage * 100), // Convert to basis points
        sortBy: 'output', // Sort by best output amount
      })

      if (quotes?.data?.quotes && quotes.data.quotes.length > 0) {
        // Get the best quote (first one is usually recommended)
        const bestQuote = quotes.data.quotes[0]
        setCompassQuote(bestQuote)
      } else {
        setError('No routes found for this swap')
        setCompassQuote(null)
      }
    } catch (error) {
      console.error('Error getting Compass quote:', error)
      setCompassQuote(null)
      setError(error instanceof Error ? error.message : "Failed to get quote")
      toast.error(error instanceof Error ? error.message : "Failed to get quote.")
    } finally {
      setLoading(false)
    }
  }, [solAmount, slippage, tokenData.address, tokenData.tradeStatus])

  // Execute swap using Blockend Compass SDK (manual flow)
  const executeCompassSwap = async () => {
    if (!compassQuote || !isConnected || tokenData.tradeStatus !== 'active') {
      toast.error('Missing required data for swap')
      return
    }

    if (!solanaWalletProvider?.publicKey) {
      toast.error('Wallet not connected')
      return
    }

    try {
      setLoading(true)
      setError(null)
      setTxStatus('Creating transaction...')

      // Step 1: Create transaction
      const txResponse = await createTransaction({
        routeId: compassQuote.routeId,
      })

      if (!txResponse?.data?.steps || txResponse.data.steps.length === 0) {
        throw new Error('No transaction steps found')
      }

      const connection = await getSolanaConnection()

      // Step 2: Execute each step
      for (const step of txResponse.data.steps) {
        setTxStatus(`Executing ${step.stepType} transaction...`)

        // Get transaction data for this step
        const nextTxResponse = await getNextTxn({
          routeId: compassQuote.routeId,
          stepId: step.stepId,
        })

        if (!nextTxResponse?.data?.txnData?.txnSol?.data) {
          throw new Error('No transaction data found')
        }

        // Deserialize and sign transaction
        const txnBuffer = Buffer.from(nextTxResponse.data.txnData.txnSol.data, 'base64')
        const transaction = VersionedTransaction.deserialize(txnBuffer)

        setTxStatus('Please approve transaction in wallet...')
        
        // Sign and send transaction - returns signature as string
        const signature = await solanaWalletProvider.signAndSendTransaction(transaction)
        console.log('Transaction signature:', signature)

        setTxStatus('Confirming transaction...')

        // Wait for confirmation
        await connection.confirmTransaction(signature, 'confirmed')

        // Step 3: Check status
        let currentStatus = 'in-progress'
        let attempts = 0
        const maxAttempts = 30

        while (currentStatus === 'in-progress' && attempts < maxAttempts) {
          try {
            const statusResponse = await checkStatus({
              routeId: compassQuote.routeId,
              stepId: step.stepId,
              txnHash: signature,
            })

            if (statusResponse?.data?.status) {
              currentStatus = statusResponse.data.status

              if (currentStatus === 'success') {
                setTxStatus('Transaction successful!')
                toast.success('Swap successful!')
                onBuy?.(parseFloat(solAmount))
                
                // Refresh quote after successful swap
                setTimeout(() => {
                  if (solanaWalletProvider?.publicKey) {
                    getCompassQuote(solanaWalletProvider.publicKey.toString())
                  }
                }, 1000)
                break
              } else if (currentStatus === 'failed') {
                throw new Error('Transaction failed on blockchain')
              } else if (currentStatus === 'partial-success') {
                toast.warning('Swap partially successful')
                break
              }
            }
          } catch (statusError) {
            console.log('Status check attempt failed, retrying...', statusError)
          }

          // Wait 2 seconds before next status check
          if (currentStatus === 'in-progress') {
            await new Promise(resolve => setTimeout(resolve, 2000))
            attempts++
          }
        }

        if (attempts >= maxAttempts) {
          console.warn('Status check timeout - transaction may still succeed')
          toast.warning('Transaction submitted - check your wallet for confirmation')
        }
      }

      setTxStatus('')

    } catch (error) {
      console.error('Swap failed:', error)
      toast.error(error instanceof Error ? error.message : 'Swap failed.')
      setError(error instanceof Error ? error.message : 'Swap failed')
      setTxStatus('')
    } finally {
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
  }, [fetchSolPrice])

  useEffect(() => {
    if (tokenData.address && solAmount && tokenData.tradeStatus === 'active') {
      const debounceTimer = setTimeout(() => {
        const walletAddress = solanaWalletProvider?.publicKey?.toString()
        getCompassQuote(walletAddress)
      }, 500)
      return () => clearTimeout(debounceTimer)
    }
  }, [solAmount, slippage, tokenData.address, tokenData.tradeStatus, getCompassQuote, solanaWalletProvider])

  // Load SOL balance when wallet connects
  useEffect(() => {
    if (isConnected && solanaWalletProvider?.publicKey) {
      checkSOLBalance(solanaWalletProvider.publicKey.toString())
        .then(balance => setSolBalance(balance))
        .catch(error => console.error('Failed to load balance:', error))
    }
  }, [isConnected, solanaWalletProvider])

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
    <div className="relative bg-[#040A25] rounded-[30px] p-6 h-auto">
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
        <div className="flex items-center mb-2 min-w-0">
          <input
            type="number"
            value={solAmount}
            onChange={handleSolAmountChange}
            className="flex-1 min-w-0 bg-transparent text-black text-xl font-medium outline-none placeholder-gray-600"
            placeholder="0.0"
            min="0"
            step="0.1"
          />
          <div className="bg-black/20 rounded-lg px-2 py-1">
            <span className="font-medium text-black text-sm">SOL</span>
          </div>
        </div>
        <div className="flex items-center border-t border-black/10 pt-2 min-w-0">
          <span className="text-black text-sm mr-2">≈</span>
          <input
            type="number"
            value={usdAmount}
            onChange={handleUsdAmountChange}
            className="flex-1 min-w-0 bg-transparent text-black text-sm font-medium outline-none placeholder-gray-600"
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
        <div className="flex items-center min-w-0">
          <input
            type="text"
            value={compassQuote?.outputAmountDisplay || '...'}
            readOnly
            className="flex-1 min-w-0 truncate bg-transparent text-black text-xl font-medium outline-none"
          />
          <div className="bg-black/20 rounded-lg px-2 py-1">
            <span className="font-medium text-black text-sm">{tokenData.symbol}</span>
          </div>
        </div>
        {compassQuote?.providerDetails && (
          <div className="mt-1 text-xs text-black font-medium">
            via {compassQuote.providerDetails.name}
          </div>
        )}
        {compassQuote?.tags?.includes('BEST') && (
          <div className="mt-1">
            <span className="text-xs bg-green-500/20 text-green-700 px-2 py-0.5 rounded">
              Best Rate
            </span>
          </div>
        )}
      </div>

      {/* Trading Fees */}
      {compassQuote?.fee && compassQuote.fee.length > 0 && (
        <div className="bg-white/5 rounded-xl p-3 border border-white/10 space-y-2 text-sm mb-4">
          {compassQuote.fee.map((fee, index) => (
            <div key={index} className="flex justify-between">
              <span className="text-gray-300 capitalize">{fee.type} Fee:</span>
              <span className="font-medium text-white">
                {(parseFloat(fee.amountInToken) / Math.pow(10, fee.token.decimals)).toFixed(6)} {fee.token.symbol}
              </span>
            </div>
          ))}
          {compassQuote.estimatedTimeInSeconds && (
            <div className="flex justify-between pt-2 border-t border-white/10">
              <span className="text-gray-300">Est. Time:</span>
              <span className="font-medium text-white">
                ~{compassQuote.estimatedTimeInSeconds}s
              </span>
            </div>
          )}
        </div>
      )}

      {/* Transaction Status */}
      {txStatus && (
        <div className="bg-white/5 rounded-xl p-3 border border-white/10 flex items-center space-x-2 mb-4">
          <Loader2 className="animate-spin h-4 w-4 text-[#3d71e9]" />
          <span className="text-white text-sm">{txStatus}</span>
        </div>
      )}

      {/* Error Display */}
      {error && !loading && (
        <div className="bg-red-500/10 rounded-xl p-3 border border-red-500/20 mb-4">
          <span className="text-red-400 text-sm">{error}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => {
            const walletAddress = solanaWalletProvider?.publicKey?.toString()
            getCompassQuote(walletAddress)
          }}
          disabled={loading}
          className="flex-1 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl disabled:opacity-50 transition-colors text-sm"
        >
          Refresh Quote
        </button>
        
        {isConnected ? (
          <button
            onClick={executeCompassSwap}
            disabled={loading || !compassQuote || !!error}
            className="flex-1 py-2 bg-gradient-to-r from-[#3d71e9] to-[#799ef3] hover:opacity-90 text-black font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm relative overflow-visible"
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

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-black/50 rounded-[30px] z-20 flex items-center justify-center">
          <div className="flex items-center gap-3 bg-white/6 px-5 py-3 rounded-lg">
            <Loader2 className="animate-spin h-5 w-5 text-white" />
            <div className="text-white text-sm">{txStatus || 'Processing...'}</div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TradingInterface