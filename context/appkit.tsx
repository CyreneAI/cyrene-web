'use client'

import { createAppKit } from '@reown/appkit/react';
import { EthersAdapter } from '@reown/appkit-adapter-ethers';
import { BaseWalletAdapter, SolanaAdapter } from '@reown/appkit-adapter-solana';
import { mainnet, arbitrum, base ,solana } from '@reown/appkit/networks';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { defineChain } from '@reown/appkit/networks';

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

// Define Monad network
const monadTestnet = defineChain({
  id: 10143, // Monad testnet chain ID
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


// 1. Get projectId from https://cloud.reown.com
export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;

if (!projectId) {
  throw new Error('Project ID is not defined. Please set NEXT_PUBLIC_PROJECT_ID in your environment variables.');
}

// 2. Create a metadata object
const metadata = {
  name: 'CyreneAI',
  description: "Powering the future of AI interaction through multi-agent collaboration with self-replicating, decentralized agents. Launch agents, engage with Cyrene, and unlock new frontiers in AI, technology, and consciousness.",
  url: 'https://cyreneai.com/',
  icons: ['https://cyreneai.com/CyreneAI_logo-text.png'],
};

// 3. Set up Solana Adapter
const wallets: BaseWalletAdapter[] = [
  new PhantomWalletAdapter() as unknown as BaseWalletAdapter,
  new SolflareWalletAdapter() as unknown as BaseWalletAdapter,
];

const solanaWeb3JsAdapter = new SolanaAdapter({
  wallets,
});

// 4. Create the AppKit instance with both Ethereum and Solana adapters
createAppKit({
  adapters: [new EthersAdapter(), solanaWeb3JsAdapter],
  metadata,
  networks: [solana ,mainnet ,arbitrum, base, peaqNetwork, monadTestnet , riseTestnet],
  projectId,
  features: {
    analytics: true,
  },
  defaultNetwork: solana,
  // Theme configuration
  themeMode: 'dark',
  themeVariables: {
    '--w3m-font-family': 'Inter, sans-serif',
    '--w3m-accent': '#3B82F6',
    '--w3m-color-mix': '#3B82F6',
    '--w3m-color-mix-strength': 40
  },
  chainImages: {
    11155931: '/rise.jpg',
    3338: '/peaq.jpg', // Path to your peaq network logo
    6969: '/monad-logo.png', // Path to your Monad network logo
  }
});

export function AppKit({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}