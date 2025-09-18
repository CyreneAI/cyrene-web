'use client'

import { createAppKit, useAppKitAccount, useAppKitProvider, useAppKitNetworkCore } from '@reown/appkit/react';
import { EthersAdapter } from '@reown/appkit-adapter-ethers';
import { BaseWalletAdapter, SolanaAdapter } from '@reown/appkit-adapter-solana';
import { mainnet, arbitrum, base, solana, solanaTestnet, solanaDevnet } from '@reown/appkit/networks';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { defineChain } from '@reown/appkit/networks';
import React, { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import axios from 'axios';
import { BrowserProvider } from 'ethers';
import { toast } from 'sonner';
import type { Provider } from "@reown/appkit-adapter-solana/react";

declare global {
  interface Window {
    phantom?: {
      solana?: {
        signMessage: (message: Uint8Array) => Promise<{ signature: Uint8Array }>;
        isPhantom?: boolean;
      };
    };
    solflare?: {
      isSolflare?: boolean;
      signMessage: (message: Uint8Array) => Promise<{ signature: Uint8Array }>;
    };
    backpack?: {
      signMessage: (message: Uint8Array) => Promise<{ signature: Uint8Array }>;
    };
  }
}

// Define Peaq network
const peaqNetwork = defineChain({
  id: 3338,
  caipNetworkId: 'eip155:333777',
  chainNamespace: 'eip155',
  name: 'peaq',
  nativeCurrency: {
    decimals: 18,
    name: 'peaq',
    symbol: 'PEAQ',
  },
  rpcUrls: {
    default: {
      http: ['https://peaq.api.onfinality.io/public'],
      webSocket: ['wss://peaq.api.onfinality.io/public'],
    },
  },
  blockExplorers: {
    default: { name: 'peaqScan', url: 'https://peaq.subscan.io/' },
  },
});

// Define Monad Testnet
const monadTestnet = defineChain({
  id: 10143,
  caipNetworkId: 'eip155:6969',
  chainNamespace: 'eip155',
  name: 'Monad Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Monad',
    symbol: 'MON',
  },
  rpcUrls: {
    default: {
      http: ['https://testnet-rpc.monad.xyz'],
      webSocket: ['wss://testnet-rpc.monad.xyz'],
    },
  },
  blockExplorers: {
    default: { name: 'Monad Explorer', url: 'https://testnet-explorer.monad.xyz' },
  },
});

// Define Rise Testnet
const riseTestnet = defineChain({
  id: 11155931,
  caipNetworkId: 'eip155:11155931',
  chainNamespace: 'eip155',
  name: 'RISE Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Ethereum',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['https://testnet.riselabs.xyz'],
      webSocket: ['wss://testnet.riselabs.xyz/ws'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Rise Explorer',
      url: 'https://testnet.explorer.riselabs.xyz',
    },
  },
});

export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;

if (!projectId) {
  throw new Error('Project ID is not defined. Please set NEXT_PUBLIC_PROJECT_ID in your environment variables.');
}

const metadata = {
  name: 'CyreneAI',
  description: "Powering the future of AI interaction through multi-agent collaboration.",
  url: 'https://cyreneai.com/',
  icons: ['https://cyreneai.com/Cyrene_mobile_logo.webp'],
};

const wallets: BaseWalletAdapter[] = [
  new PhantomWalletAdapter() as unknown as BaseWalletAdapter,
  new SolflareWalletAdapter() as unknown as BaseWalletAdapter,
];

const solanaWeb3JsAdapter = new SolanaAdapter({
  wallets,
});

// Network ID constants
const NETWORK_IDS = {
  SOLANA: Number(solana.id),
  MAINNET: Number(mainnet.id),
  ARBITRUM: Number(arbitrum.id),
  BASE: Number(base.id),
  PEAQ: Number(peaqNetwork.id),
  MONAD: Number(monadTestnet.id),
  RISE: Number(riseTestnet.id)
};

// Helper to get chain type
const getChainType = (chainId: string | number): 'solana' | 'evm' => {
  const chainIdNum = typeof chainId === 'string' ? parseInt(chainId, 10) : chainId;
  return chainIdNum === NETWORK_IDS.SOLANA || 
         chainIdNum === Number(solanaDevnet.id) || 
         chainIdNum === Number(solanaTestnet.id) ? 'solana' : 'evm';
};

// Helper to get cookie key with chain suffix
const getChainCookieKey = (key: string, chainType: string) => {
  return `${key}_${chainType}`;
};

// Cookie management utilities
const setAuthCookies = (chainType: 'solana' | 'evm', token: string, walletAddress: string, userId: string) => {
  const options = { 
    expires: 7,
    path: '/',
    sameSite: 'Strict' as const,
    secure: process.env.NODE_ENV === 'production'
  };
  
  Cookies.set(getChainCookieKey("erebrus_token", chainType), token, options);
  Cookies.set(getChainCookieKey("erebrus_wallet", chainType), walletAddress.toLowerCase(), options);
  Cookies.set(getChainCookieKey("erebrus_userid", chainType), userId, options);
};

const clearAuthCookies = (chainType: 'solana' | 'evm') => {
  const options = { path: '/' };
  Cookies.remove(getChainCookieKey("erebrus_token", chainType), options);
  Cookies.remove(getChainCookieKey("erebrus_wallet", chainType), options);
  Cookies.remove(getChainCookieKey("erebrus_userid", chainType), options);
};

const getAuthFromCookies = (chainType: 'solana' | 'evm') => {
  return {
    token: Cookies.get(getChainCookieKey("erebrus_token", chainType)),
    wallet: Cookies.get(getChainCookieKey("erebrus_wallet", chainType)),
    userId: Cookies.get(getChainCookieKey("erebrus_userid", chainType))
  };
};

// EVM Authentication
const authenticateEVM = async (walletAddress: string, walletProvider: any) => {
  try {
    const GATEWAY_URL = "https://gateway.netsepio.com/";
    const chainName = "evm";

    const { data } = await axios.get(
      `${GATEWAY_URL}api/v1.0/flowid?walletAddress=${walletAddress}&chain=evm`
    );

    const message = data.payload.eula;
    const flowId = data.payload.flowId;

    const combinedMessage = `${message}${flowId}`;

    const provider = new BrowserProvider(walletProvider);
    if (!walletAddress) {
      throw new Error("Wallet address is undefined");
    }
    const signer = await provider.getSigner();
    const signerAddress = await signer.getAddress();

    if (signerAddress.toLowerCase() !== walletAddress?.toLowerCase()) {
      throw new Error(
        `Mismatch: Signer address (${signerAddress}) !== Connected address (${walletAddress})`
      );
    }

    let signature = await signer.signMessage(combinedMessage);

    if (signature.startsWith("0x")) {
      signature = signature.slice(2);
    }

    const authResponse = await axios.post(
      `${GATEWAY_URL}api/v1.0/authenticate`,
      {
        chainName,
        flowId,
        signature,
        walletAddress
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const { token, userId } = authResponse.data.payload;
    setAuthCookies('evm', token, walletAddress, userId);
    return true;
  } catch (error) {
    console.error("EVM Authentication error:", error);
    clearAuthCookies('evm');
    return false;
  }
};

// Solana Authentication with social login support
const authenticateSolana = async (walletAddress: string, walletProvider: Provider) => {
  try {
    const GATEWAY_URL = "https://gateway.netsepio.com/";
    const chainName = "sol";

    const { data } = await axios.get(`${GATEWAY_URL}api/v1.0/flowid`, {
      params: {
        walletAddress,
        chain: chainName,
      },
    });

    const message = data.payload.eula;
    const flowId = data.payload.flowId;

    const encodedMessage = new TextEncoder().encode(message);
    const signature = await walletProvider.signMessage(encodedMessage);
    
    const signatureHex = Array.from(new Uint8Array(signature))
      .map((b: number) => b.toString(16).padStart(2, '0'))
      .join('');

    const authResponse = await axios.post(
      `${GATEWAY_URL}api/v1.0/authenticate?walletAddress=${walletAddress}&chain=sol`,
      {
        flowId,
        signature: signatureHex,
        pubKey: walletAddress,
        walletAddress,
        message,
        chainName,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const { token, userId } = authResponse.data.payload;
    setAuthCookies('solana', token, walletAddress, userId);
    return true;
  } catch (error) {
    console.error("Solana Authentication error:", error);
    clearAuthCookies('solana');
    return false;
  }
};

// Wallet auth hook
export function useWalletAuth() {
  const { isConnected, address } = useAppKitAccount();
  const { walletProvider: evmWalletProvider } = useAppKitProvider<Provider>("eip155");
  const { walletProvider: solanaWalletProvider } = useAppKitProvider<Provider>("solana");
  const { chainId, caipNetworkId } = useAppKitNetworkCore();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState(false);

  // Get current auth status
  const getCurrentAuthStatus = () => {
    if (!isConnected || !address) return false;
    
    const chainType = caipNetworkId?.startsWith('solana:') ? 'solana' : 'evm';
    const { token, wallet } = getAuthFromCookies(chainType);
    return !!(token && wallet?.toLowerCase() === address.toLowerCase());
  };

  // Authentication function
  const authenticate = async () => {
    if (!isConnected || !address) {
      setAuthError('Wallet not connected');
      return false;
    }

    setIsAuthenticating(true);
    setAuthError(null);
    setAuthSuccess(false);

    try {
      const isSolanaChain = caipNetworkId?.startsWith('solana:') || 
                           chainId === NETWORK_IDS.SOLANA || 
                           chainId === Number(solanaDevnet.id) || 
                           chainId === Number(solanaTestnet.id);

      const chainType = isSolanaChain ? 'solana' : 'evm';
      const { token, wallet } = getAuthFromCookies(chainType);
      
      if (token && wallet?.toLowerCase() === address.toLowerCase()) {
        setAuthSuccess(true);
        return true;
      }

      if (wallet && wallet.toLowerCase() !== address.toLowerCase()) {
        clearAuthCookies(chainType);
      }

      let authResult = false;
      
      if (isSolanaChain) {
        if (!solanaWalletProvider) {
          throw new Error('Solana wallet provider not available');
        }
        authResult = await authenticateSolana(address, solanaWalletProvider);
      } else {
        if (!evmWalletProvider) {
          throw new Error('EVM wallet provider not available');
        }
        authResult = await authenticateEVM(address, evmWalletProvider);
      }

      if (authResult) {
        setAuthSuccess(true);
        toast.success('Authentication successful');
        return true;
      } else {
        throw new Error('Authentication failed');
      }
    } catch (error) {
      console.error('Authentication error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      setAuthError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Cleanup on disconnection
  useEffect(() => {
    if (!isConnected) {
      ['solana', 'evm'].forEach(chainType => {
        clearAuthCookies(chainType as 'solana' | 'evm');
      });
      setAuthSuccess(false);
    }
  }, [isConnected]);

  return {
    isConnected,
    address,
    isAuthenticated: getCurrentAuthStatus(),
    isAuthenticating,
    authError,
    authSuccess,
    authenticate,
  };
}

// AppKit provider component
export function AppKit({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

// Initialize AppKit
createAppKit({
  adapters: [new EthersAdapter(), solanaWeb3JsAdapter],
  metadata,
  networks: [solana  ],
  projectId,
  features: {
    analytics: true,
  },
  defaultNetwork: solana,
  themeMode: 'dark',
  themeVariables: {
    '--w3m-font-family': 'Inter, sans-serif',
    '--w3m-accent': '#3B82F6',
    '--w3m-color-mix': '#3B82F6',
    '--w3m-color-mix-strength': 40
  },
  chainImages: {
    11155931: '/rise.jpg',
    3338: '/peaq.jpg', 
    6969: '/monad-logo.png',
  }
});