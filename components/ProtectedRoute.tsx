// components/ProtectedRoute.tsx
'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Cookies from 'js-cookie'
import { useAppKitAccount, useAppKitNetworkCore } from '@reown/appkit/react'

// Network ID constants - copied from appkit.tsx
const NETWORK_IDS = {
  SOLANA: 1, // Update with your actual solana chain ID
  MAINNET: 1,
  ARBITRUM: 42161,
  BASE: 8453,
  PEAQ: 3338,
  MONAD: 10143,
  RISE: 11155931
};

// Helper to get chain type - same as in appkit.tsx
const getChainType = (chainId: string | number): 'solana' | 'evm' => {
  const chainIdNum = typeof chainId === 'string' ? parseInt(chainId, 10) : chainId;
  return chainIdNum === NETWORK_IDS.SOLANA ? 'solana' : 'evm';
};

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { isConnected, address } = useAppKitAccount()
  const { chainId, caipNetworkId } = useAppKitNetworkCore()
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthChecked, setIsAuthChecked] = useState(false)

  // List of allowed routes without authentication
  const ALLOWED_ROUTES = ['/', '/explore-agents', '/privacy', '/terms','/explore-projects', '/launch-projects','/agents']

  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true)
      
      // Skip check for allowed routes
      if (ALLOWED_ROUTES.includes(pathname)) {
        setIsLoading(false)
        setIsAuthChecked(true)
        return
      }

      // Wait for wallet connection to settle
      await new Promise(resolve => setTimeout(resolve, 500))

      // Check authentication for both chain types
      let isAuthenticated = false;
      const chainTypes: ('solana' | 'evm')[] = ['solana', 'evm'];
      
      for (const chainType of chainTypes) {
        const token = Cookies.get(`erebrus_token_${chainType}`);
        const wallet = Cookies.get(`erebrus_wallet_${chainType}`);
        
        // Valid auth exists if there's a token and either:
        // 1. No wallet is connected currently, OR
        // 2. The connected wallet matches the authenticated wallet
        if (token && (!isConnected || !address || wallet?.toLowerCase() === address.toLowerCase())) {
          isAuthenticated = true;
          console.log(`Authenticated via ${chainType}`);
          break;
        }
      }

      if (!isAuthenticated) {
        console.log('Redirecting to home due to missing auth');
        router.push('/explore-projects');
      } else {
        console.log('Auth verified successfully');
      }

      setIsLoading(false);
      setIsAuthChecked(true);
    }

    checkAuth()
  }, [pathname, isConnected, chainId, caipNetworkId, router, address])

  if (isLoading || !isAuthChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return <>{children}</>
}
