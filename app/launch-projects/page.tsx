// app/launch-projects/page.tsx
'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Upload, TrendingUp, ExternalLink, ChevronDown, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import StarCanvas from '@/components/StarCanvas';
import ConnectButton from '@/components/common/ConnectBtn';
import { setupConfigWithWallet, QUOTE_MINTS, type QuoteMintType } from '@/helper/meteoraServices/createConfig';
import createPool from '@/helper/meteoraServices/createPool';
import { PublicKey, Transaction } from '@solana/web3.js';
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import type { Provider } from "@reown/appkit-adapter-solana/vue";
import { usePoolStatus } from '@/hooks/usePoolStatus';
import { DbcTradeModal } from '@/components/DbcTradeModal';
import { LaunchedTokensService } from '@/services/launchedTokensService';
import { LaunchedTokenData } from '@/lib/supabase';
import React from 'react';

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

export default function LaunchProjectsPage() {
  const [activeTab, setActiveTab] = useState<'launch' | 'tokens' | 'swap'>('launch');
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
  const [launchedTokens, setLaunchedTokens] = useState<LaunchedTokenData[]>([]);
  const [selectedToken, setSelectedToken] = useState<LaunchedTokenData | null>(null);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [currentLaunchedToken, setCurrentLaunchedToken] = useState<LaunchedTokenData | null>(null);
  
  // Database loading states
  const [tokensLoading, setTokensLoading] = useState(false);
  const [tokensError, setTokensError] = useState<string | null>(null);
  const [migrationStatus, setMigrationStatus] = useState<'idle' | 'migrating' | 'completed' | 'error'>('idle');

  // Stable refs to prevent callback recreation
  const launchedTokensRef = useRef<LaunchedTokenData[]>([]);
  const addressRef = useRef<string>('');
  const currentLaunchedTokenRef = useRef<LaunchedTokenData | null>(null);

  // Get wallet adapter
  const walletAdapter = useReownWalletAdapter();
  const { address, isConnected } = useAppKitAccount();

  // Update refs when state changes (no re-render triggers)
  useEffect(() => {
    launchedTokensRef.current = launchedTokens;
  }, [launchedTokens]);

  useEffect(() => {
    addressRef.current = address || '';
  }, [address]);

  useEffect(() => {
    currentLaunchedTokenRef.current = currentLaunchedToken;
  }, [currentLaunchedToken]);

  // Load launched tokens from Supabase
  const loadLaunchedTokens = useCallback(async (showLoading = true) => {
    const currentAddress = addressRef.current;
    if (!currentAddress) return;
    
    try {
      if (showLoading) setTokensLoading(true);
      setTokensError(null);
      
      const tokens = await LaunchedTokensService.getLaunchedTokens(currentAddress);
      setLaunchedTokens(tokens);
      
      if (tokens.length > 0) {
        setCurrentLaunchedToken(tokens[0]);
      }
    } catch (error) {
      console.error('Error loading launched tokens:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load tokens';
      setTokensError(errorMessage);
      toast.error(`Failed to load tokens: ${errorMessage}`);
    } finally {
      if (showLoading) setTokensLoading(false);
    }
  }, []); // Empty deps - uses ref for current address

  // Migrate from localStorage on first connection
  const handleMigration = useCallback(async () => {
    const currentAddress = addressRef.current;
    if (!currentAddress || migrationStatus !== 'idle') return;
    
    try {
      setMigrationStatus('migrating');
      const migratedTokens = await LaunchedTokensService.migrateFromLocalStorage(currentAddress);
      
      if (migratedTokens.length > 0) {
        toast.success(`Migrated ${migratedTokens.length} token(s) from local storage`);
        await loadLaunchedTokens(false); // Reload from database
      }
      
      setMigrationStatus('completed');
    } catch (error) {
      console.error('Migration error:', error);
      setMigrationStatus('error');
      toast.error('Failed to migrate local data');
    }
  }, [migrationStatus, loadLaunchedTokens]);

  // Load tokens when wallet connects
  useEffect(() => {
    if (address && isConnected) {
      handleMigration().then(() => {
        loadLaunchedTokens();
      });
    } else {
      setLaunchedTokens([]);
      setCurrentLaunchedToken(null);
    }
  }, [address, isConnected, handleMigration, loadLaunchedTokens]);

  // Save launched token to Supabase
  const saveLaunchedToken = async (tokenData: LaunchedTokenData) => {
    const currentAddress = addressRef.current;
    if (!currentAddress) return;
    
    try {
      const savedToken = await LaunchedTokensService.saveLaunchedToken(tokenData, currentAddress);
      
      // Update local state
      setLaunchedTokens(prev => [savedToken, ...prev]);
      setCurrentLaunchedToken(savedToken);
      
      toast.success('Token saved successfully!');
    } catch (error) {
      console.error('Error saving token:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save token';
      toast.error(`Failed to save token: ${errorMessage}`);
      
      // Fallback to localStorage as backup
      try {
        const key = `launched_tokens_${currentAddress}`;
        const existing = localStorage.getItem(key);
        const tokens = existing ? JSON.parse(existing) : [];
        tokens.unshift(tokenData);
        localStorage.setItem(key, JSON.stringify(tokens));
        
        setLaunchedTokens(prev => [tokenData, ...prev]);
        setCurrentLaunchedToken(tokenData);
        
        toast.info('Token saved to local storage as backup');
      } catch (localError) {
        console.error('Fallback save failed:', localError);
      }
    }
  };

  // Stable callback for current token DAMM derivation using refs
  const handleCurrentTokenDammDerived = useCallback(async (dammPoolAddress: string) => {
    const currentAddress = addressRef.current;
    const currentToken = currentLaunchedTokenRef.current;
    
    if (!currentAddress || !currentToken) return;
    
    try {
      const updatedToken = await LaunchedTokensService.updateLaunchedToken(
        currentToken.contractAddress, 
        currentAddress, 
        { dammPoolAddress }
      );
      
      if (updatedToken) {
        // Update both lists and current token using functional updates
        setLaunchedTokens(prevTokens => 
          prevTokens.map(token => 
            token.contractAddress === currentToken.contractAddress ? updatedToken : token
          )
        );
        
        setCurrentLaunchedToken(updatedToken);
        
        toast.success(`Token ${updatedToken.tokenName} graduated! AMM Pool is ready.`);
      }
    } catch (error) {
      console.error('Error updating token with DAMM pool:', error);
      toast.error('Failed to update token graduation status');
    }
  }, []); // Empty deps - uses refs for current values

  // Use the custom hook to monitor the current token's pool status
  const { isGraduated: currentTokenGraduated, isLoading: isCurrentPoolStatusLoading } = usePoolStatus({
    configAddress: currentLaunchedToken?.configAddress || null,
    contractAddress: currentLaunchedToken?.contractAddress || null,
    dbcPoolAddress: currentLaunchedToken?.dbcPoolAddress || null,
    quoteMint: currentLaunchedToken?.quoteMint || null,
    onDammDerive: handleCurrentTokenDammDerived,
  });

  // Stable callback for token list DAMM derivation using refs
  const handleTokenDammDerived = useCallback(async (dammPoolAddress: string, tokenIndex: number) => {
    const currentAddress = addressRef.current;
    const currentTokens = launchedTokensRef.current;
    
    if (!currentAddress) return;
    
    const token = currentTokens[tokenIndex];
    if (!token) return;
    
    try {
      const updatedToken = await LaunchedTokensService.updateLaunchedToken(
        token.contractAddress,
        currentAddress,
        { dammPoolAddress }
      );
      
      if (updatedToken) {
        // Update state using functional update to ensure we get latest state
        setLaunchedTokens(prevTokens => {
          const updatedTokens = [...prevTokens];
          const currentIndex = updatedTokens.findIndex(t => t.contractAddress === token.contractAddress);
          if (currentIndex !== -1) {
            updatedTokens[currentIndex] = updatedToken;
          }
          return updatedTokens;
        });
        
        // Update current token if it matches
        setCurrentLaunchedToken(prev => 
          prev?.contractAddress === token.contractAddress ? updatedToken : prev
        );
        
        toast.success(`Token ${updatedToken.tokenName} graduated! AMM Pool is ready.`);
      }
    } catch (error) {
      console.error('Error updating token with DAMM pool:', error);
      toast.error('Failed to update token graduation status');
    }
  }, []); // Empty deps - uses refs for current values

  // Fetch real-time prices
  useEffect(() => {
    const fetchPrices = async () => {
      setPriceLoading(true);
      try {
        const response = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd'
        );
        const data: PriceData = await response.json();
        
        const cyaiPrice = 0.05;
        const solPrice = data.solana?.usd || 0;
        
        setConversionRates({
          solToUsd: solPrice,
          cyaiToUsd: cyaiPrice,
          solToCyai: solPrice > 0 && cyaiPrice > 0 ? solPrice / cyaiPrice : 0,
          cyaiToSol: solPrice > 0 && cyaiPrice > 0 ? cyaiPrice / solPrice : 0
        });
      } catch (error) {
        console.error('Error fetching prices:', error);
        setConversionRates({
          solToUsd: 250,
          cyaiToUsd: 0.05,
          solToCyai: 5000,
          cyaiToSol: 0.0002
        });
      } finally {
        setPriceLoading(false);
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatPrice = (price: number) => {
    if (price < 0.01) return price.toFixed(6);
    if (price < 1) return price.toFixed(4);
    return price.toFixed(2);
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
      migrationQuoteThreshold: conversionRates ? 
        (newQuoteMint === 'SOL' ? 
          Math.round(prev.migrationQuoteThreshold * conversionRates.cyaiToSol) : 
          Math.round(prev.migrationQuoteThreshold * conversionRates.solToCyai)
        ) : prev.migrationQuoteThreshold
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!walletAdapter.publicKey || !walletAdapter.isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!params.name || !params.symbol || !params.image || !params.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('Starting token launch process...');
      
      toast.info('Setting up configuration...');
      const configResult = await setupConfigWithWallet(walletAdapter, {
        totalTokenSupply: params.totalTokenSupply,
        migrationQuoteThreshold: params.migrationQuoteThreshold,
        quoteMint: params.quoteMint
      });
      
      if (!configResult.success || !configResult.configAddress) {
        throw new Error(configResult.error || 'Failed to create config');
      }

      console.log('Config created successfully:', configResult.configAddress);
      toast.info('Creating token pool...');

      const poolResult = await createPool({
        configAddress: configResult.configAddress,
        name: params.name,
        symbol: params.symbol,
        image: params.image,
        description: params.description
      });

      if (!poolResult.success) {
        throw new Error(poolResult.error || 'Failed to create pool');
      }

      console.log('Pool created successfully:', poolResult.dbcPoolAddress);
      toast.success(`Token launched successfully! Pool: ${poolResult.dbcPoolAddress?.slice(0, 8)}...${poolResult.dbcPoolAddress?.slice(-8)}`);

      const tokenData: LaunchedTokenData = {
        contractAddress: poolResult.contractAddress || '',
        dbcPoolAddress: poolResult.dbcPoolAddress || '',
        configAddress: configResult.configAddress,
        quoteMint: params.quoteMint,
        tokenName: params.name,
        tokenSymbol: params.symbol,
        launchedAt: Date.now()
      };

      await saveLaunchedToken(tokenData);
      
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
      
    } catch (error) {
      console.error('Token launch error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to launch token';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle trade button click for current token
  const handleTradeCurrentToken = () => {
    if (currentLaunchedToken) {
      setSelectedToken(currentLaunchedToken);
      setShowTradeModal(true);
    }
  };

  if (!isConnected) {
    return (
      <>
        <StarCanvas/>
        <div className="flex flex-col items-center justify-center min-h-[60vh] pt-20">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-white">Connect your wallet</h2>
            <p className="text-gray-400">
              Please connect your wallet to launch tokens
            </p>
            <div className='px-20 py-3 ml-4'>
              <ConnectButton/>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <StarCanvas />
      <div className="min-h-screen bg-[#0B1426] text-white py-20 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">Launch Your Project</h1>
            <p className="text-gray-400">Discover and interact with our diverse collection of AI agents</p>
            
            {/* Migration Status */}
            {migrationStatus === 'migrating' && (
              <div className="mt-4 p-3 bg-blue-600/20 border border-blue-500/30 rounded-lg flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                <span className="text-blue-300 text-sm">Migrating your data...</span>
              </div>
            )}
            
            {migrationStatus === 'error' && (
              <div className="mt-4 p-3 bg-red-600/20 border border-red-500/30 rounded-lg flex items-center justify-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <span className="text-red-300 text-sm">Migration failed - using local backup</span>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex justify-center mb-8">
            <div className="flex bg-gray-800/50 rounded-full p-1">
              <button
                onClick={() => setActiveTab('launch')}
                className={`px-6 py-3 rounded-full text-sm font-medium transition-all ${
                  activeTab === 'launch'
                    ? 'bg-white text-black'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Basic Information
              </button>
              <button
                onClick={() => setActiveTab('tokens')}
                className={`px-6 py-3 rounded-full text-sm font-medium transition-all ${
                  activeTab === 'tokens'
                    ? 'bg-white text-black'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Launched Tokens {launchedTokens.length > 0 && `(${launchedTokens.length})`}
              </button>
              <button
                onClick={() => setActiveTab('swap')}
                className={`px-6 py-3 rounded-full text-sm font-medium transition-all ${
                  activeTab === 'swap'
                    ? 'bg-white text-black'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Swap
              </button>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'launch' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-900/50 rounded-2xl p-8 border border-gray-700"
            >
              <div className="mb-6">
                <div className="text-sm text-gray-400 bg-blue-600 px-3 py-1 rounded-full inline-block mb-4">
                  1 of 3
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Basic Information</h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      Enter Project Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={params.name}
                      onChange={handleInputChange}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      Ticker
                    </label>
                    <input
                      type="text"
                      name="symbol"
                      value={params.symbol}
                      onChange={handleInputChange}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 uppercase"
                      required
                      disabled={isLoading}
                      maxLength={10}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Image URL
                  </label>
                  <input
                    type="url"
                    name="image"
                    value={params.image}
                    onChange={handleInputChange}
                    placeholder="https://example.com/token-image.png"
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={params.description}
                    onChange={handleInputChange}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 min-h-[100px] resize-y"
                    required
                    disabled={isLoading}
                    maxLength={50000}
                  />
                  <div className="text-right text-xs text-gray-500 mt-1">
                    {params.description.length}/50000 characters
                  </div>
                </div>

                {/* Advanced Configuration */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Configuration</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">
                        Total Token Supply
                      </label>
                      <input
                        type="number"
                        name="totalTokenSupply"
                        value={params.totalTokenSupply}
                        onChange={handleInputChange}
                        className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                        required
                        disabled={isLoading}
                        min="1"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">
                        Migration Quote Threshold
                      </label>
                      <input
                        type="number"
                        name="migrationQuoteThreshold"
                        value={params.migrationQuoteThreshold}
                        onChange={handleInputChange}
                        className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                        required
                        disabled={isLoading}
                        min="1"
                        step="0.000001"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">
                        Quote Token
                      </label>
                      <div className="relative">
                        <select
                          name="quoteMint"
                          value={params.quoteMint}
                          onChange={handleQuoteMintChange}
                          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 appearance-none cursor-pointer"
                          required
                          disabled={isLoading}
                        >
                          {Object.entries(QUOTE_MINTS).map(([key, mint]) => (
                            <option key={key} value={key} className="bg-gray-800 text-white">
                              {mint.name} ({mint.fullSymbol})
                              {conversionRates && ` - $${formatPrice(key === 'SOL' ? conversionRates.solToUsd : conversionRates.cyaiToUsd)}`}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Launching Token...</span>
                    </div>
                  ) : (
                    'Launch Token'
                  )}
                </button>
              </form>
            </motion.div>
          )}

          {activeTab === 'tokens' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-900/50 rounded-2xl p-8 border border-gray-700"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Your Launched Tokens</h2>
                <button
                  onClick={() => loadLaunchedTokens()}
                  disabled={tokensLoading}
                  className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
                  title="Refresh tokens"
                >
                  <RefreshCw className={`w-4 h-4 text-white ${tokensLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
              
              {tokensLoading ? (
                <div className="text-center py-12">
                  <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-blue-400" />
                  <p className="text-gray-400">Loading your tokens...</p>
                </div>
              ) : tokensError ? (
                <div className="text-center py-12">
                  <AlertCircle className="w-8 h-8 mx-auto mb-4 text-red-400" />
                  <p className="text-red-400 mb-2">Failed to load tokens</p>
                  <p className="text-gray-500 text-sm mb-4">{tokensError}</p>
                  <button
                    onClick={() => loadLaunchedTokens()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              ) : launchedTokens.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🚀</div>
                  <p className="text-gray-400">No tokens launched yet</p>
                  <p className="text-gray-500 text-sm mt-2">
                    Launch your first token to see it here
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {launchedTokens.map((token, index) => (
                    <LaunchedTokenCard 
                      key={token.contractAddress} 
                      token={token}
                      index={index}
                      onDammDerived={handleTokenDammDerived}
                      onTradeClick={() => {
                        setSelectedToken(token);
                        setShowTradeModal(true);
                      }}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'swap' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-900/50 rounded-2xl p-8 border border-gray-700"
            >
              <h2 className="text-2xl font-bold text-white mb-6">Swap Tokens</h2>
              
              {tokensLoading ? (
                <div className="text-center py-12">
                  <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-blue-400" />
                  <p className="text-gray-400">Loading tokens...</p>
                </div>
              ) : currentLaunchedToken ? (
                <div className="space-y-6">
                  <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-600">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-white">{currentLaunchedToken.tokenName}</h3>
                        <p className="text-gray-400">{currentLaunchedToken.tokenSymbol}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-400 text-sm">Contract</p>
                        <p className="text-white font-mono text-sm">
                          {currentLaunchedToken.contractAddress.slice(0, 8)}...{currentLaunchedToken.contractAddress.slice(-4)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      {currentLaunchedToken.dammPoolAddress ? (
                        <a
                          href={`https://jup.ag/swap/SOL-${currentLaunchedToken.contractAddress}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg text-center font-medium transition-colors flex items-center justify-center gap-2"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Trade on Jupiter
                        </a>
                      ) : currentTokenGraduated ? (
                        <button disabled className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium cursor-wait">
                          Finalizing AMM...
                        </button>
                      ) : (
                        <button
                          onClick={handleTradeCurrentToken}
                          className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                        >
                          <TrendingUp className="w-4 h-4" />
                          Trade
                        </button>
                      )}
                      
                      <a
                        href={`https://solscan.io/token/${currentLaunchedToken.contractAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-gray-700 hover:bg-gray-600 text-white py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
                        title="View on Solscan"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-400">No tokens available for swapping</p>
                  <p className="text-gray-500 text-sm mt-2">
                    Launch a token first to enable swapping
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Trade Modal */}
        {selectedToken && (
          <DbcTradeModal
            isOpen={showTradeModal}
            onClose={() => setShowTradeModal(false)}
            poolAddress={selectedToken.dbcPoolAddress}
            tokenMintAddress={selectedToken.contractAddress}
            tokenName={selectedToken.tokenName}
            tokenSymbol={selectedToken.tokenSymbol}
            creatorName="Project"
          />
        )}
      </div>
    </>
  );
}

// Memoized LaunchedTokenCard component with stable callbacks
interface LaunchedTokenCardProps {
  token: LaunchedTokenData;
  index: number;
  onDammDerived: (dammPoolAddress: string, tokenIndex: number) => void;
  onTradeClick: () => void;
}

const LaunchedTokenCard: React.FC<LaunchedTokenCardProps> = React.memo(({ 
  token, 
  index, 
  onDammDerived, 
  onTradeClick 
}) => {
  // Create a stable callback for this specific token using useCallback
  const handleDammDerived = useCallback((dammPoolAddress: string) => {
    onDammDerived(dammPoolAddress, index);
  }, [onDammDerived, index]);

  const { isGraduated, isLoading: isPoolStatusLoading } = usePoolStatus({
    configAddress: token.configAddress,
    contractAddress: token.contractAddress,
    dbcPoolAddress: token.dbcPoolAddress,
    quoteMint: token.quoteMint,
    onDammDerive: handleDammDerived,
  });

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-gray-800/30 rounded-xl p-6 border border-gray-600 hover:border-gray-500 transition-colors"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h4 className="text-lg font-semibold text-white truncate">{token.tokenName}</h4>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-gray-400">{token.tokenSymbol}</span>
            <span className="px-2 py-1 bg-blue-900/50 text-blue-300 rounded text-xs">
              {token.quoteMint}
            </span>
            <div className="flex items-center gap-2">
              {isPoolStatusLoading ? (
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
              ) : isGraduated ? (
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              ) : (
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              )}
              <span className="text-xs text-gray-500">
                {isPoolStatusLoading ? 'Checking...' : isGraduated ? 'Graduated' : 'DBC Pool'}
              </span>
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-500">
          {formatDate(token.launchedAt)}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
        <div>
          <span className="text-gray-400">Contract:</span>
          <p className="text-gray-300 font-mono truncate">
            {token.contractAddress.slice(0, 8)}...{token.contractAddress.slice(-4)}
          </p>
        </div>
        <div>
          <span className="text-gray-400">Pool:</span>
          <p className="text-gray-300 font-mono truncate">
            {token.dbcPoolAddress.slice(0, 8)}...{token.dbcPoolAddress.slice(-4)}
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        {isPoolStatusLoading ? (
          <button disabled className="flex-1 py-2 bg-gray-600 text-white rounded-lg cursor-wait text-sm">
            <Loader2 className="w-4 h-4 mx-auto animate-spin" />
          </button>
        ) : token.dammPoolAddress ? (
          <a
            href={`https://jup.ag/swap/SOL-${token.contractAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm text-center font-medium"
          >
            Trade on Jupiter
          </a>
        ) : isGraduated ? (
          <button disabled className="flex-1 py-2 bg-blue-600 text-white rounded-lg cursor-wait text-sm">
            Finalizing...
          </button>
        ) : (
          <button
            onClick={onTradeClick}
            className="flex-1 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-1"
          >
            <TrendingUp className="w-3 h-3" />
            Trade
          </button>
        )}
        
        <a
          href={`https://solscan.io/token/${token.contractAddress}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm flex items-center justify-center"
          title="View on Solscan"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </motion.div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary re-renders
  return (
    prevProps.token.contractAddress === nextProps.token.contractAddress &&
    prevProps.token.dammPoolAddress === nextProps.token.dammPoolAddress &&
    prevProps.index === nextProps.index
  );
});