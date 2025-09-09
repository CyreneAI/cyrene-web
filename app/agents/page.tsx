// app/dashboard/agents/page.tsx - FIXED VERSION
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { useWallet } from '@solana/wallet-adapter-react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Loader2, Search, Copy, ExternalLink, MessageSquare, User, Coins, 
  TrendingUp, RefreshCw, ImageIcon, Settings, Twitter, Calendar,
  MapPin, Globe, Edit3, Verified, Users, Heart, Lightbulb,
  Rocket, Github, FileText, Eye, Clock
} from 'lucide-react';
import { BeatLoader } from 'react-spinners';
import { toast } from 'sonner';
import StarCanvas from '@/components/StarCanvas';
import { GlowButton } from '@/components/ui/glow-button';
import ConnectButton from '@/components/common/ConnectBtn';
import { LaunchedTokensService } from '@/services/launchedTokensService';
import { ProjectIdeasService } from '@/services/projectIdeasService';
import { LaunchedTokenData, ProjectIdeaData } from '@/lib/supabase';
import { DbcTradeModal } from '@/components/DbcTradeModal';
import React from 'react';
import { Check } from 'lucide-react';

// Types
interface UserProfile {
  id: string;
  wallet_address: string;
  twitter_id?: string;
  twitter_username?: string;
  twitter_name?: string;
  twitter_profile_image_url?: string;
  twitter_verified: boolean;
  twitter_followers_count: number;
  twitter_following_count: number;
  twitter_tweet_count: number;
  bio?: string;
  website_url?: string;
  location?: string;
  joined_date: string;
  total_agents: number;
  total_tokens: number;
  total_volume: number;
  reputation_score: number;
}

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

interface MessageExample {
  user?: string;
  content: {
    text: string;
  };
}

interface CharacterData {
  oneLiner: string;
  description: string;
  bio: string[];
  lore: string[];
  knowledge: string[];
  messageExamples: MessageExample[];
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

const formatDate = (dateString: string | number) => {
  const date = typeof dateString === 'string' ? new Date(dateString) : new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatTokenDate = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatJoinDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });
};

const formatNumber = (num: number) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

export default function UserProfilePage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tokens, setTokens] = useState<LaunchedTokenData[]>([]);
  const [projectIdeas, setProjectIdeas] = useState<ProjectIdeaData[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [tokenMetadataCache, setTokenMetadataCache] = useState<Map<string, TokenMetadata>>(new Map());
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [agentsLoading, setAgentsLoading] = useState(false);
  const [tokensLoading, setTokensLoading] = useState(false);
  const [ideasLoading, setIdeasLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedToken, setSelectedToken] = useState<LaunchedTokenData | null>(null);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'agents' | 'tokens' | 'ideas'>('agents');
  const [twitterLinking, setTwitterLinking] = useState(false);
  
  // Ethereum wallet
  const { address: ethAddress, isConnected: isEthConnected } = useAppKitAccount();
  // Solana wallet
  const { publicKey: solAddress, connected: isSolConnected } = useWallet();
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  useEffect(() => {
    if (isEthConnected && ethAddress) {
      setWalletAddress(ethAddress);
    } else if (isSolConnected && solAddress) {
      setWalletAddress(solAddress.toBase58());
    } else {
      setWalletAddress(null);
    }
  }, [isEthConnected, isSolConnected, ethAddress, solAddress]);

  // Load user profile
  const loadProfile = useCallback(async () => {
    if (!walletAddress) return;
    
    try {
      setProfileLoading(true);
      const response = await fetch(`/api/profile/${walletAddress}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }
      
      const data = await response.json();
      setProfile(data.profile);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setProfileLoading(false);
    }
  }, [walletAddress]);

  // Handle Twitter linking
  const handleTwitterLink = async () => {
    if (!walletAddress) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setTwitterLinking(true);
      const response = await fetch('/api/auth/twitter/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ walletAddress }),
      });

      if (!response.ok) {
        throw new Error('Failed to initiate Twitter login');
      }

      const { authUrl } = await response.json();
      window.location.href = authUrl;
    } catch (error) {
      console.error('Twitter link error:', error);
      toast.error('Failed to link Twitter account');
      setTwitterLinking(false);
    }
  };

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

  // Load agents
  const loadAgents = useCallback(async () => {
    if (!walletAddress) return;
    
    try {
      setAgentsLoading(true);
      const response = await fetch(`/api/getAgentsbyWallet?walletAddress=${walletAddress}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch agents');
      }
      
      const data = await response.json();
      const agentsArray = Array.isArray(data) ? data : data.agents || [];
      setAgents(agentsArray);
    } catch (error) {
      console.error('Error loading agents:', error);
      toast.error('Failed to load agents');
    } finally {
      setAgentsLoading(false);
    }
  }, [walletAddress]);

  // Load tokens
  const loadTokens = useCallback(async () => {
    if (!walletAddress) return;
    
    try {
      setTokensLoading(true);
      const tokens = await LaunchedTokensService.getLaunchedTokens(walletAddress);
      setTokens(tokens);
    } catch (error) {
      console.error('Error loading tokens:', error);
      toast.error('Failed to load tokens');
    } finally {
      setTokensLoading(false);
    }
  }, [walletAddress]);

  // Load project ideas - FIXED to filter out launched ideas
  const loadProjectIdeas = useCallback(async () => {
    if (!walletAddress) return;
    
    try {
      setIdeasLoading(true);
      const allIdeas = await ProjectIdeasService.getProjectIdeas(walletAddress);
      // Filter out launched projects - they should appear in tokens tab
      const unlaunchedIdeas = allIdeas.filter(idea => !idea.isLaunched);
      setProjectIdeas(unlaunchedIdeas);
    } catch (error) {
      console.error('Error loading project ideas:', error);
      toast.error('Failed to load project ideas');
    } finally {
      setIdeasLoading(false);
    }
  }, [walletAddress]);

  // Initial load when wallet connects
  useEffect(() => {
    const loadData = async () => {
      if (walletAddress) {
        setLoading(true);
        await Promise.all([loadProfile(), loadAgents(), loadTokens(), loadProjectIdeas()]);
        setLoading(false);
      } else {
        setLoading(false);
        setProfile(null);
        setAgents([]);
        setTokens([]);
        setProjectIdeas([]);
      }
    };

    loadData();
  }, [walletAddress, loadProfile, loadAgents, loadTokens, loadProjectIdeas]);

  // Check for Twitter success/error params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('twitter_linked') === 'true') {
      toast.success('Twitter account linked successfully!');
      loadProfile(); // Reload profile to get updated data
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (urlParams.get('error')) {
      toast.error('Failed to link Twitter account');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [loadProfile]);

  const filteredAgents = agents.filter(agent => {
    return agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           (agent.character_file && agent.character_file.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  const filteredTokens = tokens.filter(token =>
    token.tokenName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    token.tokenSymbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    token.contractAddress.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredIdeas = projectIdeas.filter(idea =>
    idea.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    idea.projectDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
    idea.projectCategory.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  // Handle trade button click
  const handleTradeClick = (token: LaunchedTokenData) => {
    setSelectedToken(token);
    setShowTradeModal(true);
  };

  // Handle upgrade to fundraise - FIXED
  const handleUpgradeToFundraise = async (ideaId: string) => {
    if (!walletAddress) return;
    
    try {
      // Update the project stage to cooking
      await ProjectIdeasService.updateProjectIdea(ideaId, walletAddress, {
        projectStage: 'cooking'
      });
      
      // Redirect to launch page with the idea ID
      window.location.href = `/launch-projects?ideaId=${ideaId}`;
    } catch (error) {
      console.error('Error upgrading to fundraise:', error);
      toast.error('Failed to upgrade project stage');
    }
  };

  if (!walletAddress) {
    return (
      <>
        <div className="flex flex-col items-center justify-center min-h-[60vh] pt-20">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-white">Connect your wallet</h2>
            <p className="text-gray-400">
              Please connect your wallet to view your profile
            </p>
            <div className='px-20 py-3 ml-4'> <ConnectButton/></div>
          </div>
        </div>
      </>
    );
  }

  if (loading) {
    return (
      <>
      
        <div className="flex items-center justify-center min-h-[60vh] pt-20">
          <div className="text-center">
            <BeatLoader color="#2f7add" />
            <p className="text-gray-400 mt-4">Loading your profile...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="absolute top-0 left-0 w-full overflow-hidden -z-10 pointer-events-none">
        <div className="w-[2661px] text-[370px] opacity-10 tracking-[24.96px] leading-[70%] font-moonhouse text-transparent text-left inline-block [-webkit-text-stroke:3px_#c8c8c8] [paint-order:stroke_fill] mix-blend-overlay">
          CYRENE
        </div>
      </div>
      
      <div className="relative min-h-screen py-20 px-4 overflow-hidden mt-12">
        <div className="relative z-10 max-w-7xl mx-auto mt-12">
          {/* Profile Header Section - Keep existing code */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            {/* Profile Card - Keep existing profile card code */}
            <div className="relative">
              <div className="absolute inset-0 bg-[#434a6033] rounded-[40px] backdrop-blur-[35px] backdrop-brightness-[100%]" />
              <div className="relative z-10 p-8 md:p-12">
                <div className="flex flex-col md:flex-row items-start gap-8">
                  {/* Profile Image and Basic Info */}
                  <div className="flex flex-col items-center md:items-start">
                    <div className="relative">
                      <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 p-1">
                        <div className="w-full h-full rounded-full overflow-hidden bg-black">
                          <Image
                            src={profile?.twitter_profile_image_url || "/cyrene_profile.png"}
                            alt="Profile"
                            width={128}
                            height={128}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                      {profile?.twitter_verified && (
                        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                          <Verified className="w-5 h-5 text-white fill-white" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Profile Details */}
                  <div className="flex-1 space-y-4">
                    <div>
                      <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                        {profile?.twitter_name || 'Anonymous User'}
                      </h1>
                      {profile?.twitter_username && (
                        <p className="text-blue-400 text-lg mb-2">@{profile.twitter_username}</p>
                      )}
                      {profile?.bio && (
                        <p className="text-gray-300 max-w-2xl leading-relaxed">{profile.bio}</p>
                      )}
                    </div>

                    {/* Profile Stats Row */}
                    <div className="flex flex-wrap gap-6 text-sm">
                      {profile?.location && (
                        <div className="flex items-center gap-2 text-gray-400">
                          <MapPin className="w-4 h-4" />
                          <span>{profile.location}</span>
                        </div>
                      )}
                      {profile?.website_url && (
                        <a
                          href={profile.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          <Globe className="w-4 h-4" />
                          <span>Website</span>
                        </a>
                      )}
                      {profile?.joined_date && (
                        <div className="flex items-center gap-2 text-gray-400">
                          <Calendar className="w-4 h-4" />
                          <span>Joined {formatJoinDate(profile.joined_date)}</span>
                        </div>
                      )}
                    </div>

                    {/* Social Stats */}
                    {profile?.twitter_id && (
                      <div className="flex gap-6 text-sm">
                        <div className="flex items-center gap-1">
                          <span className="font-semibold text-white">{formatNumber(profile.twitter_following_count)}</span>
                          <span className="text-gray-400">Following</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="font-semibold text-white">{formatNumber(profile.twitter_followers_count)}</span>
                          <span className="text-gray-400">Followers</span>
                        </div>
                      </div>
                    )}

                    {/* Wallet and Actions */}
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="inline-flex items-center gap-3 bg-gray-800/50 backdrop-blur-sm rounded-full px-4 py-2 border border-gray-700">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span className="text-gray-300 font-mono text-sm">
                          {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                        </span>
                        <button
                          onClick={() => copyToClipboard(walletAddress)}
                          className="text-gray-400 hover:text-white transition-colors"
                          title="Copy wallet address"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>

                      {!profile?.twitter_id && (
                        <button
                          onClick={handleTwitterLink}
                          disabled={twitterLinking}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full transition-colors text-sm font-medium"
                        >
                          {twitterLinking ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Twitter className="w-4 h-4" />
                          )}
                          Link Twitter
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Stats Cards - Updated to include project ideas */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8"
          >
            {/* Total Projects Card */}
            <div className="group relative overflow-hidden cursor-pointer" onClick={() => setActiveTab('ideas')}>
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-600/5 rounded-2xl backdrop-blur-xl border border-purple-500/20 group-hover:border-purple-500/40"></div>
              <div className="relative p-6 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-500/20 backdrop-blur-sm mb-4 group-hover:bg-purple-500/30 transition-colors">
                  <Lightbulb className="w-6 h-6 text-purple-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-3xl font-bold text-purple-400 tracking-tight">{projectIdeas.length}</p>
                  <p className="text-white/60 text-sm font-medium">Project Ideas</p>
                  <p className="text-gray-400 text-xs">In development</p>
                </div>
              </div>
            </div>

            {/* Ideation Stage */}
            <div className="group relative overflow-hidden cursor-pointer" onClick={() => setActiveTab('ideas')}>
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-orange-600/5 rounded-2xl backdrop-blur-xl border border-yellow-500/20 group-hover:border-yellow-500/40"></div>
              <div className="relative p-6 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-yellow-500/20 backdrop-blur-sm mb-4 group-hover:bg-yellow-500/30 transition-colors">
                  <Clock className="w-6 h-6 text-yellow-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-3xl font-bold text-yellow-400 tracking-tight">{projectIdeas.filter(p => p.projectStage === 'ideation').length}</p>
                  <p className="text-white/60 text-sm font-medium">Ideation</p>
                  <p className="text-gray-400 text-xs">Early stage</p>
                </div>
              </div>
            </div>

            {/* Total Tokens Card */}
            <div className="group relative overflow-hidden cursor-pointer" onClick={() => setActiveTab('tokens')}>
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-600/5 rounded-2xl backdrop-blur-xl border border-blue-500/20 group-hover:border-blue-500/40"></div>
              <div className="relative p-6 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-500/20 backdrop-blur-sm mb-4 group-hover:bg-blue-500/30 transition-colors">
                  <Coins className="w-6 h-6 text-blue-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-3xl font-bold text-blue-400 tracking-tight">{tokens.length}</p>
                  <p className="text-white/60 text-sm font-medium">Tokens</p>
                  <p className="text-gray-400 text-xs">Launched</p>
                </div>
              </div>
            </div>

            {/* Graduated Card */}
            <div className="group relative overflow-hidden cursor-pointer" onClick={() => setActiveTab('tokens')}>
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-600/5 rounded-2xl backdrop-blur-xl border border-green-500/20 group-hover:border-green-500/40"></div>
              <div className="relative p-6 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-500/20 backdrop-blur-sm mb-4 group-hover:bg-green-500/30 transition-colors">
                  <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div className="space-y-1">
                  <p className="text-3xl font-bold text-green-400 tracking-tight">{tokens.filter(t => t.dammPoolAddress).length}</p>
                  <p className="text-white/60 text-sm font-medium">Graduated</p>
                  <p className="text-gray-400 text-xs">On DEX</p>
                </div>
              </div>
            </div>

            {/* Active Agents Card */}
            <div className="group relative overflow-hidden cursor-pointer" onClick={() => setActiveTab('agents')}>
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-600/5 rounded-2xl backdrop-blur-xl border border-cyan-500/20 group-hover:border-cyan-500/40"></div>
              <div className="relative p-6 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-cyan-500/20 backdrop-blur-sm mb-4 group-hover:bg-cyan-500/30 transition-colors">
                  <MessageSquare className="w-6 h-6 text-cyan-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-3xl font-bold text-cyan-400 tracking-tight">{agents.filter(a => a.status === 'active').length}</p>
                  <p className="text-white/60 text-sm font-medium">Agents</p>
                  <p className="text-gray-400 text-xs">Active</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Tabs - Updated to include project ideas */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex justify-center mb-8"
          >
            <div className="flex bg-gray-800/50 backdrop-blur-xl rounded-full p-1 border border-white/10">
              <button
                onClick={() => setActiveTab('agents')}
                className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium transition-all ${
                  activeTab === 'agents'
                    ? 'bg-white text-black'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <User className="w-4 h-4" />
                Agents {agents.length > 0 && `(${agents.length})`}
              </button>
              <button
                onClick={() => setActiveTab('tokens')}
                className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium transition-all ${
                  activeTab === 'tokens'
                    ? 'bg-white text-black'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Coins className="w-4 h-4" />
                Tokens {tokens.length > 0 && `(${tokens.length})`}
              </button>
              <button
                onClick={() => setActiveTab('ideas')}
                className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium transition-all ${
                  activeTab === 'ideas'
                    ? 'bg-white text-black'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Lightbulb className="w-4 h-4" />
                Ideas {projectIdeas.length > 0 && `(${projectIdeas.length})`}
              </button>
            </div>
          </motion.div>

          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto mb-8">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={`Search your ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 rounded-lg pl-12 pr-16 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
            />
            <button
              onClick={() => {
                if (activeTab === 'agents') loadAgents();
                else if (activeTab === 'tokens') loadTokens();
                else loadProjectIdeas();
              }}
              disabled={agentsLoading || tokensLoading || ideasLoading}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-white transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${(agentsLoading || tokensLoading || ideasLoading) ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Glass Background Container */}
          <div className="relative w-full">
            <div className="absolute inset-0 bg-[#434a6033] rounded-[40px] backdrop-blur-[35px] backdrop-brightness-[100%]" />
            <div className="relative z-10 p-8 md:p-12">
              {activeTab === 'agents' ? (
                <AgentsSection
                  agents={filteredAgents}
                  loading={agentsLoading}
                  formatDate={formatDate}
                  parseCharacterFile={parseCharacterFile}
                />
              ) : activeTab === 'tokens' ? (
                <TokensSection
                  tokens={filteredTokens}
                  loading={tokensLoading}
                  onTradeClick={handleTradeClick}
                  formatDate={formatTokenDate}
                  fetchTokenMetadata={fetchTokenMetadata}
                />
              ) : (
                <ProjectIdeasSection
                  ideas={filteredIdeas}
                  loading={ideasLoading}
                  onUpgradeToFundraise={handleUpgradeToFundraise}
                  formatDate={formatDate}
                />
              )}
            </div>
          </div>
        </div>
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
          creatorName="You"
        />
      )}
    </>
  );
}

// Project Ideas Section Component - FIXED
interface ProjectIdeasSection {
  ideas: ProjectIdeaData[];
  loading: boolean;
  onUpgradeToFundraise: (ideaId: string) => void;
  formatDate: (date: string) => string;
}

const ProjectIdeasSection: React.FC<ProjectIdeasSection> = ({ 
  ideas, 
  loading, 
  onUpgradeToFundraise, 
  formatDate 
}) => {
  if (loading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-blue-400" />
        <p className="text-gray-400">Loading your project ideas...</p>
      </div>
    );
  }

  if (ideas.length === 0) {
    return (
      <div className="text-center py-20">
        <Lightbulb className="w-16 h-16 mx-auto mb-4 text-gray-500" />
        <p className="text-gray-400 mb-4">No project ideas found</p>
        <Link 
          href="/launch-projects"
          className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
        >
          <Lightbulb className="w-4 h-4" />
          Create Your First Project
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {ideas.map((idea, index) => (
        <ProjectIdeaCard
          key={idea.id}
          idea={idea}
          index={index}
          onUpgradeToFundraise={() => onUpgradeToFundraise(idea.id!)}
          formatDate={formatDate}
        />
      ))}
    </div>
  );
};

// Project Idea Card Component - FIXED
interface ProjectIdeaCardProps {
  idea: ProjectIdeaData;
  index: number;
  onUpgradeToFundraise: () => void;
  formatDate: (date: string) => string;
}

const ProjectIdeaCard: React.FC<ProjectIdeaCardProps> = ({ 
  idea, 
  index, 
  onUpgradeToFundraise, 
  formatDate 
}) => {
  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'ideation':
        return 'text-yellow-400 bg-yellow-400/20';
      case 'cooking':
        return 'text-green-400 bg-green-400/20';
      default:
        return 'text-gray-400 bg-gray-400/20';
    }
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="relative bg-[#000010] transition-colors duration-300 rounded-3xl p-6 border border-white/10 hover:border-white/20 group backdrop-blur-sm"
    >
      {/* Status and Stage indicators */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <div className={`px-2 py-1 rounded text-xs font-medium ${getStageColor(idea.projectStage)}`}>
          {idea.projectStage === 'ideation' ? 'Ideation' : 'Cooking'}
        </div>
      </div>

      {/* Project Image */}
      <div className="w-20 h-20 rounded-xl bg-[#000010] flex items-center justify-center overflow-hidden relative shadow-lg mb-4">
        {idea.projectImage ? (
          <img
            src={idea.projectImage}
            alt={`${idea.projectName} logo`}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/shapes/svg?seed=${idea.projectName}`;
            }}
          />
        ) : (
          <Lightbulb className="w-8 h-8 text-purple-400" />
        )}
      </div>

      {/* Project Info */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white mb-1" title={idea.projectName}>
          {truncateText(idea.projectName, 20)}
        </h3>
        <p className="text-blue-300 text-sm mb-2">
          {idea.projectCategory}
        </p>
        
        {idea.projectDescription && (
          <p className="text-gray-300 text-xs mb-2 line-clamp-2" title={idea.projectDescription}>
            {truncateText(idea.projectDescription, 80)}
          </p>
        )}
        
        <div className="grid grid-cols-2 gap-4 text-xs mb-3">
          <div>
            <span className="text-gray-400 block">Industry</span>
            <span className="text-blue-300 font-medium">{idea.projectIndustry}</span>
          </div>
          <div>
            <span className="text-gray-400 block">Team Size</span>
            <span className="text-gray-200 font-medium">{idea.teamMembers.length} members</span>
          </div>
        </div>

        <div className="text-xs text-gray-400 mb-3">
          Created {formatDate(idea.createdAt!)}
        </div>
      </div>

      {/* Action Buttons - FIXED */}
      <div className="flex gap-2">
        {idea.projectStage === 'cooking' ? (
          <Link
            href={`/launch-projects?ideaId=${idea.id}`}
            className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-1 shadow-lg"
          >
            <Rocket className="w-3 h-3" />
            Launch Token
          </Link>
        ) : (
          <button
            onClick={onUpgradeToFundraise}
            className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-1 shadow-lg"
          >
            <Rocket className="w-3 h-3" />
            Upgrade to Fundraise
          </button>
        )}

        {/* View Details Button - FIXED to use edit link for now */}
        <Link
          href={`/launch-projects?ideaId=${idea.id}`}
          className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm flex items-center justify-center group-hover:bg-white/20 backdrop-blur-sm shadow-lg"
          title="Edit Project"
        >
          <Edit3 className="w-4 h-4" />
        </Link>
      </div>

      {/* Links */}
      {(idea.githubUrl || idea.websiteUrl || idea.whitepaperUrl) && (
        <div className="flex gap-2 mt-3 pt-3 border-t border-gray-700">
          {idea.githubUrl && (
            <a
              href={idea.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors"
              title="GitHub"
            >
              <Github className="w-4 h-4" />
            </a>
          )}
          {idea.websiteUrl && (
            <a
              href={idea.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors"
              title="Website"
            >
              <Globe className="w-4 h-4" />
            </a>
          )}
          {idea.whitepaperUrl && (
            <a
              href={idea.whitepaperUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors"
              title="Whitepaper"
            >
              <FileText className="w-4 h-4" />
            </a>
          )}
        </div>
      )}

      <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-purple-600/0 to-blue-600/0 group-hover:from-purple-600/10 group-hover:to-blue-600/10 transition-all duration-300 pointer-events-none"></div>
    </motion.article>
  );
};

// Keep existing AgentsSection, AgentCard, TokensSection, and TokenCard components
// (They remain the same as in your original code)

// Agents Section Component
interface AgentsSectionProps {
  agents: Agent[];
  loading: boolean;
  formatDate: (date: string) => string;
  parseCharacterFile: (file: string) => CharacterData;
}

const AgentsSection: React.FC<AgentsSectionProps> = ({ agents, loading, formatDate, parseCharacterFile }) => {
  if (loading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-blue-400" />
        <p className="text-gray-400">Loading your agents...</p>
      </div>
    );
  }

  if (agents.length === 0) {
    return (
      <div className="text-center py-20">
        <User className="w-16 h-16 mx-auto mb-4 text-gray-500" />
        <p className="text-gray-400 mb-4">No agents found</p>
        <Link 
          href="/launch-agent"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <User className="w-4 h-4" />
          Launch Your First Agent
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {agents.map((agent, index) => (
        <AgentCard
          key={agent.id}
          agent={agent}
          index={index}
          formatDate={formatDate}
          parseCharacterFile={parseCharacterFile}
        />
      ))}
    </div>
  );
};

// Agent Card Component
interface AgentCardProps {
  agent: Agent;
  index: number;
  formatDate: (date: string) => string;
  parseCharacterFile: (file: string) => CharacterData;
}

const AgentCard: React.FC<AgentCardProps> = ({ agent, index, formatDate, parseCharacterFile }) => {
  const characterData = agent.character_file ? parseCharacterFile(agent.character_file) : null;

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
        <div className={`w-2 h-2 rounded-full ${
          agent.status === 'active' ? 'bg-green-400 shadow-green-400/50' :
          agent.status === 'paused' ? 'bg-yellow-400 shadow-yellow-400/50' :
          'bg-red-400 shadow-red-400/50'
        } shadow-lg`}></div>
        <span className="text-xs text-gray-300 capitalize">{agent.status}</span>
      </div>

      {/* Agent Avatar */}
      <div className="w-20 h-20 rounded-xl bg-[#000010] flex items-center justify-center overflow-hidden relative shadow-lg mb-4">
        <Image
          src={agent.avatar_img ? `https://ipfs.erebrus.io/ipfs/${agent.avatar_img}` : "/cyrene_profile.png"}
          alt={agent.name}
          width={80}
          height={80}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Agent Info */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white mb-1" title={agent.name}>
          {truncateText(agent.name, 20)}
        </h3>
        {characterData?.oneLiner && (
          <p className="text-blue-300 text-sm mb-2" title={characterData.oneLiner}>
            {truncateText(characterData.oneLiner, 70)}
          </p>
        )}
        {characterData?.description && (
          <p className="text-gray-300 text-xs mb-4 line-clamp-2" title={characterData.description}>
            {truncateText(characterData.description, 300)}
          </p>
        )}
        
        {/* Agent Stats */}
        <div className="grid grid-cols-2 gap-4 text-xs mb-3">
          <div>
            <span className="text-gray-400 block">Domain</span>
            <span className="text-blue-300 font-medium">
              {agent.domain ? truncateText(agent.domain, 15) : 'Not set'}
            </span>
          </div>
          <div>
            <span className="text-gray-400 block">Created</span>
            <span className="text-gray-200 font-medium">{formatDate(agent.created_at)}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Link
          href={`/explore-agents/chat/${agent.id}`}
          className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-1 shadow-lg"
        >
          <MessageSquare className="w-3 h-3" />
          Chat
        </Link>
        
        {agent.domain ? (
          <a
            href={`https://${agent.domain}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm flex items-center justify-center group-hover:bg-white/20 backdrop-blur-sm shadow-lg"
            title="Visit domain"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        ) : (
          <div className="px-3 py-2 bg-gray-700/50 text-gray-500 rounded-lg text-sm flex items-center justify-center backdrop-blur-sm shadow-lg cursor-not-allowed">
            <Settings className="w-4 h-4" />
          </div>
        )}
      </div>

      {/* Hover effect overlay */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-600/0 to-purple-600/0 group-hover:from-blue-600/10 group-hover:to-purple-600/10 transition-all duration-300 pointer-events-none"></div>
    </motion.article>
  );
};

// Tokens Section Component
interface TokensSectionProps {
  tokens: LaunchedTokenData[];
  loading: boolean;
  onTradeClick: (token: LaunchedTokenData) => void;
  formatDate: (timestamp: number) => string;
  fetchTokenMetadata: (metadataUri: string) => Promise<TokenMetadata | null>;
}

const TokensSection: React.FC<TokensSectionProps> = ({ tokens, loading, onTradeClick, formatDate, fetchTokenMetadata }) => {
  if (loading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-blue-400" />
        <p className="text-gray-400">Loading your tokens...</p>
      </div>
    );
  }

  if (tokens.length === 0) {
    return (
      <div className="text-center py-20">
        <Coins className="w-16 h-16 mx-auto mb-4 text-gray-500" />
        <p className="text-gray-400 mb-4">No tokens found</p>
        <Link 
          href="/launch-projects"
          className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
        >
          <Coins className="w-4 h-4" />
          Launch Your First Token
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {tokens.map((token, index) => (
        <TokenCard
          key={token.contractAddress}
          token={token}
          index={index}
          onTradeClick={() => onTradeClick(token)}
          formatDate={formatDate}
          fetchTokenMetadata={fetchTokenMetadata}
        />
      ))}
    </div>
  );
};

// Token Card Component
interface TokenCardProps {
  token: LaunchedTokenData;
  index: number;
  onTradeClick: () => void;
  formatDate: (timestamp: number) => string;
  fetchTokenMetadata: (metadataUri: string) => Promise<TokenMetadata | null>;
}

const TokenCard: React.FC<TokenCardProps> = React.memo(({ token, index, onTradeClick, formatDate, fetchTokenMetadata }) => {
  const [tokenImage, setTokenImage] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [metadata, setMetadata] = useState<TokenMetadata | null>(null);

  const getTokenStatus = () => {
    if (token.dammPoolAddress) {
      return { status: 'graduated', label: 'Graduated' };
    }
    return { status: 'active', label: 'Active' };
  };

  const statusInfo = getTokenStatus();

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
        {statusInfo.status === 'graduated' ? (
          <div className="w-2 h-2 bg-green-400 rounded-full shadow-lg shadow-green-400/50"></div>
        ) : (
          <div className="w-2 h-2 bg-blue-400 rounded-full shadow-lg shadow-blue-400/50"></div>
        )}
        <span className="text-xs text-gray-300">{statusInfo.label}</span>
      </div>

      {/* Token Image */}
      <div className="w-20 h-20 rounded-xl bg-[#000010] flex items-center justify-center overflow-hidden relative shadow-lg mb-4">
        {imageLoading ? (
          <Loader2 className="w-8 h-8 text-white animate-spin" />
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
        
        {metadata?.description && (
          <p className="text-gray-300 text-xs mb-2 line-clamp-2" title={metadata.description}>
            {truncateText(metadata.description, 80)}
          </p>
        )}
        
        <div className="grid grid-cols-2 gap-4 text-xs mb-3">
          <div>
            <span className="text-gray-400 block">Quote Token</span>
            <span className="text-blue-300 font-medium">{token.quoteMint}</span>
          </div>
          <div>
            <span className="text-gray-400 block">Launched</span>
            <span className="text-gray-200 font-medium">{formatDate(token.launchedAt)}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        {token.dammPoolAddress ? (
          <a
            href={`https://jup.ag/swap/SOL-${token.contractAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm text-center font-medium flex items-center justify-center gap-1 shadow-lg"
          >
            <ExternalLink className="w-3 h-3" />
            Jupiter
          </a>
        ) : (
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

      <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-600/0 to-purple-600/0 group-hover:from-blue-600/10 group-hover:to-purple-600/10 transition-all duration-300 pointer-events-none"></div>
    </motion.article>
  );
});

TokenCard.displayName = 'TokenCard';