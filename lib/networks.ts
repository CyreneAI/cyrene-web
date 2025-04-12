import { defineChain } from '@reown/appkit/networks';

export const peaqNetwork = defineChain({
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

export const monadTestnet = defineChain({
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
export const riseTestnet =defineChain({
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

export const NETWORK_CONFIG = {
  [riseTestnet.id]: {
    name: "Rise Testnet",
    subscriptionContract: "0xFb323A5F6ffD982cF1A4b08B826B62c07ae91620",
    explorerUrl: "https://testnet.explorer.riselabs.xyz"
  },
  [monadTestnet.id]: {
    name: "Monad Testnet",
    subscriptionContract: "0x3C7dA73dDD4F0d4FBDd048Da9c177d43775f6572",
    explorerUrl: "https://testnet.monadexplorer.com"
  }
};