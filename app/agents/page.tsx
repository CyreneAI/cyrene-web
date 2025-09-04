// app/dashboard/agents/page.tsx
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { useWallet } from '@solana/wallet-adapter-react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Loader2, Search, Copy, ExternalLink, MessageSquare, User, Coins, TrendingUp, RefreshCw, ImageIcon, Settings } from 'lucide-react';
import { BeatLoader } from 'react-spinners';
import { toast } from 'sonner';
import StarCanvas from '@/components/StarCanvas';
import { GlowButton } from '@/components/ui/glow-button';
import ConnectButton from '@/components/common/ConnectBtn';
import { LaunchedTokensService } from '@/services/launchedTokensService';
import { LaunchedTokenData } from '@/lib/supabase';
import { DbcTradeModal } from '@/components/DbcTradeModal';
import React from 'react';

// Token Metadata Interface
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

export default function UserProfilePage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tokens, setTokens] = useState<LaunchedTokenData[]>([]);
  const [tokenMetadataCache, setTokenMetadataCache] = useState<Map<string, TokenMetadata>>(new Map());
  const [loading, setLoading] = useState(true);
  const [agentsLoading, setAgentsLoading] = useState(false);
  const [tokensLoading, setTokensLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedToken, setSelectedToken] = useState<LaunchedTokenData | null>(null);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'agents' | 'tokens'>('agents');
  
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

  // Initial load when wallet connects
  useEffect(() => {
    const loadData = async () => {
      if (walletAddress) {
        setLoading(true);
        await Promise.all([loadAgents(), loadTokens()]);
        setLoading(false);
      } else {
        setLoading(false);
        setAgents([]);
        setTokens([]);
      }
    };

    loadData();
  }, [walletAddress, loadAgents, loadTokens]);

  const filteredAgents = agents.filter(agent => {
    return agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           (agent.character_file && agent.character_file.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  const filteredTokens = tokens.filter(token =>
    token.tokenName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    token.tokenSymbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    token.contractAddress.toLowerCase().includes(searchQuery.toLowerCase())
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

  if (!walletAddress) {
    return (
      <>
        <StarCanvas/>
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
        <StarCanvas />
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
      <div className="w-[2661px]  text-[370px] opacity-10 tracking-[24.96px] leading-[70%] font-moonhouse text-transparent text-left inline-block [-webkit-text-stroke:3px_#c8c8c8] [paint-order:stroke_fill] mix-blend-overlay">
        CYRENE
      </div>
    </div>
    
  
      <div className="relative min-h-screen py-20 px-4 overflow-hidden mt-12">
        {/* Gradient Orbs */}

        <div className="relative z-10 max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r text-white bg-clip-text text-transparent py-4">
              My Profile
            </h1>
            <p className="mt-4 text-gray-400 mb-6">
              Manage your agents and tokens
            </p>
            
            {/* Wallet Info */}
            <div className="inline-flex items-center gap-3 bg-gray-800/50 backdrop-blur-sm rounded-full px-6 py-3 border border-gray-700">
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              <span className="text-gray-300 font-mono text-sm">
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </span>
              <button
                onClick={() => copyToClipboard(walletAddress)}
                className="text-gray-400 hover:text-white transition-colors"
                title="Copy wallet address"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          >
            {/* Total Tokens Card */}
            <div className="group relative overflow-hidden cursor-pointer" onClick={() => setActiveTab('tokens')}>
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-600/5 rounded-2xl backdrop-blur-xl border border-blue-500/20 group-hover:border-blue-500/40"></div>
              <div className="relative p-6 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-500/20 backdrop-blur-sm mb-4 group-hover:bg-blue-500/30 transition-colors">
                  <Coins className="w-6 h-6 text-blue-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-3xl font-bold text-blue-400 tracking-tight">{tokens.length}</p>
                  <p className="text-white/60 text-sm font-medium">Total Tokens</p>
                  <p className="text-gray-400 text-xs">Launched projects</p>
                </div>
              </div>
            </div>

            {/* Active Trading Card */}
            <div className="group relative overflow-hidden cursor-pointer" onClick={() => setActiveTab('tokens')}>
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-teal-600/5 rounded-2xl backdrop-blur-xl border border-cyan-500/20 group-hover:border-cyan-500/40"></div>
              <div className="relative p-6 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-cyan-500/20 backdrop-blur-sm mb-4 group-hover:bg-cyan-500/30 transition-colors">
                  <TrendingUp className="w-6 h-6 text-cyan-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-3xl font-bold text-cyan-400 tracking-tight">{tokens.filter(t => !t.dammPoolAddress).length}</p>
                  <p className="text-white/60 text-sm font-medium">Active Trading</p>
                  <p className="text-gray-400 text-xs">Bonding curve</p>
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
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-violet-600/5 rounded-2xl backdrop-blur-xl border border-purple-500/20 group-hover:border-purple-500/40"></div>
              <div className="relative p-6 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-500/20 backdrop-blur-sm mb-4 group-hover:bg-purple-500/30 transition-colors">
                  <MessageSquare className="w-6 h-6 text-purple-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-3xl font-bold text-purple-400 tracking-tight">{agents.filter(a => a.status === 'active').length}</p>
                  <p className="text-white/60 text-sm font-medium">Active Agents</p>
                  <p className="text-gray-400 text-xs">of {agents.length} total</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Tabs */}
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
                else loadTokens();
              }}
              disabled={agentsLoading || tokensLoading}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-white transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${(agentsLoading || tokensLoading) ? 'animate-spin' : ''}`} />
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
              ) : (
                <TokensSection
                  tokens={filteredTokens}
                  loading={tokensLoading}
                  onTradeClick={handleTradeClick}
                  formatDate={formatTokenDate}
                  fetchTokenMetadata={fetchTokenMetadata}
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