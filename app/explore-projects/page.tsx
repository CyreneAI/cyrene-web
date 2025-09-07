'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Search, RefreshCw, AlertCircle, TrendingUp, ExternalLink, ImageIcon, Copy, Check, Filter, ChevronDown, Ban } from 'lucide-react';
import { toast } from 'sonner';
import StarCanvas from '@/components/StarCanvas';
import { LaunchedTokensService } from '@/services/launchedTokensService';
import { LaunchedTokenData } from '@/lib/supabase';
import React from 'react';
import { useAppKitAccount } from "@reown/appkit/react";
import { DbcTradeModal } from '@/components/DbcTradeModal';

// Interface for token metadata from IPFS
interface TokenMetadata {
  name: string;
  symbol: string;
  description: string;
  image: string;
  attributes?: Array<{
    trait_type: string;
    value: string;
  }>;
}

export default function ExploreProjectsPage() {
  const [tokens, setTokens] = useState<LaunchedTokenData[]>([]);
  const [filteredTokens, setFilteredTokens] = useState<LaunchedTokenData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedToken, setSelectedToken] = useState<LaunchedTokenData | null>(null);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [tokenMetadataCache, setTokenMetadataCache] = useState<Map<string, TokenMetadata>>(new Map());
  const [sortBy, setSortBy] = useState<'latest' | 'oldest' | 'alphabetical' | 'alphabetical-desc' | 'graduated-first' | 'active-first' | 'tradeable-first'>('latest');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  
  const itemsPerPage = 12;
  const { address } = useAppKitAccount();
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  // Sort options for the dropdown
  const sortOptions = [
    { value: 'latest', label: 'Latest First', icon: '🕐' },
    { value: 'oldest', label: 'Oldest First', icon: '🕑' },
    { value: 'alphabetical', label: 'A-Z', icon: '🔤' },
    { value: 'alphabetical-desc', label: 'Z-A', icon: '🔠' },
    { value: 'graduated-first', label: 'Graduated First', icon: '🎓' },
    { value: 'active-first', label: 'Active First', icon: '⚡' },
    { value: 'tradeable-first', label: 'Tradeable First', icon: '💰' },
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setShowSortDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Function to fetch metadata from IPFS
  const fetchTokenMetadata = useCallback(async (metadataUri: string): Promise<TokenMetadata | null> => {
    try {
      // Check cache first
      if (tokenMetadataCache.has(metadataUri)) {
        return tokenMetadataCache.get(metadataUri)!;
      }

      const response = await fetch(metadataUri);
      if (!response.ok) {
        throw new Error(`Failed to fetch metadata: ${response.statusText}`);
      }
      
      const metadata: TokenMetadata = await response.json();
      
      // Cache the metadata
      setTokenMetadataCache(prev => new Map(prev).set(metadataUri, metadata));
      
      return metadata;
    } catch (error) {
      console.error('Error fetching token metadata:', error);
      return null;
    }
  }, [tokenMetadataCache]);

  // Load all tokens
  const loadTokens = useCallback(async (showLoadingIndicator = true) => {
    try {
      if (showLoadingIndicator) setIsLoading(true);
      setError(null);
      
      const allTokens = await LaunchedTokensService.getAllLaunchedTokens(100);
      setTokens(allTokens);
      setFilteredTokens(allTokens);
      
      if (allTokens.length === 0) {
        setError('No tokens found');
      }
    } catch (err) {
      console.error('Error loading tokens:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load tokens';
      setError(errorMessage);
      toast.error(`Failed to load tokens: ${errorMessage}`);
    } finally {
      if (showLoadingIndicator) setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadTokens();
  }, [loadTokens]);

  // Function to sort tokens based on selected criteria
  const sortTokens = useCallback((tokensToSort: LaunchedTokenData[], sortCriteria: typeof sortBy) => {
    const sorted = [...tokensToSort];
    
    switch (sortCriteria) {
      case 'latest':
        return sorted.sort((a, b) => b.launchedAt - a.launchedAt);
      case 'oldest':
        return sorted.sort((a, b) => a.launchedAt - b.launchedAt);
      case 'alphabetical':
        return sorted.sort((a, b) => a.tokenName.toLowerCase().localeCompare(b.tokenName.toLowerCase()));
      case 'alphabetical-desc':
        return sorted.sort((a, b) => b.tokenName.toLowerCase().localeCompare(a.tokenName.toLowerCase()));
      case 'graduated-first':
        return sorted.sort((a, b) => {
          if (a.dammPoolAddress && !b.dammPoolAddress) return -1;
          if (!a.dammPoolAddress && b.dammPoolAddress) return 1;
          return b.launchedAt - a.launchedAt; // Secondary sort by latest
        });
      case 'active-first':
        return sorted.sort((a, b) => {
          if (!a.dammPoolAddress && b.dammPoolAddress) return -1;
          if (a.dammPoolAddress && !b.dammPoolAddress) return 1;
          return b.launchedAt - a.launchedAt; // Secondary sort by latest
        });
      case 'tradeable-first':
        return sorted.sort((a, b) => {
          if (a.tradeStatus && !b.tradeStatus) return -1;
          if (!a.tradeStatus && b.tradeStatus) return 1;
          return b.launchedAt - a.launchedAt; // Secondary sort by latest
        });
      default:
        return sorted.sort((a, b) => b.launchedAt - a.launchedAt);
    }
  }, []);

  // Filter and sort tokens based on search query and sort criteria
  useEffect(() => {
    let filtered = tokens;

    // Apply search filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = tokens.filter(token =>
        token.tokenName.toLowerCase().includes(query) ||
        token.tokenSymbol.toLowerCase().includes(query) ||
        token.contractAddress.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    const sortedAndFiltered = sortTokens(filtered, sortBy);
    
    setFilteredTokens(sortedAndFiltered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchQuery, tokens, sortBy, sortTokens]);

  // Get current page tokens
  const getCurrentPageTokens = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredTokens.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(filteredTokens.length / itemsPerPage);

  // Handle trade button click
  const handleTradeClick = (token: LaunchedTokenData) => {
    if (!token.tradeStatus) {
      // Redirect to Jupiter tokens page if trade is disabled
      window.open(`https://jup.ag/tokens/${token.contractAddress}`, '_blank');
      return;
    }
    
    setSelectedToken(token);
    setShowTradeModal(true);
  };

  // Search handler
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
    <div className="absolute top-0 left-0 w-full overflow-hidden -z-10 pointer-events-none">
      <div className="w-[2661px]  text-[370px] opacity-10 tracking-[24.96px] leading-[70%] font-moonhouse text-transparent text-left inline-block [-webkit-text-stroke:3px_#c8c8c8] [paint-order:stroke_fill] mix-blend-overlay">
        CYRENE
      </div>
    </div>
    

      <div className="min-h-screen text-white py-20 px-4 mt-24">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">Explore Projects</h1>
            <p className="text-gray-400">Discover tokens launched by the community</p>
          </div>

          {/* Search and Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, symbol, or contract address..."
                value={searchQuery}
                onChange={handleSearch}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg pl-12 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            
            {/* Sort Dropdown */}
            <div className="relative" ref={sortDropdownRef}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className="flex items-center justify-between bg-gray-800/95 backdrop-blur-sm border border-gray-700 rounded-xl pl-4 pr-3 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 cursor-pointer min-w-[160px] shadow-lg hover:bg-gray-700/95"
              >
                <div className="flex items-center">
                  <Filter className="w-4 h-4 mr-2 text-gray-400" />
                  <span className="text-sm">
                    {sortOptions.find(option => option.value === sortBy)?.label}
                  </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${showSortDropdown ? 'rotate-180' : ''}`} />
              </motion.button>

              <AnimatePresence>
                {showSortDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="absolute right-0 mt-2 w-56 origin-top-right bg-gray-800/95 backdrop-blur-sm rounded-xl shadow-2xl z-50 border border-gray-700 overflow-hidden"
                  >
                    <div className="py-1">
                      {sortOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setSortBy(option.value as typeof sortBy);
                            setShowSortDropdown(false);
                          }}
                          className={`flex items-center w-full px-4 py-3 text-sm text-left hover:bg-blue-500/30 transition-colors ${
                            sortBy === option.value ? 'bg-blue-500/30 text-white' : 'text-white'
                          }`}
                        >
                          <span className="mr-2">{option.icon}</span>
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <button
              onClick={() => loadTokens()}
              disabled={isLoading}
              className="flex items-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh tokens"
            >
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>

          {/* Results count */}
          {!isLoading && !error && (
            <div className="mb-6 text-gray-400 text-sm flex items-center justify-between">
              <div>
                {searchQuery ? (
                  <>
                    Found {filteredTokens.length} token{filteredTokens.length !== 1 ? 's' : ''} 
                    {searchQuery && ` matching "${searchQuery}"`}
                  </>
                ) : (
                  <>Showing {filteredTokens.length} total token{filteredTokens.length !== 1 ? 's' : ''}</>
                )}
              </div>
              <div className="text-xs text-gray-500">
                Sorted by: {
                  sortBy === 'latest' ? 'Latest First' :
                  sortBy === 'oldest' ? 'Oldest First' :
                  sortBy === 'alphabetical' ? 'A-Z' :
                  sortBy === 'alphabetical-desc' ? 'Z-A' :
                  sortBy === 'graduated-first' ? 'Graduated First' :
                  sortBy === 'active-first' ? 'Active First' :
                  sortBy === 'tradeable-first' ? 'Tradeable First' : 'Latest First'
                }
              </div>
            </div>
          )}

          {/* Content */}
          {isLoading ? (
            <div className="text-center py-20">
              <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-blue-400" />
              <p className="text-gray-400">Loading tokens...</p>
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={() => loadTokens()}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : filteredTokens.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-gray-400 mb-2">
                {searchQuery ? `No tokens found matching "${searchQuery}"` : 'No tokens found'}
              </p>
              <p className="text-gray-500 text-sm">
                {searchQuery ? 'Try a different search term' : 'Be the first to launch a token!'}
              </p>
            </div>
          ) : (
            <>
              {/* Glass Background Container for Token Grid */}
              <div className="relative w-full">
                {/* Glass Background */}
                <div className="absolute inset-0 bg-[#434a6033] rounded-[40px] backdrop-blur-[35px] backdrop-brightness-[100%]" />
                
                {/* Token Grid Content */}
                <div className="relative z-10 p-8 md:p-12">
                  {/* Token Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-12">
                    {getCurrentPageTokens().map((token, index) => (
                      <TokenCard
                        key={token.contractAddress}
                        token={token}
                        index={index}
                        onTradeClick={() => handleTradeClick(token)}
                        formatDate={formatDate}
                        fetchTokenMetadata={fetchTokenMetadata}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Pagination - Outside glass background */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                  >
                    Previous
                  </button>
                  
                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNumber;
                      if (totalPages <= 5) {
                        pageNumber = i + 1;
                      } else if (currentPage <= 3) {
                        pageNumber = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNumber = totalPages - 4 + i;
                      } else {
                        pageNumber = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNumber}
                          onClick={() => setCurrentPage(pageNumber)}
                          className={`w-10 h-10 rounded-lg transition-colors ${
                            currentPage === pageNumber
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
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
            creatorName="Community"
          />
        )}
      </div>
    </>
  );
}

// Token Card Component
interface TokenCardProps {
  token: LaunchedTokenData;
  index: number;
  onTradeClick: () => void;
  formatDate: (timestamp: number) => string;
  fetchTokenMetadata: (metadataUri: string) => Promise<TokenMetadata | null>;
}

const TokenCard: React.FC<TokenCardProps> = React.memo(({ 
  token, 
  index, 
  onTradeClick, 
  formatDate, 
  fetchTokenMetadata 
}) => {
  const [tokenImage, setTokenImage] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [metadata, setMetadata] = useState<TokenMetadata | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Enhanced status determination including trade status
  const getTokenStatus = () => {
    // If dammPoolAddress exists, token has graduated
    if (token.dammPoolAddress) {
      return { status: 'graduated', label: 'Graduated', color: 'green' };
    }
    // Check trade status for active tokens
    if (!token.tradeStatus) {
      return { status: 'graduated', label: 'Graduated', color: 'green' };
    }
    // Otherwise, it's active and tradeable
    return { status: 'active', label: 'Active', color: 'blue' };
  };

  const statusInfo = getTokenStatus();

  // Copy to clipboard function
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

  // Fetch token metadata and image
  useEffect(() => {
    const loadTokenImage = async () => {
      if (!token.metadataUri) {
        // Fallback to generated avatar if no metadata URI
        setTokenImage(`https://api.dicebear.com/7.x/shapes/svg?seed=${token.contractAddress}&backgroundColor=1e40af,1e3a8a,1d4ed8&backgroundRotation=10,20,30`);
        return;
      }

      setImageLoading(true);
      try {
        const fetchedMetadata = await fetchTokenMetadata(token.metadataUri);
        if (fetchedMetadata) {
          setMetadata(fetchedMetadata);
          setTokenImage(fetchedMetadata.image);
        } else {
          // Fallback to generated avatar
          setTokenImage(`https://api.dicebear.com/7.x/shapes/svg?seed=${token.contractAddress}&backgroundColor=1e40af,1e3a8a,1d4ed8`);
        }
      } catch (error) {
        console.error('Failed to load token image:', error);
        // Fallback to generated avatar
        setTokenImage(`https://api.dicebear.com/7.x/shapes/svg?seed=${token.contractAddress}&backgroundColor=1e40af,1e3a8a,1d4ed8`);
      } finally {
        setImageLoading(false);
      }
    };

    loadTokenImage();
  }, [token.metadataUri, token.contractAddress, fetchTokenMetadata]);

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="relative bg-[#000010] transition-colors duration-300 rounded-3xl p-6 border border-white/10 hover:border-white/20 group backdrop-blur-sm"
    >
      {/* Status indicator */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full shadow-lg ${
          statusInfo.color === 'green' ? 'bg-green-400 shadow-green-400/50' :
          statusInfo.color === 'orange' ? 'bg-orange-400 shadow-orange-400/50' :
          'bg-blue-400 shadow-blue-400/50'
        }`}></div>
        <span className="text-xs text-gray-300">
          {statusInfo.label}
        </span>
      </div>

      {/* Token Image */}
      <div className="w-20 h-20 rounded-xl  bg-[#000010] flex items-center justify-center overflow-hidden relative shadow-lg">
        {imageLoading ? (
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        ) : tokenImage ? (
          <img
            src={tokenImage}
            alt={`${token.tokenName} logo`}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Final fallback
              (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/shapes/svg?seed=${token.contractAddress}`;
            }}
          />
        ) : (
          <ImageIcon className="w-8 h-8 text-white/50" />
        )}
      </div>

      {/* Token Info */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white mb-1" title={token.tokenName}>
          {truncateText(token.tokenName, 20)}
        </h3>
        <p className="text-blue-300 text-sm font-mono mb-2">
          ${token.tokenSymbol}
        </p>
        
        {/* Show description if available from metadata */}
        {metadata?.description && (
          <p className="text-gray-300 text-xs mb-2 line-clamp-2" title={metadata.description}>
            {truncateText(metadata.description, 80)}
          </p>
        )}
        
        {/* Contract Address with Copy Button */}
        <div className="flex items-center justify-between text-xs text-gray-300">
          <span>Contract</span>
          <div className="flex items-center gap-2">
            <span className="font-mono">{truncateAddress(token.contractAddress)}</span>
            <button
              onClick={() => copyToClipboard(token.contractAddress, 'Contract Address')}
              className="p-1 hover:bg-white/20 rounded text-gray-300 hover:text-white transition-colors"
              title="Copy contract address"
            >
              {copiedField === 'Contract Address' ? (
                <Check className="w-3 h-3 text-green-400" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-4"></div>

      {/* Token Stats */}
      <div className="grid grid-cols-2 gap-4 text-xs mb-4">
        <div>
          <span className="text-gray-300 block">Quote Token</span>
          <span className="text-blue-300 font-medium">{token.quoteMint}</span>
        </div>
        <div>
          <span className="text-gray-300 block">Launched</span>
          <span className="text-gray-200 font-medium">{formatDate(token.launchedAt)}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        {token.dammPoolAddress ? (
          // Graduated tokens - always go to Jupiter swap
          <a
            href={`https://jup.ag/swap/SOL-${token.contractAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm text-center font-medium flex items-center justify-center gap-1 shadow-lg"
          >
            <ExternalLink className="w-3 h-3" />
            Jupiter
          </a>
        ) : token.tradeStatus ? (
          // Active tokens with trade enabled - show trade button
          <button
            onClick={onTradeClick}
            className="flex-1 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-1 group-hover:bg-cyan-500 shadow-lg"
          >
            <TrendingUp className="w-3 h-3" />
            Trade
          </button>
        ) : (
          // Active tokens with trade disabled - show view on Jupiter button
          <button
            onClick={onTradeClick}
            className="flex-1 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-1 group-hover:bg-cyan-500 shadow-lg"
          >
            <TrendingUp className="w-3 h-3" />
            Trade
          </button>
        )}

        <a
          href={`https://solscan.io/token/${token.contractAddress}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm flex items-center justify-center group-hover:bg-white/20 backdrop-blur-sm shadow-lg"
          title="View on Solscan"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      {/* Hover effect overlay */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-600/0 to-purple-600/0 group-hover:from-blue-600/10 group-hover:to-purple-600/10 transition-all duration-300 pointer-events-none"></div>
    </motion.article>
  );
});

TokenCard.displayName = 'TokenCard';