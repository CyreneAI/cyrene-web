// app/launch-projects/page.tsx
'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Upload, TrendingUp, ExternalLink, ChevronDown, AlertCircle, RefreshCw, DollarSign, Zap, Image as LucidImage, Ban, Settings } from 'lucide-react';
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
import { Copy, Check } from 'lucide-react';
import Image from "next/image";
import axios from 'axios';

interface TokenLaunchParams {
  totalTokenSupply: number;
  migrationQuoteThreshold: number;
  quoteMint: QuoteMintType;
  name: string;
  symbol: string;
  image: string;
  description: string;
  // First buy parameters
  firstBuyAmountSol: number;
  minimumTokensOut: number;
  enableFirstBuy: boolean;
  // Trade status parameter
  tradeStatus: boolean;
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
    description: '',
    firstBuyAmountSol: 0.1, // Default 0.1 SOL first buy
    minimumTokensOut: 1000000, // Default minimum tokens expected
    enableFirstBuy: true, // Enable first buy by default
    tradeStatus: true // Enable trading by default
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState<number | null>(null);
  const [totalTransactions] = useState(2);
  const [conversionRates, setConversionRates] = useState<ConversionRate | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);
  const [launchedTokens, setLaunchedTokens] = useState<LaunchedTokenData[]>([]);
  const [selectedToken, setSelectedToken] = useState<LaunchedTokenData | null>(null);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [currentLaunchedToken, setCurrentLaunchedToken] = useState<LaunchedTokenData | null>(null);
  
  // Image upload states
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageHash, setImageHash] = useState<string>('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  
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

  // Handle file upload to IPFS
  const uploadToIPFS = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('/api/ipfs', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.file.cid;
    } catch (error) {
      console.error('IPFS upload error:', error);
      toast.error('Failed to upload image to IPFS');
      throw error;
    }
  };

  // Handle image file change
  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Image size must be less than 10MB');
        return;
      }

      setIsUploadingImage(true);
      
      try {
        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);

        // Upload to IPFS
        const hash = await uploadToIPFS(file);
        setImageHash(hash);
        
        // Update params with IPFS URL
        const ipfsUrl = `https://ipfs.erebrus.io/ipfs/${hash}`;
        setParams(prev => ({
          ...prev,
          image: ipfsUrl
        }));
        
        toast.success('Image uploaded successfully to IPFS');
      } catch (error) {
        toast.error('Failed to upload image');
        setImagePreview(null);
        setImageHash('');
      } finally {
        setIsUploadingImage(false);
      }
    }
  };

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

  // Function to handle trade status toggle for existing tokens
  const handleTradeStatusToggle = async (token: LaunchedTokenData) => {
    const currentAddress = addressRef.current;
    if (!currentAddress) return;
    
    try {
      const updatedToken = await LaunchedTokensService.updateTradeStatus(
        token.contractAddress,
        currentAddress,
        !token.tradeStatus
      );
      
      if (updatedToken) {
        // Update both lists and current token
        setLaunchedTokens(prevTokens => 
          prevTokens.map(t => 
            t.contractAddress === token.contractAddress ? updatedToken : t
          )
        );
        
        if (currentLaunchedToken?.contractAddress === token.contractAddress) {
          setCurrentLaunchedToken(updatedToken);
        }
        
        toast.success(`Trading ${updatedToken.tradeStatus ? 'enabled' : 'disabled'} for ${updatedToken.tokenName}`);
      }
    } catch (error) {
      console.error('Error updating trade status:', error);
      toast.error('Failed to update trade status');
    }
  };

  // Handle trade button click - now respects trade status
  const handleTradeClick = (token: LaunchedTokenData) => {
    if (!token.tradeStatus) {
      // Redirect to Jupiter tokens page if trade is disabled
      window.open(`https://jup.ag/tokens/${token.contractAddress}`, '_blank');
      return;
    }
    
    setSelectedToken(token);
    setShowTradeModal(true);
  };

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
    const { name, value, type } = e.target;
    setParams(prev => ({
      ...prev,
      [name]: type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked
        : (name === 'totalTokenSupply' || name === 'migrationQuoteThreshold' || name === 'firstBuyAmountSol' || name === 'minimumTokensOut')
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

  const calculateFirstBuyValue = () => {
    if (!conversionRates) return '$0.00';
    return `$${(params.firstBuyAmountSol * conversionRates.solToUsd).toFixed(2)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!walletAdapter.publicKey || !walletAdapter.isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }
  
    if (!params.name || !params.symbol || !params.image || !params.description) {
      toast.error('Please fill in all required fields and upload an image');
      return;
    }

    if (params.enableFirstBuy && params.firstBuyAmountSol <= 0) {
      toast.error('First buy amount must be greater than 0');
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
      toast.info('Creating token pool with first buy...');
  
      // Pass first buy parameters to createPool
      const poolResult = await createPool({
        configAddress: configResult.configAddress,
        name: params.name,
        symbol: params.symbol,
        image: params.image, // This will now be the IPFS URL
        description: params.description,
        firstBuyAmountSol: params.enableFirstBuy ? params.firstBuyAmountSol : undefined,
        minimumTokensOut: params.enableFirstBuy ? params.minimumTokensOut : undefined
      }, walletAdapter);
  
      if (!poolResult.success) {
        throw new Error(poolResult.error || 'Failed to create pool');
      }
  
      console.log('Pool created successfully:', poolResult.dbcPoolAddress);
      
      let successMessage = `Token launched successfully! Pool: ${poolResult.dbcPoolAddress?.slice(0, 8)}...${poolResult.dbcPoolAddress?.slice(-8)}`;
      if (poolResult.firstBuySignature) {
        successMessage += ` | First buy completed!`;
      }
      
      toast.success(successMessage);
  
      const tokenData: LaunchedTokenData = {
        contractAddress: poolResult.contractAddress || '',
        dbcPoolAddress: poolResult.dbcPoolAddress || '',
        configAddress: configResult.configAddress,
        quoteMint: params.quoteMint,
        tokenName: params.name,
        tokenSymbol: params.symbol,
        metadataUri: poolResult.metadataUri, // Add this line to store IPFS metadata URI
        tradeStatus: params.tradeStatus, // Include trade status
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
        description: '',
        firstBuyAmountSol: 0.1,
        minimumTokensOut: 1000000,
        enableFirstBuy: true,
        tradeStatus: true // Reset to enabled
      });

      // Reset image states
      setImagePreview(null);
      setImageHash('');
      
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
      handleTradeClick(currentLaunchedToken);
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
         <div className="absolute top-0 left-0 w-full overflow-hidden -z-10 pointer-events-none">
      <div className="w-[2661px]  text-[370px] opacity-10 tracking-[24.96px] leading-[70%] font-moonhouse text-transparent text-left inline-block [-webkit-text-stroke:3px_#c8c8c8] [paint-order:stroke_fill] mix-blend-overlay">
        CYRENE
      </div>
    </div>
    
      <div className="min-h-screen text-white py-20 px-4 mt-24">
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

                {/* Image Upload Section */}
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Project Image
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Upload Section */}
                    <div>
                      <label className="block border-2 border-dashed border-gray-600 rounded-xl p-6 cursor-pointer hover:border-blue-500 transition-all group">
                        <div className="text-center">
                          {isUploadingImage ? (
                            <div className="flex flex-col items-center gap-2">
                              <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                              <span className="text-sm text-blue-300">Uploading to IPFS...</span>
                            </div>
                          ) : (
                            <>
                              <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400 group-hover:text-blue-400 transition-colors" />
                              <p className="text-sm text-gray-400 group-hover:text-white">
                                Click to upload image
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                PNG, JPG, GIF up to 10MB
                              </p>
                            </>
                          )}
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                          disabled={isLoading || isUploadingImage}
                        />
                      </label>
                    </div>
                    
                    {/* Preview Section */}
                    <div className="border border-gray-600 rounded-xl p-6 flex items-center justify-center bg-gray-800/50">
                      {imagePreview ? (
                        <div className="text-center">
                          <Image
                            src={imagePreview}
                            alt="Token Preview"
                            width={120}
                            height={120}
                            className="rounded-lg mx-auto mb-2 object-cover"
                          />
                          <p className="text-xs text-green-400">✓ Uploaded to IPFS</p>
                          {imageHash && (
                            <p className="text-xs text-gray-500 mt-1 truncate">
                              Hash: {imageHash.slice(0, 8)}...
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="text-center text-gray-500">
                          <LucidImage className="w-12 h-12 mx-auto mb-2" />
                          <p className="text-sm">Image preview</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {params.image && (
                    <div className="mt-2 p-2 bg-green-900/20 border border-green-500/30 rounded text-xs text-green-300">
                      ✓ Image URL: {params.image}
                    </div>
                  )}
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

                {/* Trade Settings Section */}
                {/* <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Settings className="w-6 h-6 text-purple-400" />
                    <h3 className="text-lg font-semibold text-white">Trade Settings</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label htmlFor="tradeStatus" className="text-gray-300 text-sm font-medium">
                          Enable Trading
                        </label>
                        <p className="text-xs text-gray-500 mt-1">
                          Allow users to trade your token directly or redirect to Jupiter
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          id="tradeStatus"
                          name="tradeStatus"
                          checked={params.tradeStatus}
                          onChange={handleInputChange}
                          className="sr-only peer"
                          disabled={isLoading}
                        />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                      </label>
                    </div>

                    <div className="text-xs text-gray-400 bg-gray-800/50 rounded-lg p-3">
                      💡 <strong>Trade Status:</strong> When enabled, users can trade your token directly through our platform. 
                      When disabled, users will be redirected to Jupiter's token information page.
                    </div>
                  </div>
                </div> */}

                {/* Bot Protection Section */}
                <div className="bg-gradient-to-r from-cyan-600/20 to-purple-600/20 border border-cyan-500/30 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Zap className="w-6 h-6 text-cyan-400" />
                    <h3 className="text-lg font-semibold text-white">Bot Protection</h3>
                    <div className="px-2 py-1 bg-cyan-600 text-cyan-100 rounded text-xs font-medium">
                      RECOMMENDED
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="enableFirstBuy"
                        name="enableFirstBuy"
                        checked={params.enableFirstBuy}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-cyan-600 bg-gray-700 border-gray-600 rounded focus:ring-cyan-500 focus:ring-2"
                        disabled={isLoading}
                      />
                      <label htmlFor="enableFirstBuy" className="text-gray-300 text-sm">
                        Enable instant first buy to prevent bots from front-running your token launch
                      </label>
                    </div>

                    {params.enableFirstBuy && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pl-7">
                        <div>
                          <label className="block text-gray-300 text-sm font-medium mb-2">
                            First Buy Amount (SOL)
                          </label>
                          <input
                            type="number"
                            name="firstBuyAmountSol"
                            value={params.firstBuyAmountSol}
                            onChange={handleInputChange}
                            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500"
                            min="0.001"
                            max="10"
                            step="0.001"
                            disabled={isLoading}
                            required={params.enableFirstBuy}
                          />
                          <div className="text-xs text-gray-500 mt-1">
                            {conversionRates && `≈ ${calculateFirstBuyValue()}`}
                          </div>
                        </div>

                        <div>
                          <label className="block text-gray-300 text-sm font-medium mb-2">
                            Minimum Tokens Expected
                          </label>
                          <input
                            type="number"
                            name="minimumTokensOut"
                            value={params.minimumTokensOut}
                            onChange={handleInputChange}
                            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500"
                            min="1"
                            disabled={isLoading}
                            required={params.enableFirstBuy}
                          />
                          <div className="text-xs text-gray-500 mt-1">
                            Slippage protection
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="text-xs text-gray-400 bg-gray-800/50 rounded-lg p-3">
                      💡 <strong>Pro tip:</strong> Enabling first buy executes your purchase in the same transaction as pool creation, 
                      preventing bots from buying before you can get your own tokens.
                    </div>
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
                        min="0.001"
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
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white py-4 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading || isUploadingImage || !params.image}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>
                        Transactions ({currentTransaction}/{totalTransactions}) - 
                        {currentTransaction === 1 ? ' Setting up config...' : ' Creating pool...'}
                      </span>
                    </div>
                  ) : !params.image ? (
                    'Please upload an image first'
                  ) : params.enableFirstBuy ? (
                    <div className="flex items-center justify-center gap-2">
                      <Zap className="w-5 h-5" />
                      <span>Launch Token with First Buy</span>
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
                      onTradeClick={() => handleTradeClick(token)}
                      onTradeStatusToggle={() => handleTradeStatusToggle(token)}
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
                      ) : currentLaunchedToken.tradeStatus ? (
                        <button
                          onClick={handleTradeCurrentToken}
                          className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                        >
                          <TrendingUp className="w-4 h-4" />
                          Trade
                        </button>
                      ) : (
                        <button
                          onClick={handleTradeCurrentToken}
                          className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                          title="Trading disabled - view on Jupiter"
                        >
                          <Ban className="w-4 h-4" />
                          View on Jupiter
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
  onTradeStatusToggle: () => void;
}

const LaunchedTokenCard: React.FC<LaunchedTokenCardProps> = React.memo(({ 
  token, 
  index, 
  onDammDerived, 
  onTradeClick,
  onTradeStatusToggle
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
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      toast.success(`${fieldName} copied!`);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      toast.error('Failed to copy');
    }
  };

  // Enhanced status determination including trade status
  const getTokenStatus = () => {
    if (token.dammPoolAddress) {
      return { status: 'graduated', label: 'Graduated', color: 'green' };
    }
    if (!token.tradeStatus) {
      return { status: 'trade-disabled', label: 'View Only', color: 'orange' };
    }
    return { status: 'active', label: 'Active', color: 'blue' };
  };

  const statusInfo = getTokenStatus();

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
              <div className={`w-2 h-2 rounded-full ${
                statusInfo.color === 'green' ? 'bg-green-500' :
                statusInfo.color === 'orange' ? 'bg-orange-500 animate-pulse' :
                'bg-blue-500 animate-pulse'
              }`}></div>
              <span className="text-xs text-gray-500">
                {statusInfo.label}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <p className="text-xs text-gray-500">
            {formatDate(token.launchedAt)}
          </p>
          {/* Trade Status Toggle - only show for non-graduated tokens */}
          {!token.dammPoolAddress && (
            <button
              onClick={onTradeStatusToggle}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                token.tradeStatus 
                  ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30' 
                  : 'bg-orange-600/20 text-orange-400 hover:bg-orange-600/30'
              }`}
              title={`Click to ${token.tradeStatus ? 'disable' : 'enable'} trading`}
            >
              {token.tradeStatus ? 'Trading ON' : 'Trading OFF'}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-gray-400">Token:</span>
            <button
              onClick={() => copyToClipboard(token.contractAddress, 'Contract Address')}
              className="p-1 hover:bg-gray-600 rounded text-gray-400 hover:text-white transition-colors"
              title="Copy contract address"
            >
              {copiedField === 'Contract Address' ? (
                <Check className="w-3 h-3 text-green-400" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
          </div>
          <p className="text-gray-300 font-mono truncate">
            {token.contractAddress.slice(0, 8)}...{token.contractAddress.slice(-4)}
          </p>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-gray-400">Pool:</span>
            <button
              onClick={() => copyToClipboard(token.dbcPoolAddress, 'Pool Address')}
              className="p-1 hover:bg-gray-600 rounded text-gray-400 hover:text-white transition-colors"
              title="Copy pool address"
            >
              {copiedField === 'Pool Address' ? (
                <Check className="w-3 h-3 text-green-400" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
          </div>
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
        ) : token.tradeStatus ? (
          <button
            onClick={onTradeClick}
            className="flex-1 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-1"
          >
            <TrendingUp className="w-3 h-3" />
            Trade
          </button>
        ) : (
          <button
            onClick={onTradeClick}
            className="flex-1 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-1"
            title="Trading disabled - view on Jupiter"
          >
            <Ban className="w-3 h-3" />
            View Only
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
    prevProps.token.tradeStatus === nextProps.token.tradeStatus &&
    prevProps.index === nextProps.index
  );
});

LaunchedTokenCard.displayName = 'LaunchedTokenCard';