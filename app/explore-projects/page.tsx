'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Loader2, Search, RefreshCw, AlertCircle, TrendingUp, ExternalLink, 
  ImageIcon, Copy, Check, Filter, ChevronDown, Ban, Lightbulb, 
  Rocket, Users, Clock, Eye, Github, Globe, FileText 
} from 'lucide-react';
import { toast } from 'sonner';
import StarCanvas from '@/components/StarCanvas';
import { LaunchedTokensService } from '@/services/launchedTokensService';
import { ProjectIdeasService } from '@/services/projectIdeasService';
import { LaunchedTokenData, ProjectIdeaData } from '@/lib/supabase';
import React from 'react';
import { useAppKitAccount } from "@reown/appkit/react";
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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
  const router = useRouter();
  const [launchedTokens, setLaunchedTokens] = useState<LaunchedTokenData[]>([]);
  const [projectIdeas, setProjectIdeas] = useState<ProjectIdeaData[]>([]);
  const [filteredTokens, setFilteredTokens] = useState<LaunchedTokenData[]>([]);
  const [filteredIdeas, setFilteredIdeas] = useState<ProjectIdeaData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [tokenMetadataCache, setTokenMetadataCache] = useState<Map<string, TokenMetadata>>(new Map());
  
  const { address } = useAppKitAccount();

  // Function to fetch metadata from IPFS
  const fetchTokenMetadata = useCallback(async (metadataUri: string): Promise<TokenMetadata | null> => {
    try {
      if (tokenMetadataCache.has(metadataUri)) {
        return tokenMetadataCache.get(metadataUri)!;
      }

      const response = await fetch(metadataUri);
      if (!response.ok) {
        throw new Error(`Failed to fetch metadata: ${response.statusText}`);
      }
      
      const metadata: TokenMetadata = await response.json();
      setTokenMetadataCache(prev => new Map(prev).set(metadataUri, metadata));
      
      return metadata;
    } catch (error) {
      console.error('Error fetching token metadata:', error);
      return null;
    }
  }, [tokenMetadataCache]);

  // Load all data
  const loadAllData = useCallback(async (showLoadingIndicator = true) => {
    try {
      if (showLoadingIndicator) setIsLoading(true);
      setError(null);
      
      const [allTokens, allIdeas] = await Promise.all([
        LaunchedTokensService.getAllLaunchedTokens(100),
        ProjectIdeasService.getPublicProjectIdeas(100)
      ]);
      
      const unlaunchedIdeas = allIdeas.filter(idea => !idea.isLaunched);
      
      setLaunchedTokens(allTokens);
      setProjectIdeas(unlaunchedIdeas);
      setFilteredTokens(allTokens);
      setFilteredIdeas(unlaunchedIdeas);
      
    } catch (err) {
      console.error('Error loading data:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
      setError(errorMessage);
      toast.error(`Failed to load data: ${errorMessage}`);
    } finally {
      if (showLoadingIndicator) setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Filter based on search query
  useEffect(() => {
    let filteredTokensResult = launchedTokens;
    let filteredIdeasResult = projectIdeas;

    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      
      filteredTokensResult = launchedTokens.filter(token =>
        token.tokenName.toLowerCase().includes(query) ||
        token.tokenSymbol.toLowerCase().includes(query) ||
        token.contractAddress.toLowerCase().includes(query)
      );

      filteredIdeasResult = projectIdeas.filter(idea =>
        idea.projectName.toLowerCase().includes(query) ||
        idea.projectDescription.toLowerCase().includes(query) ||
        idea.projectCategory.toLowerCase().includes(query)
      );
    }

    // Sort by latest first
    const sortedTokens = filteredTokensResult.sort((a, b) => b.launchedAt - a.launchedAt);
    const sortedIdeas = filteredIdeasResult.sort((a, b) => 
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
    
    setFilteredTokens(sortedTokens);
    setFilteredIdeas(sortedIdeas);
  }, [searchQuery, launchedTokens, projectIdeas]);

  // Handle trade button click - UPDATED to navigate to trade page
  const handleTradeClick = (token: LaunchedTokenData) => {
    // Create query parameters for the trade page
    const params = new URLSearchParams({
      tokenAddress: token.contractAddress,
      tokenName: token.tokenName,
      tokenSymbol: token.tokenSymbol,
      poolAddress: token.dbcPoolAddress || '',
      metadataUri: token.metadataUri || '',
      tradeStatus: token.tradeStatus ? 'active' : 'graduated'
    });
    
    // Navigate to trade page with token data
    router.push(`/trade?${params.toString()}`);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const formatDate = (timestamp: number | string) => {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      {/* Enhanced Background with Glassmorphism */}

      {/* Background Text */}
      <div className="absolute top-0 left-0 w-full overflow-hidden -z-10 pointer-events-none">
        <div className="w-[2661px] text-[370px] opacity-10 tracking-[24.96px] leading-[70%] font-moonhouse text-transparent text-left inline-block [-webkit-text-stroke:3px_#c8c8c8] [paint-order:stroke_fill] mix-blend-overlay">
          CYRENE
        </div>
      </div>

      <div className="min-h-screen text-white py-20 px-4 mt-24 relative">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl font-bold text-white mb-4 drop-shadow-lg"
            >
              Explore Projects
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-gray-400 drop-shadow-md"
            >
              Discover projects and tokens at every stage
            </motion.p>
          </div>

          {/* Search Bar */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex justify-center mb-8"
          >
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={handleSearch}
                className="w-full bg-gray-800/70 backdrop-blur-md border border-gray-600/50 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/60 focus:bg-gray-700/80 transition-all duration-300 text-sm shadow-lg"
              />
            </div>
          </motion.div>

          {/* Content */}
          {isLoading ? (
            <div className="text-center py-20">
              <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-blue-400" />
              <p className="text-gray-400">Loading projects...</p>
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={() => loadAllData()}
                className="px-6 py-2 bg-blue-600/80 hover:bg-blue-700/80 backdrop-blur-sm text-white rounded-lg transition-all duration-300 shadow-lg"
              >
                Try Again
              </button>
            </div>
          ) : filteredIdeas.length === 0 && filteredTokens.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-gray-400 mb-2">
                {searchQuery ? `No projects found matching "${searchQuery}"` : 'No projects found'}
              </p>
              <p className="text-gray-500 text-sm">
                {searchQuery ? 'Try a different search term' : 'Be the first to launch a project!'}
              </p>
            </div>
          ) : (
            <>
              {/* Phase Columns */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Inception Column */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6 }}
                  className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 rounded-2xl overflow-hidden shadow-2xl"
                >
                  {/* Column Header */}
                  <div className="bg-gray-800/80 backdrop-blur-sm border-b border-gray-600/50 p-4">
                    <div className="flex items-center gap-3">
                      <Lightbulb className="w-5 h-5 text-blue-400" />
                      <h2 className="text-lg font-semibold text-white">Ideation</h2>
                      <div className="ml-auto bg-gray-700/80 backdrop-blur-sm border border-gray-600/50 px-3 py-1 rounded-full text-sm text-gray-300">
                        {filteredIdeas.length}
                      </div>
                    </div>
                  </div>

                  {/* Column Content */}
                  <div className="p-4 min-h-[600px]">
                    <div className="space-y-3">
                      {filteredIdeas.length === 0 ? (
                        <div className="text-center py-12">
                          <Lightbulb className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                          <p className="text-gray-400">No projects in ideation phase</p>
                        </div>
                      ) : (
                        filteredIdeas.map((idea, index) => (
                          <ProjectIdeaCard
                            key={idea.id}
                            idea={idea}
                            index={index}
                            formatDate={formatDate}
                          />
                        ))
                      )}
                    </div>
                  </div>
                </motion.div>

                {/* Cooking/Launched Column */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 rounded-2xl overflow-hidden shadow-2xl"
                >
                  {/* Column Header */}
                  <div className="bg-gray-800/80 backdrop-blur-sm border-b border-gray-600/50 p-4">
                    <div className="flex items-center gap-3">
                      <Rocket className="w-5 h-5 text-blue-400" />
                      <h2 className="text-lg font-semibold text-white">Cooking</h2>
                      <div className="ml-auto bg-gray-700/80 backdrop-blur-sm border border-gray-600/50 px-3 py-1 rounded-full text-sm text-gray-300">
                        {filteredTokens.length}
                      </div>
                    </div>
                  </div>

                  {/* Column Content */}
                  <div className="p-4 min-h-[600px]">
                    <div className="space-y-3">
                      {filteredTokens.length === 0 ? (
                        <div className="text-center py-12">
                          <Rocket className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                          <p className="text-gray-400">No tokens launched yet</p>
                        </div>
                      ) : (
                        filteredTokens.map((token, index) => (
                          <TokenCard
                            key={token.contractAddress}
                            token={token}
                            index={index}
                            onTradeClick={() => handleTradeClick(token)}
                            formatDate={formatDate}
                            fetchTokenMetadata={fetchTokenMetadata}
                          />
                        ))
                      )}
                    </div>
                  </div>
                </motion.div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// Project Idea Card Component (unchanged)
interface ProjectIdeaCardProps {
  idea: ProjectIdeaData;
  index: number;
  formatDate: (timestamp: number | string) => string;
}

const ProjectIdeaCard: React.FC<ProjectIdeaCardProps> = ({ idea, index, formatDate }) => {
  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-gray-900/80 backdrop-blur-md border border-gray-700/50 rounded-xl p-4 hover:bg-gray-800/90 hover:border-gray-600/60 transition-all duration-300 group shadow-lg"
    >
      {/* Project header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-gray-800/80 backdrop-blur-sm border border-gray-600/50 flex items-center justify-center overflow-hidden">
          {idea.projectImage ? (
            <img
              src={idea.projectImage}
              alt={idea.projectName}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/shapes/svg?seed=${idea.projectName}`;
              }}
            />
          ) : (
            <Lightbulb className="w-5 h-5 text-blue-400" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-white text-sm truncate" title={idea.projectName}>
            {idea.projectName}
          </h3>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span>{idea.projectCategory}</span>
            <span>•</span>
            <span>{idea.teamMembers.length} members</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Link
            href={`/launch-projects?ideaId=${idea.id}`}
            className="p-1 text-gray-400 hover:text-blue-400 transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </Link>
          {idea.githubUrl && (
            <a
              href={idea.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 text-gray-400 hover:text-white transition-colors"
              title="GitHub"
            >
              <Github className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>

      {/* Description */}
      {idea.projectDescription && (
        <p className="text-gray-300 text-xs mb-2 line-clamp-2" title={idea.projectDescription}>
          {truncateText(idea.projectDescription, 80)}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{formatDate(idea.createdAt!)}</span>
        <span>{idea.projectIndustry}</span>
      </div>
    </motion.div>
  );
};

// Token Card Component (updated to use router navigation)
interface TokenCardProps {
  token: LaunchedTokenData;
  index: number;
  onTradeClick: () => void;
  formatDate: (timestamp: number | string) => string;
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

  const getTokenStatus = () => {
    if (token.dammPoolAddress) {
      return { status: 'graduated', label: 'Graduated', color: 'green' };
    }
    if (!token.tradeStatus) {
      return { status: 'Graduated', label: 'Graduated', color: 'green' };
    }
    return { status: 'active', label: 'Active', color: 'blue' };
  };

  const statusInfo = getTokenStatus();

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

  useEffect(() => {
    const loadTokenImage = async () => {
      if (!token.metadataUri) {
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
          setTokenImage(`https://api.dicebear.com/7.x/shapes/svg?seed=${token.contractAddress}&backgroundColor=1e40af,1e3a8a,1d4ed8`);
        }
      } catch (error) {
        console.error('Failed to load token image:', error);
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-gray-900/90 backdrop-blur-md border border-gray-700/60 rounded-xl p-4 hover:bg-gray-800/95 hover:border-gray-600/70 transition-all duration-300 group shadow-xl"
    >
      {/* Token header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-gray-800/90 backdrop-blur-sm border border-gray-600/60 flex items-center justify-center overflow-hidden">
          {imageLoading ? (
            <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
          ) : tokenImage ? (
            <img
              src={tokenImage}
              alt={`${token.tokenName} logo`}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/shapes/svg?seed=${token.contractAddress}`;
              }}
            />
          ) : (
            <ImageIcon className="w-5 h-5 text-white/50" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-white text-sm truncate" title={token.tokenName}>
            {token.tokenName}
          </h3>
          <div className="flex items-center gap-2 text-xs text-gray-300">
            <span className="font-mono">${token.tokenSymbol}</span>
            <span>•</span>
            <div className="flex items-center gap-1">
              <div className={`w-1.5 h-1.5 rounded-full ${
                statusInfo.color === 'green' ? 'bg-green-400' :
                statusInfo.color === 'orange' ? 'bg-orange-400' :
                'bg-blue-400'
              }`}></div>
              <span>{statusInfo.label}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onTradeClick}
            className="px-3 py-1.5 bg-blue-600/80 hover:bg-blue-700/80 backdrop-blur-sm text-white rounded-lg text-xs transition-all duration-300 shadow-lg border border-blue-500/30"
          >
            Trade
          </button>
          
          <button
            onClick={() => copyToClipboard(token.contractAddress, 'Contract')}
            className="p-1.5 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-700/40"
            title="Copy contract"
          >
            {copiedField === 'Contract' ? (
              <Check className="w-4 h-4 text-green-400" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Contract Address */}
      <div className="text-xs text-gray-400 font-mono mb-2 bg-gray-800/60 backdrop-blur-sm rounded px-2 py-1 border border-gray-700/40">
        {truncateAddress(token.contractAddress)}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>{formatDate(token.launchedAt)}</span>
        <span>{token.quoteMint}</span>
      </div>
    </motion.div>
  );
});

TokenCard.displayName = 'TokenCard';