'use client'

import { createAppKit, useAppKitAccount, useAppKitProvider, useAppKitNetworkCore, type Provider } from '@reown/appkit/react';
import { EthersAdapter } from '@reown/appkit-adapter-ethers';
import { BaseWalletAdapter, SolanaAdapter } from '@reown/appkit-adapter-solana';
import { mainnet, arbitrum, base, solana, solanaTestnet, solanaDevnet } from '@reown/appkit/networks';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { defineChain } from '@reown/appkit/networks';
import React, { useEffect } from 'react';
import Cookies from 'js-cookie';
import axios from 'axios';
import { BrowserProvider } from 'ethers';

declare global {
  interface Window {
    phantom?: {
      solana?: {
        signMessage: (message: Uint8Array) => Promise<{ signature: Uint8Array }>;
        isPhantom?: boolean;
      };
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
  icons: ['https://cyreneai.com/CyreneAI_logo-text.png'],
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

    const provider = new BrowserProvider(walletProvider);
    const signer = await provider.getSigner();
    const signature = await signer.signMessage(message);

    const authResponse = await axios.post(
      `${GATEWAY_URL}api/v1.0/authenticate?&chain=evm`,
      {
        flowId,
        signature,
        chainName,
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

// Solana Authentication
const authenticateSolana = async (walletAddress: string) => {
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

    const wallet = window.phantom?.solana;
    if (!wallet) throw new Error("Phantom wallet not found");

    const encodedMessage = new TextEncoder().encode(message);
    const { signature: sigBytes } = await wallet.signMessage(encodedMessage);

    const signatureHex = Array.from(sigBytes)
      .map(b => b.toString(16).padStart(2, '0'))
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
function useWalletAuth() {
  const { isConnected, address } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider<Provider>("eip155");
  const { chainId, caipNetworkId } = useAppKitNetworkCore();

  useEffect(() => {
    const handleAuthentication = async () => {
      if (!isConnected || !address) return;

      // Determine chain type
      let chainType: 'solana' | 'evm' = 'evm';
      if (caipNetworkId) {
        chainType = caipNetworkId.startsWith('solana:') ? 'solana' : 'evm';
      } else if (chainId) {
        chainType = getChainType(chainId);
      }

      // Check existing auth
      const { token, wallet } = getAuthFromCookies(chainType);
      
      if (token && wallet?.toLowerCase() === address.toLowerCase()) {
        console.log(`Already authenticated for ${chainType} chain`);
        return;
      }

      // Clear existing auth if wallet mismatch
      if (wallet && wallet.toLowerCase() !== address.toLowerCase()) {
        clearAuthCookies(chainType);
      }

      try {
        let authSuccess = false;
        
        if (chainType === 'solana') {
          if (!window.phantom?.solana) {
            console.error('Phantom wallet not detected');
            return;
          }
          authSuccess = await authenticateSolana(address);
        } else {
          if (!walletProvider) {
            console.error('EVM wallet provider not available');
            return;
          }
          authSuccess = await authenticateEVM(address, walletProvider);
        }

        if (authSuccess) {
          console.log(`Authentication successful for ${chainType} chain`);
        } else {
          console.error(`Authentication failed for ${chainType} chain`);
        }
      } catch (error) {
        console.error(`Error during ${chainType} authentication:`, error);
      }
    };

    // Add slight delay to ensure wallet is fully connected
    const timer = setTimeout(handleAuthentication, 500);
    return () => clearTimeout(timer);
  }, [isConnected, address, chainId, caipNetworkId, walletProvider]);

  // Cleanup on disconnection
  useEffect(() => {
    if (!isConnected) {
      ['solana', 'evm'].forEach(chainType => {
        clearAuthCookies(chainType as 'solana' | 'evm');
      });
    }
  }, [isConnected]);
}

// AppKit provider component
export function AppKit({ children }: { children: React.ReactNode }) {
  useWalletAuth();
  return <>{children}</>;
}

// Initialize AppKit
createAppKit({
  adapters: [new EthersAdapter(), solanaWeb3JsAdapter],
  metadata,
  networks: [solana, mainnet, arbitrum, base, peaqNetwork, monadTestnet, riseTestnet],
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