'use client'

import Image from "next/image";
import { motion } from "framer-motion";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react';
import { Loader2, TrendingUp, ExternalLink, ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import StarCanvas from "@/components/StarCanvas";
import { FixedChat } from "@/components/FixedChat";
import LaunchHero from "@/components/LaunchHero";
import { LaunchedTokensService } from '@/services/launchedTokensService';
import { LaunchedTokenData } from '@/lib/supabase';
import Link from 'next/link';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { cn } from "@/lib/utils";
import { GlowButton } from "@/components/ui/glow-button";
import { useWallet } from '@solana/wallet-adapter-react';
import { AuthDialog } from "@/components/ui/auth-dialog";
import Stats from "@/components/Stats";
import DecryptedText from "@/components/ui/DecryptedText";
import ShinyText from "@/components/ShinyText";
import ScrollVelocity from "@/components/ScrollVelocity";

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

interface DexScreenerPair {
  fdv?: string;
  marketCap?: string;
  volume?: {
    h24?: string;
  };
  txns?: {
    h24?: {
      buys?: string;
      sells?: string;
    };
  };
}

interface DexScreenerResponse {
  pairs?: DexScreenerPair[];
}


// Agent interface
interface Agent {
  id: string;
  name: string;
  domain: string;
  status: 'active' | 'paused' | 'stopped';
  clients: string[];
  port: string;
  image: string;
  description: string;
  avatar_img: string;
  cover_img: string;
  organization: string; 
  telegram_bot_token?: string;
  discord_application_id?: string;
  discord_token?: string;
}

interface AgentResponseItem {
  agents: {
    agents: Agent[];
  };
  node: Record<string, unknown>;
}

export interface AgentsApiResponse {
  agents: AgentResponseItem[];
}

// Token Carousel Card Component
// Updated Token Carousel Card Component
interface TokenCarouselCardProps {
  token: LaunchedTokenData;
  fetchTokenMetadata: (metadataUri: string) => Promise<TokenMetadata | null>;
}

// Updated Token Carousel Card Component
// Updated Token Carousel Card Component
interface TokenCarouselCardProps {
  token: LaunchedTokenData;
  fetchTokenMetadata: (metadataUri: string) => Promise<TokenMetadata | null>;
}

const TokenCarouselCard: React.FC<TokenCarouselCardProps> = ({ token, fetchTokenMetadata }) => {
  const [tokenImage, setTokenImage] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<TokenMetadata | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [tokenStats, setTokenStats] = useState({
    marketCap: 0,
    volume: 0,
    holders: 0,
    loading: true,
    error: false
  });

  // Fetch token metadata and image
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

  // Fetch real market data from DexScreener
  useEffect(() => {
    const fetchTokenData = async () => {
      if (!token.contractAddress) return;

      try {
        setTokenStats(prev => ({ ...prev, loading: true, error: false }));
        
        // Use a CORS proxy or your own API route if needed
        const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${token.contractAddress}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('DexScreener API Response:', data); // Debug log
        
        if (data.pairs && data.pairs.length > 0) {
          // Get the most liquid pair (highest volume)
          const mainPair = data.pairs.reduce((prev: DexScreenerPair, current: DexScreenerPair) => {
            const prevVol = parseFloat(prev.volume?.h24 || '0');
            const currentVol = parseFloat(current.volume?.h24 || '0');
            return currentVol > prevVol ? current : prev;
          });
          

          console.log('Main pair data:', mainPair); // Debug log

          // Parse values safely
          const marketCap = parseFloat(mainPair.fdv || mainPair.marketCap || '0');
          const volume24h = parseFloat(mainPair.volume?.h24 || '0');
          const buyTxns = parseInt(mainPair.txns?.h24?.buys || '0');
          const sellTxns = parseInt(mainPair.txns?.h24?.sells || '0');
          const transactions24h = buyTxns + sellTxns;

          console.log('Parsed values:', { marketCap, volume24h, transactions24h }); // Debug log

          setTokenStats({
            marketCap: isNaN(marketCap) ? 0 : marketCap,
            volume: isNaN(volume24h) ? 0 : volume24h,
            holders: isNaN(transactions24h) ? 0 : transactions24h,
            loading: false,
            error: false
          });
        } else {
          console.log('No pairs found for token:', token.contractAddress);
          // No pairs found - set to zero but not error state
          setTokenStats({
            marketCap: 0,
            volume: 0,
            holders: 0,
            loading: false,
            error: false
          });
        }
      } catch (error) {
        console.error('Error fetching token data from DexScreener:', error);
        setTokenStats({
          marketCap: 0,
          volume: 0,
          holders: 0,
          loading: false,
          error: true
        });
      }
    };

    // Add a small delay to prevent rate limiting
    const timeoutId = setTimeout(fetchTokenData, 100);
    
    return () => clearTimeout(timeoutId);
  }, [token.contractAddress]);

  const getTokenStatus = () => {
    if (token.dammPoolAddress) {
      return { status: 'graduated', label: 'Graduated', color: 'bg-green-500' };
    }
    return { status: 'active', label: 'Active', color: 'bg-blue-500' };
  };

  const statusInfo = getTokenStatus();

  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
  };

  const formatNumber = (num: number) => {
    if (!num || num === 0 || isNaN(num)) return '-';
    
    if (num >= 1_000_000_000) {
      return `$${(num / 1_000_000_000).toFixed(2)}B`;
    } else if (num >= 1_000_000) {
      return `$${(num / 1_000_000).toFixed(2)}M`;
    } else if (num >= 1_000) {
      return `$${(num / 1_000).toFixed(2)}K`;
    }
    
    return `$${num.toFixed(2)}`;
  };

  const formatVolume = (num: number) => {
    if (!num || num === 0 || isNaN(num)) return '-';
    
    if (num >= 1_000_000) {
      return `$${(num / 1_000_000).toFixed(2)}M`;
    } else if (num >= 1_000) {
      return `$${(num / 1_000).toFixed(2)}K`;
    }
    
    return `$${num.toFixed(2)}`;
  };

  const formatTransactions = (num: number) => {
    if (!num || num === 0 || isNaN(num)) return '-';
    
    if (num >= 1_000) {
      return `${(num / 1_000).toFixed(1)}k`;
    }
    
    return num.toString();
  };

  const handleActionClick = () => {
    if (token.dammPoolAddress) {
      window.open(`https://jup.ag/swap/SOL-${token.contractAddress}`, '_blank');
    } else {
      // Navigate to individual project preview page
      window.location.href = `/preview-page?tokenAddress=${token.contractAddress}`;
    }
  };

  return (
    <div className="flex-none w-[356px] px-2">
      <motion.div
        whileHover={{ y: -5, scale: 1.02 }}
        transition={{ duration: 0.3 }}
        onClick={handleActionClick}
        className="relative w-[340px] h-[316px] bg-[#000010] rounded-[30px] overflow-hidden mx-auto cursor-pointer"
      >
        {/* Token Image Container */}
        <div className="absolute w-[120px] h-[120px] top-4 left-[15px] rounded-[20px] border border-solid border-[#ffffff0d] bg-gradient-to-br from-blue-600/20 to-purple-600/20 overflow-hidden">
          {imageLoading ? (
            <div className="w-full h-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-[#9daad7] animate-spin" />
            </div>
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
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-8 h-8 text-[#9daad7]/50" />
            </div>
          )}
        </div>

        {/* Token Name */}
        <div className="absolute top-[30px] left-[152px] font-outfit font-normal text-white text-lg tracking-[0] leading-[23.4px] whitespace-nowrap">
          {truncateText(token.tokenName, 12)}
        </div>

        {/* Stats Line */}
        <div className="absolute w-44 h-px top-[134px] left-[146px] bg-gradient-to-r from-[#576592] to-[#9daad7] opacity-30" />

        {/* Volume Stats */}
        <p className="absolute top-[108px] left-[152px] font-outfit font-normal text-xs tracking-[0] leading-[15.6px] whitespace-nowrap">
          <span className="text-[#576592]">Volume </span>
          {tokenStats.loading ? (
            <span className="font-medium text-[#9daad7]">...</span>
          ) : (
            <span className="font-medium text-[#9daad7]">{formatVolume(tokenStats.volume)}</span>
          )}
        </p>

        {/* Transactions Stats (instead of holders since holders data isn't available from DexScreener) */}
        <p className="absolute top-[108px] left-[252px] font-outfit font-normal text-xs tracking-[0] leading-[15.6px] whitespace-nowrap">
          <span className="text-[#576592]">Txns </span>
          {tokenStats.loading ? (
            <span className="font-medium text-[#9daad7]">...</span>
          ) : (
            <span className="font-medium text-[#9daad7]">{formatTransactions(tokenStats.holders)}</span>
          )}
        </p>

        {/* Description */}
        <p className="absolute w-[295px] top-[155px] left-[23px] font-outfit font-normal text-[#9daad7] text-xs tracking-[0] leading-[18px]">
          {metadata?.description 
            ? truncateText(metadata.description, 120)
            : "Autonomous token with seamless execution and enhanced reliability for decentralized trading."
          }
        </p>

        {/* Market Cap */}
        <p className="absolute top-[270px] left-[23px] font-outfit font-normal text-sm tracking-[0] leading-[18.2px] whitespace-nowrap">
          <span className="text-[#576592]">MC </span>
          {tokenStats.loading ? (
            <span className="font-semibold text-white">...</span>
          ) : (
            <span className="font-semibold text-white">{formatNumber(tokenStats.marketCap)}</span>
          )}
        </p>

        {/* Action Icon (Visual Indicator) */}
        <div className="absolute top-[258px] left-[249px] pointer-events-none">
          <div className="inline-flex items-center justify-center gap-[14.95px] px-[22.42px] py-[7.47px] bg-[#00000033] rounded-[37.36px] border-none relative overflow-hidden group-hover:opacity-80 transition-opacity">
            {/* Gradient Border Effect */}
            <div className="absolute inset-0 p-[0.75px] rounded-[37.36px] bg-gradient-to-r from-[#324172] via-[#36467a] to-[#283061] opacity-60 group-hover:opacity-100 transition-opacity" 
                 style={{
                   WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                   WebkitMaskComposite: 'xor',
                   maskComposite: 'exclude'
                 }} 
            />
            
            {/* Arrow Icon */}
            <div>
              {token.dammPoolAddress ? (
                <ExternalLink className="relative w-[20.92px] h-[20.92px] aspect-[1] text-[#9daad7] group-hover:text-white transition-colors" />
              ) : (
                <TrendingUp className="relative w-[20.92px] h-[20.92px] aspect-[1] text-[#9daad7] group-hover:text-white transition-colors" />
              )}
            </div>
          </div>
        </div>

        {/* Status Badge (Top Right Corner) */}
        <div className={`absolute top-4 right-4 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
          statusInfo.status === 'graduated' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full ${statusInfo.color}`}></div>
          {statusInfo.label}
        </div>
      </motion.div>
    </div>
  );
};
// Token Carousel Component
const TokenCarousel = () => {
  const [tokens, setTokens] = useState<LaunchedTokenData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tokenMetadataCache, setTokenMetadataCache] = useState<Map<string, TokenMetadata>>(new Map());
  // Static layout: no scroll/animation state needed

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

  // Load tokens
  const loadTokens = useCallback(async () => {
    try {
      setIsLoading(true);
      const allTokens = await LaunchedTokensService.getAllLaunchedTokens(20);
      // Sort by latest first and take first 8 tokens for carousel
      const sortedTokens = allTokens.sort((a, b) => b.launchedAt - a.launchedAt).slice(0, 8);
      setTokens(sortedTokens);
    } catch (err) {
      console.error('Error loading tokens:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load tokens on mount
  useEffect(() => {
    loadTokens();
  }, [loadTokens]);

  // Static view: use tokens as-is

  if (isLoading) {
    return (
      <section className="py-16 bg-transparent">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-blue-400" />
            <p className="font-outfit text-gray-400">Loading latest tokens...</p>
          </div>
        </div>
      </section>
    );
  }

  if (tokens.length === 0) {
    return null; // Don't show carousel if no tokens
  }

  return (
    <section className="py-16 bg-transparent">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="font-outfit text-[21px] font-medium text-white mb-4 uppercase tracking-[27px] leading-[130%] text-center">
            PROJECTS
          </h2>
          <p className="font-outfit text-gray-400 text-lg">
            Discover the newest projects launched by our community
          </p>
        </motion.div>

        {/* Static Cards Container */}
        <div className="relative">
          <div className="rounded-2xl">
            <div className="flex flex-wrap justify-center gap-4">
              {tokens.map((token, index) => (
                <TokenCarouselCard
                  key={`${token.contractAddress}-${index}`}
                  token={token}
                  fetchTokenMetadata={fetchTokenMetadata}
                />
              ))}
            </div>
          </div>
        </div>

        {/* View All Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-center mt-12"
        >
          <Link href="/explore-projects">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex w-[269px] h-[70px] items-center justify-center font-outfit font-normal text-[21px] text-black bg-white rounded-[50px] border-2 border-solid border-white hover:bg-black hover:text-white transition-colors duration-300 mx-auto"
            >
              Explore All Projects
            </motion.button>
          </Link>
        </motion.div>
      </div>

      {/* Animation CSS retained but unused now that cards are static */}
      <style jsx global>{`
        @keyframes infinite-scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        
        .animate-infinite-scroll {
          animation: infinite-scroll ${tokens.length * 3}s linear infinite;
        }
        
        .animate-infinite-scroll:hover {
          animation-play-state: paused;
        }

    /* Mobile hero section improvements (updated) */
        @media (max-width: 640px) {
          /* Mobile base: make hero nearly full-screen and wider */
          .hero-section { 
            min-height: 86vh !important; 
            align-items: center !important; 
            padding-top: 32px !important; 
            width: 100% !important;
            margin-left: 0 !important;
            margin-right: 0 !important;
          }
          .hero-section .robot-wrapper { 
            /* lower robot slightly on mobile so it sits a bit further down */
            transform: scale(1.18) translateY(64px); 
            transform-origin: center top; 
            margin-top: 24px !important;
          }
          .hero-title {
            max-width: 94vw;
            overflow-wrap: break-word;
            font-size: 56px !important;
            line-height: 1.02 !important;
            letter-spacing: 1px;
          }
          .hero-subtitle { font-size: 15px !important; }
          .hero-content { padding-bottom: 0 !important; justify-content: flex-end !important; }
          /* nudge header lower and add a slightly larger bottom gap so robot is visible */
          .hero-content header { margin-top: 108px !important; transform: translateY(8px); margin-bottom: 18px !important; }
          /* make the shiny 'JOURNEY WITH' slightly lower too */
          .hero-content header .relative.w-fit { transform: translateY(8px); }
          .hero-title { letter-spacing: 0.26em !important; }
          .hero-title {
            max-width: 90vw;
            overflow-wrap: break-word;
            font-size: 52px !important;
            line-height: 1.05 !important;
          }
        }

        @media (max-width: 480px) {
          .hero-section { min-height: 82vh !important; border-radius: 24px !important; padding-top: 40px !important; }
          .hero-title { font-size: 52px !important; letter-spacing: 0.28em !important; }
          .hero-section .robot-wrapper { /* small phones */ transform: scale(1.22) translateY(28px); margin-top: 16px !important; }
          /* keep a consistent small gap on small phones */
          @media (max-width: 480px) {
            .hero-content header { margin-bottom: 20px !important; }
          }
        }

        @media (max-width: 380px) {
          .hero-section { min-height: 84vh !important; padding-top: 36px !important; }
          .hero-title { font-size: 50px !important; letter-spacing: 0.30em !important; }
          .hero-section .robot-wrapper { /* extra small */ transform: scale(1.24) translateY(36px); margin-top: 18px !important; }
          @media (max-width: 380px) {
            .hero-content header { margin-bottom: 22px !important; }
          }
        }
      `}</style>
    </section>
  );
};
// Agent Carousel Card Component - NEW DESIGN
interface AgentCarouselCardProps {
  agent: Agent;
  onChatClick: () => void;
}

const AgentCarouselCard: React.FC<AgentCarouselCardProps> = ({ agent, onChatClick }) => {
  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
  };

  const getAgentStats = () => {
    // Mock stats for demo - you can replace with real data
    return {
      interactions: `${Math.floor(Math.random() * 50 + 10)}k`,
      uptime: `${Math.floor(Math.random() * 16 + 85)}%`
    };
  };

  const stats = getAgentStats();

  return (
    <div className="flex-none w-full sm:w-1/2 lg:w-1/2 px-3">
      <motion.div
        whileHover={{ y: -5, scale: 1.02 }}
        transition={{ duration: 0.3 }}
        className="h-full"
      >
        <section 
          aria-label={`${agent.name} agent card`}
          className="rounded-[32px] border border-[#25304b]/40 bg-[#070a17] p-6 md:p-8 lg:p-8 h-full flex flex-col"
        >
          {/* Top content */}
          <div className="flex flex-col gap-6 flex-1">
            
            {/* Logo tile with agent avatar */}
            <div className="shrink-0 rounded-3xl bg-[#0d1228] p-6 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] mx-auto">
              <div className="size-[180px] md:size-[200px] relative">
                <Image 
                  src={agent.avatar_img ? `https://ipfs.erebrus.io/ipfs/${agent.avatar_img}` : agent.image} 
                  alt={`${agent.name} avatar`} 
                  fill
                  className={cn(
                    "object-cover rounded-2xl",
                    agent.name === "cyrene" && "object-contain"
                  )}
                />
              </div>
            </div>

            {/* Details */}
            <div className="flex-1 flex flex-col">
              {/* Meta row */}
              <div className="flex items-center justify-between text-sm md:text-base text-[#9BA4C7]">
                <div className="font-outfit">
                  {"Interactions "}
                  <span className="font-semibold text-white/90">{stats.interactions}</span>
                </div>
                <div className="font-outfit">
                  {"Uptime "}
                  <span className="font-semibold text-white/90">{stats.uptime}</span>
                </div>
              </div>

              {/* Divider */}
              <hr className="mt-4 border-t border-[#2a3550]/40" />

              {/* Title + description */}
              <h3 className="font-outfit mt-6 text-2xl md:text-3xl font-semibold text-white text-pretty capitalize">
                {agent.name}
              </h3>
              <p className="font-outfit mt-4 max-w-prose text-sm leading-relaxed text-[#9BA4C7] flex-1">
                {truncateText(agent.description, 120)}
              </p>

              {/* Bottom row: Status + actions */}
              <div className="mt-8 flex items-center justify-between">
                <div className="font-outfit text-base md:text-lg text-[#9BA4C7]">
                  {"Status "}
                  <span className={cn(
                    "font-semibold capitalize",
                    agent.status === 'active' ? "text-green-400" : 
                    agent.status === 'paused' ? "text-yellow-400" : 
                    "text-red-400"
                  )}>
                    {agent.status || 'Active'}
                  </span>
                </div>
                
                <div className="flex items-center gap-3">
                  {/* Chat button (outlined pill) */}
                  <button 
                    type="button"
                    onClick={onChatClick}
                    className="font-outfit group inline-flex items-center gap-3 rounded-full border border-[#2a3550] px-5 py-2.5 text-[14px] font-medium text-[#B8C3E5] hover:border-[#37508a] hover:text-white transition-colors"
                    aria-label={`Chat with ${agent.name}`}
                  >
                    Chat Now
                    {/* Small indicator pill */}
                    <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-white/90">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#000018]"></span>
                      <span className="sr-only">indicator</span>
                    </span>
                  </button>

                  {/* Extra icon button */}
                  <button 
                    type="button"
                    onClick={onChatClick}
                    className="inline-flex size-10 items-center justify-center rounded-full border border-[#2a3550] hover:border-[#37508a] transition-colors"
                    aria-label={`Connect to ${agent.name}`}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-90 text-[#B8C3E5]">
                      <path d="M5 12h14M13 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </motion.div>
    </div>
  );
};

// Agents Carousel Component
const AgentsCarousel = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const router = useRouter();
  
  // Wallet connections
  const { isConnected: isEthConnected } = useAppKitAccount();
  const { connected: isSolConnected } = useWallet();
  const isAuthenticated = isEthConnected || isSolConnected;

  // Agent API - memoized to prevent infinite re-renders
  const agentApi = useMemo(() => ({
    async getAgents(): Promise<Agent[]> {
      try {
        const response = await axios.get<AgentsApiResponse>('/api/getAgents');
        const allAgents = response.data.agents
          .filter((item: AgentResponseItem) => item.agents && Array.isArray(item.agents.agents))
          .flatMap((item: AgentResponseItem) => item.agents.agents);
        return allAgents || [];
      } catch (error) {
        console.error('Error fetching agents:', error);
        return [];
      }
    },
  }), []);

  // Mock agents
  const mockAgents = useMemo(() => [
    {
      name: "Orion",
      image: "/orion.png",
      description: "Orion gathers and delivers essential news, keeping businesses ahead of the curve.",
      organization: "other",
    },
    {
      name: "Elixia", 
      image: "/elixia.png",
      description: "Elixia posts creative content to drive engagement and build community.",
      organization: "other",
    },
    {
      name: "Solis",
      image: "/solis.png", 
      description: "Solis illuminates the path to success with data-driven clarity and strategic insight.",
      organization: "other",
    },
    {
      name: "Auren",
      image: "/auren.png",
      description: "Auren is here to guide you, bringing warmth and clarity to every customer interaction.",
      organization: "other",
    },
    {
      name: "Cyrene",
      image: "/cyrene_profile.png",
      description: "Cyrene cosmic presence from the Andromeda Galaxy, here to help you navigate technology and privacy with love and wisdom.",
      organization: "cyrene",
    },
  ], []);

  // Load agents
  const loadAgents = useCallback(async () => {
    try {
      setIsLoading(true);
      const fetchedAgents = await agentApi.getAgents();
      const filteredFetchedAgents = fetchedAgents.filter((agent) => agent.organization === 'cyrene');
      const filteredMockAgents = mockAgents.filter(
        (mock) => mock.image !== "/cyrene_profile.png" && mock.image !== "/elixia.png"
      );

      const enrichedAgents = filteredFetchedAgents.map((agent) => {
        if (agent.name === "cyrene") {
          const cyreneMock = mockAgents.find((mock) => mock.name === "Cyrene");
          return {
            ...agent,
            image: "/cyrene_profile.png",
            description: cyreneMock?.description || agent.description,
          };
        } else if (agent.name === "Elixia") {
          const elixiaMock = mockAgents.find((mock) => mock.name === "Elixia");
          return {
            ...agent,
            image: "/elixia.png",
            description: elixiaMock?.description || agent.description,
          };
        } else {
          const randomMockAgent =
            filteredMockAgents[Math.floor(Math.random() * filteredMockAgents.length)];
          return {
            ...agent,
            image: randomMockAgent.image,
            description: randomMockAgent.description,
          };
        }
      });

      // Limit to 6 agents for carousel
      setAgents(enrichedAgents.slice(0, 6));
    } catch (err) {
      console.error('Error loading agents:', err);
    } finally {
      setIsLoading(false);
    }
  }, [mockAgents, agentApi]);

  // Load agents on mount
  useEffect(() => {
    loadAgents();
  }, [loadAgents]);

  // Create duplicated array for smooth infinite scroll
  const extendedAgents = useMemo(() => {
    if (agents.length === 0) return [];
    // Double the array for seamless infinite scroll
    return [...agents, ...agents];
  }, [agents]);

  // Chat with agent
  const setChatAgent = (id: string, name: string, avatar_img: string, cover_img: string) => {
    localStorage.setItem('currentAgentId', id);
    localStorage.setItem('currentAgentName', name);
    localStorage.setItem('currentAgentImage', avatar_img ? `https://ipfs.erebrus.io/ipfs/${avatar_img}` : '');
    localStorage.setItem('currentAgentCoverImage', cover_img ? `https://ipfs.erebrus.io/ipfs/${cover_img}` : '');
    localStorage.setItem('scrollToSection', 'target-section');
    router.push(`/explore-agents/chat/${id}`);
  };

  const handleChatClick = (agent: Agent) => {
    if (!isAuthenticated) {
      setSelectedAgent(agent);
      setShowAuthDialog(true);
    } else {
      setChatAgent(agent.id, agent.name, agent.avatar_img, agent.cover_img);
    }
  };

  if (isLoading) {
    return (
      <section className="py-16 bg-transparent">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-blue-400" />
            <p className="font-outfit text-gray-400">Loading AI agents...</p>
          </div>
        </div>
      </section>
    );
  }

  if (agents.length === 0) {
    return null; // Don't show carousel if no agents
  }

  return (
    <>
      <section className="py-16 bg-transparent">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="font-outfit text-[21px] font-medium text-white mb-6 uppercase tracking-[27px] leading-[130%] text-center">
              OUR AGENTS
            </h2>
            <p className="font-outfit text-gray-400 text-lg">
              Discover and interact with our diverse collection of AI agents
            </p>
          </motion.div>

          {/* Carousel Container */}
          <div className="relative">
            {/* Fade gradients on edges */}
            <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[#010623] to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[#010623] to-transparent z-10 pointer-events-none" />
            
            {/* Control button */}

            {/* Carousel Track */}
            <div className="overflow-hidden rounded-2xl">
              <div
                className={`flex ${!isPaused ? 'animate-infinite-scroll-agents' : ''}`}
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
              >
                {extendedAgents.map((agent, index) => (
                  <AgentCarouselCard 
                    key={`${agent.id}-${index}`}
                    agent={agent} 
                    onChatClick={() => handleChatClick(agent)}
                  />
                ))}
              </div>
            </div>

            {/* Scroll indicator */}

          </div>

          {/* View All Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center mt-12"
          >
            <Link href="/explore-agents">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex w-[269px] h-[70px] items-center justify-center font-outfit font-normal text-[21px] text-black bg-white rounded-[50px] border-2 border-solid border-white hover:bg-black hover:text-white transition-colors duration-300 mx-auto"
              >
                Explore All Agents
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Auth Dialog */}
      <AuthDialog
        agentName={selectedAgent?.name || ''}
        isOpen={showAuthDialog}
        onClose={() => setShowAuthDialog(false)}
        onSuccess={() => {
          if (selectedAgent) {
            setChatAgent(selectedAgent.id, selectedAgent.name, selectedAgent.avatar_img, selectedAgent.cover_img);
          }
        }}
      />

      {/* Add this CSS for agents carousel animation */}
      <style jsx global>{`
        @keyframes infinite-scroll-agents {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        
        .animate-infinite-scroll-agents {
          animation: infinite-scroll-agents ${agents.length * 4}s linear infinite;
        }
        
        .animate-infinite-scroll-agents:hover {
          animation-play-state: paused;
        }
      `}</style>
    </>
  );
};


export default function Home() {
  const { address, isConnected } = useAppKitAccount();
  const { switchNetwork } = useAppKitNetwork();

  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [autoSlideIndex, setAutoSlideIndex] = useState(0);

  // Auto slide effect
  useEffect(() => {
    const timer = setInterval(() => {
      setAutoSlideIndex((prev) => (prev + 1) % 4);
    }, 3000);

    return () => clearInterval(timer);
  }, []);

  const features = [
    {
      title: "Self-Replicating AI",
      description: "Autonomous agents capable of seamless task execution and self-replication for enhanced reliability.",
      gradient: "from-blue-400 via-cyan-500 to-teal-600",
      bgGradient: "from-blue-500/20 via-cyan-500/20 to-teal-600/20",
      image: "/self-replicating-ai.jpg",
      fromLeft: true
    },
    {
      title: "Decentralized Infrastructure",
      description: "AI agents and MCP servers are hosted on Erebrus ĐVPN Nodes for secure and verifiable execution.",
      gradient: "from-teal-400 via-cyan-500 to-blue-600",
      bgGradient: "from-teal-500/20 via-cyan-500/20 to-blue-600/20",
      image: "/decentralized-infrastructure.jpg",
      fromLeft: false
    },
    {
      title: "Hyper Coherent Network",
      description: "Multi-agent coordination with real-time precision, fault tolerance and context synchronization.",
      gradient: "from-cyan-400 via-blue-500 to-indigo-600",
      bgGradient: "from-cyan-500/20 via-blue-500/20 to-indigo-600/20",
      image: "/hyper-coherent-network.jpg",
      fromLeft: true
    },
    {
      title: "Unstoppable Ecosystem",
      description: "Blockchain-backed security with ÐVPN technology ensures resilience.",
      gradient: "from-blue-400 via-indigo-500 to-cyan-600",
      bgGradient: "from-blue-500/20 via-indigo-500/20 to-cyan-600/20",
      image: "/ecosytem.jpg",
      fromLeft: false
    }
  ];

  useEffect(() => {
    const storedWalletAddress = localStorage.getItem("walletAddress");
    if (storedWalletAddress) {
      setWalletAddress(storedWalletAddress);
    }
  }, []);

  useEffect(() => {
    if (isConnected && address) {
      setWalletAddress(address);
      localStorage.setItem('walletAddress', address);
    } else {
      setWalletAddress(null);
      localStorage.removeItem('walletAddress');
    }
  }, [isConnected, address]);

  return (
    <>

<div className="absolute top-0 left-0 w-full overflow-hidden -z-10 pointer-events-none">
      <div className="w-[2661px]  text-[370px] opacity-10 tracking-[24.96px] leading-[70%] font-moonhouse text-transparent text-left inline-block [-webkit-text-stroke:3px_#c8c8c8] [paint-order:stroke_fill] mix-blend-overlay">
        CYRENE
      </div>
    </div>
    
      {/* Background wrapper */}
      <div className="relative w-full overflow-hidden">

        
      
        <div className="absolute inset-0 bg-transparent"></div>

       
        {/* Your existing content */}
        <div className="relative">
          {/* Hero Section */}
          <section aria-labelledby="cyrene-hero-title" className="hero-section flex w-[90%] max-w-[1700px] mx-auto h-[90vh] min-h-[450px] items-end md:items-end justify-center md:justify-center gap-2.5 px-4 sm:px-8 xl:px-[320px] 2xl:px-[517px] py-6 sm:py-0 my-4 sm:my-10 md:my-12 relative rounded-[24px] sm:rounded-[30px] md:rounded-[45px] lg:rounded-[60px] overflow-hidden">
            
            {/* Background Image */}
            <Image 
              src="/hero.webp" 
              alt="Futuristic corridor background" 
              fill
              priority
              className="object-cover z-0" 
            />
            
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-black/40 sm:bg-black/30 md:bg-black/20 z-[1]" aria-hidden="true" />
            
            {/* Left Arrow (decorative) */}
            <Image 
              src="/left-arrow.webp" 
              alt="" 
              aria-hidden="true" 
              width={160}
              height={160}
              className="pointer-events-none absolute left-0 top-1/2 z-10 -translate-y-1/2 hidden md:block w-auto h-auto" 
            />
            
            {/* Right Arrow (decorative) */}
            <Image 
              src="/right-arrow.webp" 
              alt="" 
              aria-hidden="true" 
              width={160}
              height={160}
              className="pointer-events-none absolute right-0 top-1/2 z-10 -translate-y-1/2 hidden md:block w-auto h-auto" 
            />
            
            <div className="hero-content inline-flex flex-col justify-end items-center relative flex-[0_0_auto] w-full pb-6 sm:pb-8 md:pb-12 lg:pb-16">
      
              {/* Header Section */}
              <header className="flex flex-col w-full max-w-[598px] gap-2 sm:gap-3 items-center relative flex-[0_0_auto]">
                <ShinyText
                  text="JOURNEY WITH"
                  className="relative w-fit font-outfit font-medium text-[18px] sm:text-[20px] md:text-[22px] lg:text-[24px] text-center tracking-[8px] sm:tracking-[10px] md:tracking-[13.47px] leading-[20px] sm:leading-[24px] md:leading-[27.3px] whitespace-nowrap"
                />

                <DecryptedText
                  text="CYRENE"
                  animateOn="view"
                  revealDirection="center"
                  sequential={true}
                  speed={200}
                  maxIterations={15}
                  useOriginalCharsOnly={false}
                  characters="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+=-[]{}|;:,.<>?"
                  className="hero-title relative w-fit 
                    bg-[linear-gradient(90deg,rgba(255,255,255,1)_0%,rgba(162,194,255,1)_100%)] 
                    [-webkit-background-clip:text] 
                    bg-clip-text 
                    [-webkit-text-fill-color:transparent] 
                    [text-fill-color:transparent] 
                    font-moonhouse 
                    font-normal 
                    text-transparent 
                    text-[72px] sm:text-[92px] md:text-[110px] 
                    text-center 
                    tracking-[4px] sm:tracking-[6px] md:tracking-[8.00px] 
                    leading-[45px] sm:leading-[60px] md:leading-[77.0px] 
                    whitespace-nowrap"
                  encryptedClassName="relative w-fit 
                    text-white/40
                    font-moonhouse 
                    font-normal 
                    text-[60px] sm:text-[80px] md:text-[110px] 
                    text-center 
                    tracking-[4px] sm:tracking-[6px] md:tracking-[8.00px] 
                    leading-[45px] sm:leading-[60px] md:leading-[77.0px] 
                    whitespace-nowrap"
                />

              </header>
              
              {/* Portrait Image */}
              {/* Mobile-only soft radial glow behind the robot (hidden on md+) */}
              <div aria-hidden="true" className="absolute left-1/2 -translate-x-1/2 top-[52%] w-[340px] h-[180px] rounded-full blur-[56px] opacity-70 pointer-events-none z-10 block sm:hidden md:hidden lg:hidden" style={{background: 'radial-gradient(closest-side, rgba(60,150,255,0.22), rgba(20,30,60,0.0) 60%)'}} />
              <div aria-hidden="true" className="absolute left-1/2 -translate-x-1/2 top-[40%] w-[280px] h-[140px] rounded-full blur-[40px] opacity-80 pointer-events-none z-10 hidden sm:block md:hidden lg:hidden" style={{background: 'radial-gradient(closest-side, rgba(60,150,255,0.18), rgba(20,30,60,0.0) 60%)'}} />
              <div className="robot-wrapper relative w-[300px] sm:w-[360px] md:w-[500px] lg:w-[700px] h-[255px] sm:h-[300px] md:h-[380px] lg:h-[498px] -mt-2 sm:-mt-4 md:-mt-6 transition-all z-20">
                <Image
                  src="/robo.webp"
                  alt="Portrait of Cyrene, a technologically advanced female humanoid"
                  fill
                  className="object-contain scale-[1.18] sm:scale-100 origin-bottom"
                  priority
                />
              </div>
            </div>
          </section>

          {/* Token Carousel */}
          <TokenCarousel />

          <LaunchHero />

          {/* Why Launch on CyreneAI Section */}
          <section className="py-20 px-6">
            <div className="max-w-7xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center mb-16"
              >
                <h1 className="font-moonhouse text-[30px] font-medium text-white mb-4 uppercase tracking-[6px] leading-[130%] text-center">
                  Why CyreneAI ?
                </h1>
                <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-600 mx-auto rounded-full"></div>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Earn from Day 1 */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="bg-gradient-to-br from-[#2C3C70]/40 via-[#18285C]/30 to-[#2C3C70]/40 backdrop-blur-sm border border-[#2C3C70]/50 rounded-2xl p-8 relative overflow-hidden shadow-xl hover:shadow-[#2C3C70]/30 transition-all duration-500 group"
                >
                  <div className="relative z-10">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#2C3C70] to-[#18285C] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <h3 className="text-white text-xl font-outfit font-bold mb-4">
                      Earn from Day 1
                    </h3>
                    <p className="text-[#9DABD8]/90 font-outfit text-base leading-relaxed">
                      Get 1% of trading volume as fees — no upfront cost.
                    </p>
                  </div>
                </motion.div>

                {/* Aligned Incentives */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="bg-gradient-to-br from-[#17224A]/50 via-[#2C3C70]/40 to-[#18285C]/50 backdrop-blur-sm border border-[#2C3C70]/60 rounded-2xl p-8 relative overflow-hidden shadow-xl hover:shadow-[#2C3C70]/30 transition-all duration-500 group"
                >
                  <div className="relative z-10">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#2C3C70] to-[#18285C] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-white text-xl font-outfit font-bold mb-4">
                      Aligned Incentives
                    </h3>
                    <p className="text-[#9DABD8]/90 font-outfit text-base leading-relaxed">
                      10% team tokens, 6-month cliff, 1-year vesting for long-term growth.
                    </p>
                  </div>
                </motion.div>

                {/* Internet Capital Markets */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="bg-gradient-to-br from-[#0A122E]/95 via-[#17224A]/90 to-[#0A122E]/95 backdrop-blur-sm border border-[#2C3C70]/40 rounded-2xl p-8 relative overflow-hidden shadow-xl hover:shadow-[#2C3C70]/20 transition-all duration-500 group"
                >
                  <div className="relative z-10">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#2C3C70] to-[#18285C] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <h3 className="text-white text-xl font-outfit font-bold mb-4">
                      Internet Capital Markets
                    </h3>
                    <p className="text-[#9DABD8]/90 font-outfit text-base leading-relaxed">
                      Launch early, build community, raise seed — all on-chain, with full control.
                    </p>
                  </div>
                </motion.div>
              </div>
            </div>
          </section>



          {/* Agents Carousel */}
          <AgentsCarousel />
          
          {/* Stats Section */}
          <Stats/>
          <ScrollVelocity
            texts={[
              'AI agents, your launch partners',
              'Internet capital markets',
            ]} 
            velocity={40} 
            className="text-white opacity-80"
            withStars={true}
          />

        </div>
      </div>

      {/* Fixed Chat Component */}
      <FixedChat />
    </>
  );
}