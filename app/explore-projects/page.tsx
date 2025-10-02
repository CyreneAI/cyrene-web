'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Loader2, Search, RefreshCw, AlertCircle, TrendingUp, ExternalLink, 
  ImageIcon, Copy, Check, Filter, ChevronDown, Ban, Lightbulb, 
  Rocket, Users, Clock, Eye, Github, Globe, FileText, 
  Heart,
  Linkedin,
  Instagram,
  Twitter,
  Radio,
  VideoIcon,
  ShieldCheck,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { FaXTwitter } from "react-icons/fa6";
import { toast } from 'sonner';
import StarCanvas from '@/components/StarCanvas';
import { LaunchedTokensService } from '@/services/launchedTokensService';
import { ProjectIdeasService } from '@/services/projectIdeasService';
import { StreamingService } from '@/services/streamingService';
import { VerificationService } from '@/services/verificationService';
import { LaunchedTokenData, ProjectIdeaData } from '@/lib/supabase';
import React from 'react';
import { useAppKitAccount } from "@reown/appkit/react";
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSocialInteractions } from '@/hooks/useSocialInteractions';

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

// Enhanced interface for live streaming data
interface LiveStreamInfo {
  projectId: string;
  projectType: 'idea' | 'token';
  isLive: boolean;
  streamingType: 'third-party' | 'onsite';
  title?: string;
  streamKey?: string;
}

// Verification Badge Component
const VerifiedBadge = ({ className = "" }: { className?: string }) => (
  <div className={`flex items-center gap-1 ${className}`} title="Verified by CyreneAI">
    <ShieldCheck className="w-4 h-4 text-blue-400" />
  </div>
);

// Pagination Component
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

const Pagination: React.FC<PaginationProps> = ({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  className = "" 
}) => {
  if (totalPages <= 1) return null;

  const getVisiblePages = () => {
    const delta = 1;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  const visiblePages = getVisiblePages();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center justify-center gap-1.5 ${className}`}
    >
      {/* Previous button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`flex items-center justify-center w-10 h-10 rounded-xl border backdrop-blur-sm transition-all duration-300 ${
          currentPage === 1
            ? 'border-gray-700/30 text-gray-600 cursor-not-allowed opacity-50'
            : 'border-gray-600/40 text-gray-300 hover:border-blue-400/60 hover:text-blue-300 hover:bg-blue-500/15 hover:shadow-lg hover:shadow-blue-500/20'
        }`}
      >
        <ChevronLeft className="w-4 h-4" />
      </motion.button>

      {/* Page numbers */}
      <div className="flex items-center gap-1">
        {visiblePages.map((page, index) => (
          <React.Fragment key={index}>
            {page === '...' ? (
              <span className="text-gray-500 px-3 text-sm">•••</span>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onPageChange(page as number)}
                className={`flex items-center justify-center w-10 h-10 rounded-xl border text-sm font-semibold backdrop-blur-sm transition-all duration-300 ${
                  currentPage === page
                    ? 'border-blue-400/60 bg-gradient-to-br from-blue-500/30 to-blue-600/20 text-blue-200 shadow-lg shadow-blue-500/25 ring-1 ring-blue-400/20'
                    : 'border-gray-600/40 text-gray-300 hover:border-blue-400/50 hover:text-blue-300 hover:bg-blue-500/10 hover:shadow-md hover:shadow-blue-500/10'
                }`}
              >
                {page}
              </motion.button>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Next button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`flex items-center justify-center w-10 h-10 rounded-xl border backdrop-blur-sm transition-all duration-300 ${
          currentPage === totalPages
            ? 'border-gray-700/30 text-gray-600 cursor-not-allowed opacity-50'
            : 'border-gray-600/40 text-gray-300 hover:border-blue-400/60 hover:text-blue-300 hover:bg-blue-500/15 hover:shadow-lg hover:shadow-blue-500/20'
        }`}
      >
        <ChevronRight className="w-4 h-4" />
      </motion.button>
    </motion.div>
  );
};

export default function ExploreProjectsPage() {
  const router = useRouter();
  const [launchedTokens, setLaunchedTokens] = useState<LaunchedTokenData[]>([]);
  const [projectIdeas, setProjectIdeas] = useState<ProjectIdeaData[]>([]);
  const [filteredTokens, setFilteredTokens] = useState<LaunchedTokenData[]>([]);
  const [filteredIdeas, setFilteredIdeas] = useState<ProjectIdeaData[]>([]);
  const [liveStreams, setLiveStreams] = useState<Map<string, LiveStreamInfo>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [tokenMetadataCache, setTokenMetadataCache] = useState<Map<string, TokenMetadata>>(new Map());
  const [isCyreneTeamMember, setIsCyreneTeamMember] = useState(false);
  
  // Pagination states
  const [currentIdeasPage, setCurrentIdeasPage] = useState(1);
  const [currentTokensPage, setCurrentTokensPage] = useState(1);
  const itemsPerPage = 6; // Number of items per page

const { address, isConnected } = useAppKitAccount();

  // Check if user is a CyreneAI team member
  useEffect(() => {
    const checkTeamMembership = async () => {
      if (address) {
        const isMember = await VerificationService.isCyreneAITeamMember(address);
        setIsCyreneTeamMember(isMember);
      } else {
        setIsCyreneTeamMember(false);
      }
    };
    checkTeamMembership();
  }, [address]);

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

  // Load live streams data with enhanced information
  const loadLiveStreams = useCallback(async () => {
    try {
      const liveStreamsData = await StreamingService.getLiveStreams();
      const streamMap = new Map<string, LiveStreamInfo>();
      
      liveStreamsData.forEach(stream => {
        streamMap.set(stream.projectId, {
          projectId: stream.projectId,
          projectType: stream.projectType,
          isLive: stream.status === 'live',
          streamingType: stream.streamingType || 'third-party',
          title: stream.title,
          streamKey: stream.streamKey
        });
      });
      
      setLiveStreams(streamMap);
      console.log(`Loaded ${liveStreamsData.length} live streams`);
    } catch (error) {
      console.error('Error loading live streams:', error);
    }
  }, []);

  // Check if a project is live streaming
  const isProjectLiveStreaming = useCallback((projectId: string): boolean => {
    return liveStreams.get(projectId)?.isLive || false;
  }, [liveStreams]);

  // Get stream info for a project
  const getStreamInfo = useCallback((projectId: string): LiveStreamInfo | null => {
    return liveStreams.get(projectId) || null;
  }, [liveStreams]);

  // Load all data
  const loadAllData = useCallback(async (showLoadingIndicator = true) => {
    try {
      if (showLoadingIndicator) setIsLoading(true);
      setError(null);
      
      const [allTokens, allIdeas] = await Promise.all([
        LaunchedTokensService.getAllLaunchedTokens(100),
        ProjectIdeasService.getPublicProjectIdeas(100),
        loadLiveStreams() // Load live streams data
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
  }, [loadLiveStreams]);

  // Initial load
  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Set up real-time updates for live streams
  useEffect(() => {
    // Refresh live streams every 30 seconds to keep status updated
    const interval = setInterval(() => {
      loadLiveStreams();
    }, 30000);

    return () => clearInterval(interval);
  }, [loadLiveStreams]);

  // Enhanced filtering that prioritizes verified and live streams
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

    // Sort by live streams first, then by latest
    const sortedTokens = filteredTokensResult.sort((a, b) => {
      // Verified first
      if (a.isVerified && !b.isVerified) return -1;
      if (!a.isVerified && b.isVerified) return 1;

      const aIsLive = isProjectLiveStreaming(a.projectIdeaId || a.contractAddress);
      const bIsLive = isProjectLiveStreaming(b.projectIdeaId || b.contractAddress);
      
      // Then live streams
      if (aIsLive && !bIsLive) return -1;
      if (!aIsLive && bIsLive) return 1;
      
      // Then by launch time
      return b.launchedAt - a.launchedAt;
    });
    
    const sortedIdeas = filteredIdeasResult.sort((a, b) => {
      // Verified first
      if (a.isVerified && !b.isVerified) return -1;
      if (!a.isVerified && b.isVerified) return 1;

      const aIsLive = isProjectLiveStreaming(a.id || '');
      const bIsLive = isProjectLiveStreaming(b.id || '');
      
      // Then live streams
      if (aIsLive && !bIsLive) return -1;
      if (!aIsLive && bIsLive) return 1;
      
      // Then by creation time
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
    
    setFilteredTokens(sortedTokens);
    setFilteredIdeas(sortedIdeas);
  }, [searchQuery, launchedTokens, projectIdeas, isProjectLiveStreaming]);

  // Handle trade button click
  const handleTradeClick = (token: LaunchedTokenData) => {
    const params = new URLSearchParams({
      tokenAddress: token.contractAddress,
      tokenName: token.tokenName,
      tokenSymbol: token.tokenSymbol,
      poolAddress: token.dbcPoolAddress || '',
      metadataUri: token.metadataUri || '',
      tradeStatus: token.tradeStatus ? 'active' : 'graduated'
    });
    
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

  // Count live streams for display
  const liveStreamCount = Array.from(liveStreams.values()).filter(stream => stream.isLive).length;

  // Pagination calculations
  const totalIdeasPages = Math.ceil(filteredIdeas.length / itemsPerPage);
  const totalTokensPages = Math.ceil(filteredTokens.length / itemsPerPage);
  
  // Get paginated data
  const getCurrentIdeas = () => {
    const startIndex = (currentIdeasPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredIdeas.slice(startIndex, endIndex);
  };
  
  const getCurrentTokens = () => {
    const startIndex = (currentTokensPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredTokens.slice(startIndex, endIndex);
  };

  // Reset pagination when search query changes
  useEffect(() => {
    setCurrentIdeasPage(1);
    setCurrentTokensPage(1);
  }, [searchQuery]);

  // Keyboard navigation for pagination
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if no input is focused
      if (document.activeElement?.tagName === 'INPUT') return;
      
      if (e.key === 'ArrowLeft' && e.ctrlKey) {
        // Ctrl + Left Arrow - Previous page for Ideas
        e.preventDefault();
        if (currentIdeasPage > 1) {
          setCurrentIdeasPage(prev => prev - 1);
        }
      } else if (e.key === 'ArrowRight' && e.ctrlKey) {
        // Ctrl + Right Arrow - Next page for Ideas
        e.preventDefault();
        if (currentIdeasPage < totalIdeasPages) {
          setCurrentIdeasPage(prev => prev + 1);
        }
      } else if (e.key === 'ArrowLeft' && e.shiftKey) {
        // Shift + Left Arrow - Previous page for Tokens
        e.preventDefault();
        if (currentTokensPage > 1) {
          setCurrentTokensPage(prev => prev - 1);
        }
      } else if (e.key === 'ArrowRight' && e.shiftKey) {
        // Shift + Right Arrow - Next page for Tokens
        e.preventDefault();
        if (currentTokensPage < totalTokensPages) {
          setCurrentTokensPage(prev => prev + 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIdeasPage, totalIdeasPages, currentTokensPage, totalTokensPages]);

  return (
    <>
      {/* Background Text */}
      <div className="absolute top-0 left-0 w-full overflow-hidden -z-10 pointer-events-none">
        <div className="w-[2661px] text-[370px] opacity-10 tracking-[24.96px] leading-[70%] font-moonhouse text-transparent text-left inline-block [-webkit-text-stroke:3px_#c8c8c8] [paint-order:stroke_fill] mix-blend-overlay">
          CYRENE
        </div>
      </div>

  <div className="min-h-screen text-white py-8 px-4 mt-44 relative">
        <div className="max-w-7xl mx-auto">
          {/* Compact Header */}
          <div className="text-center mb-8">
            <div className="flex flex-col items-center gap-4 mb-6">
              {/* Centered Title + Description */}
              <div>
                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-3xl font-bold text-white mb-1 drop-shadow-lg text-center"
                >
                  Explore Projects
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-gray-400 text-sm drop-shadow-md text-center"
                >
                  Discover projects and tokens at every stage
                </motion.p>

                {/* Admin badge for CyreneAI team members */}
            {/* {isCyreneTeamMember && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600/20 border border-purple-500/30 rounded-full text-purple-300 text-sm mb-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>CyreneAI Team - Verification Controls Active</span>
              </motion.div>
            )} */}

              </div>

              {/* Centered controls row: live indicator + search */}
              <div className="flex items-center gap-4">
                {liveStreamCount > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-600/20 border border-red-500/30 rounded-full text-red-300 text-sm"
                  >
                    <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                    <VideoIcon className="w-4 h-4" />
                    <span>{liveStreamCount} live</span>
                  </motion.div>
                )}

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="w-full max-w-md mx-auto"
                >
                  <div>
                    <input
                      type="text"
                      placeholder="Search projects..."
                      value={searchQuery}
                      onChange={handleSearch}
                      aria-label="Search projects"
                      className="w-full bg-gray-900/80 backdrop-blur-md border border-gray-700/50 rounded-xl px-4 py-2.5 text-white placeholder-gray-400 placeholder:text-center text-center focus:outline-none focus:border-blue-500/60 focus:bg-gray-800/90 transition-all duration-300 text-sm shadow-xl"
                    />
                  </div>
                </motion.div>
              </div>
            </div>
          </div>

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
              {/* Two Column Layout - With pagination */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
                {/* Ideation Column */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6 }}
                  className="bg-gradient-to-b from-gray-900/90 to-gray-900/60 backdrop-blur-xl border border-gray-700/40 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
                >
                  {/* Column Header - Compact */}
                  <div className="p-4 border-b border-gray-700/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <h2 className="text-xl font-semibold text-white">Ideation</h2>
                        <div className="bg-gray-700/60 px-2.5 py-1 rounded-full text-white text-xs font-medium">
                          {filteredIdeas.length}
                        </div>
                        {/* Live stream indicator */}
                        {filteredIdeas.filter(idea => isProjectLiveStreaming(idea.id || '')).length > 0 && (
                          <div className="flex items-center gap-1 px-2 py-0.5 bg-red-500/20 rounded-full text-red-300 text-xs border border-red-400/30">
                            <div className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse"></div>
                            <span>{filteredIdeas.filter(idea => isProjectLiveStreaming(idea.id || '')).length} live</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Column Content - Fixed height with pagination */}
                  <div className="flex-1 px-4 pb-4">
                    <AnimatePresence mode="wait">
                      <motion.div 
                        key={`ideas-page-${currentIdeasPage}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-3 pt-3 min-h-[600px]"
                      >
                        {filteredIdeas.length === 0 ? (
                          <div className="text-center py-12">
                            <div className="w-12 h-12 bg-gray-800/60 rounded-xl flex items-center justify-center mx-auto mb-3">
                              <Lightbulb className="w-6 h-6 text-gray-500" />
                            </div>
                            <p className="text-gray-400 text-base">No projects in ideation phase</p>
                            <p className="text-gray-500 text-sm mt-1">Be the first to submit an idea!</p>
                          </div>
                        ) : (
                          getCurrentIdeas().map((idea, index) => (
                            <ProjectIdeaCard
                              key={idea.id}
                              idea={idea}
                              index={index}
                              formatDate={formatDate}
                              streamInfo={getStreamInfo(idea.id || '')}
                              isCyreneTeamMember={isCyreneTeamMember}
                              onVerificationChange={() => loadAllData(false)}
                            />
                          ))
                        )}
                      </motion.div>
                    </AnimatePresence>
                    
                    {/* Pagination for Ideas */}
                    {totalIdeasPages > 1 && (
                      <div className="mt-6 flex flex-col items-center gap-3">
                        <div className="flex flex-col items-center gap-1">
                          <div className="text-xs text-gray-400">
                            Showing {(currentIdeasPage - 1) * itemsPerPage + 1} - {Math.min(currentIdeasPage * itemsPerPage, filteredIdeas.length)} of {filteredIdeas.length} projects
                          </div>
                          <div className="text-xs text-gray-500">
                            Use Ctrl + ← → to navigate
                          </div>
                        </div>
                        <Pagination
                          currentPage={currentIdeasPage}
                          totalPages={totalIdeasPages}
                          onPageChange={setCurrentIdeasPage}
                        />
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Cooking Column */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="bg-gradient-to-b from-gray-900/90 to-gray-900/60 backdrop-blur-xl border border-gray-700/40 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
                >
                  {/* Column Header - Compact */}
                  <div className="p-4 border-b border-gray-700/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <h2 className="text-xl font-semibold text-white">Cooking</h2>
                        <div className="bg-gray-700/60 px-2.5 py-1 rounded-full text-white text-xs font-medium">
                          {filteredTokens.length}
                        </div>
                        {/* Live stream indicator */}
                        {filteredTokens.filter(token => isProjectLiveStreaming(token.projectIdeaId || token.contractAddress)).length > 0 && (
                          <div className="flex items-center gap-1 px-2 py-0.5 bg-red-500/20 rounded-full text-red-300 text-xs border border-red-400/30">
                            <div className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse"></div>
                            <span>{filteredTokens.filter(token => isProjectLiveStreaming(token.projectIdeaId || token.contractAddress)).length} live</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Column Content - Fixed height with pagination */}
                  <div className="flex-1 px-4 pb-4">
                    <AnimatePresence mode="wait">
                      <motion.div 
                        key={`tokens-page-${currentTokensPage}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-3 pt-3 min-h-[600px]"
                      >
                        {filteredTokens.length === 0 ? (
                          <div className="text-center py-12">
                            <div className="w-12 h-12 bg-gray-800/60 rounded-xl flex items-center justify-center mx-auto mb-3">
                              <Rocket className="w-6 h-6 text-gray-500" />
                            </div>
                            <p className="text-gray-400 text-base">No tokens launched yet</p>
                            <p className="text-gray-500 text-sm mt-1">Projects will appear here once launched</p>
                          </div>
                        ) : (
                          getCurrentTokens().map((token, index) => (
                            <TokenCard
                              key={token.contractAddress}
                              token={token}
                              index={index}
                              onTradeClick={() => handleTradeClick(token)}
                              formatDate={formatDate}
                              fetchTokenMetadata={fetchTokenMetadata}
                              streamInfo={getStreamInfo(token.projectIdeaId || token.contractAddress)}
                              isCyreneTeamMember={isCyreneTeamMember}
                              onVerificationChange={() => loadAllData(false)}
                            />
                          ))
                        )}
                      </motion.div>
                    </AnimatePresence>
                    
                    {/* Pagination for Tokens */}
                    {totalTokensPages > 1 && (
                      <div className="mt-6 flex flex-col items-center gap-3">
                        <div className="flex flex-col items-center gap-1">
                          <div className="text-xs text-gray-400">
                            Showing {(currentTokensPage - 1) * itemsPerPage + 1} - {Math.min(currentTokensPage * itemsPerPage, filteredTokens.length)} of {filteredTokens.length} tokens
                          </div>
                          <div className="text-xs text-gray-500">
                            Use Shift + ← → to navigate
                          </div>
                        </div>
                        <Pagination
                          currentPage={currentTokensPage}
                          totalPages={totalTokensPages}
                          onPageChange={setCurrentTokensPage}
                        />
                      </div>
                    )}
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

// Project Idea Card Component - Enhanced with verification controls
interface ProjectIdeaCardProps {
  idea: ProjectIdeaData;
  index: number;
  formatDate: (timestamp: number | string) => string;
  streamInfo: LiveStreamInfo | null;
  isCyreneTeamMember: boolean;
  onVerificationChange: () => void;
}

const ProjectIdeaCard: React.FC<ProjectIdeaCardProps> = ({ 
  idea, 
  index, 
  formatDate, 
  streamInfo,
  isCyreneTeamMember,
  onVerificationChange
}) => {
  const router = useRouter();
  const { address, isConnected } = useAppKitAccount();
  const [isVerifying, setIsVerifying] = useState(false);
  
  const { stats, isLoading: socialLoading } = useSocialInteractions(
    idea.id || '', 
    isConnected ? address : undefined
  );
  
  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
  };

  const handleCardClick = () => {
    router.push(`/preview-page?ideaId=${idea.id}`);
  };

  const handleLinkClick = (e: React.MouseEvent, url: string) => {
    e.stopPropagation();
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleVerificationToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!address || !idea.id) return;

    setIsVerifying(true);
    try {
      const result = idea.isVerified 
        ? await VerificationService.unverifyProjectIdea(idea.id, address)
        : await VerificationService.verifyProjectIdea(idea.id, address);
      
      if (result.success) {
        toast.success(idea.isVerified ? 'Project unverified' : 'Project verified!');
        onVerificationChange();
      } else {
        toast.error(result.error || 'Failed to update verification');
      }
    } catch (error) {
      toast.error('Failed to update verification');
    } finally {
      setIsVerifying(false);
    }
  };

  const isLive = streamInfo?.isLive || false;
  const streamingType = streamInfo?.streamingType;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={handleCardClick}
      className={`relative bg-gray-800/40 backdrop-blur-lg border rounded-xl p-3 hover:bg-gray-700/50 transition-all duration-300 group shadow-xl cursor-pointer ${
        isLive
          ? 'border-green-500/50 ring-1 ring-green-400/20 shadow-green-500/10'
          : idea.isVerified
            ? 'border-blue-500/40 ring-1 ring-blue-400/10'
            : 'border-gray-600/30 hover:border-gray-500/50'
      }`}
    >
      {/* Enhanced live streaming indicator */}
      {isLive && (
        <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-green-500/20 rounded-full border border-green-400/40">
          <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
          <Radio className="w-3 h-3 text-green-400" />
          <span className="text-xs text-green-300 font-medium">
            LIVE
          </span>
        </div>
      )}

      {/* Top metadata row */}
      <div className="flex items-center justify-between mb-2 text-xs text-gray-400">
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-0.5">
            <Users className="w-3 h-3 text-blue-400" />
            <span>{idea.teamMembers.length}</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-0.5">
            <Users className="w-3 h-3 text-green-400" />
            <span>{socialLoading ? '...' : stats.followerCount}</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-0.5">
            <Heart className="w-3 h-3 text-red-400" />
            <span>{socialLoading ? '...' : stats.likeCount}</span>
          </div>
        </div>
        <span className="text-blue-400 font-medium text-xs">{idea.projectIndustry}</span>
      </div>

      {/* Project header with image and title */}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-12 h-12 rounded-xl bg-gray-700/50 backdrop-blur-sm border border-gray-600/40 flex items-center justify-center overflow-hidden relative shadow-lg">
          {idea.projectImage ? (
            <Image
              src={idea.projectImage}
              alt={idea.projectName}
              width={48}
              height={48}
              className="w-full h-full object-cover rounded-xl"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/shapes/svg?seed=${idea.projectName}&backgroundColor=1e40af,1e3a8a,1d4ed8`;
              }}
            />
          ) : (
            <Lightbulb className="w-6 h-6 text-blue-400" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-white text-sm truncate group-hover:text-blue-300 transition-colors" title={idea.projectName}>
              {idea.projectName}
            </h3>
            {idea.isVerified && <VerifiedBadge />}
          </div>
          <p className="text-gray-400 text-xs">{idea.projectCategory}</p>
        </div>
      </div>

      {/* Description */}
      {idea.projectDescription && (
        <p className="text-gray-300 text-xs mb-3 leading-relaxed line-clamp-2" title={idea.projectDescription}>
          {truncateText(idea.projectDescription, 100)}
        </p>
      )}

      {/* Footer with date and action buttons */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-700/30">
        <span className="text-xs text-gray-500 font-medium">Ideated {formatDate(idea.createdAt!)}</span>
        <div className="flex items-center gap-1.5">
          {/* Website button */}
          {idea.websiteUrl && (
            <button
              onClick={(e) => handleLinkClick(e, idea.websiteUrl!)}
              className="p-1 text-gray-400 hover:text-green-400 transition-colors rounded hover:bg-gray-600/40"
              title="Website"
            >
              <Globe className="w-3.5 h-3.5" />
            </button>
          )}

          {/* GitHub button */}
          {idea.githubUrl && (
            <button
              onClick={(e) => handleLinkClick(e, idea.githubUrl!)}
              className="p-1 text-gray-400 hover:text-white transition-colors rounded hover:bg-gray-600/40"
              title="GitHub"
            >
              <Github className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Verification button for CyreneAI team members */}
          {isCyreneTeamMember && (
            <button
              onClick={handleVerificationToggle}
              disabled={isVerifying}
              className={`px-2 py-1 rounded text-xs flex items-center gap-1 transition-all ${
                idea.isVerified 
                  ? 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border border-blue-400/30' 
                  : 'bg-gray-600/20 text-gray-300 hover:bg-gray-600/30 border border-gray-600/30'
              }`}
              title={idea.isVerified ? 'Click to unverify' : 'Click to verify'}
            >
              {isVerifying ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <ShieldCheck className="w-3 h-3" />
              )}
              <span>{idea.isVerified ? 'Verified' : 'Verify'}</span>
            </button>
          )}

          {/* Open button */}
          <button
            className="flex items-center gap-1 px-2 py-1 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 text-blue-300 rounded text-xs font-medium transition-all duration-200"
            title="Open project"
          >
            <ExternalLink className="w-3 h-3" />
            Open
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// Token Card Component - Enhanced with streaming info
interface TokenCardProps {
  token: LaunchedTokenData;
  index: number;
  onTradeClick: () => void;
  formatDate: (timestamp: number | string) => string;
  fetchTokenMetadata: (metadataUri: string) => Promise<TokenMetadata | null>;
  streamInfo: LiveStreamInfo | null;
  isCyreneTeamMember: boolean;
  onVerificationChange: () => void;
}

const TokenCard: React.FC<TokenCardProps> = React.memo(({ 
  token, 
  index, 
  onTradeClick, 
  formatDate, 
  fetchTokenMetadata,
  streamInfo,
  isCyreneTeamMember,
  onVerificationChange
}) => {
  const router = useRouter();
  const { address, isConnected } = useAppKitAccount();
  const [tokenImage, setTokenImage] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [metadata, setMetadata] = useState<TokenMetadata | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const projectIdForSocial = token.projectIdeaId || token.contractAddress;
  
  const { stats, isLoading: socialLoading } = useSocialInteractions(
    projectIdForSocial, 
    isConnected ? address : undefined
  );

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
  const isLive = streamInfo?.isLive || false;
  const streamingType = streamInfo?.streamingType;

  const copyToClipboard = async (text: string, fieldName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      toast.success(`${fieldName} copied!`);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      toast.error('Failed to copy');
    }
  };

  const handleCardClick = () => {
    router.push(`/preview-page?tokenAddress=${token.contractAddress}`);
  };

  const handleTradeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onTradeClick();
  };

  const handleVerificationToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!address || !token.contractAddress) return;

    setIsVerifying(true);
    try {
      const result = token.isVerified 
        ? await VerificationService.unverifyToken(token.contractAddress, address)
        : await VerificationService.verifyToken(token.contractAddress, address);
      
      if (result.success) {
        toast.success(token.isVerified ? 'Token unverified' : 'Token verified!');
        onVerificationChange();
      } else {
        toast.error(result.error || 'Failed to update verification');
      }
    } catch (error) {
      toast.error('Failed to update verification');
    } finally {
      setIsVerifying(false);
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
      onClick={handleCardClick}
      className={`bg-gray-800/40 backdrop-blur-lg border rounded-xl p-3 hover:bg-gray-700/50 transition-all duration-300 group shadow-xl cursor-pointer relative ${
        isLive
          ? 'border-green-500/50 ring-1 ring-green-400/20 shadow-green-500/10'
          : token.isVerified
            ? 'border-blue-500/40 ring-1 ring-blue-400/10'
            : 'border-gray-600/30 hover:border-gray-500/50'
      }`}
    >
      {/* Enhanced live streaming indicator */}
      {isLive && (
        <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-green-500/20 rounded-full border border-green-400/40">
          <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
          <Radio className="w-3 h-3 text-green-400" />
          <span className="text-xs text-green-300 font-medium">
            LIVE
          </span>
        </div>
      )}

      {/* Top metadata row */}
      <div className="flex items-center justify-between mb-2 text-xs text-gray-400">
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-0.5">
            <Users className="w-3 h-3 text-blue-400" />
            <span>{Math.floor(Math.random() * 10) + 1}</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-0.5">
            <Users className="w-3 h-3 text-green-400" />
            <span>{socialLoading ? '...' : stats.followerCount}</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-0.5">
            <Heart className="w-3 h-3 text-red-400" />
            <span>{socialLoading ? '...' : stats.likeCount}</span>
          </div>
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
        
        <div className="flex items-center gap-2">
          {/* Verified Tab */}
          {token.isVerified && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-500/20 border border-blue-400/40 rounded-lg backdrop-blur-sm"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-xs font-medium text-blue-300">Verified</span>
            </motion.div>
          )}

          {/* Contract Address Copy Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={(e) => copyToClipboard(token.contractAddress, 'Contract Address', e)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all duration-200 group backdrop-blur-sm ${
              copiedField === 'Contract Address'
                ? 'bg-gradient-to-r from-green-500/20 to-green-600/10 border border-green-400/40'
                : 'bg-gradient-to-r from-gray-800/60 to-gray-700/40 hover:from-gray-700/60 hover:to-gray-600/40 border border-gray-600/30 hover:border-blue-400/40'
            }`}
            title={`Copy contract address: ${token.contractAddress}`}
          >
            <span className={`font-mono text-xs font-medium transition-colors ${
              copiedField === 'Contract Address'
                ? 'text-green-300'
                : 'text-gray-300 group-hover:text-blue-300'
            }`}>
              {truncateAddress(token.contractAddress)}
            </span>
            <motion.div
              animate={copiedField === 'Contract Address' ? { rotate: 360 } : { rotate: 0 }}
              transition={{ duration: 0.3 }}
            >
              {copiedField === 'Contract Address' ? (
                <Check className="w-3.5 h-3.5 text-green-400" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-400 transition-colors" />
              )}
            </motion.div>
          </motion.button>
        </div>
      </div>

      {/* Project header with image and title */}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-12 h-12 rounded-xl bg-gray-700/50 backdrop-blur-sm border border-gray-600/40 flex items-center justify-center overflow-hidden relative shadow-lg">
          {imageLoading ? (
            <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
          ) : tokenImage ? (
            <Image
              src={tokenImage}
              alt={`${token.tokenName} logo`}
              width={48}
              height={48}
              className="w-full h-full object-cover rounded-xl"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/shapes/svg?seed=${token.contractAddress}&backgroundColor=1e40af,1e3a8a,1d4ed8`;
              }}
            />
          ) : (
            <ImageIcon className="w-6 h-6 text-white/50" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-white text-sm truncate group-hover:text-blue-300 transition-colors" title={token.tokenName}>
              {token.tokenName}
            </h3>
            {token.isVerified && <VerifiedBadge />}
          </div>
          <p className="text-gray-400 text-xs font-mono">${token.tokenSymbol}</p>
        </div>
      </div>

      {/* Description */}
      {metadata?.description && (
        <p className="text-gray-300 text-xs mb-3 leading-relaxed line-clamp-2" title={metadata.description}>
          {metadata.description.length > 100 ? `${metadata.description.slice(0, 100)}...` : metadata.description}
        </p>
      )}

      {/* Footer with date and action buttons */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-700/30">
        <span className="text-xs text-gray-500 font-medium">{formatDate(token.launchedAt)}</span>
        <div className="flex items-center gap-1">
          {/* Website button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              const websiteUrl = metadata?.attributes?.find(attr => attr.trait_type === 'website')?.value || `https://${token.tokenName.toLowerCase()}.com`;
              window.open(websiteUrl, '_blank', 'noopener,noreferrer');
            }}
            className="p-1 text-gray-400 hover:text-green-400 transition-colors rounded hover:bg-gray-600/40"
            title="Website"
          >
            <Globe className="w-3.5 h-3.5" />
          </button>

          {/* GitHub button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              const githubUrl = metadata?.attributes?.find(attr => attr.trait_type === 'github')?.value || `https://github.com/${token.tokenName.toLowerCase()}`;
              window.open(githubUrl, '_blank', 'noopener,noreferrer');
            }}
            className="p-1 text-gray-400 hover:text-white transition-colors rounded hover:bg-gray-600/40"
            title="GitHub"
          >
            <Github className="w-3.5 h-3.5" />
          </button>

          {/* Verification button for CyreneAI team members */}
          {isCyreneTeamMember && (
            <button
              onClick={handleVerificationToggle}
              disabled={isVerifying}
              className={`px-2 py-1 rounded text-xs flex items-center gap-1 transition-all ${
                token.isVerified 
                  ? 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border border-blue-400/30' 
                  : 'bg-gray-600/20 text-gray-300 hover:bg-gray-600/30 border border-gray-600/30'
              }`}
              title={token.isVerified ? 'Click to unverify' : 'Click to verify'}
            >
              {isVerifying ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <ShieldCheck className="w-3 h-3" />
              )}
              <span>{token.isVerified ? 'Verified' : 'Verify'}</span>
            </button>
          )}

          {/* Open button */}
          <button
            className="flex items-center gap-1 px-2 py-1 bg-gray-700/40 hover:bg-gray-600/50 text-white transition-colors rounded text-xs font-medium"
            title="Open project"
          >
            <ExternalLink className="w-3 h-3" />
            Open
          </button>

          {/* Trade button */}
          <button
            onClick={handleTradeClick}
            className="flex items-center gap-1 px-2 py-1 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 text-blue-300 rounded text-xs font-medium transition-all duration-200"
          >
            Trade
          </button>
        </div>
      </div>
    </motion.div>
  );
});

TokenCard.displayName = 'TokenCard';