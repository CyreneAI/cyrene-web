'use client'

import React, { useState, useEffect } from 'react'
import { X, Loader2, TrendingUp, TrendingDown, AlertCircle, Info } from 'lucide-react'
import { useAppKitProvider } from '@reown/appkit/react'
import { Connection, VersionedTransaction, SystemProgram, Transaction, PublicKey } from '@solana/web3.js'
import { toast } from 'sonner'
import type { Provider } from "@reown/appkit-adapter-solana/react"
import base58 from 'bs58'
import axios from 'axios'

interface LeverageTradingProps {
  tokenAddress: string
  tokenSymbol: string
  tokenName: string
  onClose: () => void
  isConnected: boolean
  onConnectWallet: () => void
}

interface LoanOffer {
  publicKey: string
  account: {
    interestRate: number
    collateralType: string
    maxBorrow: string
    maxExposure: string
    currentExposure: string
    nodeWallet: string
  }
  quoteToken: string
  priceVsQuote: string
  maxLeverage: number
  maxOpenPerTrade: number
  availableForOpen: number
  tags: string[]
  createdAt: string
  updatedAt: number
}

interface Position {
  positionAddress: string
  status: string
  onChainStatus?: string  // NEW: v3 field
  isActionable?: boolean   // NEW: v3 field
  initialBorrowQuote: string
  initialMarginQuote: string
  currentPrice: string
  positionLtv: number
  liquidationPrice: number
  interestAccrued: number
  apr: number
  quoteToken: {
    address: string
    symbol: string
    name: string
    decimals: number
  }
  collateralToken: {
    address: string
    symbol: string
    name: string
    decimals: number
  }
}

const TOKEN_2022_PROGRAM_ID = 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'

const LeverageTrading: React.FC<LeverageTradingProps> = ({
  tokenAddress,
  tokenSymbol,
  tokenName,
  onClose,
  isConnected,
  onConnectWallet
}) => {
  const { walletProvider } = useAppKitProvider<Provider>('solana')

  const [offers, setOffers] = useState<LoanOffer[]>([])
  const [selectedOffer, setSelectedOffer] = useState<LoanOffer | null>(null)
  const [positions, setPositions] = useState<Position[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingOffers, setLoadingOffers] = useState(false)

  // Trade parameters
  const [margin, setMargin] = useState('0.1')
  const [leverage, setLeverage] = useState(2)
  const [slippage, setSlippage] = useState(5000) // 50% in basis points for low liquidity tokens
  const [activeTab, setActiveTab] = useState<'open' | 'positions'>('open')

  const API_KEY = process.env.NEXT_PUBLIC_LAVAOS_API_KEY || ''
  const BASE_URL = 'https://lavarave.wtf/api/sdk/v1.0'
  const PARTNER_FEE_RECIPIENT = 'CWfBXH66Wa5JEPBYsqC3JWg1CLxaerumfX9e19pAwVRY'
  const PARTNER_FEE_MARKUP_BPS = 200 // 2% fee

  // Environment variables for Jito endpoints
  const JITO_TIP_ENDPOINT = process.env.NEXT_PUBLIC_JITO_TIP_ENDPOINT || 'https://bundles.jito.wtf/api/v1/bundles/tip_floor'
  const JITO_BUNDLE_ENDPOINT = process.env.NEXT_PUBLIC_JITO_BUNDLE_ENDPOINT || 'https://mainnet.block-engine.jito.wtf/api/v1/bundles'
  const JITO_TIP_ACCOUNT = process.env.NEXT_PUBLIC_JITO_TIP_ACCOUNT || 'DfXygSm4jCyNCybVYYK6DwvWqjKee8pbDmJGcLWNDXjh'

  // Check if token is Token2022
  const isToken2022 = async (mintAddress: string): Promise<boolean> => {
    try {
      const connection = getSolanaConnection()
      const accountInfo = await connection.getAccountInfo(new PublicKey(mintAddress))
      
      if (!accountInfo) {
        return false
      }
      
      return accountInfo.owner.toString() === TOKEN_2022_PROGRAM_ID
    } catch (error) {
      console.error('Error checking if token is Token2022:', error)
      return false
    }
  }

  // Send Jito bundle
  const sendJitoBundle = async (transactions: VersionedTransaction[], userPublicKey: string): Promise<string> => {
    try {
      if (!walletProvider?.signAllTransactions) {
        throw new Error('Wallet does not support signing multiple transactions')
      }

      // Get latest blockhash
      const connection = getSolanaConnection()
      const latestBlockHash = await connection.getLatestBlockhash()
      const blockhash = latestBlockHash.blockhash

      // Update blockhash for all transactions
      transactions.forEach(tx => {
        tx.message.recentBlockhash = blockhash
      })

      // Get tip estimates
      const tipEstimates = await axios.get(JITO_TIP_ENDPOINT)
      const tipFloor = Number((Number(tipEstimates.data[0].landed_tips_99th_percentile) * 2 * 1000000000).toFixed(0))
      
      if (tipFloor > 30000000) {
        throw new Error('Tip floor is too high')
      }

      console.log('Jito tip amount:', tipFloor, 'lamports')

      // Create tip transaction
      const tipTransaction = new Transaction()
      tipTransaction.add(SystemProgram.transfer({
        fromPubkey: new PublicKey(userPublicKey),
        toPubkey: new PublicKey(JITO_TIP_ACCOUNT),
        lamports: tipFloor,
      }))
      tipTransaction.recentBlockhash = blockhash
      tipTransaction.feePayer = new PublicKey(userPublicKey)

      // Prepare all transactions for signing
      const allTransactions = [tipTransaction, ...transactions]

      // Sign all transactions with wallet
      const signedTxs = await walletProvider.signAllTransactions(allTransactions)
      if (!signedTxs) {
        throw new Error('Failed to sign transactions')
      }

      // Send Jito bundle
      const sendBundle = async () => {
        await axios.post(JITO_BUNDLE_ENDPOINT, {
          jsonrpc: '2.0',
          id: 1,
          method: 'sendBundle',
          params: [
            signedTxs.map((tx: any) => {
              if (tx instanceof Transaction) {
                const serialized = tx.serialize({ requireAllSignatures: false, verifySignatures: false })
                return btoa(String.fromCharCode(...serialized))
              } else {
                const serialized = tx.serialize()
                return btoa(String.fromCharCode(...serialized))
              }
            }),
            {
              encoding: 'base64',
            },
          ],
        })
      }

      // Retry logic
      const RETRIES = 3
      const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms))

      for (let attempt = 1; attempt <= RETRIES; attempt++) {
        try {
          await sendBundle()
          console.log('Jito bundle sent successfully')
          break
        } catch (err) {
          if (attempt < RETRIES) {
            console.error(`Bundle attempt ${attempt} failed. Retrying...`)
            await delay(1000)
            continue
          }
          console.error('All bundle attempts failed:', err)
          throw err
        }
      }

      // Return the signature of the last transaction (the main transaction)
      const lastTx = signedTxs[signedTxs.length - 1]
      const signature = lastTx instanceof Transaction 
        ? lastTx.signatures[0].signature 
        : lastTx.signatures[0]
      
      if (!signature) {
        throw new Error('Failed to get transaction signature')
      }
      
      return base58.encode(signature)
    } catch (error) {
      console.error('Error sending Jito bundle:', error)
      throw error
    }
  }

  // Fetch loan offers
  const fetchOffers = async () => {
    setLoadingOffers(true)
    try {
      const SOL_MINT = 'So11111111111111111111111111111111111111112'
      
      // Fetch all offers first
      const response = await fetch(
        `${BASE_URL}/offers`,
        {
          headers: {
            'x-api-key': API_KEY,
            'accept': 'application/json'
          }
        }
      )

      if (!response.ok) throw new Error('Failed to fetch offers')

      const allOffers = await response.json()
      console.log('All available offers:', allOffers.length)
      console.log('Looking for token:', tokenAddress)

      // Filter offers for this specific collateral token
      const matchingOffers = allOffers.filter((offer: LoanOffer) =>
        offer.account.collateralType === tokenAddress
      )

      console.log('Matching offers found:', matchingOffers.length)
      console.log('Matching offers:', matchingOffers)

      if (matchingOffers.length > 0) {
        // Prioritize SOL-based offers over USDC
        const solOffers = matchingOffers.filter((o: LoanOffer) => o.quoteToken === SOL_MINT)
        const usdcOffers = matchingOffers.filter((o: LoanOffer) => o.quoteToken !== SOL_MINT)
        
        console.log('SOL-based offers:', solOffers.length)
        console.log('USDC-based offers:', usdcOffers.length)
        
        // Use SOL offers first if available, otherwise use USDC
        const prioritizedOffers = [...solOffers, ...usdcOffers]
        setOffers(prioritizedOffers)
        setSelectedOffer(prioritizedOffers[0])
        
        // Warn if only USDC offers available
        if (solOffers.length === 0 && usdcOffers.length > 0) {
          toast.warning(
            'Only USDC-based leverage available. If your token has low USDC liquidity, the transaction may fail. Consider tokens with better liquidity.',
            { duration: 8000 }
          )
        }
      } else {
        // Show available collateral types for debugging
        const availableCollaterals = [...new Set(allOffers.map((o: LoanOffer) => o.account.collateralType))]
        console.log('Available collateral types:', availableCollaterals)

        toast.error(
          `No leverage offers for this token. This token may not be supported for leverage trading yet.`,
          { duration: 5000 }
        )
      }
    } catch (error) {
      console.error('Error fetching offers:', error)
      toast.error('Failed to load leverage offers')
    } finally {
      setLoadingOffers(false)
    }
  }

  // Fetch user positions
  const fetchPositions = async () => {
    if (!walletProvider?.publicKey) return

    try {
      // Use v3 endpoint with includeInactionable to see pending positions
      const response = await fetch(
        `${BASE_URL}/positions/v3?status=all&userPubKey=${walletProvider.publicKey.toString()}&includeInactionable=true`,
        {
          headers: {
            'x-api-key': API_KEY,
            'accept': 'application/json'
          }
        }
      )

      if (!response.ok) {
        const errorText = await response.text()
        console.error('API Error Response:', errorText)
        throw new Error(`Failed to fetch positions: ${response.status}`)
      }

      const data = await response.json()
      console.log('Positions API Response:', data)

      // Handle array response
      const positionsArray: Position[] = Array.isArray(data) ? data : []

      // Filter for current token (include all statuses to show pending positions)
      const tokenPositions = positionsArray.filter(
        (pos: Position) => pos.collateralToken?.address === tokenAddress
      )
      
      console.log('Filtered token positions:', tokenPositions)
      setPositions(tokenPositions)
    } catch (error) {
      console.error('Error fetching positions:', error)
      setPositions([])
    }
  }

  useEffect(() => {
    fetchOffers()
  }, [tokenAddress])

  useEffect(() => {
    if (isConnected && activeTab === 'positions') {
      fetchPositions()
    }
  }, [isConnected, activeTab, walletProvider])

  const getSolanaConnection = () => {
    return new Connection(
      `https://mainnet.helius-rpc.com/?api-key=${process.env.NEXT_PUBLIC_HELIUS_API_KEY}`,
      { commitment: 'confirmed', confirmTransactionInitialTimeout: 120000 }
    )
  }

  // Open leveraged position with splitTransaction support
  const openPosition = async () => {
    if (!selectedOffer || !walletProvider?.publicKey) return

    setLoading(true)
    try {
      const marginAmount = parseFloat(margin)

      // Validate inputs
      if (marginAmount < 0.01) {
        toast.error('Minimum margin is 0.01 SOL')
        setLoading(false)
        return
      }

      if (leverage < 1 || leverage > selectedOffer.maxLeverage) {
        toast.error(`Leverage must be between 1x and ${selectedOffer.maxLeverage}x`)
        setLoading(false)
        return
      }

      // Calculate total position size
      const totalPositionSOL = marginAmount * leverage
      const availableSOL = selectedOffer.availableForOpen / 1e9

      if (totalPositionSOL > availableSOL) {
        toast.error(`Position too large. Max available: ${availableSOL.toFixed(2)} SOL`)
        setLoading(false)
        return
      }

      // Check if token is Token2022
      const needsSplitTransaction = await isToken2022(tokenAddress)
      console.log('Token requires split transaction:', needsSplitTransaction)

      const requestBody = {
        offerId: selectedOffer.publicKey,
        marginSOL: Math.floor(marginAmount * 1e9),  // Convert SOL to lamports
        leverage: Number(leverage.toFixed(2)),
        quoteToken: selectedOffer.quoteToken,
        slippage: Number(slippage),
        userPubKey: walletProvider.publicKey.toString(),
        partnerFeeRecipient: PARTNER_FEE_RECIPIENT,
        partnerFeeMarkupBps: Number(PARTNER_FEE_MARKUP_BPS),
        splitTransaction: needsSplitTransaction
      }

      console.log('Opening position with:', requestBody)

      let response: Response
      let attempts = 0
      const maxAttempts = 2

      while (attempts < maxAttempts) {
        try {
          console.log(`Attempt ${attempts + 1} - Request body:`, JSON.stringify(requestBody, null, 2))
          
          response = await fetch(`${BASE_URL}/positions/open`, {
            method: 'POST',
            headers: {
              'x-api-key': API_KEY,
              'Content-Type': 'application/json',
              'accept': 'application/json'
            },
            body: JSON.stringify(requestBody)
          })

          if (response.ok) {
            break
          }

          const errorData = await response.json()
          console.error(`Attempt ${attempts + 1} failed:`, errorData)

          // If 400 error and first attempt, try with opposite splitTransaction value
          if (response.status === 400 && attempts === 0) {
            console.warn(`Retrying with splitTransaction: ${!requestBody.splitTransaction}`)
            requestBody.splitTransaction = !requestBody.splitTransaction
            attempts++
            continue
          }

          // On final attempt, throw the error
          throw new Error(errorData.message || 'Failed to create position')
        } catch (error) {
          if (attempts === maxAttempts - 1) {
            throw error
          }
          attempts++
        }
      }

      const data = await response!.json()

      if (!data.transaction) {
        throw new Error('No transaction returned from API')
      }

      let signature: string

      // Check if response contains transaction array (splitTransaction case)
      if (Array.isArray(data.transaction)) {
        console.log('Processing split transactions with Jito bundle')
        const transactions = data.transaction.map((tx: string) => VersionedTransaction.deserialize(base58.decode(tx)))
        signature = await sendJitoBundle(transactions, walletProvider.publicKey.toString())
      } else {
        // Single transaction case
        console.log('Processing single transaction')
        const txBuffer = Buffer.from(data.transaction, 'base64')
        const transaction = VersionedTransaction.deserialize(txBuffer)
        
        const connection = getSolanaConnection()
        signature = await walletProvider.signAndSendTransaction(transaction)
        await connection.confirmTransaction(signature, 'confirmed')
      }

      toast.success('Leverage position opened successfully!')
      
      // Poll for position updates since it takes time to sync
      toast.info('Waiting for position to sync...', { duration: 3000 })
      
      // Poll every 3 seconds for up to 30 seconds
      let pollAttempts = 0
      const maxPollAttempts = 10
      
      const pollInterval = setInterval(async () => {
        pollAttempts++
        await fetchPositions()
        
        if (positions.length > 0 || pollAttempts >= maxPollAttempts) {
          clearInterval(pollInterval)
          if (positions.length > 0) {
            toast.success('Position synced successfully!')
          }
        }
      }, 3000)
      
      setActiveTab('positions')
    } catch (error) {
      console.error('Error opening position:', error)
      
      // Provide more helpful error messages
      const errorMessage = error instanceof Error ? error.message : 'Failed to open position'
      
      if (errorMessage.includes('No valid quotes available')) {
        toast.error(
          'Cannot find swap route for this token. Try: 1) Increasing slippage to 50%+, 2) Using a larger margin (0.5+ SOL), or 3) This token may have insufficient liquidity.',
          { duration: 7000 }
        )
      } else {
        toast.error(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  // Close position with splitTransaction support
  const closePosition = async (position: Position) => {
    if (!walletProvider?.publicKey || !selectedOffer) return

    setLoading(true)
    try {
      // Check if token is Token2022
      const needsSplitTransaction = await isToken2022(position.collateralToken.address)
      console.log('Token requires split transaction for closing:', needsSplitTransaction)

      const requestBody = {
        positionId: position.positionAddress,
        offerId: selectedOffer.publicKey,
        quoteToken: position.quoteToken?.address || 'So11111111111111111111111111111111111111112',
        slippage: slippage,
        userPubKey: walletProvider.publicKey.toString(),
        partnerFeeRecipient: PARTNER_FEE_RECIPIENT,
        partnerFeeMarkupBps: PARTNER_FEE_MARKUP_BPS,
        splitTransaction: needsSplitTransaction
      }

      let response: Response
      let attempts = 0
      const maxAttempts = 2

      while (attempts < maxAttempts) {
        try {
          console.log(`Close attempt ${attempts + 1} - Request body:`, JSON.stringify(requestBody, null, 2))
          
          response = await fetch(`${BASE_URL}/positions/sell`, {
            method: 'POST',
            headers: {
              'x-api-key': API_KEY,
              'Content-Type': 'application/json',
              'accept': 'application/json'
            },
            body: JSON.stringify(requestBody)
          })

          if (response.ok) {
            break
          }

          const errorData = await response.json()
          console.error(`Close attempt ${attempts + 1} failed:`, errorData)

          // If 400 error and first attempt, try with opposite splitTransaction value
          if (response.status === 400 && attempts === 0) {
            console.warn(`Retrying close with splitTransaction: ${!requestBody.splitTransaction}`)
            requestBody.splitTransaction = !requestBody.splitTransaction
            attempts++
            continue
          }

          // On final attempt, throw the error
          throw new Error(errorData.message || 'Failed to close position')
        } catch (error) {
          if (attempts === maxAttempts - 1) {
            throw error
          }
          attempts++
        }
      }

      const data = await response!.json()
      let signature: string

      // Check if response contains transaction array (splitTransaction case)
      if (Array.isArray(data.transaction)) {
        console.log('Processing split transactions with Jito bundle')
        const transactions = data.transaction.map((tx: string) => VersionedTransaction.deserialize(base58.decode(tx)))
        signature = await sendJitoBundle(transactions, walletProvider.publicKey.toString())
      } else {
        // Single transaction case
        console.log('Processing single transaction')
        const txBuffer = Buffer.from(data.transaction, 'base64')
        const transaction = VersionedTransaction.deserialize(txBuffer)

        const connection = getSolanaConnection()
        signature = await walletProvider.signAndSendTransaction(transaction)
        await connection.confirmTransaction(signature, 'confirmed')
      }

      toast.success('Position closed successfully!')
      fetchPositions()
    } catch (error) {
      console.error('Error closing position:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to close position')
    } finally {
      setLoading(false)
    }
  }

  const calculatePotentialReturn = () => {
    if (!margin || !leverage) return 0
    return parseFloat(margin) * leverage
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#040A25] rounded-3xl border border-gray-700/50 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[#040A25] border-b border-gray-700/50 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-blue-400" />
              Leverage Trading
            </h2>
            <p className="text-gray-400 text-sm mt-1">{tokenName} ({tokenSymbol})</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700/50">
          <button
            onClick={() => setActiveTab('open')}
            className={`flex-1 py-4 text-sm font-medium transition ${
              activeTab === 'open'
                ? 'text-white border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Open Position
          </button>
          <button
            onClick={() => setActiveTab('positions')}
            className={`flex-1 py-4 text-sm font-medium transition ${
              activeTab === 'positions'
                ? 'text-white border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            My Positions
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'open' ? (
            <div className="space-y-6">
              {/* Offer Selection */}
              {loadingOffers ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                </div>
              ) : offers.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No leverage offers available for this token</p>
                </div>
              ) : (
                <>
                  {/* Selected Offer Info */}
                  {selectedOffer && (
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                      <div className="grid grid-cols-3 gap-4 text-sm mb-2">
                        <div>
                          <p className="text-gray-400">APR</p>
                          <p className="text-white font-semibold">{selectedOffer.account.interestRate}%</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Max Leverage</p>
                          <p className="text-white font-semibold">{selectedOffer.maxLeverage.toFixed(2)}x</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Available</p>
                          <p className="text-white font-semibold">{(selectedOffer.availableForOpen / 1e9).toFixed(2)} SOL</p>
                        </div>
                      </div>
                      <div className="text-xs text-gray-400 pt-2 border-t border-blue-500/30">
                        Quote Token: {selectedOffer.quoteToken === 'So11111111111111111111111111111111111111112' ? 'SOL' : 
                                     selectedOffer.quoteToken === 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' ? 'USDC' : 
                                     selectedOffer.quoteToken.slice(0, 4) + '...' + selectedOffer.quoteToken.slice(-4)}
                      </div>
                    </div>
                  )}

                  {/* Margin Input */}
                  <div>
                    <label className="block text-gray-300 mb-2">Margin (SOL)</label>
                    <input
                      type="number"
                      value={margin}
                      onChange={(e) => setMargin(e.target.value)}
                      className="w-full bg-gray-800/50 border border-gray-600 rounded-lg px-4 py-3 text-white"
                      placeholder="0.1"
                      min="0.01"
                      step="0.01"
                    />
                  </div>

                  {/* Leverage Slider */}
                  <div>
                    <label className="block text-gray-300 mb-2">
                      Leverage: {leverage.toFixed(2)}x
                    </label>
                    <input
                      type="range"
                      min="1"
                      max={selectedOffer?.maxLeverage || 4}
                      step="0.1"
                      value={leverage}
                      onChange={(e) => setLeverage(parseFloat(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>1x</span>
                      <span>{selectedOffer?.maxLeverage.toFixed(2) || 4}x max</span>
                    </div>
                  </div>

                  {/* Slippage Slider */}
                  <div>
                    <label className="block text-gray-300 mb-2">
                      Slippage Tolerance: {(slippage / 100).toFixed(1)}%
                    </label>
                    <input
                      type="range"
                      min="500"
                      max="10000"
                      step="100"
                      value={slippage}
                      onChange={(e) => setSlippage(parseInt(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>5%</span>
                      <span>100%</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Higher slippage helps with low-liquidity tokens
                    </p>
                  </div>

                  {/* Calculation Display */}
                  <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Your Margin:</span>
                      <span className="text-white font-medium">{margin} SOL</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Borrowed:</span>
                      <span className="text-white font-medium">
                        {(parseFloat(margin) * (leverage - 1)).toFixed(4)} SOL
                      </span>
                    </div>
                    <div className="flex justify-between text-sm border-t border-gray-700/50 pt-2">
                      <span className="text-gray-400">Total Position:</span>
                      <span className="text-white font-semibold">
                        {calculatePotentialReturn().toFixed(4)} SOL
                      </span>
                    </div>
                  </div>

                  {/* Warning */}
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 flex gap-3">
                    <Info className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                    <p className="text-yellow-200 text-sm">
                      Leverage trading involves significant risk. You can lose more than your initial margin if the market moves against you.
                    </p>
                  </div>

                  {/* Action Button */}
                  {isConnected ? (
                    <button
                      onClick={openPosition}
                      disabled={loading || !selectedOffer || !margin}
                      className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-400 text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Opening Position...
                        </>
                      ) : (
                        <>
                          <TrendingUp className="w-5 h-5" />
                          Open Leveraged Position
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={onConnectWallet}
                      className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-400 text-white font-semibold rounded-xl hover:opacity-90 transition"
                    >
                      Connect Wallet
                    </button>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {positions.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <TrendingDown className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No active positions</p>
                </div>
              ) : (
                positions.map((position) => (
                  <div key={position.positionAddress} className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-4">
                    {/* Position Status Badge */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        position.status === 'active' ? 'bg-green-500/20 text-green-400' :
                        position.onChainStatus === 'EXECUTED' ? 'bg-green-500/20 text-green-400' :
                        position.onChainStatus === 'ONCHAIN' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {position.status.toUpperCase()}
                      </span>
                      {position.onChainStatus && position.onChainStatus !== 'EXECUTED' && (
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-500/20 text-blue-400">
                          {position.onChainStatus}
                        </span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-gray-400 text-sm">Margin</p>
                        <p className="text-white font-medium">{parseFloat(position.initialMarginQuote).toFixed(4)} SOL</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Borrowed</p>
                        <p className="text-white font-medium">{parseFloat(position.initialBorrowQuote).toFixed(4)} SOL</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Current Price</p>
                        <p className="text-white font-medium">${parseFloat(position.currentPrice).toFixed(6)}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">LTV</p>
                        <p className="text-white font-medium">{(position.positionLtv * 100).toFixed(2)}%</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => closePosition(position)}
                        disabled={loading}
                        className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition text-sm font-medium"
                      >
                        Close Position
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default LeverageTrading