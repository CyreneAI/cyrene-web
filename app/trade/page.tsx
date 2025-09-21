'use client'

import { useState, useEffect, Suspense } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { useAppKitAccount } from '@reown/appkit/react'
import { useAppKit } from '@reown/appkit/react'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import PageTitle from '@/components/tokens/PageTitle'
import TokenInfoCard from '@/components/tokens/TokenInfoCard'
import ChartContainer from '@/components/tokens/ChartContainer'
import TransactionSection from '@/components/tokens/TransactionSection'
import HoldersDistribution from '@/components/tokens/HoldersDistribution'
import { FixedChat } from '@/components/FixedChat'
import PoolProgressCard from '@/components/trade/PoolProgressCard'
import TradingInterface from '@/components/trade/TradingInterface'

import LiveChat from '@/components/LiveChat'
import { fetchTokenData, fetchDexScreenerData } from '@/services/tokenDataService'
import { useProjectStream } from '@/hooks/useProjectStream'
import LiveStreamPlayer from '@/components/LiveStreamPlayer'


// Types
interface TokenData {
  address: string;
  name: string;
  symbol: string;
  description: string;
  image: string;
  price: number;
  priceChange: {
    percentage: number;
    period: string;
  };
  marketCap: number;
  volume24h: number;
  holders: number;
  poolAddress?: string;
  tradeStatus: 'active' | 'graduated';
  metadataUri?: string;
}

function TradePageContent() {
  const searchParams = useSearchParams()
  const { address, isConnected } = useAppKitAccount()
  const { open } = useAppKit()
  
  // Get URL parameters
  const tokenAddress = searchParams.get('tokenAddress')
  const tokenName = searchParams.get('tokenName')
  const tokenSymbol = searchParams.get('tokenSymbol')
  const poolAddress = searchParams.get('poolAddress')
  const metadataUri = searchParams.get('metadataUri')
  const tradeStatus = searchParams.get('tradeStatus') as 'active' | 'graduated'
  const streamUrl = searchParams.get('streamUrl') // optional livestream url
  
  // State
  const [tokenData, setTokenData] = useState<TokenData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Use streaming hook - only after tokenData is available
  const { streamSource, isLive, isLoading: streamLoading } = useProjectStream(tokenData?.address)
  
  // Load token data
  useEffect(() => {
    const loadTokenData = async () => {
      if (!tokenAddress || !tokenName || !tokenSymbol) {
        setError('Missing required token parameters')
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        // Fetch data from multiple sources
        const [dexData, metadataData] = await Promise.all([
          fetchDexScreenerData(tokenAddress),
          metadataUri ? fetchTokenData(metadataUri) : Promise.resolve(null)
        ])

        // Combine data sources
        const combinedData: TokenData = {
          address: tokenAddress,
          name: tokenName,
          symbol: tokenSymbol,
          description: metadataData?.description || `${tokenName} token`,
          image: metadataData?.image || `https://api.dicebear.com/7.x/shapes/svg?seed=${tokenAddress}`,
          price: dexData?.priceUsd ? parseFloat(dexData.priceUsd) : 0,
          priceChange: {
            percentage: dexData?.priceChange?.h24 || 0,
            period: '24h'
          },
          marketCap: dexData?.marketCap || 0,
          volume24h: dexData?.volume?.h24 || 0,
          holders: dexData?.info?.holders || 0,
          poolAddress: poolAddress || undefined,
          tradeStatus: tradeStatus || 'graduated',
          metadataUri: metadataUri || undefined
        }

        setTokenData(combinedData)

      } catch (err) {
        console.error('Error loading token data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load token data')
        toast.error('Failed to load token data')
      } finally {
        setIsLoading(false)
      }
    }

    loadTokenData()
  }, [tokenAddress, tokenName, tokenSymbol, poolAddress, metadataUri, tradeStatus, streamUrl])
  
  // Handle wallet connection
  const handleConnectWallet = () => {
    if (!isConnected) {
      open()
    }
  }
  
  // Trade handlers
  const handleBuy = (amount: number) => {
    toast.info(`Buy Order Placed`, {
      description: `You placed an order to buy ${amount} ${tokenData?.symbol} tokens`,
      position: 'top-center',
    })
  }
  
  const handleSell = (amount: number) => {
    toast.info(`Sell Order Placed`, {
      description: `You placed an order to sell ${amount} ${tokenData?.symbol} tokens`,
      position: 'top-center',
    })
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 pt-32 pb-16 mt-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-400">Loading token data...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !tokenData) {
    return (
      <div className="container mx-auto px-4 pt-32 pb-16 mt-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <p className="text-red-400 mb-4">{error || 'Token not found'}</p>
              <button
                onClick={() => window.history.back()}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Background with gradient */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <Image 
          src="/abstract-luxury-gradient-blue-background-smooth-dark-blue-with-black-vignette-studio-banner_2_1.webp"
          alt="Background"
          fill
          className="object-cover"
          priority
        />
        {/* CYRENE Watermark Logo */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-10">
          <Image
            src="/Cyrene_logo_text.webp"
            alt="Cyrene Logo"
            width={800}
            height={800}
            className="w-[800px] h-auto"
          />
        </div>
      </div>

      <div className="container mx-auto px-4 pt-32 pb-16 mt-16">
        <div className="max-w-7xl mx-auto">
          {/* Page Title with breadcrumb */}
          <PageTitle 
            title="Trade" 
            breadcrumbs={[
              { label: "Explore Projects", href: "/explore-projects" },
              { label: tokenData.name }
            ]} 
          />

          {/* Trading Interface Container */}
          <div className="bg-[#242F5466] backdrop-blur-[70px] rounded-[40px] p-6 shadow-lg border border-gray-800/30">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Token Info and Chart Area - Takes up 3 columns on large screens */}
              <div className="lg:col-span-3">
                {/* 0) Token information card */}
                <TokenInfoCard 
                  symbol={tokenData.symbol}
                  name={tokenData.name}
                  description={tokenData.description}
                  image={tokenData.image}
                  marketCapDisplay={tokenData.marketCap > 0 ? `$${(tokenData.marketCap / 1000).toFixed(2)}k` : 'N/A'}
                  metrics={[
                    { 
                      label: 'Volume', 
                      value: tokenData.volume24h > 0 ? `$${(tokenData.volume24h / 1000000).toFixed(2)}M` : 'N/A' 
                    },
                    { 
                      label: 'Holders', 
                      value: tokenData.holders > 0 ? `${(tokenData.holders / 1000).toFixed(1)}k` : 'N/A' 
                    },
                    { 
                      label: 'Price', 
                      value: tokenData.price > 0 ? `$${tokenData.price.toFixed(6)}` : 'N/A' 
                    },
                    { 
                      label: 'Change 24h', 
                      value: `${tokenData.priceChange.percentage >= 0 ? '+' : ''}${tokenData.priceChange.percentage.toFixed(2)}%` 
                    },
                    { 
                      label: 'Status', 
                      value: tokenData.tradeStatus === 'active' ? 'Active' : 'Graduated' 
                    },
                  ]}
                />
                
                {/* 1) Enhanced Livestream - Only show if stream exists or is loading */}
                {(streamSource || isLive || streamLoading) && (
                  <LiveStreamPlayer
                    source={streamSource}
                    isLive={isLive}
                    className="mb-6"
                    title={`${tokenData.name} Live Stream`}
                  />
                )}

                {/* 2) Chart section */}
                <div className="bg-[#040A25] rounded-[30px] p-4 mb-6">
                  <ChartContainer 
                    tokenAddress={tokenData.address}
                    price={tokenData.price} 
                    height={380} 
                  />
                </div>

                {/* 3) REAL-TIME Transactions section */}
                <div className="bg-[#040A25] rounded-[30px] p-4 lg:row-span-2">
                  <TransactionSection 
                    className="h-[420px]"
                    tokenAddress={tokenData.address} // Pass real token address
                    limit={15}
                    showRefresh={true}
                    autoRefresh={true}
                    title="Live Transactions"
                  />
                </div>
              </div>

              {/* Trading Controls - Takes up 1 column */}
              <div className="lg:col-span-1 space-y-6">
                {/* Pool Progress (if active bonding curve) */}
                {tokenData.tradeStatus === 'active' && tokenData.poolAddress && (
                  <PoolProgressCard poolAddress={tokenData.poolAddress} />
                )}
                
                {/* Live Chat */}
                {/* <LiveChat
  roomId={tokenData.address}
  title="Live Chat" 
  isStreamLive={isLive}
  autoCreateRoom={true}
/> */}

                {/* Trading Interface */}
                <TradingInterface
                  tokenData={tokenData}
                  isConnected={isConnected}
                  onConnectWallet={handleConnectWallet}
                  onBuy={handleBuy}
                  onSell={handleSell}
                />

                {/* REAL-TIME Holders distribution */}
                <div className="bg-[#040A25] rounded-[30px] p-6">
                  <HoldersDistribution 
                    tokenAddress={tokenData.address} // Pass real token address
                    title="Live Holders"
                    showRefresh={true}
                    enableRealtime={true}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Chat component */}
      <FixedChat />
    </>
  )
}

export default function TradePage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 pt-32 pb-16 mt-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-400">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    }>
      <TradePageContent />
    </Suspense>
  )
}