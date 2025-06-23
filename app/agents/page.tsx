// app/dashboard/agents/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { useWallet } from '@solana/wallet-adapter-react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Loader2, Search, Copy, ExternalLink, BookOpen, MessageSquare, Settings, Zap, Shield, Globe, Cpu, Terminal } from 'lucide-react';
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
  domain?: string;
  server_domain?: string;
  voice_model?: string;
  organization?: string;
  wallet_address?: string;
  character_file?: string;
}

const GRADIENT_COLORS = 'linear-gradient(45deg, #0162FF, white, #A63FE1, #0162FF)';



interface MessageContent {
  text: string;
  // Add other content properties if they exist
}

interface MessageExample {
  user: string;
  content: MessageContent;
}

interface CharacterData {
  oneLiner: string;
  description: string;
  bio: string[];
  lore: string[];
  knowledge: string[];
  messageExamples: MessageExample[][]; // Array of message pairs
 
  settings: Record<string, unknown>;
  modelProvider?: string; // Optional property for model provider
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

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export default function UserAgentsPage() {
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('html');
  const [widgetConfig, setWidgetConfig] = useState({
    primaryColor: '#1366d9',
    position: 'bottom-right',
    size: 'medium'
  });
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
        // Check if data is an array (old format) or has agents property (new format)
        const agentsArray = Array.isArray(data) ? data : data.agents || [];
        setAgents(agentsArray);
        if (agentsArray.length > 0) {
          setSelectedAgent(agentsArray[0]);
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
           (agent.character_file && agent.character_file.toLowerCase().includes(searchQuery.toLowerCase()));
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

  const fetchPeerIdForAgent = async (agentId: string): Promise<string | null> => {
    try {
      const response = await fetch('https://gateway.netsepio.com/api/v1.0/agents');
      const data = await response.json();
  
      for (const item of data.agents) {
        for (const agent of item.agents.agents) {
          if (agent.id === agentId) {
            return item.node.peerId;
          }
        }
      }
  
      return null; // not found
    } catch (error) {
      console.error("Failed to fetch agents", error);
      return null;
    }
  };

  const [peerid, setPeerid] = useState<string | null>(null);

// Call this when selectedAgent changes
useEffect(() => {
  if (selectedAgent?.id) {
    fetchPeerIdForAgent(selectedAgent.id).then(setPeerid);
  }
}, [selectedAgent]);

  const generateSnippet = () => {
    if (!selectedAgent) return '';
    
    // Use the agent's domain if available, otherwise fall back to the default
    const domain = selectedAgent.domain;
  
    const baseSnippet = `window.aiChatConfig = {
      chatUrl: 'https://${domain}/${selectedAgent.id}/message',
      agentInfoUrl: 'https://gateway.netsepio.com/api/v1.0/agents/${peerid}/${selectedAgent.id}',
      agentName: '${selectedAgent.name}',
      primaryColor: '${widgetConfig.primaryColor}',
      position: '${widgetConfig.position}',
      size: '${widgetConfig.size}'
    };`;
    
    if (activeTab === 'html') {
      return `<!-- Configure the widget (place before the script) -->
  <script>
    ${baseSnippet}
  </script>
  
  <!-- AI Chat Widget -->
  <script src="https://cyreneai.com/chatbot/index.js"></script>`;
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

        <div className="relative z-10 max-w-7xl mx-auto mb-8">
          {/* Title Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#0162FF] via-[#3985FF] to-[#A63FE1] bg-clip-text text-transparent py-4">
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
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <h3 className="font-bold text-white truncate">{agent.name}</h3>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              agent.status === 'active' ? 'bg-green-900/50 text-green-400' :
                              agent.status === 'paused' ? 'bg-yellow-900/50 text-yellow-400' :
                              'bg-red-900/50 text-red-400'
                            }`}>
                              {agent.status}
                            </span>
                          </div>
                          {agent.character_file && (
                            <p className="text-sm text-gray-400 truncate">
                              {parseCharacterFile(agent.character_file).oneLiner}
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </div>

              {/* Right Panel - Agent Details */}
              {selectedAgent && (
                <div className="w-full lg:w-2/3">
                  <div className="bg-gray-900/50 backdrop-blur-xl rounded-xl border border-white/10 overflow-hidden">
                    {/* Cover Image */}
                    <div className="relative w-full h-48 rounded-t-xl overflow-hidden">
                      <Image
                        src={selectedAgent.cover_img ? `https://ipfs.erebrus.io/ipfs/${selectedAgent.cover_img}` : "/cyrene_cover_2-1-85.png"}
                        alt={`${selectedAgent.name} cover`}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 to-transparent" />
                    </div>

                    {/* Agent Header */}
                    <div className="flex flex-col md:flex-row gap-6 px-6 -mt-16 mb-6">
                      <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-gray-900 shadow-xl">
                        <Image
                          src={selectedAgent.avatar_img ? `https://ipfs.erebrus.io/ipfs/${selectedAgent.avatar_img}` : "/cyrene_profile.png"}
                          alt={selectedAgent.name}
                          fill
                          className="object-cover"
                        />
                      </div>

                      <div className="flex-1 pt-4 ">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className='flex flex-col gap-12'>
                            <h2 className="text-2xl font-bold text-white">{selectedAgent.name}</h2>
                            {selectedAgent.character_file && (
                              
                              <p className="text-lg text-blue-300">
                                
                                {parseCharacterFile(selectedAgent.character_file).oneLiner}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              selectedAgent.status === 'active' ? 'bg-green-900/50 text-green-400' :
                              selectedAgent.status === 'paused' ? 'bg-yellow-900/50 text-yellow-400' :
                              'bg-red-900/50 text-red-400'
                            }`}>
                              {selectedAgent.status}
                            </span>
                            <span className="px-3 py-1 rounded-full bg-blue-900/50 text-blue-400 text-xs font-medium">
                              {selectedAgent.organization || 'cyrene'}
                            </span>
                          </div>
                        </div>

                        {selectedAgent.character_file && (
                          <p className="mt-2 text-gray-300">
                            {parseCharacterFile(selectedAgent.character_file).description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Main Content */}
                    <div className="p-6">
                      {/* Quick Actions */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <GlowButton
                          onClick={() => router.push(`/explore-agents/chat/${selectedAgent.id}`)}
                          className="w-full"
                        >
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Chat
                        </GlowButton>

                        <button
                          onClick={() => setShowModal(true)}
                          className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        >
                          <Terminal className="w-4 h-4" />
                          Integration Code
                        </button>

                        {selectedAgent.clients?.includes('telegram') && (
                          <a
                            href={`https://t.me/${selectedAgent.name.toLowerCase()}_bot`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 px-4 py-3 bg-[#0088cc] hover:bg-[#0077aa] text-white rounded-lg transition-colors"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.14-.26.26-.534.26l.213-3.053 5.56-5.023c.24-.213-.054-.334-.373-.121l-6.87 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z"/>
                            </svg>
                            Telegram
                          </a>
                        )}

                        {selectedAgent.clients?.includes('discord') && (
                          <a
                            href={`https://discord.com/api/oauth2/authorize?client_id=${selectedAgent.discord_application_id}&permissions=0&scope=bot`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 px-4 py-3 bg-[#5865F2] hover:bg-[#4752c4] text-white rounded-lg transition-colors"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                            </svg>
                            Discord
                          </a>
                        )}
                      </div>

                      {/* Agent Details Sections */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* About Section */}
                        <div className="bg-gray-900/30 rounded-lg p-5 border border-white/10">
                          <div className="flex items-center gap-2 mb-4">
                            <BookOpen className="w-5 h-5 text-blue-400" />
                            <h3 className="text-lg font-semibold text-white">About</h3>
                          </div>
                          {selectedAgent.character_file ? (
                            <div className="space-y-4">
                              <div>
                                <h4 className="text-sm font-medium text-gray-400 mb-1">Description</h4>
                                <p className="text-gray-300">
                                  {parseCharacterFile(selectedAgent.character_file).description}
                                </p>
                              </div>
                              <div>
                                <h4 className="text-sm font-medium text-gray-400 mb-1">Knowledge</h4>
                                <p className="text-gray-300">
                                  {parseCharacterFile(selectedAgent.character_file).knowledge.join(' ')}
                                </p>
                              </div>
                              <div>
                                <h4 className="text-sm font-medium text-gray-400 mb-1">Example Messages</h4>
                                <div className="space-y-2">
  {parseCharacterFile(selectedAgent.character_file).messageExamples.slice(0, 2).map((example: MessageExample[], idx: number) => (
    <div key={idx} className="bg-gray-800/50 p-3 rounded">
      <p className="text-blue-300 text-sm">{example[0].user}: {example[0].content.text}</p>
      <p className="text-green-300 text-sm mt-1">{example[1].user}: {example[1].content.text}</p>
    </div>
  ))}
</div>
                              </div>
                            </div>
                          ) : (
                            <p className="text-gray-400">No description available</p>
                          )}
                        </div>

                        {/* Technical Details */}
                        <div className="bg-gray-900/30 rounded-lg p-5 border border-white/10">
                          <div className="flex items-center gap-2 mb-4">
                            <Settings className="w-5 h-5 text-blue-400" />
                            <h3 className="text-lg font-semibold text-white">Agent Details</h3>
                          </div>
                          <div className="space-y-4">
                            <div>
                              <h4 className="text-sm font-medium text-gray-400 mb-1">Agent ID</h4>
                              <div className="flex items-center gap-2">
                                <p className="text-gray-300 font-mono text-sm">{selectedAgent.id}</p>
                                <button
                                  onClick={() => copyToClipboard(selectedAgent.id)}
                                  className="text-gray-400 hover:text-white"
                                  title="Copy to clipboard"
                                >
                                  <Copy className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            <div>
                              <h4 className="text-sm font-medium text-gray-400 mb-1">Domain</h4>
                              <div className="flex items-center gap-2">
                                <a
                                  href={`https://${selectedAgent.domain}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-400 hover:underline flex items-center gap-1"
                                >
                                  {selectedAgent.domain}
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            </div>

                            <div>
                              <h4 className="text-sm font-medium text-gray-400 mb-1">Created At</h4>
                              <p className="text-gray-300">{formatDate(selectedAgent.created_at)}</p>
                            </div>

                            <div>
                              <h4 className="text-sm font-medium text-gray-400 mb-1">Voice Model</h4>
                              <p className="text-gray-300">{selectedAgent.voice_model || 'Not specified'}</p>
                            </div>

                            <div>
                              <h4 className="text-sm font-medium text-gray-400 mb-1">Connected Clients</h4>
                              <div className="flex flex-wrap gap-2 mt-1">
                              {selectedAgent.clients ? (
  (typeof selectedAgent.clients === 'string' 
    ? JSON.parse(selectedAgent.clients) 
    : selectedAgent.clients
  ).map((client: string) => (
    <span key={client} className="px-2 py-1 bg-blue-900/30 text-blue-300 rounded text-xs">
      {client}
    </span>
  ))
) : (
  <span className="text-gray-400">No connected clients</span>
)}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Advanced Info */}
                        <div className="bg-gray-900/30 rounded-lg p-5 border border-white/10 lg:col-span-2">
                          <div className="flex items-center gap-2 mb-4">
                            <Zap className="w-5 h-5 text-blue-400" />
                            <h3 className="text-lg font-semibold text-white">Advanced Information</h3>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="text-sm font-medium text-gray-400 mb-1">Server Domain</h4>
                              <p className="text-gray-300 font-mono text-sm">{selectedAgent.server_domain}</p>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-gray-400 mb-1">Wallet Address</h4>
                              <div className="flex items-center gap-2">
                                <p className="text-gray-300 font-mono text-sm truncate">{selectedAgent.wallet_address}</p>
                                <button
                                  onClick={() => copyToClipboard(selectedAgent.wallet_address || '')}
                                  className="text-gray-400 hover:text-white"
                                  title="Copy to clipboard"
                                >
                                  <Copy className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-gray-400 mb-1">Model Provider</h4>
                              <p className="text-gray-300">
                                {selectedAgent.character_file && parseCharacterFile(selectedAgent.character_file).modelProvider || 'Not specified'}
                              </p>
                            </div>
                            {/* <div>
                              <h4 className="text-sm font-medium text-gray-400 mb-1">Docker Image</h4>
                              <p className="text-gray-300 font-mono text-sm">
                                {selectedAgent.character_file && parseCharacterFile(selectedAgent.character_file).settings?.docker_url || 'Not specified'}
                              </p>
                            </div> */}
                          </div>
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

      {/* Integration Code Modal */}
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

      {/* Widget Configuration Section */}
      <div className="mb-6 bg-gray-800/50 p-4 rounded-lg">
        <h4 className="text-lg font-semibold text-white mb-4">Widget Configuration</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Primary Color */}
          <div>
  <label className="block text-sm font-medium text-gray-300 mb-1">Primary Color</label>
  <div className="flex items-center gap-2">
    <div className="relative">
      <input
        type="color"
        value={widgetConfig.primaryColor}
        onChange={(e) => setWidgetConfig({...widgetConfig, primaryColor: e.target.value})}
        className="w-6 h-6 cursor-pointer absolute opacity-0"
      />
      <div 
        className="w-6 h-6 rounded border border-gray-500"
        style={{ backgroundColor: widgetConfig.primaryColor }}
      />
    </div>
    <input
      type="text"
      value={widgetConfig.primaryColor}
      onChange={(e) => setWidgetConfig({...widgetConfig, primaryColor: e.target.value})}
      className="w-28 bg-gray-700 text-white px-2 py-1 rounded text-sm h-8"
    />
  </div>
</div>

          {/* Position */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Position</label>
            <select
              value={widgetConfig.position}
              onChange={(e) => setWidgetConfig({...widgetConfig, position: e.target.value})}
              className="w-full bg-gray-700 text-white px-3 py-1 rounded text-sm"
            >
              <option value="top-right">Top Right</option>
              <option value="top-left">Top Left</option>
              <option value="bottom-right">Bottom Right</option>
              <option value="bottom-left">Bottom Left</option>
            </select>
          </div>

          {/* Size */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Size</label>
            <select
              value={widgetConfig.size}
              onChange={(e) => setWidgetConfig({...widgetConfig, size: e.target.value})}
              className="w-full bg-gray-700 text-white px-3 py-1 rounded text-sm"
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>
        </div>
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

      <div className="relative bg-gray-800 rounded-lg p-4 mb-4">
        <pre className="overflow-x-auto text-sm text-white">
          {generateSnippet()}
        </pre>
        <button
          onClick={() => copyToClipboard(generateSnippet())}
          className="absolute top-2 right-2 bg-gray-700 hover:bg-gray-600 text-white p-1 rounded"
          title="Copy to clipboard"
        >
          <Copy className="w-4 h-4" />
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

