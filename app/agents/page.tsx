// app/dashboard/agents/page.tsx
'use client';

import { useCallback, useEffect, useState } from 'react';

import { useWallet } from '@solana/wallet-adapter-react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Loader2, Search, Copy, ExternalLink, BookOpen, MessageSquare, Settings, Zap, Shield, Globe, Cpu, Terminal, Coins, TrendingUp, CheckCircle } from 'lucide-react';
import { BeatLoader } from 'react-spinners';
import { toast } from 'sonner';
import StarCanvas from '@/components/StarCanvas';
import { GlowButton } from '@/components/ui/glow-button';
import ConnectButton from '@/components/common/ConnectBtn';
import { useRouter } from 'next/navigation';
import { setupConfigWithWallet, QUOTE_MINTS, type QuoteMintType } from '@/helper/meteoraServices/createConfig';
import createPool from '@/helper/meteoraServices/createPool';
import { PublicKey, Transaction, Keypair } from '@solana/web3.js';
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import type { Provider } from "@reown/appkit-adapter-solana/vue";
import CurveVisualization from '@/components/ui/CurveVisualization';

import { useVanityAddress } from '@/hooks/useVanityAddress';
import { VanityAddressProgress } from '@/components/VanityAddressProgress';

import { usePoolStatus } from '@/hooks/usePoolStatus'; 
import { DbcTradeModal } from '@/components/DbcTradeModal';

interface Agent {
  id: string;
  name: string;
  description: string;
  avatar_img: string;
  cover_img: string;
  status: 'active' | 'paused' | 'stopped';
  created_at: string;
  clients?: string[];
  telegram_bot_token?: string;
  discord_application_id?: string;
  discord_token?: string;
  domain?: string;
  server_domain?: string;
  voice_model?: string;
  organization?: string;
  wallet_address?: string;
  character_file?: string;
}

interface AgentTokenData {
  contractAddress: string;
  dbcPoolAddress: string;
  configAddress: string;
  quoteMint: QuoteMintType;
  tokenName: string;
  tokenSymbol: string;
  dammPoolAddress?: string; // Optional: will be filled in after graduation
}

const useReownWalletAdapter = () => {
  const { address, isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider<Provider>("solana");
  
  return {
    publicKey: address ? new PublicKey(address) : null,
    isConnected,
    signTransaction: async (transaction: Transaction) => {
      if (!walletProvider || !address) {
        throw new Error("Wallet not connected");
      }
      return await walletProvider.signTransaction(transaction);
    },
    signAllTransactions: async (transactions: Transaction[]) => {
      if (!walletProvider || !address) {
        throw new Error("Wallet not connected");
      }
      return await walletProvider.signAllTransactions(transactions);
    }
  };
};

interface TokenLaunchParams {
  totalTokenSupply: number;
  migrationQuoteThreshold: number;
  quoteMint: QuoteMintType;
  name: string;
  symbol: string;
  image: string;
  description: string;
}

interface PriceData {
  [key: string]: {
    usd: number;
  };
}

interface ConversionRate {
  solToUsd: number;
  cyaiToUsd: number;
  solToCyai: number;
  cyaiToSol: number;
}

interface WalletAdapter {
  publicKey: PublicKey | null;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
  isConnected: boolean;
}

interface VanityAddressHookReturn {
  isGenerating: boolean;
  progress: number;
  attempts: number;
  estimatedTime: string;
  hasVanityAddress: boolean;
  startGeneration: () => void;
  stopGeneration: () => void;
  restartGeneration: () => void;
  consumeVanityKeypair: () => Keypair | null;
}

interface TokenLaunchModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallet: WalletAdapter;
  onLaunchSuccess: (data: {
    contractAddress: string;
    dbcPoolAddress: string;
    configAddress: string;
    quoteMint: QuoteMintType;
    tokenName: string;
    tokenSymbol: string;
  }) => void;
  vanityAddress: VanityAddressHookReturn;
}

interface MessageContent {
  text: string;
}

interface MessageExample {
  user: string;
  content: MessageContent;
}

interface CharacterData {
  oneLiner: string;
  description: string;
  bio: string[];
  lore: string[];
  knowledge: string[];
  messageExamples: MessageExample[][];
  settings: Record<string, unknown>;
  modelProvider?: string;
}

const parseCharacterFile = (characterFile: string): CharacterData => {
  try {
    return JSON.parse(characterFile);
  } catch (error) {
    console.error('Error parsing character file:', error);
    return {
      oneLiner: '',
      description: '',
      bio: [],
      lore: [],
      knowledge: [],
      messageExamples: [],
      settings: {}
    };
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Vanity Address Section Component
const VanityAddressSection: React.FC<{ vanityAddress: VanityAddressHookReturn }> = ({ vanityAddress }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.15 }}
    className="space-y-6"
  >
    <div className="flex items-center gap-3 pb-3">
      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
        <Zap className="w-4 h-4 text-white" />
      </div>
      <h4 className="text-xl font-semibold text-white">Vanity Address</h4>
    </div>
    
    <VanityAddressProgress
      isGenerating={vanityAddress.isGenerating}
      progress={vanityAddress.progress}
      attempts={vanityAddress.attempts}
      estimatedTime={vanityAddress.estimatedTime}
      hasVanityAddress={vanityAddress.hasVanityAddress}
      onStart={vanityAddress.startGeneration}
      onStop={vanityAddress.stopGeneration}
      onRestart={vanityAddress.restartGeneration}
      suffix="CYAI"
    />

    {vanityAddress.hasVanityAddress && (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-r from-green-900/20 to-emerald-900/20 border border-green-500/30 rounded-lg p-4"
      >
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle className="w-5 h-5 text-green-400" />
          <span className="text-green-400 font-semibold">Vanity Address Ready!</span>
        </div>
        <p className="text-gray-300 text-sm">
          Your token will use a custom address ending with <span className="font-mono text-purple-300">CYAI</span>
        </p>
        <div className="mt-2 text-xs text-gray-400">
          This makes your token contract address more memorable and brandable.
        </div>
      </motion.div>
    )}
  </motion.div>
);

const TokenLaunchModal: React.FC<TokenLaunchModalProps> = ({ 
  isOpen, 
  onClose, 
  wallet,
  onLaunchSuccess,
  vanityAddress
}) => {
  const [params, setParams] = useState<TokenLaunchParams>({
    totalTokenSupply: 1000000000,
    migrationQuoteThreshold: 210,
    quoteMint: 'SOL' as QuoteMintType,
    name: '',
    symbol: '',
    image: '',
    description: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [conversionRates, setConversionRates] = useState<ConversionRate | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);

  // Fetch real-time prices
  useEffect(() => {
    const fetchPrices = async () => {
      setPriceLoading(true);
      try {
        // Using CoinGecko API for real-time prices
        const response = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd'
        );
        const data: PriceData = await response.json();
        
        // For CYAI, we'll use a placeholder price since it might not be on CoinGecko yet
        // Replace this with actual API call when CYAI is listed
        const cyaiPrice = 0.05; // Placeholder price in USD
        
        const solPrice = data.solana?.usd || 0;
        
        setConversionRates({
          solToUsd: solPrice,
          cyaiToUsd: cyaiPrice,
          solToCyai: solPrice > 0 && cyaiPrice > 0 ? solPrice / cyaiPrice : 0,
          cyaiToSol: solPrice > 0 && cyaiPrice > 0 ? cyaiPrice / solPrice : 0
        });
      } catch (error) {
        console.error('Error fetching prices:', error);
        // Fallback prices
        setConversionRates({
          solToUsd: 100, // Fallback SOL price
          cyaiToUsd: 0.05, // Fallback CYAI price
          solToCyai: 2000,
          cyaiToSol: 0.0005
        });
      } finally {
        setPriceLoading(false);
      }
    };

    if (isOpen) {
      fetchPrices();
      // Refresh prices every 30 seconds
      const interval = setInterval(fetchPrices, 30000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const formatPrice = (price: number) => {
    if (price < 0.01) return price.toFixed(6);
    if (price < 1) return price.toFixed(4);
    return price.toFixed(2);
  };

  const getConvertedThreshold = () => {
    if (!conversionRates) return params.migrationQuoteThreshold;
    
    if (params.quoteMint === 'SOL') {
      return params.migrationQuoteThreshold;
    } else {
      // Convert from SOL equivalent to CYAI
      return Math.round(params.migrationQuoteThreshold * conversionRates.solToCyai);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setParams(prev => ({
      ...prev,
      [name]: name === 'totalTokenSupply' || name === 'migrationQuoteThreshold' 
        ? Number(value) 
        : value
    }));
  };

  const handleQuoteMintChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newQuoteMint = e.target.value as QuoteMintType;
    setParams(prev => ({
      ...prev,
      quoteMint: newQuoteMint,
      // Auto-convert threshold when switching quote mints
      migrationQuoteThreshold: conversionRates ? 
        (newQuoteMint === 'SOL' ? 
          Math.round(prev.migrationQuoteThreshold * conversionRates.cyaiToSol) : 
          Math.round(prev.migrationQuoteThreshold * conversionRates.solToCyai)
        ) : prev.migrationQuoteThreshold
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!wallet.publicKey || !wallet.isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    // Validate form
    if (!params.name || !params.symbol || !params.image || !params.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('Starting token launch process...');
      
      // Step 1: Setup config with wallet
      toast.info('Setting up configuration...');
      const configResult = await setupConfigWithWallet(wallet, {
        totalTokenSupply: params.totalTokenSupply,
        migrationQuoteThreshold: params.migrationQuoteThreshold,
        quoteMint: params.quoteMint
      });
      
      if (!configResult.success || !configResult.configAddress) {
        throw new Error(configResult.error || 'Failed to create config');
      }

      console.log('Config created successfully:', configResult.configAddress);
      toast.info('Creating token pool...');

      // Get vanity keypair if available
      const vanityKeypair = vanityAddress.consumeVanityKeypair();

      if (vanityKeypair) {
        console.log('Using vanity address:', vanityKeypair.publicKey.toBase58());
        toast.info('🎉 Using vanity address ending with CYAI!');
      } else {
        console.log('No vanity address available, using standard generation');
        toast.info('Using standard address generation');
      }

      // Step 2: Create pool using the config address
      const poolResult = await createPool({
        configAddress: configResult.configAddress,
        name: params.name,
        symbol: params.symbol,
        image: params.image,
        description: params.description,
        vanityKeypair: vanityKeypair || undefined
      });

      if (!poolResult.success) {
        throw new Error(poolResult.error || 'Failed to create pool');
      }

      console.log('Pool created successfully:', poolResult.dbcPoolAddress);
      // Show success message with vanity address info
      if (poolResult.isVanityAddress) {
        toast.success(`🎉 Token launched with vanity address! Pool: ${poolResult.dbcPoolAddress?.slice(0, 8)}...${poolResult.dbcPoolAddress?.slice(-8)}`);
      } else {
        toast.success(`Token launched successfully! Pool: ${poolResult.dbcPoolAddress?.slice(0, 8)}...${poolResult.dbcPoolAddress?.slice(-8)}`);
      }

      onLaunchSuccess({
        contractAddress: poolResult.contractAddress || '',
        dbcPoolAddress: poolResult.dbcPoolAddress || '',
        configAddress: configResult.configAddress,
        quoteMint: params.quoteMint,
        tokenName: params.name,
        tokenSymbol: params.symbol,
      });
      
      // Close modal on success
      onClose();
      
      // Reset form
      setParams({
        totalTokenSupply: 1000000000,
        migrationQuoteThreshold: 210,
        quoteMint: 'SOL' as QuoteMintType,
        name: '',
        symbol: '',
        image: '',
        description: ''
      });

      setTimeout(() => {
        vanityAddress.restartGeneration();
      }, 1000);
      
    } catch (error) {
      console.error('Token launch error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to launch token';
      toast.error(errorMessage);
      // Don't close modal on error so user can try again
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 rounded-2xl border border-white/20 shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden relative flex flex-col"
      >
        {/* Animated background gradient orbs */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-xl opacity-60 animate-pulse" />
        <div className="absolute bottom-0 right-0 w-40 h-40 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-xl opacity-60 animate-pulse animation-delay-1000" />
        
        {/* Header with enhanced styling */}
        <div className="relative z-10 px-8 py-6 border-b border-white/10 bg-gradient-to-r from-blue-600/10 to-purple-600/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Launch Your Token
                </h3>
                <p className="text-gray-400 text-sm">Create and deploy your custom token</p>
              </div>
            </div>
            <motion.button 
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose} 
              className="w-10 h-10 rounded-full bg-gray-800/50 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 flex items-center justify-center text-gray-400 hover:text-red-400 transition-all duration-200"
              disabled={isLoading}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </motion.button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="relative z-10 flex-1 overflow-y-auto px-8 py-6">
          <form onSubmit={handleSubmit} className="space-y-8 pb-4">
            {/* Token Configuration Section with enhanced styling */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3 pb-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                  <Settings className="w-4 h-4 text-white" />
                </div>
                <h4 className="text-xl font-semibold text-white">Token Configuration</h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                    <Cpu className="w-4 h-4 text-blue-400" />
                    Total Token Supply
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="totalTokenSupply"
                      value={params.totalTokenSupply}
                      onChange={handleInputChange}
                      className="w-full bg-gray-800/50 backdrop-blur-sm text-white px-4 py-3 rounded-xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 hover:border-white/20"
                      required
                      disabled={isLoading}
                      min="1"
                    />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/5 to-purple-500/5 pointer-events-none" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                    <Shield className="w-4 h-4 text-green-400" />
                    Migration Quote Threshold
                    {conversionRates && (
                      <span className="text-xs text-gray-500">
                        (~${formatPrice((params.migrationQuoteThreshold * (params.quoteMint === 'SOL' ? conversionRates.solToUsd : conversionRates.cyaiToUsd)))} USD)
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="migrationQuoteThreshold"
                      value={params.migrationQuoteThreshold}
                      onChange={handleInputChange}
                      className="w-full bg-gray-800/50 backdrop-blur-sm text-white px-4 py-3 rounded-xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all duration-200 hover:border-white/20"
                      required
                      disabled={isLoading}
                      min="1"
                      step="0.000001"
                    />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-500/5 to-blue-500/5 pointer-events-none" />

                  </div>
                  {conversionRates && params.quoteMint === 'CYAI' && (
                    <div className="text-xs text-gray-500 pl-1">
                      Equivalent to ~{formatPrice(params.migrationQuoteThreshold * conversionRates.cyaiToSol)} SOL
                    </div>
                  )}
                  {conversionRates && params.quoteMint === 'SOL' && (
                    <div className="text-xs text-gray-500 pl-1">
                      Equivalent to ~{formatPrice(params.migrationQuoteThreshold * conversionRates.solToCyai)} CYAI
                    </div>
                  )}
                </div>

                {/* Quote Mint Selection */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                    <Coins className="w-4 h-4 text-yellow-400" />
                    Quote Token
                    {priceLoading && (
                      <div className="animate-spin w-3 h-3 border border-gray-400 border-t-transparent rounded-full"></div>
                    )}
                  </label>
                  <div className="relative">
                    <select
                      name="quoteMint"
                      value={params.quoteMint}
                      onChange={handleQuoteMintChange}
                      className="w-full bg-gray-800/50 backdrop-blur-sm text-white px-4 py-3 rounded-xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 transition-all duration-200 hover:border-white/20 appearance-none cursor-pointer"
                      required
                      disabled={isLoading}
                    >
                      {Object.entries(QUOTE_MINTS).map(([key, mint]) => (
                        <option key={key} value={key} className="bg-gray-800 text-white">
                          {mint.name} ({mint.fullSymbol})
                          {conversionRates && ` - ${formatPrice(key === 'SOL' ? conversionRates.solToUsd : conversionRates.cyaiToUsd)}`}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-500/5 to-orange-500/5 pointer-events-none" />
                    {/* Custom dropdown arrow */}
                    <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  {/* Quote mint info with real-time data */}
                  <div className="bg-gray-800/30 rounded-lg p-3 text-xs">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-400">Selected Token:</span>
                      <span className="text-white font-medium">
                       {QUOTE_MINTS[params.quoteMint].name}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-400">Price:</span>
                      <span className="text-green-400 font-medium">
                        {conversionRates ? 
                          `${formatPrice(params.quoteMint === 'SOL' ? conversionRates.solToUsd : conversionRates.cyaiToUsd)}` : 
                          'Loading...'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-400">Decimals:</span>
                      <span className="text-blue-400">{QUOTE_MINTS[params.quoteMint].decimals}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Address:</span>
                      <span className="text-gray-300 font-mono">{QUOTE_MINTS[params.quoteMint].address.slice(0, 8)}...</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Enhanced Curve Visualization with better styling */}
              <div className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <CurveVisualization 
  totalSupply={params.totalTokenSupply}
  migrationThreshold={params.migrationQuoteThreshold}
  solPrice={conversionRates?.solToUsd || 100} // Pass the actual SOL price
/>
              </div>
            </motion.div>

            <VanityAddressSection vanityAddress={vanityAddress} />
            {/* Token Metadata Section with enhanced styling */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3 pb-3">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <Globe className="w-4 h-4 text-white" />
                </div>
                <h4 className="text-xl font-semibold text-white">Token Metadata</h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Token Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="name"
                      value={params.name}
                      onChange={handleInputChange}
                      className="w-full bg-gray-800/50 backdrop-blur-sm text-white px-4 py-3 rounded-xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200 hover:border-white/20"
                      placeholder="Enter token name"
                      required
                      disabled={isLoading}
                    />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/5 to-pink-500/5 pointer-events-none" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Token Symbol
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="symbol"
                      value={params.symbol}
                      onChange={handleInputChange}
                      className="w-full bg-gray-800/50 backdrop-blur-sm text-white px-4 py-3 rounded-xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50 transition-all duration-200 hover:border-white/20 uppercase"
                      placeholder="Enter symbol (e.g., BTC)"
                      required
                      disabled={isLoading}
                      maxLength={10}
                    />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-pink-500/5 to-purple-500/5 pointer-events-none" />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Image URL
                </label>
                <div className="relative">
                  <input
                    type="url"
                    name="image"
                    value={params.image}
                    onChange={handleInputChange}
                    className="w-full bg-gray-800/50 backdrop-blur-sm text-white px-4 py-3 rounded-xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-200 hover:border-white/20"
                    placeholder="https://example.com/token-image.png"
                    required
                    disabled={isLoading}
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/5 to-blue-500/5 pointer-events-none" />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Description
                </label>
                <div className="relative">
                  <textarea
                    name="description"
                    value={params.description}
                    onChange={handleInputChange}
                    className="w-full bg-gray-800/50 backdrop-blur-sm text-white px-4 py-3 rounded-xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-200 hover:border-white/20 min-h-[100px] resize-y"
                    placeholder="Enter token description"
                    required
                    disabled={isLoading}
                    maxLength={100}
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500/5 to-purple-500/5 pointer-events-none" />
                </div>
                <div className="text-right text-xs text-gray-500">
                  {params.description.length}/100 characters
                </div>
              </div>
            </motion.div>
          </form>
        </div>

        {/* Enhanced Action Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="relative z-10 flex-shrink-0 px-8 py-6 border-t border-white/10 bg-gradient-to-r from-gray-900/50 to-gray-800/50 backdrop-blur-sm"
        >
          <div className="flex justify-end gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-gray-700/50 hover:bg-gray-600/50 text-white rounded-xl border border-white/10 hover:border-white/20 transition-all duration-200 backdrop-blur-sm"
              disabled={isLoading}
            >
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              onClick={handleSubmit}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl flex items-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Loader2 className="w-5 h-5" />
                  </motion.div>
                  <span>Launching...</span>
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  <span>Launch Token</span>
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default function UserAgentsPage() {
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [showIntegrationModal, setShowIntegrationModal] = useState(false);
  const [showTokenLaunchModal, setShowTokenLaunchModal] = useState(false);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [activeTab, setActiveTab] = useState('html');
  const [widgetConfig, setWidgetConfig] = useState({
    primaryColor: '#1366d9',
    position: 'bottom-right',
    size: 'medium'
  });

  const vanityAddress = useVanityAddress({
    suffix: 'CYAI',
    autoStart: true, // Start generating as soon as user lands on page
    maxAttempts: Infinity
  });

  // Get wallet adapter
  const walletAdapter = useReownWalletAdapter();
  const [agentTokenData, setAgentTokenData] = useState<AgentTokenData | null>(null);

  const getTokenDataForAgent = (agentId: string): AgentTokenData | null => {
    const data = localStorage.getItem(`agent_token_${agentId}`);
    return data ? JSON.parse(data) : null;
  };

  const saveTokenDataForAgent = (agentId: string, data: AgentTokenData) => {
    localStorage.setItem(`agent_token_${agentId}`, JSON.stringify(data));
  };
  
  // Wallets
  const { address: ethAddress, isConnected: isEthConnected } = useAppKitAccount();
  const { publicKey: solAddress, connected: isSolConnected } = useWallet();
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [peerid, setPeerid] = useState<string | null>(null);

  useEffect(() => {
    if (isEthConnected && ethAddress) {
      setWalletAddress(ethAddress);
    } else if (isSolConnected && solAddress) {
      setWalletAddress(solAddress.toBase58());
    } else {
      setWalletAddress(null);
    }
  }, [isEthConnected, isSolConnected, ethAddress, solAddress]);

  useEffect(() => {
    const fetchAgents = async () => {
      if (!walletAddress) {
        setLoading(false);
        return;
      }
    
      try {
        setLoading(true);
        const response = await fetch(`/api/getAgentsbyWallet?walletAddress=${walletAddress}`);
    
        if (!response.ok) {
          throw new Error('Failed to fetch agents');
        }
    
        const data = await response.json();
        const agentsArray = Array.isArray(data) ? data : data.agents || [];
        setAgents(agentsArray);
        if (agentsArray.length > 0) {
          setSelectedAgent(agentsArray[0]);
        }
      } catch (error) {
        console.error('Error fetching agents:', error);
        toast.error('Failed to load your agents');
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();
  }, [walletAddress]);

  useEffect(() => {
    if (selectedAgent?.id) {
      // Clear previous agent's token data to prevent state pollution
      setAgentTokenData(null);
      
      // Get token data specific to this agent
      const tokenData = getTokenDataForAgent(selectedAgent.id);
      setAgentTokenData(tokenData);
      
      // Fetch peer ID for this specific agent
      fetchPeerIdForAgent(selectedAgent.id).then(setPeerid);
    }
  }, [selectedAgent?.id]);

  const filteredAgents = agents.filter(agent => {
    return agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           (agent.character_file && agent.character_file.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  useEffect(() => {
    return () => {
      // Optional: Clean up vanity address generation when user leaves the page
      // This is optional - you might want to keep it running
      if (!vanityAddress.hasVanityAddress) {
        vanityAddress.stopGeneration();
      }
    };
  }, [vanityAddress.hasVanityAddress, vanityAddress.stopGeneration]);

  const VanityStatusIndicator = () => (
    <div className="fixed bottom-4 right-4 z-40">
      {vanityAddress.isGenerating && !vanityAddress.hasVanityAddress && (
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
          className="bg-gray-900/95 backdrop-blur-sm border border-purple-500/30 rounded-lg p-3 shadow-lg max-w-xs"
        >
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full"
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white">Generating Vanity Address</div>
              <div className="text-xs text-gray-400 truncate">
                {vanityAddress.attempts.toLocaleString()} attempts • {vanityAddress.estimatedTime}
              </div>
            </div>
          </div>
        </motion.div>
      )}
      
      {vanityAddress.hasVanityAddress && (
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
          className="bg-green-900/95 backdrop-blur-sm border border-green-500/30 rounded-lg p-3 shadow-lg max-w-xs"
        >
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <div className="flex-1">
              <div className="text-sm font-medium text-white">Vanity Address Ready!</div>
              <div className="text-xs text-gray-300">Ends with CYAI</div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );

  const handleTokenLaunchSuccess = (data: {
    contractAddress: string;
    dbcPoolAddress: string;
    configAddress: string;
    quoteMint: QuoteMintType;
    tokenName: string;
    tokenSymbol: string;
  }) => {
    if (!selectedAgent?.id) {
      toast.error('No agent selected');
      return;
    }
    
    console.log(`Token launched successfully for agent ${selectedAgent.id}:`, data);
    
    const fullTokenData: AgentTokenData = { ...data };
    saveTokenDataForAgent(selectedAgent.id, fullTokenData);
    setAgentTokenData(fullTokenData);
    setShowTokenLaunchModal(false);
    
    toast.success(`Token launched for ${selectedAgent.name}!`);
  };
  
  // Callback for when the final AMM pool is derived
  const handleDammDerived = useCallback((dammPoolAddress: string) => {
    if (!selectedAgent?.id || !agentTokenData) {
      console.warn('handleDammDerived called but missing selectedAgent or agentTokenData');
      return;
    }
    
    console.log(`Handling DAMM derivation for agent ${selectedAgent.id}: ${dammPoolAddress}`);
    
    // Update the existing token data with the new dammPoolAddress
    const updatedTokenData = { 
      ...agentTokenData, 
      dammPoolAddress 
    };
    
    saveTokenDataForAgent(selectedAgent.id, updatedTokenData);
    setAgentTokenData(updatedTokenData); // Trigger UI re-render
    toast.success(`Token for ${selectedAgent.name} graduated! AMM Pool is ready.`);
  }, [selectedAgent?.id, agentTokenData]);

  // Use the custom hook to monitor the pool status
  const { isGraduated, isLoading: isPoolStatusLoading } = usePoolStatus({
    configAddress: agentTokenData?.configAddress || null,
    contractAddress: agentTokenData?.contractAddress || null,
    dbcPoolAddress: agentTokenData?.dbcPoolAddress || null,
    quoteMint: agentTokenData?.quoteMint || null,
    onDammDerive: handleDammDerived,
  });

  const clearAllTokenData = () => {
    const keys = Object.keys(localStorage).filter(key => key.startsWith('agent_token_'));
    keys.forEach(key => localStorage.removeItem(key));
    setAgentTokenData(null);
    toast.info('All token data cleared');
  };
  
  const fetchPeerIdForAgent = async (agentId: string): Promise<string | null> => {
    try {
      const response = await fetch('https://gateway.netsepio.com/api/v1.0/agents');
      const data = await response.json();
  
      for (const item of data.agents) {
        for (const agent of item.agents.agents) {
          if (agent.id === agentId) {
            return item.node.peerId;
          }
        }
      }
  
      return null;
    } catch (error) {
      console.error("Failed to fetch agents", error);
      return null;
    }
  };

  const generateSnippet = () => {
    if (!selectedAgent) return '';
    
    const domain = selectedAgent.domain;
    const baseSnippet = `window.aiChatConfig = {
      chatUrl: 'https://${domain}/${selectedAgent.id}/message',
      agentInfoUrl: 'https://gateway.netsepio.com/api/v1.0/agents/${peerid}/${selectedAgent.id}',
      agentName: '${selectedAgent.name}',
      primaryColor: '${widgetConfig.primaryColor}',
      position: '${widgetConfig.position}',
      size: '${widgetConfig.size}'
    };`;
    
    if (activeTab === 'html') {
      return `<!-- Configure the widget (place before the script) -->
  <script>
    ${baseSnippet}
  </script>
  
  <!-- AI Chat Widget -->
  <script src="https://cyreneai.com/chatbot/index.js"></script>`;
    } else if (activeTab === 'react') {
      return `import { ErebrusChat } from '@erebrus/chat-widget';
  
  function App() {
    return (
      <ErebrusChat
        config={{
          ${baseSnippet.replace(/\n/g, '\n        ')}
        }}
      />
    );
  }`;
    } else if (activeTab === 'nextjs') {
      return `'use client';
  
  import { ErebrusChat } from '@erebrus/chat-widget';
  
  export default function ChatWidget() {
    return (
      <ErebrusChat
        config={{
          ${baseSnippet.replace(/\n/g, '\n        ')}
        }}
      />
    );
  }`;
    }
    return '';
  };

  if (!walletAddress) {
    return (
      <>
        <StarCanvas/>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-white">Connect your wallet</h2>
            <p className="text-muted-foreground">
              Please connect your wallet to view your agents
            </p>
            <div className='px-20 py-3 ml-4'> <ConnectButton/></div>
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

        <div className="relative z-10 max-w-7xl mx-auto mb-8">
          {/* Title Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#0162FF] via-[#3985FF] to-[#A63FE1] bg-clip-text text-transparent py-4">
              My Agents
            </h1>
            <p className="mt-4 text-gray-400">
              Manage and interact with your personal AI agents
            </p>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-12"
          >
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-100" />
              <input
                type="text"
                placeholder="Search your agents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-900/50 backdrop-blur-xl border border-white/10 rounded-full
                         text-white placeholder-gray-400 focus:outline-none focus:border-[#3985FF]/50
                         transition-all duration-300"
              />
            </div>
          </motion.div>

          <VanityStatusIndicator />

          {/* Main Content */}
          {filteredAgents.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center min-h-[40vh] space-y-4"
            >
              <p className="text-muted-foreground">
                Launch your first agent to get started
              </p>
              <Link href="/launch-agent">
                <GlowButton
                  style={{
                    padding: '0.6em 2em',
                    borderRadius: '10px',
                    fontSize: '16px',
                    fontWeight: '500'
                  }}
                >
                  Launch Agent
                </GlowButton>
              </Link>
            </motion.div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Left Panel - Agent List */}
              <div className="w-full lg:w-1/3">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="space-y-4"
                >
                  {filteredAgents.map((agent, index) => (
                    <motion.div
                      key={agent.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      whileHover={{ y: -5 }}
                      className={`p-4 rounded-xl backdrop-blur-xl border ${selectedAgent?.id === agent.id ? 'border-[#3985FF] bg-gray-900/50' : 'border-white/10 bg-gray-900/30'} cursor-pointer transition-all`}
                      onClick={() => setSelectedAgent(agent)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative w-16 h-16 rounded-full overflow-hidden">
                          <Image
                            src={agent.avatar_img ? `https://ipfs.erebrus.io/ipfs/${agent.avatar_img}` : "/cyrene_profile.png"}
                            alt={agent.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <h3 className="font-bold text-white truncate">{agent.name}</h3>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              agent.status === 'active' ? 'bg-green-900/50 text-green-400' :
                              agent.status === 'paused' ? 'bg-yellow-900/50 text-yellow-400' :
                              'bg-red-900/50 text-red-400'
                            }`}>
                              {agent.status}
                            </span>
                          </div>
                          {agent.character_file && (
                            <p className="text-sm text-gray-400 truncate">
                              {parseCharacterFile(agent.character_file).oneLiner}
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </div>

              {/* Right Panel - Agent Details */}
              {selectedAgent && (
                <div className="w-full lg:w-2/3">
                  <div className="bg-gray-900/50 backdrop-blur-xl rounded-xl border border-white/10 overflow-hidden">
                    {/* Cover Image */}
                    <div className="relative w-full h-48 rounded-t-xl overflow-hidden">
                      <Image
                        src={selectedAgent.cover_img ? `https://ipfs.erebrus.io/ipfs/${selectedAgent.cover_img}` : "/cyrene_cover_2-1-85.png"}
                        alt={`${selectedAgent.name} cover`}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 to-transparent" />
                    </div>

                    {/* Agent Header */}
                    <div className="flex flex-col md:flex-row gap-6 px-6 -mt-16 mb-6">
                      <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-gray-900 shadow-xl">
                        <Image
                          src={selectedAgent.avatar_img ? `https://ipfs.erebrus.io/ipfs/${selectedAgent.avatar_img}` : "/cyrene_profile.png"}
                          alt={selectedAgent.name}
                          fill
                          className="object-cover"
                        />
                      </div>

                      <div className="flex-1 pt-4 ">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className='flex flex-col gap-12'>
                            <h2 className="text-2xl font-bold text-white">{selectedAgent.name}</h2>
                            {selectedAgent.character_file && (
                              <p className="text-lg text-blue-300">
                                {parseCharacterFile(selectedAgent.character_file).oneLiner}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              selectedAgent.status === 'active' ? 'bg-green-900/50 text-green-400' :
                              selectedAgent.status === 'paused' ? 'bg-yellow-900/50 text-yellow-400' :
                              'bg-red-900/50 text-red-400'
                            }`}>
                              {selectedAgent.status}
                            </span>
                            <span className="px-3 py-1 rounded-full bg-blue-900/50 text-blue-400 text-xs font-medium">
                              {selectedAgent.organization || 'cyrene'}
                            </span>
                          </div>
                        </div>

                        {selectedAgent.character_file && (
                          <p className="mt-2 text-gray-300">
                            {parseCharacterFile(selectedAgent.character_file).description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Main Content */}
                    <div className="p-6">
                      {/* Quick Actions */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <GlowButton
                          onClick={() => router.push(`/explore-agents/chat/${selectedAgent.id}`)}
                          className="w-full"
                        >
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Chat
                        </GlowButton>

                        <button
                          onClick={() => setShowModal(true)}
                          className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        >
                          <Terminal className="w-4 h-4" />
                          Integration Code
                        </button>

                        {!agentTokenData ? (
                    // STATE 1: No token launched yet
                    <button onClick={() => setShowTokenLaunchModal(true)} className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors">
                      <Zap className="w-4 h-4" />
                      Launch Token
                    </button>
                  ) : isPoolStatusLoading ? (
                    // STATE 2: Checking pool status
                    <button disabled className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-600 text-white rounded-lg cursor-wait">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Checking Status...
                    </button>
                  ) : agentTokenData.dammPoolAddress ? (
                    // STATE 3: Graduated and DAMM pool is ready
                    <a href={`https://jup.ag/swap/SOL-${agentTokenData.contractAddress}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
                      <ExternalLink className="w-4 h-4" />
                      Trade on Jupiter
                    </a>
                  ) : isGraduated ? (
                    // STATE 4: Graduated, but waiting for derivation to complete
                     <button disabled className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg cursor-wait">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Finalizing Pool...
                    </button>
                  ) : (
                    // STATE 5: Launched but not graduated yet
                    <button onClick={() => setShowTradeModal(true)} className="flex items-center justify-center gap-2 px-4 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors">
                      <TrendingUp className="w-4 h-4" />
                      Trade Now
                    </button>
                  )}

                        {selectedAgent.clients?.includes('telegram') && (
                          <a
                            href={`https://t.me/${selectedAgent.name.toLowerCase()}_bot`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 px-4 py-3 bg-[#0088cc] hover:bg-[#0077aa] text-white rounded-lg transition-colors"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.14-.26.26-.534.26l.213-3.053 5.56-5.023c.24-.213-.054-.334-.373-.121l-6.87 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z"/>
                            </svg>
                            Telegram
                          </a>
                        )}

                        {selectedAgent.clients?.includes('discord') && (
                          <a
                            href={`https://discord.com/api/oauth2/authorize?client_id=${selectedAgent.discord_application_id}&permissions=0&scope=bot`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 px-4 py-3 bg-[#5865F2] hover:bg-[#4752c4] text-white rounded-lg transition-colors"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                            </svg>
                            Discord
                          </a>
                        )}
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* About Section */}
                        <div className="bg-gray-900/30 rounded-lg p-5 border border-white/10">
                          <div className="flex items-center gap-2 mb-4">
                            <BookOpen className="w-5 h-5 text-blue-400" />
                            <h3 className="text-lg font-semibold text-white">About</h3>
                          </div>
                          {selectedAgent.character_file ? (
                            <div className="space-y-4">
                              <div>
                                <h4 className="text-sm font-medium text-gray-400 mb-1">Description</h4>
                                <p className="text-gray-300">
                                  {parseCharacterFile(selectedAgent.character_file).description}
                                </p>
                              </div>
                              <div>
                                <h4 className="text-sm font-medium text-gray-400 mb-1">Knowledge</h4>
                                <p className="text-gray-300">
                                  {parseCharacterFile(selectedAgent.character_file).knowledge.join(' ')}
                                </p>
                              </div>
                              <div>
                                <h4 className="text-sm font-medium text-gray-400 mb-1">Example Messages</h4>
                                <div className="space-y-2">
                                  {parseCharacterFile(selectedAgent.character_file).messageExamples.slice(0, 2).map((example: MessageExample[], idx: number) => (
                                    <div key={idx} className="bg-gray-800/50 p-3 rounded">
                                      <p className="text-blue-300 text-sm">{example[0].user}: {example[0].content.text}</p>
                                      <p className="text-green-300 text-sm mt-1">{example[1].user}: {example[1].content.text}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <p className="text-gray-400">No description available</p>
                          )}
                        </div>

                        {/* Technical Details */}
                        <div className="bg-gray-900/30 rounded-lg p-5 border border-white/10">
                          <div className="flex items-center gap-2 mb-4">
                            <Settings className="w-5 h-5 text-blue-400" />
                            <h3 className="text-lg font-semibold text-white">Agent Details</h3>
                          </div>
                          <div className="space-y-4">
                            <div>
                              <h4 className="text-sm font-medium text-gray-400 mb-1">Agent ID</h4>
                              <div className="flex items-center gap-2">
                                <p className="text-gray-300 font-mono text-sm">{selectedAgent.id}</p>
                                <button
                                  onClick={() => copyToClipboard(selectedAgent.id)}
                                  className="text-gray-400 hover:text-white"
                                  title="Copy to clipboard"
                                >
                                  <Copy className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            <div>
                              <h4 className="text-sm font-medium text-gray-400 mb-1">Domain</h4>
                              <div className="flex items-center gap-2">
                                <a
                                  href={`https://${selectedAgent.domain}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-400 hover:underline flex items-center gap-1"
                                >
                                  {selectedAgent.domain}
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            </div>

                            <div>
                              <h4 className="text-sm font-medium text-gray-400 mb-1">Created At</h4>
                              <p className="text-gray-300">{formatDate(selectedAgent.created_at)}</p>
                            </div>

                            <div>
                              <h4 className="text-sm font-medium text-gray-400 mb-1">Voice Model</h4>
                              <p className="text-gray-300">{selectedAgent.voice_model || 'Not specified'}</p>
                            </div>

                            <div>
                              <h4 className="text-sm font-medium text-gray-400 mb-1">Connected Clients</h4>
                              <div className="flex flex-wrap gap-2 mt-1">
                                {selectedAgent.clients ? (
                                  (typeof selectedAgent.clients === 'string' 
                                    ? JSON.parse(selectedAgent.clients) 
                                    : selectedAgent.clients
                                  ).map((client: string) => (
                                    <span key={client} className="px-2 py-1 bg-blue-900/30 text-blue-300 rounded text-xs">
                                      {client}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-gray-400">No connected clients</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Advanced Info */}
                        <div className="bg-gray-900/30 rounded-lg p-5 border border-white/10 lg:col-span-2">
                          <div className="flex items-center gap-2 mb-4">
                            <Zap className="w-5 h-5 text-blue-400" />
                            <h3 className="text-lg font-semibold text-white">Advanced Information</h3>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="text-sm font-medium text-gray-400 mb-1">Server Domain</h4>
                              <p className="text-gray-300 font-mono text-sm">{selectedAgent.server_domain}</p>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-gray-400 mb-1">Wallet Address</h4>
                              <div className="flex items-center gap-2">
                                <p className="text-gray-300 font-mono text-sm truncate">{selectedAgent.wallet_address}</p>
                                <button
                                  onClick={() => copyToClipboard(selectedAgent.wallet_address || '')}
                                  className="text-gray-400 hover:text-white"
                                  title="Copy to clipboard"
                                >
                                  <Copy className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-gray-400 mb-1">Model Provider</h4>
                              <p className="text-gray-300">
                                {selectedAgent.character_file && parseCharacterFile(selectedAgent.character_file).modelProvider || 'Not specified'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Integration Code Modal */}
      {showModal && selectedAgent && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl border border-white/10 max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Integrate {selectedAgent.name} with your app</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white"
              >
                &times;
              </button>
            </div>

            {/* Widget Configuration Section */}
            <div className="mb-6 bg-gray-800/50 p-4 rounded-lg">
              <h4 className="text-lg font-semibold text-white mb-4">Widget Configuration</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Primary Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Primary Color</label>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <input
                        type="color"
                        value={widgetConfig.primaryColor}
                        onChange={(e) => setWidgetConfig({...widgetConfig, primaryColor: e.target.value})}
                        className="w-6 h-6 cursor-pointer absolute opacity-0"
                      />
                      <div 
                        className="w-6 h-6 rounded border border-gray-500"
                        style={{ backgroundColor: widgetConfig.primaryColor }}
                      />
                    </div>
                    <input
                      type="text"
                      value={widgetConfig.primaryColor}
                      onChange={(e) => setWidgetConfig({...widgetConfig, primaryColor: e.target.value})}
                      className="w-28 bg-gray-700 text-white px-2 py-1 rounded text-sm h-8"
                    />
                  </div>
                </div>

                {/* Position */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Position</label>
                  <select
                    value={widgetConfig.position}
                    onChange={(e) => setWidgetConfig({...widgetConfig, position: e.target.value})}
                    className="w-full bg-gray-700 text-white px-3 py-1 rounded text-sm"
                  >
                    <option value="top-right">Top Right</option>
                    <option value="top-left">Top Left</option>
                    <option value="bottom-right">Bottom Right</option>
                    <option value="bottom-left">Bottom Left</option>
                  </select>
                </div>

                {/* Size */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Size</label>
                  <select
                    value={widgetConfig.size}
                    onChange={(e) => setWidgetConfig({...widgetConfig, size: e.target.value})}
                    className="w-full bg-gray-700 text-white px-3 py-1 rounded text-sm"
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex border-b border-gray-700">
                <button
                  className={`px-4 py-2 ${activeTab === 'html' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400'}`}
                  onClick={() => setActiveTab('html')}
                >
                  HTML
                </button>
                <button
                  className={`px-4 py-2 ${activeTab === 'react' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400'}`}
                  onClick={() => setActiveTab('react')}
                >
                  React
                </button>
                <button
                  className={`px-4 py-2 ${activeTab === 'nextjs' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400'}`}
                  onClick={() => setActiveTab('nextjs')}
                >
                  Next.js
                </button>
              </div>
            </div>

            <div className="relative bg-gray-800 rounded-lg p-4 mb-4">
              <pre className="overflow-x-auto text-sm text-white">
                {generateSnippet()}
              </pre>
              <button
                onClick={() => copyToClipboard(generateSnippet())}
                className="absolute top-2 right-2 bg-gray-700 hover:bg-gray-600 text-white p-1 rounded"
                title="Copy to clipboard"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => setShowModal(false)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Token Launch Modal */}
      <TokenLaunchModal
        isOpen={showTokenLaunchModal}
        onClose={() => setShowTokenLaunchModal(false)}
        wallet={walletAdapter}
        onLaunchSuccess={handleTokenLaunchSuccess} 
        vanityAddress={vanityAddress}
      />

      {/* DBC Trade Modal (for pre-graduation) */}
      {agentTokenData && !isGraduated && selectedAgent && (
        <DbcTradeModal
          isOpen={showTradeModal}
          onClose={() => setShowTradeModal(false)}
          poolAddress={agentTokenData.dbcPoolAddress}
          tokenMintAddress={agentTokenData.contractAddress}
          tokenName={agentTokenData.tokenName}
          tokenSymbol={agentTokenData.tokenSymbol}
          creatorName={selectedAgent.name || 'Agent'}
        />
      )}
    </>
  );
}

// // app/dashboard/agents/page.tsx
// 'use client';

// import { useCallback, useEffect, useState } from 'react';

// import { useWallet } from '@solana/wallet-adapter-react';
// import { motion } from 'framer-motion';
// import Image from 'next/image';
// import Link from 'next/link';
// import { Loader2, Search, Copy, ExternalLink, BookOpen, MessageSquare, Settings, Zap, Shield, Globe, Cpu, Terminal, Coins, TrendingUp } from 'lucide-react';
// import { BeatLoader } from 'react-spinners';
// import { toast } from 'sonner';
// import StarCanvas from '@/components/StarCanvas';
// import { GlowButton } from '@/components/ui/glow-button';
// import ConnectButton from '@/components/common/ConnectBtn';
// import { useRouter } from 'next/navigation';
// import { setupConfigWithWallet, QUOTE_MINTS, type QuoteMintType } from '@/helper/meteoraServices/createConfig';
// import createPool from '@/helper/meteoraServices/createPool';
// import { PublicKey, Transaction } from '@solana/web3.js';
// import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
// import type { Provider } from "@reown/appkit-adapter-solana/vue";
// import CurveVisualization from '@/components/ui/CurveVisualization';

// import { usePoolStatus } from '@/hooks/usePoolStatus'; 
// import { DbcTradeModal } from '@/components/DbcTradeModal';

// interface Agent {
//   id: string;
//   name: string;
//   description: string;
//   avatar_img: string;
//   cover_img: string;
//   status: 'active' | 'paused' | 'stopped';
//   created_at: string;
//   clients?: string[];
//   telegram_bot_token?: string;
//   discord_application_id?: string;
//   discord_token?: string;
//   domain?: string;
//   server_domain?: string;
//   voice_model?: string;
//   organization?: string;
//   wallet_address?: string;
//   character_file?: string;
// }

// interface AgentTokenData {
//   contractAddress: string;
//   dbcPoolAddress: string;
//   configAddress: string;
//   quoteMint: QuoteMintType;
//   tokenName: string;
//   tokenSymbol: string;
//   dammPoolAddress?: string; // Optional: will be filled in after graduation
// }

// const useReownWalletAdapter = () => {
//   const { address, isConnected } = useAppKitAccount();
//   const { walletProvider } = useAppKitProvider<Provider>("solana");
  
//   return {
//     publicKey: address ? new PublicKey(address) : null,
//     isConnected,
//     signTransaction: async (transaction: Transaction) => {
//       if (!walletProvider || !address) {
//         throw new Error("Wallet not connected");
//       }
//       return await walletProvider.signTransaction(transaction);
//     },
//     signAllTransactions: async (transactions: Transaction[]) => {
//       if (!walletProvider || !address) {
//         throw new Error("Wallet not connected");
//       }
//       return await walletProvider.signAllTransactions(transactions);
//     }
//   };
// };

// interface TokenLaunchParams {
//   totalTokenSupply: number;
//   migrationQuoteThreshold: number;
//   quoteMint: QuoteMintType;
//   name: string;
//   symbol: string;
//   image: string;
//   description: string;
// }

// interface PriceData {
//   [key: string]: {
//     usd: number;
//   };
// }

// interface ConversionRate {
//   solToUsd: number;
//   cyaiToUsd: number;
//   solToCyai: number;
//   cyaiToSol: number;
// }

// interface WalletAdapter {
//   publicKey: PublicKey | null;
//   signTransaction: (transaction: Transaction) => Promise<Transaction>;
//   signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
//   isConnected: boolean;
// }

// interface TokenLaunchModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   wallet: WalletAdapter;
//   // This is the missing line
//   onLaunchSuccess: (data: {
//     contractAddress: string;
//     dbcPoolAddress: string;
//     configAddress: string;
//     quoteMint: QuoteMintType;
//     tokenName: string;
//     tokenSymbol: string;
//   }) => void;
// }
// interface MessageContent {
//   text: string;
// }

// interface MessageExample {
//   user: string;
//   content: MessageContent;
// }

// interface CharacterData {
//   oneLiner: string;
//   description: string;
//   bio: string[];
//   lore: string[];
//   knowledge: string[];
//   messageExamples: MessageExample[][];
//   settings: Record<string, unknown>;
//   modelProvider?: string;
// }

// const parseCharacterFile = (characterFile: string): CharacterData => {
//   try {
//     return JSON.parse(characterFile);
//   } catch (error) {
//     console.error('Error parsing character file:', error);
//     return {
//       oneLiner: '',
//       description: '',
//       bio: [],
//       lore: [],
//       knowledge: [],
//       messageExamples: [],
//       settings: {}
//     };
//   }
// };

// const formatDate = (dateString: string) => {
//   const date = new Date(dateString);
//   return date.toLocaleDateString('en-US', {
//     year: 'numeric',
//     month: 'long',
//     day: 'numeric',
//     hour: '2-digit',
//     minute: '2-digit'
//   });
// };

// const TokenLaunchModal: React.FC<TokenLaunchModalProps> = ({ 
//   isOpen, 
//   onClose, 
//   wallet ,
//   onLaunchSuccess
// }) => {
//   const [params, setParams] = useState<TokenLaunchParams>({
//     totalTokenSupply: 1000000000,
//     migrationQuoteThreshold: 210,
//     quoteMint: 'SOL' as QuoteMintType,
//     name: '',
//     symbol: '',
//     image: '',
//     description: ''
//   });
//   const [isLoading, setIsLoading] = useState(false);
//   const [conversionRates, setConversionRates] = useState<ConversionRate | null>(null);
//   const [priceLoading, setPriceLoading] = useState(false);

//   // Fetch real-time prices
//   useEffect(() => {
//     const fetchPrices = async () => {
//       setPriceLoading(true);
//       try {
//         // Using CoinGecko API for real-time prices
//         const response = await fetch(
//           'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd'
//         );
//         const data: PriceData = await response.json();
        
//         // For CYAI, we'll use a placeholder price since it might not be on CoinGecko yet
//         // Replace this with actual API call when CYAI is listed
//         const cyaiPrice = 0.05; // Placeholder price in USD
        
//         const solPrice = data.solana?.usd || 0;
        
//         setConversionRates({
//           solToUsd: solPrice,
//           cyaiToUsd: cyaiPrice,
//           solToCyai: solPrice > 0 && cyaiPrice > 0 ? solPrice / cyaiPrice : 0,
//           cyaiToSol: solPrice > 0 && cyaiPrice > 0 ? cyaiPrice / solPrice : 0
//         });
//       } catch (error) {
//         console.error('Error fetching prices:', error);
//         // Fallback prices
//         setConversionRates({
//           solToUsd: 100, // Fallback SOL price
//           cyaiToUsd: 0.05, // Fallback CYAI price
//           solToCyai: 2000,
//           cyaiToSol: 0.0005
//         });
//       } finally {
//         setPriceLoading(false);
//       }
//     };

//     if (isOpen) {
//       fetchPrices();
//       // Refresh prices every 30 seconds
//       const interval = setInterval(fetchPrices, 30000);
//       return () => clearInterval(interval);
//     }
//   }, [isOpen]);

//   const formatPrice = (price: number) => {
//     if (price < 0.01) return price.toFixed(6);
//     if (price < 1) return price.toFixed(4);
//     return price.toFixed(2);
//   };

//   const getConvertedThreshold = () => {
//     if (!conversionRates) return params.migrationQuoteThreshold;
    
//     if (params.quoteMint === 'SOL') {
//       return params.migrationQuoteThreshold;
//     } else {
//       // Convert from SOL equivalent to CYAI
//       return Math.round(params.migrationQuoteThreshold * conversionRates.solToCyai);
//     }
//   };

//   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
//     const { name, value } = e.target;
//     setParams(prev => ({
//       ...prev,
//       [name]: name === 'totalTokenSupply' || name === 'migrationQuoteThreshold' 
//         ? Number(value) 
//         : value
//     }));
//   };

//   const handleQuoteMintChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
//     const newQuoteMint = e.target.value as QuoteMintType;
//     setParams(prev => ({
//       ...prev,
//       quoteMint: newQuoteMint,
//       // Auto-convert threshold when switching quote mints
//       migrationQuoteThreshold: conversionRates ? 
//         (newQuoteMint === 'SOL' ? 
//           Math.round(prev.migrationQuoteThreshold * conversionRates.cyaiToSol) : 
//           Math.round(prev.migrationQuoteThreshold * conversionRates.solToCyai)
//         ) : prev.migrationQuoteThreshold
//     }));
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
    
//     if (!wallet.publicKey || !wallet.isConnected) {
//       toast.error('Please connect your wallet first');
//       return;
//     }

//     // Validate form
//     if (!params.name || !params.symbol || !params.image || !params.description) {
//       toast.error('Please fill in all required fields');
//       return;
//     }

//     setIsLoading(true);
    
//     try {
//       console.log('Starting token launch process...');
      
//       // Step 1: Setup config with wallet
//       toast.info('Setting up configuration...');
//       const configResult = await setupConfigWithWallet(wallet, {
//         totalTokenSupply: params.totalTokenSupply,
//         migrationQuoteThreshold: params.migrationQuoteThreshold,
//         quoteMint: params.quoteMint
//       });
      
//       if (!configResult.success || !configResult.configAddress) {
//         throw new Error(configResult.error || 'Failed to create config');
//       }

//       console.log('Config created successfully:', configResult.configAddress);
//       toast.info('Creating token pool...');

//       // Step 2: Create pool using the config address
//       const poolResult = await createPool({
//         configAddress: configResult.configAddress,
//         name: params.name,
//         symbol: params.symbol,
//         image: params.image,
//         description: params.description
//       });

//       if (!poolResult.success) {
//         throw new Error(poolResult.error || 'Failed to create pool');
//       }

//       console.log('Pool created successfully:', poolResult.dbcPoolAddress);
//       toast.success(`Token launched successfully! Pool: ${poolResult.dbcPoolAddress}`);

//       onLaunchSuccess({
//         contractAddress: poolResult.contractAddress || '',
//         dbcPoolAddress: poolResult.dbcPoolAddress || '',
//         configAddress: configResult.configAddress,
//         quoteMint: params.quoteMint,
//         tokenName: params.name,
//         tokenSymbol: params.symbol,
//       });
      
//       // Close modal on success
//       onClose();
      
//       // Reset form
//       setParams({
//         totalTokenSupply: 1000000000,
//         migrationQuoteThreshold: 210,
//         quoteMint: 'SOL' as QuoteMintType,
//         name: '',
//         symbol: '',
//         image: '',
//         description: ''
//       });
      
//     } catch (error) {
//       console.error('Token launch error:', error);
//       const errorMessage = error instanceof Error ? error.message : 'Failed to launch token';
//       toast.error(errorMessage);
//       // Don't close modal on error so user can try again
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   if (!isOpen) return null;

//   return (
//     <motion.div 
//       initial={{ opacity: 0 }}
//       animate={{ opacity: 1 }}
//       exit={{ opacity: 0 }}
//       className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
//     >
//       <motion.div 
//         initial={{ scale: 0.95, opacity: 0, y: 20 }}
//         animate={{ scale: 1, opacity: 1, y: 0 }}
//         exit={{ scale: 0.95, opacity: 0, y: 20 }}
//         transition={{ duration: 0.3, ease: "easeOut" }}
//         className="bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 rounded-2xl border border-white/20 shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden relative flex flex-col"
//       >
//         {/* Animated background gradient orbs */}
//         <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-xl opacity-60 animate-pulse" />
//         <div className="absolute bottom-0 right-0 w-40 h-40 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-xl opacity-60 animate-pulse animation-delay-1000" />
        
//         {/* Header with enhanced styling */}
//         <div className="relative z-10 px-8 py-6 border-b border-white/10 bg-gradient-to-r from-blue-600/10 to-purple-600/10">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center gap-3">
//               <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
//                 <Zap className="w-6 h-6 text-white" />
//               </div>
//               <div>
//                 <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
//                   Launch Your Token
//                 </h3>
//                 <p className="text-gray-400 text-sm">Create and deploy your custom token</p>
//               </div>
//             </div>
//             <motion.button 
//               whileHover={{ scale: 1.1, rotate: 90 }}
//               whileTap={{ scale: 0.9 }}
//               onClick={onClose} 
//               className="w-10 h-10 rounded-full bg-gray-800/50 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 flex items-center justify-center text-gray-400 hover:text-red-400 transition-all duration-200"
//               disabled={isLoading}
//             >
//               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//               </svg>
//             </motion.button>
//           </div>
//         </div>

//         {/* Scrollable content */}
//         <div className="relative z-10 flex-1 overflow-y-auto px-8 py-6">
//           <form onSubmit={handleSubmit} className="space-y-8 pb-4">
//             {/* Token Configuration Section with enhanced styling */}
//             <motion.div 
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ delay: 0.1 }}
//               className="space-y-6"
//             >
//               <div className="flex items-center gap-3 pb-3">
//                 <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
//                   <Settings className="w-4 h-4 text-white" />
//                 </div>
//                 <h4 className="text-xl font-semibold text-white">Token Configuration</h4>
//               </div>
              
//               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//                 <div className="space-y-2">
//                   <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
//                     <Cpu className="w-4 h-4 text-blue-400" />
//                     Total Token Supply
//                   </label>
//                   <div className="relative">
//                     <input
//                       type="number"
//                       name="totalTokenSupply"
//                       value={params.totalTokenSupply}
//                       onChange={handleInputChange}
//                       className="w-full bg-gray-800/50 backdrop-blur-sm text-white px-4 py-3 rounded-xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 hover:border-white/20"
//                       required
//                       disabled={isLoading}
//                       min="1"
//                     />
//                     <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/5 to-purple-500/5 pointer-events-none" />
//                   </div>
//                 </div>
                
//                 <div className="space-y-2">
//                   <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
//                     <Shield className="w-4 h-4 text-green-400" />
//                     Migration Quote Threshold
//                     {conversionRates && (
//                       <span className="text-xs text-gray-500">
//                         (~${formatPrice((params.migrationQuoteThreshold * (params.quoteMint === 'SOL' ? conversionRates.solToUsd : conversionRates.cyaiToUsd)))} USD)
//                       </span>
//                     )}
//                   </label>
//                   <div className="relative">
//                     <input
//                       type="number"
//                       name="migrationQuoteThreshold"
//                       value={params.migrationQuoteThreshold}
//                       onChange={handleInputChange}
//                       className="w-full bg-gray-800/50 backdrop-blur-sm text-white px-4 py-3 rounded-xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all duration-200 hover:border-white/20"
//                       required
//                       disabled={isLoading}
//                       min="1"
//                       step="0.000001"
//                     />
//                     <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-500/5 to-blue-500/5 pointer-events-none" />

//                   </div>
//                   {conversionRates && params.quoteMint === 'CYAI' && (
//                     <div className="text-xs text-gray-500 pl-1">
//                       Equivalent to ~{formatPrice(params.migrationQuoteThreshold * conversionRates.cyaiToSol)} SOL
//                     </div>
//                   )}
//                   {conversionRates && params.quoteMint === 'SOL' && (
//                     <div className="text-xs text-gray-500 pl-1">
//                       Equivalent to ~{formatPrice(params.migrationQuoteThreshold * conversionRates.solToCyai)} CYAI
//                     </div>
//                   )}
//                 </div>

//                 {/* Quote Mint Selection */}
//                 <div className="space-y-2">
//                   <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
//                     <Coins className="w-4 h-4 text-yellow-400" />
//                     Quote Token
//                     {priceLoading && (
//                       <div className="animate-spin w-3 h-3 border border-gray-400 border-t-transparent rounded-full"></div>
//                     )}
//                   </label>
//                   <div className="relative">
//                     <select
//                       name="quoteMint"
//                       value={params.quoteMint}
//                       onChange={handleQuoteMintChange}
//                       className="w-full bg-gray-800/50 backdrop-blur-sm text-white px-4 py-3 rounded-xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 transition-all duration-200 hover:border-white/20 appearance-none cursor-pointer"
//                       required
//                       disabled={isLoading}
//                     >
//                       {Object.entries(QUOTE_MINTS).map(([key, mint]) => (
//                         <option key={key} value={key} className="bg-gray-800 text-white">
//                           {mint.name} ({mint.fullSymbol})
//                           {conversionRates && ` - ${formatPrice(key === 'SOL' ? conversionRates.solToUsd : conversionRates.cyaiToUsd)}`}
//                         </option>
//                       ))}
//                     </select>
//                     <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-500/5 to-orange-500/5 pointer-events-none" />
//                     {/* Custom dropdown arrow */}
//                     <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
//                       <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
//                       </svg>
//                     </div>
//                   </div>
//                   {/* Quote mint info with real-time data */}
//                   <div className="bg-gray-800/30 rounded-lg p-3 text-xs">
//                     <div className="flex justify-between items-center mb-2">
//                       <span className="text-gray-400">Selected Token:</span>
//                       <span className="text-white font-medium">
//                        {QUOTE_MINTS[params.quoteMint].name}
//                       </span>
//                     </div>
//                     <div className="flex justify-between items-center mb-2">
//                       <span className="text-gray-400">Price:</span>
//                       <span className="text-green-400 font-medium">
//                         {conversionRates ? 
//                           `${formatPrice(params.quoteMint === 'SOL' ? conversionRates.solToUsd : conversionRates.cyaiToUsd)}` : 
//                           'Loading...'
//                         }
//                       </span>
//                     </div>
//                     <div className="flex justify-between items-center mb-2">
//                       <span className="text-gray-400">Decimals:</span>
//                       <span className="text-blue-400">{QUOTE_MINTS[params.quoteMint].decimals}</span>
//                     </div>
//                     <div className="flex justify-between items-center">
//                       <span className="text-gray-400">Address:</span>
//                       <span className="text-gray-300 font-mono">{QUOTE_MINTS[params.quoteMint].address.slice(0, 8)}...</span>
//                     </div>
//                     {/* {conversionRates && (
//                       <div className="mt-2 pt-2 border-t border-gray-700">
//                         <div className="text-gray-400 text-center">
//                           Exchange Rate: 1 SOL = {formatPrice(conversionRates.solToCyai)} 🧠 | 1  = {formatPrice(conversionRates.cyaiToSol)} ◎
//                         </div>
//                       </div>
//                     )} */}
//                   </div>
//                 </div>
//               </div>
              
//               {/* Enhanced Curve Visualization with better styling */}
//               <div className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
//               <CurveVisualization 
//   totalSupply={params.totalTokenSupply}
//   migrationThreshold={params.migrationQuoteThreshold}
//   solPrice={conversionRates?.solToUsd || 100} // Pass the actual SOL price
// />
//               </div>
//             </motion.div>

//             {/* Token Metadata Section with enhanced styling */}
//             <motion.div 
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ delay: 0.2 }}
//               className="space-y-6"
//             >
//               <div className="flex items-center gap-3 pb-3">
//                 <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
//                   <Globe className="w-4 h-4 text-white" />
//                 </div>
//                 <h4 className="text-xl font-semibold text-white">Token Metadata</h4>
//               </div>
              
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <div className="space-y-2">
//                   <label className="block text-sm font-medium text-gray-300">
//                     Token Name
//                   </label>
//                   <div className="relative">
//                     <input
//                       type="text"
//                       name="name"
//                       value={params.name}
//                       onChange={handleInputChange}
//                       className="w-full bg-gray-800/50 backdrop-blur-sm text-white px-4 py-3 rounded-xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200 hover:border-white/20"
//                       placeholder="Enter token name"
//                       required
//                       disabled={isLoading}
//                     />
//                     <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/5 to-pink-500/5 pointer-events-none" />
//                   </div>
//                 </div>
                
//                 <div className="space-y-2">
//                   <label className="block text-sm font-medium text-gray-300">
//                     Token Symbol
//                   </label>
//                   <div className="relative">
//                     <input
//                       type="text"
//                       name="symbol"
//                       value={params.symbol}
//                       onChange={handleInputChange}
//                       className="w-full bg-gray-800/50 backdrop-blur-sm text-white px-4 py-3 rounded-xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50 transition-all duration-200 hover:border-white/20 uppercase"
//                       placeholder="Enter symbol (e.g., BTC)"
//                       required
//                       disabled={isLoading}
//                       maxLength={10}
//                     />
//                     <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-pink-500/5 to-purple-500/5 pointer-events-none" />
//                   </div>
//                 </div>
//               </div>
              
//               <div className="space-y-2">
//                 <label className="block text-sm font-medium text-gray-300">
//                   Image URL
//                 </label>
//                 <div className="relative">
//                   <input
//                     type="url"
//                     name="image"
//                     value={params.image}
//                     onChange={handleInputChange}
//                     className="w-full bg-gray-800/50 backdrop-blur-sm text-white px-4 py-3 rounded-xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-200 hover:border-white/20"
//                     placeholder="https://example.com/token-image.png"
//                     required
//                     disabled={isLoading}
//                   />
//                   <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/5 to-blue-500/5 pointer-events-none" />
//                 </div>
//               </div>
              
//               <div className="space-y-2">
//                 <label className="block text-sm font-medium text-gray-300">
//                   Description
//                 </label>
//                 <div className="relative">
//                   <textarea
//                     name="description"
//                     value={params.description}
//                     onChange={handleInputChange}
//                     className="w-full bg-gray-800/50 backdrop-blur-sm text-white px-4 py-3 rounded-xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-200 hover:border-white/20 min-h-[100px] resize-y"
//                     placeholder="Enter token description"
//                     required
//                     disabled={isLoading}
//                     maxLength={100}
//                   />
//                   <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500/5 to-purple-500/5 pointer-events-none" />
//                 </div>
//                 <div className="text-right text-xs text-gray-500">
//                   {params.description.length}/100 characters
//                 </div>
//               </div>
//             </motion.div>
//           </form>
//         </div>

//         {/* Enhanced Action Buttons */}
//         <motion.div 
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ delay: 0.3 }}
//           className="relative z-10 flex-shrink-0 px-8 py-6 border-t border-white/10 bg-gradient-to-r from-gray-900/50 to-gray-800/50 backdrop-blur-sm"
//         >
//           <div className="flex justify-end gap-4">
//             <motion.button
//               whileHover={{ scale: 1.02 }}
//               whileTap={{ scale: 0.98 }}
//               type="button"
//               onClick={onClose}
//               className="px-6 py-3 bg-gray-700/50 hover:bg-gray-600/50 text-white rounded-xl border border-white/10 hover:border-white/20 transition-all duration-200 backdrop-blur-sm"
//               disabled={isLoading}
//             >
//               Cancel
//             </motion.button>
//             <motion.button
//               whileHover={{ scale: 1.02 }}
//               whileTap={{ scale: 0.98 }}
//               type="submit"
//               onClick={handleSubmit}
//               className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl flex items-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25"
//               disabled={isLoading}
//             >
//               {isLoading ? (
//                 <>
//                   <motion.div
//                     animate={{ rotate: 360 }}
//                     transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
//                   >
//                     <Loader2 className="w-5 h-5" />
//                   </motion.div>
//                   <span>Launching...</span>
//                 </>
//               ) : (
//                 <>
//                   <Zap className="w-5 h-5" />
//                   <span>Launch Token</span>
//                 </>
//               )}
//             </motion.button>
//           </div>
//         </motion.div>
//       </motion.div>
//     </motion.div>
//   );
// };

// export default function UserAgentsPage() {
//   const router = useRouter();
//   const [agents, setAgents] = useState<Agent[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
//   const [showModal, setShowModal] = useState(false);
//   const [showTokenModal, setShowTokenModal] = useState(false);
//   const [showIntegrationModal, setShowIntegrationModal] = useState(false);
//   const [showTokenLaunchModal, setShowTokenLaunchModal] = useState(false);
//   const [showTradeModal, setShowTradeModal] = useState(false);
//   const [activeTab, setActiveTab] = useState('html');
//   const [widgetConfig, setWidgetConfig] = useState({
//     primaryColor: '#1366d9',
//     position: 'bottom-right',
//     size: 'medium'
//   });

//   // Get wallet adapter
//   const walletAdapter = useReownWalletAdapter();
//   const [agentTokenData, setAgentTokenData] = useState<AgentTokenData | null>(null);

//   const getTokenDataForAgent = (agentId: string): AgentTokenData | null => {
//     const data = localStorage.getItem(`agent_token_${agentId}`);
//     return data ? JSON.parse(data) : null;
//   };

//   const saveTokenDataForAgent = (agentId: string, data: AgentTokenData) => {
//     localStorage.setItem(`agent_token_${agentId}`, JSON.stringify(data));
//   };
  
//   // Wallets
//   const { address: ethAddress, isConnected: isEthConnected } = useAppKitAccount();
//   const { publicKey: solAddress, connected: isSolConnected } = useWallet();
//   const [walletAddress, setWalletAddress] = useState<string | null>(null);
//   const [peerid, setPeerid] = useState<string | null>(null);

//   useEffect(() => {
//     if (isEthConnected && ethAddress) {
//       setWalletAddress(ethAddress);
//     } else if (isSolConnected && solAddress) {
//       setWalletAddress(solAddress.toBase58());
//     } else {
//       setWalletAddress(null);
//     }
//   }, [isEthConnected, isSolConnected, ethAddress, solAddress]);

//   useEffect(() => {
//     const fetchAgents = async () => {
//       if (!walletAddress) {
//         setLoading(false);
//         return;
//       }
    
//       try {
//         setLoading(true);
//         const response = await fetch(`/api/getAgentsbyWallet?walletAddress=${walletAddress}`);
    
//         if (!response.ok) {
//           throw new Error('Failed to fetch agents');
//         }
    
//         const data = await response.json();
//         const agentsArray = Array.isArray(data) ? data : data.agents || [];
//         setAgents(agentsArray);
//         if (agentsArray.length > 0) {
//           setSelectedAgent(agentsArray[0]);
//         }
//       } catch (error) {
//         console.error('Error fetching agents:', error);
//         toast.error('Failed to load your agents');
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchAgents();
//   }, [walletAddress]);

//   useEffect(() => {
//     if (selectedAgent?.id) {
//       // Clear previous agent's token data to prevent state pollution
//       setAgentTokenData(null);
      
//       // Get token data specific to this agent
//       const tokenData = getTokenDataForAgent(selectedAgent.id);
//       setAgentTokenData(tokenData);
      
//       // Fetch peer ID for this specific agent
//       fetchPeerIdForAgent(selectedAgent.id).then(setPeerid);
//     }
//   }, [selectedAgent?.id]);

//   const filteredAgents = agents.filter(agent => {
//     return agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
//            (agent.character_file && agent.character_file.toLowerCase().includes(searchQuery.toLowerCase()));
//   });

//   const copyToClipboard = (text: string) => {
//     navigator.clipboard.writeText(text);
//     toast.success('Copied to clipboard!');
//   };

//   const handleTokenLaunchSuccess = (data: {
//     contractAddress: string;
//     dbcPoolAddress: string;
//     configAddress: string;
//     quoteMint: QuoteMintType;
//     tokenName: string;
//     tokenSymbol: string;
//   }) => {
//     if (!selectedAgent?.id) {
//       toast.error('No agent selected');
//       return;
//     }
    
//     console.log(`Token launched successfully for agent ${selectedAgent.id}:`, data);
    
//     const fullTokenData: AgentTokenData = { ...data };
//     saveTokenDataForAgent(selectedAgent.id, fullTokenData);
//     setAgentTokenData(fullTokenData);
//     setShowTokenLaunchModal(false);
    
//     toast.success(`Token launched for ${selectedAgent.name}!`);
//   };
  
//   // Callback for when the final AMM pool is derived
//   const handleDammDerived = useCallback((dammPoolAddress: string) => {
//     if (!selectedAgent?.id || !agentTokenData) {
//       console.warn('handleDammDerived called but missing selectedAgent or agentTokenData');
//       return;
//     }
    
//     console.log(`Handling DAMM derivation for agent ${selectedAgent.id}: ${dammPoolAddress}`);
    
//     // Update the existing token data with the new dammPoolAddress
//     const updatedTokenData = { 
//       ...agentTokenData, 
//       dammPoolAddress 
//     };
    
//     saveTokenDataForAgent(selectedAgent.id, updatedTokenData);
//     setAgentTokenData(updatedTokenData); // Trigger UI re-render
//     toast.success(`Token for ${selectedAgent.name} graduated! AMM Pool is ready.`);
//   }, [selectedAgent?.id, agentTokenData]);

//   // Use the custom hook to monitor the pool status
//   const { isGraduated, isLoading: isPoolStatusLoading } = usePoolStatus({
//     configAddress: agentTokenData?.configAddress || null,
//     contractAddress: agentTokenData?.contractAddress || null,
//     dbcPoolAddress: agentTokenData?.dbcPoolAddress || null,
//     quoteMint: agentTokenData?.quoteMint || null,
//     onDammDerive: handleDammDerived,
//   });

//   const clearAllTokenData = () => {
//     const keys = Object.keys(localStorage).filter(key => key.startsWith('agent_token_'));
//     keys.forEach(key => localStorage.removeItem(key));
//     setAgentTokenData(null);
//     toast.info('All token data cleared');
//   };
  

//   const fetchPeerIdForAgent = async (agentId: string): Promise<string | null> => {
//     try {
//       const response = await fetch('https://gateway.netsepio.com/api/v1.0/agents');
//       const data = await response.json();
  
//       for (const item of data.agents) {
//         for (const agent of item.agents.agents) {
//           if (agent.id === agentId) {
//             return item.node.peerId;
//           }
//         }
//       }
  
//       return null;
//     } catch (error) {
//       console.error("Failed to fetch agents", error);
//       return null;
//     }
//   };

//   const generateSnippet = () => {
//     if (!selectedAgent) return '';
    
//     const domain = selectedAgent.domain;
//     const baseSnippet = `window.aiChatConfig = {
//       chatUrl: 'https://${domain}/${selectedAgent.id}/message',
//       agentInfoUrl: 'https://gateway.netsepio.com/api/v1.0/agents/${peerid}/${selectedAgent.id}',
//       agentName: '${selectedAgent.name}',
//       primaryColor: '${widgetConfig.primaryColor}',
//       position: '${widgetConfig.position}',
//       size: '${widgetConfig.size}'
//     };`;
    
//     if (activeTab === 'html') {
//       return `<!-- Configure the widget (place before the script) -->
//   <script>
//     ${baseSnippet}
//   </script>
  
//   <!-- AI Chat Widget -->
//   <script src="https://cyreneai.com/chatbot/index.js"></script>`;
//     } else if (activeTab === 'react') {
//       return `import { ErebrusChat } from '@erebrus/chat-widget';
  
//   function App() {
//     return (
//       <ErebrusChat
//         config={{
//           ${baseSnippet.replace(/\n/g, '\n        ')}
//         }}
//       />
//     );
//   }`;
//     } else if (activeTab === 'nextjs') {
//       return `'use client';
  
//   import { ErebrusChat } from '@erebrus/chat-widget';
  
//   export default function ChatWidget() {
//     return (
//       <ErebrusChat
//         config={{
//           ${baseSnippet.replace(/\n/g, '\n        ')}
//         }}
//       />
//     );
//   }`;
//     }
//     return '';
//   };

//   if (!walletAddress) {
//     return (
//       <>
//         <StarCanvas/>
//         <div className="flex flex-col items-center justify-center min-h-[60vh]">
//           <div className="text-center space-y-4">
//             <h2 className="text-2xl font-bold text-white">Connect your wallet</h2>
//             <p className="text-muted-foreground">
//               Please connect your wallet to view your agents
//             </p>
//             <div className='px-20 py-3 ml-4'> <ConnectButton/></div>
//           </div>
//         </div>
//       </>
//     );
//   }

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center min-h-[60vh]">
//         <BeatLoader color="#2f7add" />
//       </div>
//     );
//   }

//   return (
//     <>
//       <StarCanvas />
//       <div className="relative min-h-screen py-20 px-4 overflow-hidden">
//         {/* Gradient Orbs */}
//         <div className="absolute top-20 left-10 w-72 h-72 bg-[#0162FF] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" />
//         <div className="absolute top-40 right-10 w-72 h-72 bg-[#A63FE1] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000" />
//         <div className="absolute -bottom-8 left-20 w-72 h-72 bg-[#3985FF] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000" />

//         <div className="relative z-10 max-w-7xl mx-auto mb-8">
//           {/* Title Section */}
//           <motion.div
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.8 }}
//             className="text-center mb-12"
//           >
//             <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#0162FF] via-[#3985FF] to-[#A63FE1] bg-clip-text text-transparent py-4">
//               My Agents
//             </h1>
//             <p className="mt-4 text-gray-400">
//               Manage and interact with your personal AI agents
//             </p>
//           </motion.div>

//           {/* Search Bar */}
//           <motion.div
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.8, delay: 0.2 }}
//             className="mb-12"
//           >
//             <div className="relative max-w-2xl mx-auto">
//               <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-100" />
//               <input
//                 type="text"
//                 placeholder="Search your agents..."
//                 value={searchQuery}
//                 onChange={(e) => setSearchQuery(e.target.value)}
//                 className="w-full pl-12 pr-4 py-3 bg-gray-900/50 backdrop-blur-xl border border-white/10 rounded-full
//                          text-white placeholder-gray-400 focus:outline-none focus:border-[#3985FF]/50
//                          transition-all duration-300"
//               />
//             </div>
//           </motion.div>

//           {/* Main Content */}
//           {filteredAgents.length === 0 ? (
//             <motion.div
//               initial={{ opacity: 0 }}
//               animate={{ opacity: 1 }}
//               className="flex flex-col items-center justify-center min-h-[40vh] space-y-4"
//             >
//               <p className="text-muted-foreground">
//                 Launch your first agent to get started
//               </p>
//               <Link href="/launch-agent">
//                 <GlowButton
//                   style={{
//                     padding: '0.6em 2em',
//                     borderRadius: '10px',
//                     fontSize: '16px',
//                     fontWeight: '500'
//                   }}
//                 >
//                   Launch Agent
//                 </GlowButton>
//               </Link>
//             </motion.div>
//           ) : (
//             <div className="flex flex-col lg:flex-row gap-8">
//               {/* Left Panel - Agent List */}
//               <div className="w-full lg:w-1/3">
//                 <motion.div
//                   initial={{ opacity: 0 }}
//                   animate={{ opacity: 1 }}
//                   transition={{ duration: 0.8, delay: 0.4 }}
//                   className="space-y-4"
//                 >
//                   {filteredAgents.map((agent, index) => (
//                     <motion.div
//                       key={agent.id}
//                       initial={{ opacity: 0, y: 20 }}
//                       animate={{ opacity: 1, y: 0 }}
//                       transition={{ duration: 0.5, delay: index * 0.1 }}
//                       whileHover={{ y: -5 }}
//                       className={`p-4 rounded-xl backdrop-blur-xl border ${selectedAgent?.id === agent.id ? 'border-[#3985FF] bg-gray-900/50' : 'border-white/10 bg-gray-900/30'} cursor-pointer transition-all`}
//                       onClick={() => setSelectedAgent(agent)}
//                     >
//                       <div className="flex items-center gap-4">
//                         <div className="relative w-16 h-16 rounded-full overflow-hidden">
//                           <Image
//                             src={agent.avatar_img ? `https://ipfs.erebrus.io/ipfs/${agent.avatar_img}` : "/cyrene_profile.png"}
//                             alt={agent.name}
//                             fill
//                             className="object-cover"
//                           />
//                         </div>
//                         <div className="flex-1 min-w-0">
//                           <div className="flex justify-between items-start">
//                             <h3 className="font-bold text-white truncate">{agent.name}</h3>
//                             <span className={`text-xs px-2 py-1 rounded-full ${
//                               agent.status === 'active' ? 'bg-green-900/50 text-green-400' :
//                               agent.status === 'paused' ? 'bg-yellow-900/50 text-yellow-400' :
//                               'bg-red-900/50 text-red-400'
//                             }`}>
//                               {agent.status}
//                             </span>
//                           </div>
//                           {agent.character_file && (
//                             <p className="text-sm text-gray-400 truncate">
//                               {parseCharacterFile(agent.character_file).oneLiner}
//                             </p>
//                           )}
//                         </div>
//                       </div>
//                     </motion.div>
//                   ))}
//                 </motion.div>
//               </div>

//               {/* Right Panel - Agent Details */}
//               {selectedAgent && (
//                 <div className="w-full lg:w-2/3">
//                   <div className="bg-gray-900/50 backdrop-blur-xl rounded-xl border border-white/10 overflow-hidden">
//                     {/* Cover Image */}
//                     <div className="relative w-full h-48 rounded-t-xl overflow-hidden">
//                       <Image
//                         src={selectedAgent.cover_img ? `https://ipfs.erebrus.io/ipfs/${selectedAgent.cover_img}` : "/cyrene_cover_2-1-85.png"}
//                         alt={`${selectedAgent.name} cover`}
//                         fill
//                         className="object-cover"
//                       />
//                       <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 to-transparent" />
//                     </div>

//                     {/* Agent Header */}
//                     <div className="flex flex-col md:flex-row gap-6 px-6 -mt-16 mb-6">
//                       <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-gray-900 shadow-xl">
//                         <Image
//                           src={selectedAgent.avatar_img ? `https://ipfs.erebrus.io/ipfs/${selectedAgent.avatar_img}` : "/cyrene_profile.png"}
//                           alt={selectedAgent.name}
//                           fill
//                           className="object-cover"
//                         />
//                       </div>

//                       <div className="flex-1 pt-4 ">
//                         <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
//                           <div className='flex flex-col gap-12'>
//                             <h2 className="text-2xl font-bold text-white">{selectedAgent.name}</h2>
//                             {selectedAgent.character_file && (
//                               <p className="text-lg text-blue-300">
//                                 {parseCharacterFile(selectedAgent.character_file).oneLiner}
//                               </p>
//                             )}
//                           </div>
//                           <div className="flex gap-2">
//                             <span className={`px-3 py-1 rounded-full text-xs font-medium ${
//                               selectedAgent.status === 'active' ? 'bg-green-900/50 text-green-400' :
//                               selectedAgent.status === 'paused' ? 'bg-yellow-900/50 text-yellow-400' :
//                               'bg-red-900/50 text-red-400'
//                             }`}>
//                               {selectedAgent.status}
//                             </span>
//                             <span className="px-3 py-1 rounded-full bg-blue-900/50 text-blue-400 text-xs font-medium">
//                               {selectedAgent.organization || 'cyrene'}
//                             </span>
//                           </div>
//                         </div>

//                         {selectedAgent.character_file && (
//                           <p className="mt-2 text-gray-300">
//                             {parseCharacterFile(selectedAgent.character_file).description}
//                           </p>
//                         )}
//                       </div>
//                     </div>

//                     {/* Main Content */}
//                     <div className="p-6">
//                       {/* Quick Actions */}
//                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
//                         <GlowButton
//                           onClick={() => router.push(`/explore-agents/chat/${selectedAgent.id}`)}
//                           className="w-full"
//                         >
//                           <MessageSquare className="w-4 h-4 mr-2" />
//                           Chat
//                         </GlowButton>

//                         <button
//                           onClick={() => setShowModal(true)}
//                           className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
//                         >
//                           <Terminal className="w-4 h-4" />
//                           Integration Code
//                         </button>

//                         {!agentTokenData ? (
//                     // STATE 1: No token launched yet
//                     <button onClick={() => setShowTokenLaunchModal(true)} className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors">
//                       <Zap className="w-4 h-4" />
//                       Launch Token
//                     </button>
//                   ) : isPoolStatusLoading ? (
//                     // STATE 2: Checking pool status
//                     <button disabled className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-600 text-white rounded-lg cursor-wait">
//                       <Loader2 className="w-4 h-4 animate-spin" />
//                       Checking Status...
//                     </button>
//                   ) : agentTokenData.dammPoolAddress ? (
//                     // STATE 3: Graduated and DAMM pool is ready
//                     <a href={`https://jup.ag/swap/SOL-${agentTokenData.contractAddress}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
//                       <ExternalLink className="w-4 h-4" />
//                       Trade on Jupiter
//                     </a>
//                   ) : isGraduated ? (
//                     // STATE 4: Graduated, but waiting for derivation to complete
//                      <button disabled className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg cursor-wait">
//                       <Loader2 className="w-4 h-4 animate-spin" />
//                       Finalizing Pool...
//                     </button>
//                   ) : (
//                     // STATE 5: Launched but not graduated yet
//                     <button onClick={() => setShowTradeModal(true)} className="flex items-center justify-center gap-2 px-4 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors">
//                       <TrendingUp className="w-4 h-4" />
//                       Trade Now
//                     </button>
//                   )}

//                         {selectedAgent.clients?.includes('telegram') && (
//                           <a
//                             href={`https://t.me/${selectedAgent.name.toLowerCase()}_bot`}
//                             target="_blank"
//                             rel="noopener noreferrer"
//                             className="flex items-center justify-center gap-2 px-4 py-3 bg-[#0088cc] hover:bg-[#0077aa] text-white rounded-lg transition-colors"
//                           >
//                             <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
//                               <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.14-.26.26-.534.26l.213-3.053 5.56-5.023c.24-.213-.054-.334-.373-.121l-6.87 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z"/>
//                             </svg>
//                             Telegram
//                           </a>
//                         )}

//                         {selectedAgent.clients?.includes('discord') && (
//                           <a
//                             href={`https://discord.com/api/oauth2/authorize?client_id=${selectedAgent.discord_application_id}&permissions=0&scope=bot`}
//                             target="_blank"
//                             rel="noopener noreferrer"
//                             className="flex items-center justify-center gap-2 px-4 py-3 bg-[#5865F2] hover:bg-[#4752c4] text-white rounded-lg transition-colors"
//                           >
//                             <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
//                               <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
//                             </svg>
//                             Discord
//                           </a>
//                         )}
//                       </div>

//                       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//                         {/* About Section */}
//                         <div className="bg-gray-900/30 rounded-lg p-5 border border-white/10">
//                           <div className="flex items-center gap-2 mb-4">
//                             <BookOpen className="w-5 h-5 text-blue-400" />
//                             <h3 className="text-lg font-semibold text-white">About</h3>
//                           </div>
//                           {selectedAgent.character_file ? (
//                             <div className="space-y-4">
//                               <div>
//                                 <h4 className="text-sm font-medium text-gray-400 mb-1">Description</h4>
//                                 <p className="text-gray-300">
//                                   {parseCharacterFile(selectedAgent.character_file).description}
//                                 </p>
//                               </div>
//                               <div>
//                                 <h4 className="text-sm font-medium text-gray-400 mb-1">Knowledge</h4>
//                                 <p className="text-gray-300">
//                                   {parseCharacterFile(selectedAgent.character_file).knowledge.join(' ')}
//                                 </p>
//                               </div>
//                               <div>
//                                 <h4 className="text-sm font-medium text-gray-400 mb-1">Example Messages</h4>
//                                 <div className="space-y-2">
//                                   {parseCharacterFile(selectedAgent.character_file).messageExamples.slice(0, 2).map((example: MessageExample[], idx: number) => (
//                                     <div key={idx} className="bg-gray-800/50 p-3 rounded">
//                                       <p className="text-blue-300 text-sm">{example[0].user}: {example[0].content.text}</p>
//                                       <p className="text-green-300 text-sm mt-1">{example[1].user}: {example[1].content.text}</p>
//                                     </div>
//                                   ))}
//                                 </div>
//                               </div>
//                             </div>
//                           ) : (
//                             <p className="text-gray-400">No description available</p>
//                           )}
//                         </div>

//                         {/* Technical Details */}
//                         <div className="bg-gray-900/30 rounded-lg p-5 border border-white/10">
//                           <div className="flex items-center gap-2 mb-4">
//                             <Settings className="w-5 h-5 text-blue-400" />
//                             <h3 className="text-lg font-semibold text-white">Agent Details</h3>
//                           </div>
//                           <div className="space-y-4">
//                             <div>
//                               <h4 className="text-sm font-medium text-gray-400 mb-1">Agent ID</h4>
//                               <div className="flex items-center gap-2">
//                                 <p className="text-gray-300 font-mono text-sm">{selectedAgent.id}</p>
//                                 <button
//                                   onClick={() => copyToClipboard(selectedAgent.id)}
//                                   className="text-gray-400 hover:text-white"
//                                   title="Copy to clipboard"
//                                 >
//                                   <Copy className="w-4 h-4" />
//                                 </button>
//                               </div>
//                             </div>

//                             <div>
//                               <h4 className="text-sm font-medium text-gray-400 mb-1">Domain</h4>
//                               <div className="flex items-center gap-2">
//                                 <a
//                                   href={`https://${selectedAgent.domain}`}
//                                   target="_blank"
//                                   rel="noopener noreferrer"
//                                   className="text-blue-400 hover:underline flex items-center gap-1"
//                                 >
//                                   {selectedAgent.domain}
//                                   <ExternalLink className="w-3 h-3" />
//                                 </a>
//                               </div>
//                             </div>

//                             <div>
//                               <h4 className="text-sm font-medium text-gray-400 mb-1">Created At</h4>
//                               <p className="text-gray-300">{formatDate(selectedAgent.created_at)}</p>
//                             </div>

//                             <div>
//                               <h4 className="text-sm font-medium text-gray-400 mb-1">Voice Model</h4>
//                               <p className="text-gray-300">{selectedAgent.voice_model || 'Not specified'}</p>
//                             </div>

//                             <div>
//                               <h4 className="text-sm font-medium text-gray-400 mb-1">Connected Clients</h4>
//                               <div className="flex flex-wrap gap-2 mt-1">
//                                 {selectedAgent.clients ? (
//                                   (typeof selectedAgent.clients === 'string' 
//                                     ? JSON.parse(selectedAgent.clients) 
//                                     : selectedAgent.clients
//                                   ).map((client: string) => (
//                                     <span key={client} className="px-2 py-1 bg-blue-900/30 text-blue-300 rounded text-xs">
//                                       {client}
//                                     </span>
//                                   ))
//                                 ) : (
//                                   <span className="text-gray-400">No connected clients</span>
//                                 )}
//                               </div>
//                             </div>
//                           </div>
//                         </div>

//                         {/* Advanced Info */}
//                         <div className="bg-gray-900/30 rounded-lg p-5 border border-white/10 lg:col-span-2">
//                           <div className="flex items-center gap-2 mb-4">
//                             <Zap className="w-5 h-5 text-blue-400" />
//                             <h3 className="text-lg font-semibold text-white">Advanced Information</h3>
//                           </div>
//                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                             <div>
//                               <h4 className="text-sm font-medium text-gray-400 mb-1">Server Domain</h4>
//                               <p className="text-gray-300 font-mono text-sm">{selectedAgent.server_domain}</p>
//                             </div>
//                             <div>
//                               <h4 className="text-sm font-medium text-gray-400 mb-1">Wallet Address</h4>
//                               <div className="flex items-center gap-2">
//                                 <p className="text-gray-300 font-mono text-sm truncate">{selectedAgent.wallet_address}</p>
//                                 <button
//                                   onClick={() => copyToClipboard(selectedAgent.wallet_address || '')}
//                                   className="text-gray-400 hover:text-white"
//                                   title="Copy to clipboard"
//                                 >
//                                   <Copy className="w-4 h-4" />
//                                 </button>
//                               </div>
//                             </div>
//                             <div>
//                               <h4 className="text-sm font-medium text-gray-400 mb-1">Model Provider</h4>
//                               <p className="text-gray-300">
//                                 {selectedAgent.character_file && parseCharacterFile(selectedAgent.character_file).modelProvider || 'Not specified'}
//                               </p>
//                             </div>
//                           </div>
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               )}
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Integration Code Modal */}
//       {showModal && selectedAgent && (
//         <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
//           <div className="bg-gray-900 rounded-xl border border-white/10 max-w-2xl w-full p-6">
//             <div className="flex justify-between items-center mb-4">
//               <h3 className="text-xl font-bold text-white">Integrate {selectedAgent.name} with your app</h3>
//               <button
//                 onClick={() => setShowModal(false)}
//                 className="text-gray-400 hover:text-white"
//               >
//                 &times;
//               </button>
//             </div>

//             {/* Widget Configuration Section */}
//             <div className="mb-6 bg-gray-800/50 p-4 rounded-lg">
//               <h4 className="text-lg font-semibold text-white mb-4">Widget Configuration</h4>
              
//               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                 {/* Primary Color */}
//                 <div>
//                   <label className="block text-sm font-medium text-gray-300 mb-1">Primary Color</label>
//                   <div className="flex items-center gap-2">
//                     <div className="relative">
//                       <input
//                         type="color"
//                         value={widgetConfig.primaryColor}
//                         onChange={(e) => setWidgetConfig({...widgetConfig, primaryColor: e.target.value})}
//                         className="w-6 h-6 cursor-pointer absolute opacity-0"
//                       />
//                       <div 
//                         className="w-6 h-6 rounded border border-gray-500"
//                         style={{ backgroundColor: widgetConfig.primaryColor }}
//                       />
//                     </div>
//                     <input
//                       type="text"
//                       value={widgetConfig.primaryColor}
//                       onChange={(e) => setWidgetConfig({...widgetConfig, primaryColor: e.target.value})}
//                       className="w-28 bg-gray-700 text-white px-2 py-1 rounded text-sm h-8"
//                     />
//                   </div>
//                 </div>

//                 {/* Position */}
//                 <div>
//                   <label className="block text-sm font-medium text-gray-300 mb-1">Position</label>
//                   <select
//                     value={widgetConfig.position}
//                     onChange={(e) => setWidgetConfig({...widgetConfig, position: e.target.value})}
//                     className="w-full bg-gray-700 text-white px-3 py-1 rounded text-sm"
//                   >
//                     <option value="top-right">Top Right</option>
//                     <option value="top-left">Top Left</option>
//                     <option value="bottom-right">Bottom Right</option>
//                     <option value="bottom-left">Bottom Left</option>
//                   </select>
//                 </div>

//                 {/* Size */}
//                 <div>
//                   <label className="block text-sm font-medium text-gray-300 mb-1">Size</label>
//                   <select
//                     value={widgetConfig.size}
//                     onChange={(e) => setWidgetConfig({...widgetConfig, size: e.target.value})}
//                     className="w-full bg-gray-700 text-white px-3 py-1 rounded text-sm"
//                   >
//                     <option value="small">Small</option>
//                     <option value="medium">Medium</option>
//                     <option value="large">Large</option>
//                   </select>
//                 </div>
//               </div>
//             </div>

//             <div className="mb-4">
//               <div className="flex border-b border-gray-700">
//                 <button
//                   className={`px-4 py-2 ${activeTab === 'html' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400'}`}
//                   onClick={() => setActiveTab('html')}
//                 >
//                   HTML
//                 </button>
//                 <button
//                   className={`px-4 py-2 ${activeTab === 'react' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400'}`}
//                   onClick={() => setActiveTab('react')}
//                 >
//                   React
//                 </button>
//                 <button
//                   className={`px-4 py-2 ${activeTab === 'nextjs' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400'}`}
//                   onClick={() => setActiveTab('nextjs')}
//                 >
//                   Next.js
//                 </button>
//               </div>
//             </div>

//             <div className="relative bg-gray-800 rounded-lg p-4 mb-4">
//               <pre className="overflow-x-auto text-sm text-white">
//                 {generateSnippet()}
//               </pre>
//               <button
//                 onClick={() => copyToClipboard(generateSnippet())}
//                 className="absolute top-2 right-2 bg-gray-700 hover:bg-gray-600 text-white p-1 rounded"
//                 title="Copy to clipboard"
//               >
//                 <Copy className="w-4 h-4" />
//               </button>
//             </div>

//             <button
//               onClick={() => setShowModal(false)}
//               className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded transition-colors"
//             >
//               Close
//             </button>
//           </div>
//         </div>
//       )}

//       {/* Token Launch Modal */}
//       <TokenLaunchModal
//         isOpen={showTokenLaunchModal}
//         onClose={() => setShowTokenLaunchModal(false)}
//         wallet={walletAdapter}
//         onLaunchSuccess={handleTokenLaunchSuccess} 
//       />

//       {/* DBC Trade Modal (for pre-graduation) */}
//       // In your page.tsx where you render the DbcTradeModal:
// {agentTokenData && !isGraduated && selectedAgent && (
//         <DbcTradeModal
//           isOpen={showTradeModal}
//           onClose={() => setShowTradeModal(false)}
//           poolAddress={agentTokenData.dbcPoolAddress}
//           tokenMintAddress={agentTokenData.contractAddress} // <-- ADD THIS LINE
//           tokenName={agentTokenData.tokenName}
//           tokenSymbol={agentTokenData.tokenSymbol}
//           creatorName={selectedAgent.name || 'Agent'}
//         />
//       )}
//     </>
//   );
// }