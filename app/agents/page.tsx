// app/dashboard/agents/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { useWallet } from '@solana/wallet-adapter-react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Loader2, Search } from 'lucide-react';
import { BeatLoader } from 'react-spinners';
import { toast } from 'sonner';
import StarCanvas from '@/components/StarCanvas';
import { GlowButton } from '@/components/ui/glow-button';
import ConnectButton from '@/components/common/ConnectBtn';
import { useRouter } from 'next/navigation';

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
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('html');
  
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
        if (data.length > 0) {
          setSelectedAgent(data[0]);
        }
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const generateSnippet = () => {
    if (!selectedAgent) return '';
    
    const baseSnippet = `window.aiChatConfig = {
  chatUrl: 'https://${selectedAgent.name.toLowerCase()}.us01.erebrus.io/${selectedAgent.id}/message',
  agentInfoUrl: 'https://gateway.erebrus.io/api/v1.0/agents/us01.erebrus.io/${selectedAgent.id}',
  agentName: '${selectedAgent.name}'
};`;

    if (activeTab === 'html') {
      return `<script>
  ${baseSnippet}
</script>
<script src="https://cdn.erebrus.io/chat-widget.js"></script>`;
    } else if (activeTab === 'react') {
      return `import { ErebrusChat } from '@erebrus/chat-widget';

function App() {
  return (
    <ErebrusChat
      config={{
        ${baseSnippet.replace(/\n/g, '\n        ')}
      }}
    />
  );
}`;
    } else if (activeTab === 'nextjs') {
      return `'use client';

import { ErebrusChat } from '@erebrus/chat-widget';

export default function ChatWidget() {
  return (
    <ErebrusChat
      config={{
        ${baseSnippet.replace(/\n/g, '\n        ')}
      }}
    />
  );
}`;
    }
    return '';
  };

  if (!walletAddress) {
    return (
      <>
        <StarCanvas/>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-white">Connect your wallet</h2>
            <p className="text-muted-foreground">
              Please connect your wallet to view your agents
            </p>
            <div className='px-20 py-3 ml-4'> <ConnectButton/></div>
          </div>
        </div>
      </>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <BeatLoader color="#2f7add" />
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

          {/* Main Content */}
          {filteredAgents.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center min-h-[40vh] space-y-4"
            >
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
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Left Panel - Agent List */}
              <div className="w-full lg:w-1/3">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="space-y-4"
                >
                  {filteredAgents.map((agent, index) => (
                    <motion.div
                      key={agent.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      whileHover={{ y: -5 }}
                      className={`p-4 rounded-xl backdrop-blur-xl border ${selectedAgent?.id === agent.id ? 'border-[#3985FF] bg-gray-900/50' : 'border-white/10 bg-gray-900/30'} cursor-pointer transition-all`}
                      onClick={() => setSelectedAgent(agent)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative w-16 h-16 rounded-full overflow-hidden">
                          <Image 
                            src={agent.avatar_img ? `https://ipfs.erebrus.io/ipfs/${agent.avatar_img}` : "/cyrene_profile.png"} 
                            alt={agent.name} 
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <h3 className="font-bold text-white">{agent.name}</h3>
                          <p className="text-sm text-gray-400 line-clamp-1">{agent.description}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </div>

              {/* Right Panel - Agent Details */}
              {selectedAgent && (
                <div className="w-full lg:w-2/3">
                  <div className="bg-gray-900/50 backdrop-blur-xl rounded-xl border border-white/10 p-6">
                    <div className="flex flex-col md:flex-row gap-8">
                      {/* Agent Details */}
                      <div className="w-full">
                        <div className="relative w-full h-48 rounded-xl overflow-hidden mb-4">
                          <Image 
                            src={selectedAgent.cover_img ? `https://ipfs.erebrus.io/ipfs/${selectedAgent.cover_img}` : "/cyrene_cover_2-1-85.png"} 
                            alt={`${selectedAgent.name} cover`} 
                            fill
                            className="object-cover"
                          />
                        </div>
                        
                        <div className="flex justify-center -mt-16 mb-6">
                          <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-gray-900 shadow-xl">
                            <Image 
                              src={selectedAgent.avatar_img ? `https://ipfs.erebrus.io/ipfs/${selectedAgent.avatar_img}` : "/cyrene_profile.png"} 
                              alt={selectedAgent.name} 
                              fill
                              className="object-cover"
                            />
                          </div>
                        </div>

                        <h2 className="text-2xl font-bold text-white text-center mb-2">{selectedAgent.name}</h2>
                        <p className="text-gray-400 text-center mb-6">{selectedAgent.description}</p>

                        <div className="space-y-4">
                          <GlowButton
                            onClick={() => router.push(`/explore-agents/chat/${selectedAgent.id}`)}
                            style={{ width: '100%', padding: '0.8em', borderRadius: '999px', fontSize: '15px', fontWeight: '500' }}
                          >
                            Chat with {selectedAgent.name}
                          </GlowButton>

                          {selectedAgent.clients?.includes('telegram') && (
                            <a
                              href={`https://t.me/${selectedAgent.name.toLowerCase()}_bot`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-[#0088cc] text-white rounded-full hover:bg-[#0077aa] transition-colors text-sm font-medium w-full"
                            >
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.14-.26.26-.534.26l.213-3.053 5.56-5.023c.24-.213-.054-.334-.373-.121l-6.87 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z"/>
                              </svg>
                              Connect on Telegram
                            </a>
                          )}

                          {selectedAgent.clients?.includes('discord') && (
                            <a
                              href={`https://discord.com/api/oauth2/authorize?client_id=${selectedAgent.discord_application_id}&permissions=0&scope=bot`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-[#5865F2] text-white rounded-full hover:bg-[#4752c4] transition-colors text-sm font-medium w-full"
                            >
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                              </svg>
                              Add to Discord
                            </a>
                          )}

                          <button
                            onClick={() => setShowModal(true)}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-full transition-colors"
                          >
                            Get Integration Code
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Simple Modal for Code Snippet */}
      {showModal && selectedAgent && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl border border-white/10 max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Integrate {selectedAgent.name} with your app</h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white"
              >
                &times;
              </button>
            </div>

            <div className="mb-4">
              <div className="flex border-b border-gray-700">
                <button
                  className={`px-4 py-2 ${activeTab === 'html' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400'}`}
                  onClick={() => setActiveTab('html')}
                >
                  HTML
                </button>
                <button
                  className={`px-4 py-2 ${activeTab === 'react' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400'}`}
                  onClick={() => setActiveTab('react')}
                >
                  React
                </button>
                <button
                  className={`px-4 py-2 ${activeTab === 'nextjs' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400'}`}
                  onClick={() => setActiveTab('nextjs')}
                >
                  Next.js
                </button>
              </div>
            </div>

            <div className="relative bg-gray-800 rounded-lg p-4 mb-4 text-white">
              <pre className="overflow-x-auto text-sm">
                {generateSnippet()}
              </pre>
              <button
                onClick={() => copyToClipboard(generateSnippet())}
                className="absolute top-2 right-2 bg-gray-700 hover:bg-gray-600 text-white p-1 rounded"
                title="Copy to clipboard"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              </button>
            </div>

            <button
              onClick={() => setShowModal(false)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}