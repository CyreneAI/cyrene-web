// 'use client'

// import { createAppKit, useAppKitAccount } from '@reown/appkit/react';
// import { EthersAdapter } from '@reown/appkit-adapter-ethers';
// import { BaseWalletAdapter, SolanaAdapter } from '@reown/appkit-adapter-solana';
// import { mainnet, arbitrum, base, solana } from '@reown/appkit/networks';
// import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
// import { defineChain } from '@reown/appkit/networks';
// import React, { useEffect } from 'react';
// import Cookies from 'js-cookie';
// import axios from 'axios';


// declare global {
//   interface Window {
//     phantom?: {
//       solana?: {
//         signMessage: (message: Uint8Array) => Promise<{ signature: Uint8Array }>;
//         isPhantom?: boolean;
//       };
//     };
//   }
// }



// // Define Peaq network
// const peaqNetwork = defineChain({
//   id: 3338,
//   caipNetworkId: 'eip155:333777',
//   chainNamespace: 'eip155',
//   name: 'peaq',
//   nativeCurrency: {
//     decimals: 18,
//     name: 'peaq',
//     symbol: 'PEAQ',
//   },
//   rpcUrls: {
//     default: {
//       http: ['https://peaq.api.onfinality.io/public'],
//       webSocket: ['wss://peaq.api.onfinality.io/public'],
//     },
//   },
//   blockExplorers: {
//     default: { name: 'peaqScan', url: 'https://peaq.subscan.io/' },
//   },
// });

// // Define Monad Testnet
// const monadTestnet = defineChain({
//   id: 10143,
//   caipNetworkId: 'eip155:6969',
//   chainNamespace: 'eip155',
//   name: 'Monad Testnet',
//   nativeCurrency: {
//     decimals: 18,
//     name: 'Monad',
//     symbol: 'MON',
//   },
//   rpcUrls: {
//     default: {
//       http: ['https://testnet-rpc.monad.xyz'],
//       webSocket: ['wss://testnet-rpc.monad.xyz'],
//     },
//   },
//   blockExplorers: {
//     default: { name: 'Monad Explorer', url: 'https://testnet-explorer.monad.xyz' },
//   },
// });

// // Define Rise Testnet
// const riseTestnet = defineChain({
//   id: 11155931,
//   caipNetworkId: 'eip155:11155931',
//   chainNamespace: 'eip155',
//   name: 'RISE Testnet',
//   nativeCurrency: {
//     decimals: 18,
//     name: 'Ethereum',
//     symbol: 'ETH',
//   },
//   rpcUrls: {
//     default: {
//       http: ['https://testnet.riselabs.xyz'],
//       webSocket: ['wss://testnet.riselabs.xyz/ws'],
//     },
//   },
//   blockExplorers: {
//     default: {
//       name: 'Rise Explorer',
//       url: 'https://testnet.explorer.riselabs.xyz',
//     },
//   },
// });

// export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;

// if (!projectId) {
//   throw new Error('Project ID is not defined. Please set NEXT_PUBLIC_PROJECT_ID in your environment variables.');
// }

// const metadata = {
//   name: 'CyreneAI',
//   description: "Powering the future of AI interaction through multi-agent collaboration.",
//   url: 'https://cyreneai.com/',
//   icons: ['https://cyreneai.com/CyreneAI_logo-text.png'],
// };

// const wallets: BaseWalletAdapter[] = [
//   new PhantomWalletAdapter() as unknown as BaseWalletAdapter,
//   new SolflareWalletAdapter() as unknown as BaseWalletAdapter,
// ];

// const solanaWeb3JsAdapter = new SolanaAdapter({
//   wallets,
// });

// // Network ID constants
// const NETWORK_IDS = {
//   SOLANA: Number(solana.id),
//   MAINNET: Number(mainnet.id),
//   ARBITRUM: Number(arbitrum.id),
//   BASE: Number(base.id),
//   PEAQ: Number(peaqNetwork.id),
//   MONAD: Number(monadTestnet.id),
//   RISE: Number(riseTestnet.id)
// };


// const getChainType = (chainId: number): 'solana' | 'evm' => {
//   return chainId === NETWORK_IDS.SOLANA ? 'solana' : 'evm';
// };


// const authenticateUser = async (walletAddress: string) => {
//   try {
//     const REACT_APP_GATEWAY_URL = "https://gateway.netsepio.com/";
    
    
//     const chainName = 'sol'; 

   
//     const { data } = await axios.get(`${REACT_APP_GATEWAY_URL}api/v1.0/flowid`, {
//       params: {
//         walletAddress,
//         chain: chainName
//       }
//     });

//     const { eula: message, flowId: nonce } = data.payload;

    
//     const wallet = window.phantom?.solana;
//     if (!wallet) throw new Error("Phantom wallet not found");
    
//     const encodedMessage = new TextEncoder().encode(message);
//     const { signature: sigBytes } = await wallet.signMessage(encodedMessage);
    
    
//     const signatureHex = Array.from(sigBytes)
//       .map(b => b.toString(16).padStart(2, '0'))
//       .join('');

//     // Authenticate with the signature
//     const authResponse = await axios.post(
//       `${REACT_APP_GATEWAY_URL}api/v1.0/authenticate?walletAddress=${walletAddress}&chain=sol`,
//       {
//         flowId: nonce,
//         signature: signatureHex, // Using hex format
//         pubKey: walletAddress,
//         walletAddress,
//         message,
//         chainName
//       },
//       {
//         headers: {
//           "Content-Type": "application/json",
//         }
//       }
//     );

//     const { token, userId } = authResponse.data.payload;

//     // Store authentication tokens
//     Cookies.set("erebrus_token", token, { expires: 7 });
//     Cookies.set("erebrus_wallet", walletAddress, { expires: 7 });
//     Cookies.set("erebrus_userid", userId, { expires: 7 });

//     return true;
//   } catch (error) {
//     console.error("Authentication error:", error);
//     Cookies.remove("erebrus_token");
//     Cookies.remove("erebrus_wallet");
//     Cookies.remove("erebrus_userid");
//     return false;
//   }
// };

// // Wallet auth hook
// function useWalletAuth() {
//   const { isConnected, address } = useAppKitAccount();

//   useEffect(() => {
//     if (isConnected && address) {
//       authenticateUser(address)
//         .then(success => {
//           if (success) console.log(success);
//         });
//     } else {
//       Cookies.remove("erebrus_token");
//       Cookies.remove("erebrus_wallet");
//       Cookies.remove("erebrus_userid");
//     }
//   }, [isConnected, address]);
// }

// // AppKit provider component
// export function AppKit({ children }: { children: React.ReactNode }) {
//   useWalletAuth();
//   return <>{children}</>;
// }

// // Initialize AppKit
// createAppKit({
//   adapters: [new EthersAdapter(), solanaWeb3JsAdapter],
//   metadata,
//   networks: [solana, mainnet, arbitrum, base, peaqNetwork, monadTestnet, riseTestnet],
//   projectId,
//   features: {
//     analytics: true,
//   },
//   defaultNetwork: solana,
//   themeMode: 'dark',
//   themeVariables: {
//     '--w3m-font-family': 'Inter, sans-serif',
//     '--w3m-accent': '#3B82F6',
//     '--w3m-color-mix': '#3B82F6',
//     '--w3m-color-mix-strength': 40
//   },
//   chainImages: {
//     11155931: '/rise.jpg',
//     3338: '/peaq.jpg', 
//     6969: '/monad-logo.png',
//   }
// });