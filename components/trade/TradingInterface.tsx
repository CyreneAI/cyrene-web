'use client'

import React, { useState, useEffect } from 'react'
import { Loader2, ExternalLink, ChevronDown, Search } from 'lucide-react'
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

interface Chain {
  chainId: string
  name: string
  image: string
  networkType: 'evm' | 'sol' | 'cosmos'
  symbol: string
}

interface Token {
  address: string
  symbol: string
  name: string
  decimals: number
  chainId: string
  image?: string
  isNative: boolean
}

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
  const [fromAmount, setFromAmount] = useState<string>('0.1')
  const [slippage, setSlippage] = useState<number>(0.5)
  const [loading, setLoading] = useState<boolean>(false)
  const [txStatus, setTxStatus] = useState<string>('')
  const [compassQuote, setCompassQuote] = useState<Quote | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Chain and token selection
  const [chains, setChains] = useState<Chain[]>([])
  const [tokens, setTokens] = useState<Token[]>([])
  const [selectedChain, setSelectedChain] = useState<Chain | null>(null)
  const [selectedToken, setSelectedToken] = useState<Token | null>(null)
  const [showChainSelector, setShowChainSelector] = useState(false)
  const [showTokenSelector, setShowTokenSelector] = useState(false)
  const [tokenSearchQuery, setTokenSearchQuery] = useState('')

  // Fallback chains if API fails
  const fallbackChains: Chain[] = [
    { chainId: 'sol', name: 'Solana', image: 'https://assets.coingecko.com/coins/images/4128/standard/solana.png', networkType: 'sol', symbol: 'sol' },
    { chainId: '1', name: 'Ethereum', image: 'https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/chains/ethereum.svg', networkType: 'evm', symbol: 'eth' },
    { chainId: '56', name: 'BSC', image: 'https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/chains/bsc.svg', networkType: 'evm', symbol: 'bsc' },
    { chainId: '137', name: 'Polygon', image: 'https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/chains/polygon.svg', networkType: 'evm', symbol: 'pol' },
    { chainId: '42161', name: 'Arbitrum', image: 'https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/chains/arbitrum.svg', networkType: 'evm', symbol: 'arb' },
    { chainId: '10', name: 'Optimism', image: 'https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/chains/optimism.svg', networkType: 'evm', symbol: 'opt' },
  ]

  // Initialize SDK on mount
  useEffect(() => {
    initializeCompassSDK()
    fetchChains()
  }, [])

  // Fetch available chains
  const fetchChains = async () => {
    try {
      console.log('Fetching chains...')
      const response = await axios.get('https://api2.blockend.com/v1/chains', {
        headers: {
          'x-api-key': process.env.NEXT_PUBLIC_BLOCKEND_API_KEY || '',
          'x-integrator-id': process.env.NEXT_PUBLIC_BLOCKEND_INTEGRATOR_ID || 'default'
        }
      })
      
      console.log('Chains response:', response.data)
      
      // API returns: { status: "success", data: [ {chainId, name, image, ...}, ... ] }
      if (response.data?.status === 'success' && response.data?.data && Array.isArray(response.data.data)) {
        setChains(response.data.data)
        // Default to Solana
        const solanaChain = response.data.data.find((c: Chain) => c.chainId === 'sol')
        if (solanaChain) {
          setSelectedChain(solanaChain)
        } else if (response.data.data.length > 0) {
          setSelectedChain(response.data.data[0])
        }
      } else {
        console.error('Unexpected chains response format:', response.data)
        // Use fallback chains
        console.log('Using fallback chains')
        setChains(fallbackChains)
        setSelectedChain(fallbackChains[0])
      }
    } catch (error: any) {
      console.error('Error fetching chains:', error.response?.data || error.message)
      // Use fallback chains on error
      console.log('Using fallback chains due to error')
      setChains(fallbackChains)
      setSelectedChain(fallbackChains[0])
      toast.error('Using fallback chain list - some chains may be unavailable')
    }
  }

  // Fetch tokens for selected chain
  const fetchTokens = async (chainId: string) => {
    try {
      console.log('Fetching tokens for chain:', chainId)
      const response = await axios.get(`https://api2.blockend.com/v1/tokens?chainId=${chainId}`, {
        headers: {
          'x-api-key': process.env.NEXT_PUBLIC_BLOCKEND_API_KEY || '',
          'x-integrator-id': process.env.NEXT_PUBLIC_BLOCKEND_INTEGRATOR_ID || 'default'
        }
      })
      
      console.log('Tokens response:', response.data)
      
      // API returns: { status: "success", data: { "chainId": [ {token1}, {token2}, ... ] } }
      if (response.data?.status === 'success' && response.data?.data) {
        const tokensForChain = response.data.data[chainId]
        
        if (tokensForChain && Array.isArray(tokensForChain)) {
          setTokens(tokensForChain)
          const nativeToken = tokensForChain.find((t: Token) => t.isNative)
          if (nativeToken) {
            setSelectedToken(nativeToken)
          } else if (tokensForChain.length > 0) {
            setSelectedToken(tokensForChain[0])
          }
        } else {
          console.error('No tokens found for chain:', chainId)
          // Use fallback tokens
          const fallbackTokens = getFallbackTokens(chainId)
          setTokens(fallbackTokens)
          if (fallbackTokens.length > 0) {
            setSelectedToken(fallbackTokens[0])
          }
        }
      } else {
        console.error('Unexpected tokens response format:', response.data)
        // Use fallback tokens
        const fallbackTokens = getFallbackTokens(chainId)
        setTokens(fallbackTokens)
        if (fallbackTokens.length > 0) {
          setSelectedToken(fallbackTokens[0])
        }
      }
    } catch (error: any) {
      console.error('Error fetching tokens:', error.response?.data || error.message)
      // Use fallback tokens on error
      const fallbackTokens = getFallbackTokens(chainId)
      setTokens(fallbackTokens)
      if (fallbackTokens.length > 0) {
        setSelectedToken(fallbackTokens[0])
      }
      toast.error('Using fallback token list for this chain')
    }
  }

  // Get fallback tokens for common chains
  const getFallbackTokens = (chainId: string): Token[] => {
    const fallbackTokensMap: { [key: string]: Token[] } = {
      'sol': [
        { address: 'So11111111111111111111111111111111111111112', symbol: 'SOL', name: 'Solana', decimals: 9, chainId: 'sol', isNative: true, image: 'https://assets.coingecko.com/coins/images/4128/standard/solana.png' },
        { address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', symbol: 'USDC', name: 'USD Coin', decimals: 6, chainId: 'sol', isNative: false, image: 'https://assets.coingecko.com/coins/images/6319/standard/usdc.png' },
      ],
      '1': [
        { address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', symbol: 'ETH', name: 'Ethereum', decimals: 18, chainId: '1', isNative: true, image: 'https://assets.coingecko.com/coins/images/279/standard/ethereum.png' },
        { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', symbol: 'USDC', name: 'USD Coin', decimals: 6, chainId: '1', isNative: false, image: 'https://assets.coingecko.com/coins/images/6319/standard/usdc.png' },
      ],
      '56': [
        { address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', symbol: 'BNB', name: 'BNB', decimals: 18, chainId: '56', isNative: true, image: 'https://assets.coingecko.com/coins/images/825/standard/bnb-icon2_2x.png' },
        { address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', symbol: 'USDC', name: 'USD Coin', decimals: 18, chainId: '56', isNative: false, image: 'https://assets.coingecko.com/coins/images/6319/standard/usdc.png' },
      ],
      '137': [
        { address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', symbol: 'MATIC', name: 'Polygon', decimals: 18, chainId: '137', isNative: true, image: 'https://assets.coingecko.com/coins/images/4713/standard/polygon.png' },
        { address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', symbol: 'USDC', name: 'USD Coin', decimals: 6, chainId: '137', isNative: false, image: 'https://assets.coingecko.com/coins/images/6319/standard/usdc.png' },
      ],
    }
    
    return fallbackTokensMap[chainId] || []
  }

  // When chain changes, fetch its tokens
  useEffect(() => {
    if (selectedChain) {
      fetchTokens(selectedChain.chainId)
    }
  }, [selectedChain])

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

  const handleFromAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFromAmount(e.target.value)
  }

  // Get quote using Blockend Compass SDK
  const getCompassQuote = React.useCallback(async (walletAddress?: string) => {
    if (!tokenData.address || tokenData.tradeStatus !== 'active' || !selectedToken || !selectedChain) return

    try {
      const amount = parseFloat(fromAmount)
      if (isNaN(amount) || amount <= 0) {
        setCompassQuote(null)
        return
      }

      setLoading(true)
      setError(null)
      
      // Calculate input amount in smallest unit based on token decimals
      const inputAmount = (amount * Math.pow(10, selectedToken.decimals)).toString()
      
      const quotes = await getQuotes({
        fromChainId: selectedChain.chainId,
        fromAssetAddress: selectedToken.address,
        toChainId: 'sol', // Always to Solana for now (your token's chain)
        toAssetAddress: tokenData.address,
        inputAmount: inputAmount,
        inputAmountDisplay: fromAmount,
        userWalletAddress: walletAddress || '11111111111111111111111111111111',
        recipient: walletAddress || '11111111111111111111111111111111',
        slippage: Math.floor(slippage * 100),
        sortBy: 'output',
      })

      if (quotes?.data?.quotes && quotes.data.quotes.length > 0) {
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
  }, [fromAmount, slippage, tokenData.address, tokenData.tradeStatus, selectedToken, selectedChain])

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

      const txResponse = await createTransaction({
        routeId: compassQuote.routeId,
      })

      if (!txResponse?.data?.steps || txResponse.data.steps.length === 0) {
        throw new Error('No transaction steps found')
      }

      const connection = await getSolanaConnection()

      for (const step of txResponse.data.steps) {
        setTxStatus(`Executing ${step.stepType} transaction...`)

        const nextTxResponse = await getNextTxn({
          routeId: compassQuote.routeId,
          stepId: step.stepId,
        })

        if (!nextTxResponse?.data?.txnData) {
          throw new Error('No transaction data found')
        }

        let signature: string

        // Handle different network types
        if (nextTxResponse.data.txnData.txnSol?.data) {
          // Solana transaction
          const txnBuffer = Buffer.from(nextTxResponse.data.txnData.txnSol.data, 'base64')
          const transaction = VersionedTransaction.deserialize(txnBuffer)
          setTxStatus('Please approve transaction in wallet...')
          signature = await solanaWalletProvider.signAndSendTransaction(transaction)
          await connection.confirmTransaction(signature, 'confirmed')
        } else if (nextTxResponse.data.txnData.txnEvm) {
          // EVM transaction - would need EVM wallet integration
          throw new Error('EVM transactions require connected EVM wallet')
        } else {
          throw new Error('Unsupported transaction type')
        }

        console.log('Transaction signature:', signature)
        setTxStatus('Confirming transaction...')

        // Check status
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
                onBuy?.(parseFloat(fromAmount))
                
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

  const handleJupiterTrade = () => {
    const jupiterUrl = `https://jup.ag/tokens/${tokenData.address}`
    window.open(jupiterUrl, '_blank')
  }

  useEffect(() => {
    if (tokenData.address && fromAmount && tokenData.tradeStatus === 'active' && selectedToken) {
      const debounceTimer = setTimeout(() => {
        const walletAddress = solanaWalletProvider?.publicKey?.toString()
        getCompassQuote(walletAddress)
      }, 500)
      return () => clearTimeout(debounceTimer)
    }
  }, [fromAmount, slippage, tokenData.address, tokenData.tradeStatus, selectedToken, getCompassQuote, solanaWalletProvider])

  const filteredTokens = tokens.filter(token => 
    token.symbol.toLowerCase().includes(tokenSearchQuery.toLowerCase()) ||
    token.name.toLowerCase().includes(tokenSearchQuery.toLowerCase())
  )

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

      {/* From Token Selection */}
      <div className="bg-[#3d71e9] rounded-xl p-3 border border-white/20 mb-4">
        <span className="text-black font-medium text-sm mb-2 block">You pay</span>
        
        {/* Chain & Token Selector */}
        <div className="flex gap-2 mb-2">
          <button
            onClick={() => setShowChainSelector(!showChainSelector)}
            className="flex items-center gap-1 bg-black/20 rounded-lg px-2 py-1 hover:bg-black/30 transition-colors"
          >
            {selectedChain?.image && <img src={selectedChain.image} alt={selectedChain.name} className="w-4 h-4" />}
            <span className="text-black text-xs font-medium">{selectedChain?.name || 'Select Chain'}</span>
            <ChevronDown className="w-3 h-3 text-black" />
          </button>

          <button
            onClick={() => setShowTokenSelector(!showTokenSelector)}
            className="flex items-center gap-1 bg-black/20 rounded-lg px-2 py-1 hover:bg-black/30 transition-colors flex-1"
          >
            {selectedToken?.image && <img src={selectedToken.image} alt={selectedToken.symbol} className="w-4 h-4" />}
            <span className="text-black text-xs font-medium">{selectedToken?.symbol || 'Select Token'}</span>
            <ChevronDown className="w-3 h-3 text-black" />
          </button>
        </div>

        {/* Amount Input */}
        <input
          type="number"
          value={fromAmount}
          onChange={handleFromAmountChange}
          className="w-full bg-transparent text-black text-xl font-medium outline-none placeholder-gray-600"
          placeholder="0.0"
          min="0"
          step="0.1"
        />
      </div>

      {/* Chain Selector Modal */}
      {showChainSelector && (
        <div className="absolute z-30 bg-[#040A25] border border-white/20 rounded-xl p-3 mt-2 w-[calc(100%-3rem)] max-h-60 overflow-y-auto">
          <div className="text-white text-sm font-semibold mb-2">Select Chain</div>
          {chains.map((chain) => (
            <button
              key={chain.chainId}
              onClick={() => {
                setSelectedChain(chain)
                setShowChainSelector(false)
              }}
              className="w-full flex items-center gap-2 p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <img src={chain.image} alt={chain.name} className="w-6 h-6" />
              <span className="text-white text-sm">{chain.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Token Selector Modal */}
      {showTokenSelector && (
        <div className="absolute z-30 bg-[#040A25] border border-white/20 rounded-xl p-3 mt-2 w-[calc(100%-3rem)] max-h-80 overflow-hidden flex flex-col">
          <div className="text-white text-sm font-semibold mb-2">Select Token</div>
          <div className="relative mb-2">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={tokenSearchQuery}
              onChange={(e) => setTokenSearchQuery(e.target.value)}
              placeholder="Search token..."
              className="w-full bg-white/5 text-white text-sm pl-8 pr-3 py-2 rounded-lg outline-none"
            />
          </div>
          <div className="overflow-y-auto">
            {filteredTokens.map((token) => (
              <button
                key={token.address}
                onClick={() => {
                  setSelectedToken(token)
                  setShowTokenSelector(false)
                  setTokenSearchQuery('')
                }}
                className="w-full flex items-center gap-2 p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                {token.image && <img src={token.image} alt={token.symbol} className="w-6 h-6" />}
                <div className="flex flex-col items-start">
                  <span className="text-white text-sm font-medium">{token.symbol}</span>
                  <span className="text-gray-400 text-xs">{token.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* You Receive Section */}
      <div className="bg-[#3d71e9] rounded-xl p-3 border border-white/20 mb-4">
        <span className="text-black font-medium text-sm">You receive</span>
        <div className="flex items-center justify-between">
          <input
            type="text"
            value={compassQuote?.outputAmountDisplay || '...'}
            readOnly
            className="flex-1 bg-transparent text-black text-xl font-medium outline-none"
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
              <span className="font-medium text-white">~{compassQuote.estimatedTimeInSeconds}s</span>
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