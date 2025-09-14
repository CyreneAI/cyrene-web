// app/users/page.tsx
'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Loader2, Search, User, Coins, MessageSquare, 
  RefreshCw, Users, Twitter, Verified, MapPin,
  Globe, Calendar, TrendingUp, Eye
} from 'lucide-react';
import { BeatLoader } from 'react-spinners';
import { toast } from 'sonner';
import { getHighResTwitterImage } from '@/lib/imageUtils';

// Types
interface UserStats {
  id: string;
  wallet_address: string;
  twitter_id?: string;
  twitter_username?: string;
  twitter_name?: string;
  twitter_profile_image_url?: string;
  twitter_verified: boolean;
  twitter_followers_count: number;
  twitter_following_count: number;
  bio?: string;
  website_url?: string;
  location?: string;
  joined_date: string;
  total_agents: number;
  total_tokens: number;
  active_agents: number;
  graduated_tokens: number;
  reputation_score: number;
  recent_agents?: Array<{
    id: string;
    name: string;
    avatar_img: string;
  }>;
  recent_tokens?: Array<{
    contractAddress: string;
    tokenName: string;
    tokenSymbol: string;
    metadataUri?: string;
  }>;
}

const formatNumber = (num: number) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

const formatJoinDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric'
  });
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'reputation' | 'agents' | 'tokens' | 'followers'>('reputation');

  // Load users data
  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users/stats');
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Filter and sort users
  const filteredAndSortedUsers = users
    .filter(user => {
      const query = searchQuery.toLowerCase();
      return (
        (user.twitter_name?.toLowerCase().includes(query)) ||
        (user.twitter_username?.toLowerCase().includes(query)) ||
        (user.wallet_address.toLowerCase().includes(query)) ||
        (user.bio?.toLowerCase().includes(query))
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'reputation':
          return b.reputation_score - a.reputation_score;
        case 'agents':
          return b.total_agents - a.total_agents;
        case 'tokens':
          return b.total_tokens - a.total_tokens;
        case 'followers':
          return b.twitter_followers_count - a.twitter_followers_count;
        default:
          return 0;
      }
    });

  return (
    <>
      {/* Background Text */}
      <div className="absolute top-0 left-0 w-full overflow-hidden -z-10 pointer-events-none">
        <div className="w-[2661px] text-[370px] opacity-10 tracking-[24.96px] leading-[70%] font-moonhouse text-transparent text-left inline-block [-webkit-text-stroke:3px_#c8c8c8] [paint-order:stroke_fill] mix-blend-overlay">
          CYRENE
        </div>
      </div>
      
      <div className="relative min-h-screen py-20 px-4 overflow-hidden mt-12">
        <div className="relative z-10 max-w-7xl mx-auto mt-12">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              Community
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Discover the creators, builders, and innovators shaping the future of AI agents and tokens
            </p>
          </motion.div>

          {/* Stats Overview
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-600/5 rounded-2xl backdrop-blur-xl border border-blue-500/20"></div>
              <div className="relative p-6 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-500/20 backdrop-blur-sm mb-3">
                  <Users className="w-6 h-6 text-blue-400" />
                </div>
                <p className="text-2xl font-bold text-blue-400">{users.length}</p>
                <p className="text-white/60 text-sm">Total Users</p>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-600/5 rounded-2xl backdrop-blur-xl border border-purple-500/20"></div>
              <div className="relative p-6 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-500/20 backdrop-blur-sm mb-3">
                  <MessageSquare className="w-6 h-6 text-purple-400" />
                </div>
                <p className="text-2xl font-bold text-purple-400">
                  {users.reduce((sum, user) => sum + user.total_agents, 0)}
                </p>
                <p className="text-white/60 text-sm">Total Agents</p>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-600/5 rounded-2xl backdrop-blur-xl border border-green-500/20"></div>
              <div className="relative p-6 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-500/20 backdrop-blur-sm mb-3">
                  <Coins className="w-6 h-6 text-green-400" />
                </div>
                <p className="text-2xl font-bold text-green-400">
                  {users.reduce((sum, user) => sum + user.total_tokens, 0)}
                </p>
                <p className="text-white/60 text-sm">Total Tokens</p>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-orange-600/5 rounded-2xl backdrop-blur-xl border border-yellow-500/20"></div>
              <div className="relative p-6 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-yellow-500/20 backdrop-blur-sm mb-3">
                  <TrendingUp className="w-6 h-6 text-yellow-400" />
                </div>
                <p className="text-2xl font-bold text-yellow-400">
                  {users.reduce((sum, user) => sum + user.graduated_tokens, 0)}
                </p>
                <p className="text-white/60 text-sm">Graduated</p>
              </div>
            </div>
          </motion.div> */}

          {/* Search and Sort Controls */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col md:flex-row gap-4 mb-8"
          >
            {/* Search Bar */}
            {/* <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg pl-12 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div> */}

            {/* Sort Options */}
            {/* <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option value="reputation">Sort by Reputation</option>
                <option value="agents">Sort by Agents</option>
                <option value="tokens">Sort by Tokens</option>
                <option value="followers">Sort by Followers</option>
              </select>

              <button
                onClick={loadUsers}
                disabled={loading}
                className="px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center gap-2"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div> */}
          </motion.div>

          {/* Users List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-[#434a6033] rounded-[40px] backdrop-blur-[35px] backdrop-brightness-[100%]" />
            <div className="relative z-10 p-8">
              {loading ? (
                <div className="text-center py-12">
                  <BeatLoader color="#2f7add" />
                  <p className="text-gray-400 mt-4">Loading users...</p>
                </div>
              ) : filteredAndSortedUsers.length === 0 ? (
                <div className="text-center py-20">
                  <Users className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                  <p className="text-gray-400">No users found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredAndSortedUsers.map((user, index) => (
                    <UserRow key={user.wallet_address} user={user} index={index} />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}

// User Row Component
interface UserRowProps {
  user: UserStats;
  index: number;
}

const UserRow: React.FC<UserRowProps> = ({ user, index }) => {
  return (
    
    <Link href={`/users/${user.wallet_address}`}>
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05 }}
        className="group relative bg-[#000010]/50 hover:bg-[#000020] border border-white/10 hover:border-white/20 rounded-2xl p-6 transition-all duration-300 cursor-pointer"
      >
        <div className="flex items-center gap-6">
          {/* User Profile */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 p-0.5">
                <div className="w-full h-full rounded-full overflow-hidden bg-black">
                <Image
  src={getHighResTwitterImage(user.twitter_profile_image_url)}
  alt={user.twitter_name || 'User'}
  width={64}
  height={64}
  className="w-full h-full object-cover"
/>
                </div>
              </div>
              {user.twitter_verified && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <Verified className="w-3 h-3 text-white fill-white" />
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold text-white truncate">
                  {user.twitter_name || 'Anonymous User'}
                </h3>
                {user.twitter_username && (
                  <span className="text-blue-400 text-sm">@{user.twitter_username}</span>
                )}
              </div>
              
              {user.bio && (
                <p className="text-gray-300 text-sm line-clamp-1 mb-2">
                  {user.bio}
                </p>
              )}

              <div className="flex items-center gap-4 text-xs text-gray-400">
                {user.twitter_followers_count > 0 && (
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    <span>{formatNumber(user.twitter_followers_count)} followers</span>
                  </div>
                )}
                
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>Joined {formatJoinDate(user.joined_date)}</span>
                </div>

                {user.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span>{user.location}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-8">
            {/* Agents */}
            {/* <div className="text-center">
              <div className="flex items-center gap-2 mb-1">
                <MessageSquare className="w-4 h-4 text-purple-400" />
                <span className="text-lg font-bold text-purple-400">{user.total_agents}</span>
              </div>
              <span className="text-xs text-gray-400">Agents</span>
              {user.active_agents > 0 && (
                <div className="text-xs text-green-400">({user.active_agents} active)</div>
              )}
            </div> */}

            {/* Tokens */}
            {/* <div className="text-center">
              <div className="flex items-center gap-2 mb-1">
                <Coins className="w-4 h-4 text-green-400" />
                <span className="text-lg font-bold text-green-400">{user.total_tokens}</span>
              </div>
              <span className="text-xs text-gray-400">Tokens</span>
              {user.graduated_tokens > 0 && (
                <div className="text-xs text-yellow-400">({user.graduated_tokens} graduated)</div>
              )}
            </div> */}

            {/* Reputation Score */}
            {/* <div className="text-center">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                <span className="text-lg font-bold text-blue-400">{user.reputation_score}</span>
              </div>
              <span className="text-xs text-gray-400">Score</span>
            </div> */}
          </div>

          {/* Recent Activity Preview */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Recent Agents */}
            {user.recent_agents && user.recent_agents.length > 0 && (
              <div className="flex -space-x-2">
                {user.recent_agents.slice(0, 3).map((agent, idx) => (
                  <div
                    key={agent.id}
                    className="w-8 h-8 rounded-full overflow-hidden border-2 border-gray-800 bg-gray-700"
                    title={agent.name}
                  >
                    <img
                      src={agent.avatar_img ? `https://ipfs.erebrus.io/ipfs/${agent.avatar_img}` : "/cyrene_profile.png"}
                      alt={agent.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* View Profile Arrow */}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <Eye className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
            </div>
          </div>
        </div>

        {/* Hover Effect */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-600/0 to-purple-600/0 group-hover:from-blue-600/5 group-hover:to-purple-600/5 transition-all duration-300 pointer-events-none"></div>
      </motion.div>
    </Link>
  );
};