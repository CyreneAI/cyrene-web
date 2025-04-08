// app/dashboard/agents/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { useWallet } from '@solana/wallet-adapter-react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';
import StarCanvas from '@/components/StarCanvas';
import { GlowButton } from '@/components/ui/glow-button';

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
}

const GRADIENT_COLORS = 'linear-gradient(45deg, #0162FF, white, #A63FE1, #0162FF)';

export default function UserAgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
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
        setAgents(data);
      } catch (error) {
        console.error('Error fetching agents:', error);
        toast.error('Failed to load your agents');
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();
  }, [walletAddress]);

  const filteredAgents = agents.filter(agent => {
    return agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           agent.description.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const setChatAgent = (id: string, name: string, avatar_img: string, cover_img: string) => {
    localStorage.setItem('currentAgentId', id);
    localStorage.setItem('currentAgentName', name);
    localStorage.setItem('currentAgentImage', avatar_img ? `https://ipfs.erebrus.io/ipfs/${avatar_img}` : '');
    localStorage.setItem('currentAgentCoverImage', cover_img ? `https://ipfs.erebrus.io/ipfs/${cover_img}` : '');
  };

  if (!walletAddress) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Connect your wallet</h2>
          <p className="text-muted-foreground">
            Please connect your wallet to view your agents
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
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

        <div className="relative z-10 max-w-7xl mx-auto">
          {/* Title Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#0162FF] via-[#3985FF] to-[#A63FE1] bg-clip-text text-transparent">
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

          {/* Launch Agent Button */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex justify-end mb-8"
          >
            <Link href="/launch-agent">
              <GlowButton
                style={{
                  padding: '0.6em 2em',
                  borderRadius: '10px',
                  fontSize: '16px',
                  fontWeight: '500'
                }}
              >
                Launch New Agent
              </GlowButton>
            </Link>
          </motion.div>

          {/* Agents Grid */}
          {filteredAgents.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center min-h-[40vh] space-y-4"
            >
              <h2 className="text-xl font-medium">You don`&apos;`t have any agents yet</h2>
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
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {filteredAgents.map((agent, index) => (
                <motion.div
                  key={agent.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                  className="flex justify-center group"
                >
                  <div className="relative w-full max-w-[400px]">
                    {/* Card glow effect */}
                    <div
                      style={{
                        position: 'absolute',
                        content: '""',
                        background: GRADIENT_COLORS,
                        top: '-2px',
                        left: '-2px',
                        backgroundSize: '400%',
                        zIndex: -1,
                        filter: 'blur(5px)',
                        width: 'calc(100% + 4px)',
                        height: 'calc(100% + 4px)',
                        animation: 'glowing-button 20s linear infinite',
                        transition: 'opacity 0.3s ease-in-out',
                        opacity: '0.1',
                      }}
                      className="group-hover:opacity-100"
                    />
                    
                    <div className="relative w-full bg-transparent backdrop-blur-xl rounded-2xl overflow-hidden z-10 border-blue-900/50">
                      <div className="relative w-full h-48">
                        <Image 
                          src={agent.cover_img ? `https://ipfs.erebrus.io/ipfs/${agent.cover_img}` : "/cyrene_cover_2-1-85.png"} 
                          alt={`${agent.name} cover`} 
                          fill
                          className="object-cover opacity-80"
                        />
                      </div>

                      <div className="absolute left-1/2 -translate-x-1/2 top-20">
                        <div className="relative w-48 h-48 rounded-full overflow-hidden border-4 border-gray-900 shadow-xl">
                          <Image 
                            src={agent.avatar_img ? `https://ipfs.erebrus.io/ipfs/${agent.avatar_img}` : "/cyrene_profile.png"} 
                            alt={agent.name} 
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-110"
                          />
                        </div>
                      </div>

                      <div className="p-6 mt-20">
                        <h2 className="text-xl font-bold text-white mb-4 text-center">{agent.name}</h2>
                        
                        <p className="text-gray-400 mb-4 line-clamp-2 text-center">{agent.description}</p>
                        
                        <div className="flex flex-col gap-3">
                          <GlowButton
                            onClick={() => {
                              setChatAgent(agent.id, agent.name, agent.avatar_img, agent.cover_img);
                            }}
                            style={{ width: '100%', padding: '0.8em', borderRadius: '999px', fontSize: '15px', fontWeight: '500' }}
                          >
                            Chat with {agent.name}
                          </GlowButton>

                          {agent.clients?.includes('telegram') && (
                            <a
                              href={`https://t.me/${agent.name.toLowerCase()}_bot`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-[#0088cc] text-white rounded-full hover:bg-[#0077aa] transition-colors text-sm font-medium"
                            >
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.14-.26.26-.534.26l.213-3.053 5.56-5.023c.24-.213-.054-.334-.373-.121l-6.87 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z"/>
                              </svg>
                              Connect on Telegram
                            </a>
                          )}

                          {agent.clients?.includes('discord') && (
                            <a
                              href={`https://discord.com/api/oauth2/authorize?client_id=${agent.discord_application_id}&permissions=0&scope=bot`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-[#5865F2] text-white rounded-full hover:bg-[#4752c4] transition-colors text-sm font-medium"
                            >
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                              </svg>
                              Add to Discord
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </>
  );
}