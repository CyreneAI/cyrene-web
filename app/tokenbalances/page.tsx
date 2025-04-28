// app/dashboard/tokenbalances/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Search, Copy, ExternalLink } from 'lucide-react';
import { BeatLoader } from 'react-spinners';
import { toast } from 'sonner';
import { createPublicClient, http } from 'viem';
import { mainnet, arbitrum, base } from 'viem/chains';
import { PublicKey, Connection } from '@solana/web3.js';
import { Metaplex, keypairIdentity } from '@metaplex-foundation/js';
import StarCanvas from '@/components/StarCanvas';
import { GlowButton } from '@/components/ui/glow-button';
import ConnectButton from '@/components/common/ConnectBtn';
import { Alchemy, Network, NftTokenType } from "alchemy-sdk";

interface TokenBalance {
  contractAddress: string;
  tokenBalance: string;
  name?: string;
  symbol?: string;
  decimals?: number;
  logo?: string;
  type: 'ERC-20' | 'ERC-721' | 'ERC-1155' | 'other' | 'SOL-NFT';
  chain: 'ethereum' | 'arbitrum' | 'base' | 'solana';
}

interface TokenMetadataResponse {
  name?: string;
  symbol?: string;
  decimals?: number;
  logo?: string;
}

interface HeliusNFTContent {
  metadata?: {
    name?: string;
  };
  files?: Array<{
    uri?: string;
  }>;
}

interface HeliusNFT {
  id: string;
  content?: HeliusNFTContent;
}

interface HeliusResponse {
  result?: {
    items?: HeliusNFT[];
  };
}

// Define interface for MagicEden NFT
interface MagicEdenNFT {
  mintAddress: string;
  name?: string;
  symbol?: string;
  image?: string;
}

interface MagicEdenResponse {
  tokens?: MagicEdenNFT[];
}

interface NftToken {
  contract: {
    address: string;
    name?: string;
    symbol?: string;
    tokenType?: string;
    openSea?: {
      imageUrl?: string;
    };
  };
  name?: string;
  symbol?: string;
  balance?: string;
  image?: {
    cachedUrl?: string;
  };
  rawMetadata?: {
    image?: string;
  };
}

// Create clients for each chain
const ethClient = createPublicClient({
  chain: mainnet,
  transport: http(`https://eth-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`),
});

const arbClient = createPublicClient({
  chain: arbitrum,
  transport: http(`https://arb-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`),
});

const baseClient = createPublicClient({
  chain: base,
  transport: http(`https://base-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`),
});

// Solana connection
const solanaConnection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com');
const metaplex = Metaplex.make(solanaConnection);

export default function TokenBalancesPage() {
  const [tokens, setTokens] = useState<TokenBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentChain, setCurrentChain] = useState<'ethereum' | 'arbitrum' | 'base' | 'solana'>('ethereum');
  const [manualAddress, setManualAddress] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  
  // Ethereum wallet
  const { address: ethAddress, isConnected: isEthConnected } = useAppKitAccount();
  
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  useEffect(() => {
    if (isEthConnected && ethAddress) {
      setWalletAddress(ethAddress);
    } else {
      setWalletAddress(null);
    }
  }, [isEthConnected, ethAddress]);

  useEffect(() => {
    const fetchTokenBalances = async () => {
      if (!walletAddress && !manualAddress) {
        setLoading(false);
        return;
      }
    
      try {
        setLoading(true);
        const allTokens: TokenBalance[] = [];
        
        const addressToUse = manualAddress || walletAddress;
        if (!addressToUse) {
          setLoading(false);
          return;
        }
  
        // Determine if we're working with a Solana address
        const isSolanaAddress = addressToUse.length !== 42 || !addressToUse.startsWith('0x');
        
        // Only fetch tokens for the current chain and appropriate address type
        if (currentChain === 'solana') {
          const chainTokens = await fetchSolanaTokens(addressToUse);
          allTokens.push(...chainTokens);
        } else if (!isSolanaAddress) {
          // Only fetch EVM chain tokens if we have an EVM address
          if (currentChain === 'ethereum') {
            const chainTokens = await fetchEthereumTokens(addressToUse);
            allTokens.push(...chainTokens);
          } else if (currentChain === 'arbitrum') {
            const chainTokens = await fetchArbitrumTokens(addressToUse);
            allTokens.push(...chainTokens);
          } else if (currentChain === 'base') {
            const chainTokens = await fetchBaseTokens(addressToUse);
            allTokens.push(...chainTokens);
          }
        }
        
        setTokens(allTokens);
      } catch (error) {
        console.error('Error fetching Assets:', error);
        toast.error('Failed to load Assets');
      } finally {
        setLoading(false);
      }
    };
  
    fetchTokenBalances();
  }, [walletAddress, isEthConnected, ethAddress, currentChain, manualAddress]);

  const fetchSolanaTokens = async (address: string): Promise<TokenBalance[]> => {
    try {
      const heliusApiKey = process.env.NEXT_PUBLIC_HELIUS_API_KEY;
      if (heliusApiKey) {
        const heliusResponse = await fetch(
          `https://mainnet.helius-rpc.com/?api-key=${heliusApiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: '1',
              method: 'getAssetsByOwner',
              params: {
                ownerAddress: address,
                page: 1,
                limit: 1000
              }
            })
          }
        );
  
        if (heliusResponse.ok) {
          const heliusData: HeliusResponse = await heliusResponse.json();
          if (heliusData?.result?.items) {
            return heliusData.result.items.map((nft: HeliusNFT) => ({
              contractAddress: nft.id,
              tokenBalance: '1',
              name: nft.content?.metadata?.name || 'Unnamed NFT',
              symbol: '',
              logo: nft.content?.files?.[0]?.uri || '/NFT_Icon.png',
              type: 'SOL-NFT' as const,
              chain: 'solana' as const,
            }));
          }
        }
      }
  
      throw new Error('All Solana NFT fetch attempts failed');
    } catch (error) {
      console.error('Error fetching Solana NFTs:', error);
      toast.error('Failed to fetch Solana NFTs');
      return [];
    }
  };
  const fetchEthereumTokens = async (address: string): Promise<TokenBalance[]> => {
    try {
      // Fetch ERC-20 tokens
      const response = await fetch(`https://eth-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'alchemy_getTokenBalances',
          params: [address, 'erc20']
        })
      });
  
      if (!response.ok) throw new Error('Failed to fetch Ethereum tokens');
  
      const data = await response.json();
      const balances = data.result?.tokenBalances || [];
  
      // Filter out zero balances and add metadata
      const nonZeroBalances = balances.filter((token: { tokenBalance: string }) => token.tokenBalance !== '0');
      const tokensWithMetadata = await Promise.all(nonZeroBalances.map(async (token: { contractAddress: string }) => {
        const metadata = await getTokenMetadata(token.contractAddress, 'ethereum');
        return {
          ...token,
          ...metadata,
          type: 'ERC-20',
          chain: 'ethereum'
        };
      }));
  
      // Fetch NFTs using Alchemy SDK
      const nfts = await fetchNFTs(address, 'ethereum');
      return [...tokensWithMetadata, ...nfts];
    } catch (error) {
      console.error('Error fetching Ethereum tokens:', error);
      return [];
    }
  };

  const fetchArbitrumTokens = async (address: string): Promise<TokenBalance[]> => {
    try {
      const response = await fetch(`https://arb-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'alchemy_getTokenBalances',
          params: [address, 'erc20']
        })
      });

      if (!response.ok) throw new Error('Failed to fetch Arbitrum tokens');

      const data = await response.json();
      const balances = data.result?.tokenBalances || [];

      const nonZeroBalances = balances.filter((token: { tokenBalance: string }) => token.tokenBalance !== '0');
const tokensWithMetadata = await Promise.all(nonZeroBalances.map(async (token: { contractAddress: string }) => {
  const metadata = await getTokenMetadata(token.contractAddress, 'base');
  return {
    ...token,
    ...metadata,
    type: 'ERC-20',
    chain: 'base'
  };
}));

      // Fetch NFTs
      const nfts = await fetchNFTs(address, 'arbitrum');
      return [...tokensWithMetadata, ...nfts];
    } catch (error) {
      console.error('Error fetching Arbitrum tokens:', error);
      return [];
    }
  };

  const fetchBaseTokens = async (address: string): Promise<TokenBalance[]> => {
    try {
      const response = await fetch(`https://base-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'alchemy_getTokenBalances',
          params: [address, 'erc20']
        })
      });

      if (!response.ok) throw new Error('Failed to fetch Base tokens');

      const data = await response.json();
      const balances = data.result?.tokenBalances || [];

      const nonZeroBalances = balances.filter((token: { tokenBalance: string }) => token.tokenBalance !== '0');
const tokensWithMetadata = await Promise.all(nonZeroBalances.map(async (token: { contractAddress: string }) => {
  const metadata = await getTokenMetadata(token.contractAddress, 'arbitrum');
  return {
    ...token,
    ...metadata,
    type: 'ERC-20',
    chain: 'arbitrum'
  };
}));
      // Fetch NFTs
      const nfts = await fetchNFTs(address, 'base');
      return [...tokensWithMetadata, ...nfts];
    } catch (error) {
      console.error('Error fetching Base tokens:', error);
      return [];
    }
  };

  const handleManualAddressCheck = async () => {
    if (!manualAddress) {
      toast.error('Please enter a wallet address');
      return;
    }
    
    try {
      setLoading(true);
      
      // Validate address based on chain
      if (currentChain === 'solana') {
        try {
          new PublicKey(manualAddress); // Validate Solana address
        } catch {
          toast.error('Invalid Solana address');
          return;
        }
      } else {
        // Basic EVM address validation
        if (!manualAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
          toast.error('Invalid EVM address');
          return;
        }
      }

      const newTokens = await fetchTokensForChain(manualAddress, currentChain);
      setTokens(newTokens);
      toast.success(`Found ${newTokens.length} tokens for address`);
      setShowManualInput(false);
    } catch (error) {
      console.error('Error fetching manual address:', error);
      toast.error('Failed to fetch tokens for this address');
    } finally {
      setLoading(false);
    }
  };

  const fetchTokensForChain = async (address: string, chain: 'ethereum' | 'arbitrum' | 'base' | 'solana'): Promise<TokenBalance[]> => {
    switch (chain) {
      case 'ethereum': return fetchEthereumTokens(address);
      case 'arbitrum': return fetchArbitrumTokens(address);
      case 'base': return fetchBaseTokens(address);
      case 'solana': return fetchSolanaTokens(address);
      default: return [];
    }
  };

  const alchemyConfig = {
    apiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY,
    network: Network.ETH_MAINNET, // Default network
  };
  const alchemy = new Alchemy(alchemyConfig);

  const fetchNFTs = async (address: string, chain: 'ethereum' | 'arbitrum' | 'base'): Promise<TokenBalance[]> => {
    try {
      let network: Network;
      switch (chain) {
        case 'ethereum':
          network = Network.ETH_MAINNET;
          break;
        case 'arbitrum':
          network = Network.ARB_MAINNET;
          break;
        case 'base':
          network = Network.BASE_MAINNET;
          break;
        default:
          return [];
      }
  
      const chainAlchemy = new Alchemy({
        ...alchemyConfig,
        network
      });
  
      const response = await chainAlchemy.nft.getNftsForOwner(address, {
        omitMetadata: false,
        pageSize: 100
      });
  
      return response.ownedNfts.map((nft: NftToken) => {
        const contractAddress = nft.contract?.address || '';
        const name = nft.name || nft.contract?.name || 'Unnamed NFT';
        const symbol = nft.contract?.symbol || '';
        const imageUrl = nft.image?.cachedUrl || 
                        nft.rawMetadata?.image || 
                        nft.contract?.openSea?.imageUrl;
        const tokenType = (nft.contract?.tokenType as 'ERC-20' | 'ERC-721' | 'ERC-1155' | 'other') || 'other';
  
        return {
          contractAddress,
          tokenBalance: nft.balance || '1',
          name,
          symbol,
          logo: imageUrl,
          type: tokenType,
          chain: chain
        };
      });
    } catch (error) {
      console.error(`Error fetching NFTs for ${chain}:`, error);
      return [];
    }
  };
  const getTokenMetadata = async (contractAddress: string, chain: string): Promise<Partial<TokenBalance>> => {
    try {
      let url = '';
      switch (chain) {
        case 'ethereum':
          url = `https://eth-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`;
          break;
        case 'arbitrum':
          url = `https://arb-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`;
          break;
        case 'base':
          url = `https://base-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`;
          break;
        default:
          return {};
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'alchemy_getTokenMetadata',
          params: [contractAddress]
        })
      });

      if (!response.ok) return {};

      const data = await response.json();
      return data.result || {};
    } catch (error) {
      console.error('Error fetching token metadata:', error);
      return {};
    }
  };

  const filteredTokens = tokens.filter(token => {
    return (
      token.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.symbol?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.contractAddress.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const formatBalance = (balance: string, decimals: number = 18) => {
    if (!balance) return '0';
    const divisor = Math.pow(10, decimals);
    const formatted = (parseInt(balance) / divisor).toFixed(4);
    return formatted.replace(/\.?0+$/, ''); // Remove trailing zeros
  };

  const getExplorerUrl = (address: string, chain: string) => {
    switch (chain) {
      case 'ethereum':
        return `https://etherscan.io/address/${address}`;
      case 'arbitrum':
        return `https://arbiscan.io/address/${address}`;
      case 'base':
        return `https://basescan.org/address/${address}`;
      case 'solana':
        return `https://solscan.io/account/${address}`;
      default:
        return '#';
    }
  };

  if (!walletAddress && !manualAddress) {
    return (
      <>
        <StarCanvas/>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-white">Connect your wallet</h2>
            <p className="text-muted-foreground">
              Please connect your Ethereum wallet to view your Assets
            </p>
            <div className='px-20 py-3 ml-4'> <ConnectButton/></div>
            
            <div className="mt-8 max-w-md mx-auto">
              <h3 className="text-lg font-medium text-white mb-2">Or check any address</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter wallet address (0x... or Solana)"
                  value={manualAddress}
                  onChange={(e) => setManualAddress(e.target.value)}
                  className="flex-1 px-4 py-2 bg-gray-800 rounded-lg text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleManualAddressCheck}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors"
                >
                  Check
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <BeatLoader color="#2f7add" />
      </div>
    );
  }

  return (
    <>
      <StarCanvas />
      <div className="relative min-h-screen py-20 px-4 overflow-hidden">
        {/* Gradient Orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#0162FF] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" />
        <div className="absolute top-40 right-10 w-72 h-72 bg-[#A63FE1] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-[#3985FF] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000" />

        <div className="relative z-10 max-w-7xl mx-auto">
          {/* Title Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#0162FF] via-[#3985FF] to-[#A63FE1] bg-clip-text text-transparent">
              {manualAddress ? 'Assets' : 'My Assets'}
            </h1>
            <p className="mt-4 text-gray-400">
              View all tokens across multiple blockchains
            </p>
          </motion.div>

          {/* Address Display and Controls */}
          <div className="flex flex-col items-center mb-8 gap-4">
            {walletAddress && !manualAddress && (
              <div className="flex items-center gap-2 bg-gray-800/50 px-4 py-2 rounded-full">
                <span className="text-sm text-gray-300">Connected Wallet:</span>
                <span className="font-mono text-sm text-blue-300">
                  {`${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`}
                </span>
                <button 
                  onClick={() => navigator.clipboard.writeText(walletAddress)}
                  className="text-gray-400 hover:text-blue-400 transition-colors"
                  title="Copy address"
                >
                  <Copy size={16} />
                </button>
              </div>
            )}

            {manualAddress && (
              <div className="flex items-center gap-2 bg-gray-800/50 px-4 py-2 rounded-full">
                <span className="text-sm text-gray-300">Viewing Address:</span>
                <span className="font-mono text-sm text-purple-300">
                  {`${manualAddress.substring(0, 6)}...${manualAddress.substring(manualAddress.length - 4)}`}
                </span>
                <button 
                  onClick={() => navigator.clipboard.writeText(manualAddress)}
                  className="text-gray-400 hover:text-blue-400 transition-colors"
                  title="Copy address"
                >
                  <Copy size={16} />
                </button>
                <button 
                  onClick={() => window.open(getExplorerUrl(manualAddress, currentChain), '_blank')}
                  className="text-gray-400 hover:text-blue-400 transition-colors"
                  title="View on explorer"
                >
                  <ExternalLink size={16} />
                </button>
                <button 
                  onClick={() => {
                    setManualAddress('');
                    setTokens([]);
                  }}
                  className="text-gray-400 hover:text-red-400 transition-colors ml-2"
                  title="Clear address"
                >
                  <span className="text-xs">Clear</span>
                </button>
              </div>
            )}

            <div className="flex gap-2">
              {!manualAddress && (
                <button
                  onClick={() => setShowManualInput(!showManualInput)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white text-sm font-medium transition-colors"
                >
                  {showManualInput ? 'Hide Address Input' : 'Check Another Address'}
                </button>
              )}
            </div>
          </div>

          {/* Manual Address Input */}
          {showManualInput && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-8 max-w-2xl mx-auto"
            >
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
                <h3 className="text-lg font-medium text-white mb-3">Check another wallet address</h3>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    placeholder={`Enter ${currentChain} address (0x... or Solana)`}
                    value={manualAddress}
                    onChange={(e) => setManualAddress(e.target.value)}
                    className="flex-1 px-4 py-2 bg-gray-800 rounded-lg text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleManualAddressCheck}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors whitespace-nowrap"
                  >
                    Check Address
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  You can enter any EVM (0x...) or Solana wallet address
                </p>
              </div>
            </motion.div>
          )}

          {/* Chain Selector */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-wrap justify-center gap-2 mb-8"
          >
            <GlowButton
              active={currentChain === 'ethereum'}
              onClick={() => setCurrentChain('ethereum')}
            >
              Ethereum
            </GlowButton>
            <GlowButton
              active={currentChain === 'arbitrum'}
              onClick={() => setCurrentChain('arbitrum')}
            >
              Arbitrum
            </GlowButton>
            <GlowButton
              active={currentChain === 'base'}
              onClick={() => setCurrentChain('base')}
            >
              Base
            </GlowButton>
            <GlowButton
              active={currentChain === 'solana'}
              onClick={() => setCurrentChain('solana')}
            >
              Solana
            </GlowButton>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mb-8"
          >
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-100" />
              <input
                type="text"
                placeholder="Search your tokens..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-900/50 backdrop-blur-xl border border-white/10 rounded-full
                         text-white placeholder-gray-400 focus:outline-none focus:border-[#3985FF]/50
                         transition-all duration-300"
              />
            </div>
          </motion.div>

          {/* Tokens Grid */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {filteredTokens.length > 0 ? (
              filteredTokens.map((token, index) => (
                <motion.div
                  key={`${token.chain}-${token.contractAddress}-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  whileHover={{ y: -8 }}
                  className="group relative"
                >
                  {/* Card background with subtle gradient border */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-transparent to-purple-500/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
                  
                  <div className="h-full bg-gray-900/80 backdrop-blur-lg rounded-2xl overflow-hidden border border-gray-800 group-hover:border-blue-500/30 transition-all duration-300">
                    {/* NFT Image with hover overlay */}
                    <div className="relative aspect-square overflow-hidden">
                      {token.logo ? (
                        <Image
                          src={token.logo}
                          alt={token.name || 'NFT'}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = token.type.includes('NFT') ? '/NFT_Icon.png' : '/default_token.png';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                          <span className="text-2xl text-gray-500">{token.symbol?.substring(0, 3) || 'NFT'}</span>
                        </div>
                      )}
                      
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-blue-500/0 flex items-center justify-center transition-all duration-300 group-hover:bg-blue-500/20">
                        <div className="opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white w-8 h-8">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                          </svg>
                        </div>
                      </div>
                    </div>
                    
                    {/* Token Details */}
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 
                            className="font-bold text-lg text-white transition-colors duration-200 group-hover:text-blue-400 cursor-pointer"
                            onClick={() => navigator.clipboard.writeText(token.contractAddress)}
                          >
                            {token.name || 'Unnamed Token'}
                          </h3>
                          <p className="text-gray-400 text-sm">{token.symbol || 'TOKEN'}</p>
                        </div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900/50 text-blue-200">
                          {token.type}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-1">
                          <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                          </svg>
                          <span className="text-white">
                            {formatBalance(token.tokenBalance, token.decimals)}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                          </svg>
                          <span className="text-gray-400">
                            {token.chain}
                          </span>
                        </div>
                      </div>
                      
                      {/* Divider */}
                      <div className="my-3 border-t border-gray-800/50"></div>
                      
                      {/* Contract address with copy button */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                          </svg>
                          <span className="text-xs text-gray-400 truncate max-w-[120px]">
                            {token.contractAddress}
                          </span>
                        </div>
                        <button 
                          onClick={() => navigator.clipboard.writeText(token.contractAddress)}
                          className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                          title="Copy address"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <h3 className="text-xl font-medium text-gray-400">
                  {loading ? 'Loading tokens...' : 'No tokens found'}
                </h3>
                <p className="text-gray-500 mt-2">
                  {!loading && 'This address has no tokens on the selected chain'}
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </>
  );
}