'use client'

import { createAppKit } from '@reown/appkit/react';
import { EthersAdapter } from '@reown/appkit-adapter-ethers';
import { SolanaAdapter } from '@reown/appkit-adapter-solana';
import { mainnet, arbitrum, solana, solanaTestnet, solanaDevnet } from '@reown/appkit/networks';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';


// 1. Get projectId from https://cloud.reown.com
export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;

if (!projectId) {
  throw new Error('Project ID is not defined. Please set NEXT_PUBLIC_PROJECT_ID in your environment variables.');
}

// 2. Create a metadata object
const metadata = {
  name: 'CyreneAI',
  description: "Powering the future of AI interaction through multi-agent collaboration with self-replicating, decentralized agents. Launch agents, engage with Cyrene, and unlock new frontiers in AI, technology, and consciousness.",
  url: 'https://cyreneai.com/', // origin must match your domain & subdomain
  icons: ['https://cyreneai.com/CyreneAI_logo-text.png'],
};

// 3. Set up Solana Adapter
const solanaWeb3JsAdapter = new SolanaAdapter({
  wallets: [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
});

// 4. Create the AppKit instance with both Ethereum and Solana adapters
createAppKit({
  adapters: [new EthersAdapter(), solanaWeb3JsAdapter], // Add both adapters
  metadata,
  networks: [mainnet, arbitrum, solana, solanaTestnet, solanaDevnet], // Add all networks
  projectId,
  features: {
    analytics: true, // Optional - defaults to your Cloud configuration
  },
});

export function AppKit({ children }: { children: React.ReactNode }) {
  return <>{children}</>; // Ensure <appkit-button> is used in your app
}