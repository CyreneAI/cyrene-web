"use client"

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Image as LucidImage, Upload, FileUp, Sparkles } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import axios from 'axios';
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { GlowButton } from "@/components/ui/glow-button";
import StarCanvas from "@/components/StarCanvas";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect } from "react";
import VoiceManager, { Voice } from "@/utils/voiceUtils";
import { generateCharacterInfo } from "@/app/utils/openaiUtils";
import { useAppKitAccount, useAppKitProvider } from '@reown/appkit/react';
import { useWallet } from '@solana/wallet-adapter-react';

import { createAssociatedTokenAccountInstruction, createTransferInstruction, getAssociatedTokenAddress } from '@solana/spl-token';
import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { Provider } from "@reown/appkit-adapter-solana";

interface AgentData {
  name: string;
  clients: string[];
  oneLiner: string;
  description: string;
  bio: string[];
  lore: string[];
  knowledge: string[];
  messageExamples: { user: string; content: { text: string } }[][];
  postExamples: string[];
  topics: string[];
  adjectives: string[];
  plugins: string[];
  style: {
    all: string[];
    chat: string[];
    post: string[];
  };
  wallet_address: string;
  telegram_bot_token?: string;
  discord_application_id?: string;
  discord_token?: string;
}

interface AgentConfig {
  bio: string[];
  lore: string[];
  knowledge: string[];
}
interface AgentSecrets {
  OPENAI_API_KEY: string;
  TELEGRAM_BOT_TOKEN?: string;
  DISCORD_APPLICATION_ID?: string;
  DISCORD_API_TOKEN?: string;
}

// CYAI token constants
const CYAI_TOKEN_ADDRESS = new PublicKey('6Tph3SxbAW12BSJdCevVV9Zujh97X69d5MJ4XjwKmray');
const TREASURY_ADDRESS = process.env.NEXT_PUBLIC_TREASURY_ADDRESS!;
const REQUIRED_CYAI = 100000;
const CYAI_DECIMALS = 6;
const ADMIN_ADDRESSES = [
  process.env.NEXT_PUBLIC_ADMIN_ADDRESS_1!,
  process.env.NEXT_PUBLIC_ADMIN_ADDRESS_2!,
  process.env.NEXT_PUBLIC_ADMIN_ADDRESS_3!,
];

const agentApi = {
  async createAgent(agentData: AgentData) {
    try {
      const response = await axios.post('/api/createAgent', agentData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  },
};

async function getSolanaConnection(): Promise<Connection> {
  // Ordered list of RPC endpoints to try
  const endpoints = [
    {
      url: `https://mainnet.helius-rpc.com/?api-key=${process.env.NEXT_PUBLIC_HELIUS_API_KEY}`,
      type: 'alchemy'
    },
    {
      url: 'https://api.mainnet-beta.solana.com',
      type: 'solana-mainnet'
    },
    {
      url: 'https://solana-api.projectserum.com',
      type: 'project-serum'
    }
  ];

  for (const endpoint of endpoints) {
    try {
      const connection = new Connection(endpoint.url, 'confirmed');
      // Test the connection
      await connection.getSlot();
      console.log(`Connected to ${endpoint.type} RPC`);
      return connection;
    } catch (error) {
      console.warn(`Failed to connect to ${endpoint.type} RPC:`, error);
      continue;
    }
  }

  throw new Error('Unable to connect to any Solana RPC endpoint');
}
async function checkSOLBalance(walletAddress: string): Promise<number> {
  const connection = await getSolanaConnection();
  try {
    const publicKey = new PublicKey(walletAddress);
    const balance = await connection.getBalance(publicKey);
    return balance / 1e9; // Convert lamports to SOL
  } catch (error) {
    console.error("Error checking SOL balance:", error);
    throw new Error("Failed to check SOL balance");
  }
}


async function checkCYAIBalance(walletAddress: string): Promise<number> {
  const connection = await getSolanaConnection();
  try {
    const publicKey = new PublicKey(walletAddress);
    const accounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
      mint: CYAI_TOKEN_ADDRESS,
    });

    if (accounts.value.length === 0) return 0;
    return accounts.value[0].account.data.parsed.info.tokenAmount.uiAmount;
  } catch (error) {
    console.error('Balance check error:', error);
    throw new Error('Failed to check CYAI balance');
  }
}


async function confirmTransactionWithRetry(
  connection: Connection,
  txid: string,
  retries = 3
): Promise<void> {
  try {
    await connection.confirmTransaction(txid, 'confirmed');
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      return confirmTransactionWithRetry(connection, txid, retries - 1);
    }
    throw error;
  }
}


async function getConnection(): Promise<Connection> {
  const endpoint = `https://solana-mainnet.rpc.extrnode.com`;
  
  // Try both HTTP and WebSocket
  try {
    const connection = new Connection(endpoint, 'confirmed');
    // Test connection
    await connection.getVersion();
    return connection;
  } catch (error) {
    // Fallback to public RPC if Alchemy fails
    return new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
  }
}

async function transferCYAI(walletAddress: string, walletProvider: Provider): Promise<string> {

  // if (!walletAddress || !walletProvider) {
  //   throw new Error('Wallet address or provider is not available');
  // }

  // const connection = await getSolanaConnection();
  
  try {
    if (!walletAddress) throw new Error('Wallet address is required');
    if (!walletProvider) throw new Error('Wallet provider is required');
    if (!TREASURY_ADDRESS) throw new Error('Treasury address not configured');

    const connection = await getSolanaConnection();
    const fromPublicKey = new PublicKey(walletAddress);
    const toPublicKey = new PublicKey(TREASURY_ADDRESS);
    const amount = BigInt(REQUIRED_CYAI) * BigInt(10 ** CYAI_DECIMALS);

    // Get token accounts
    const fromTokenAccount = await getAssociatedTokenAddress(
      CYAI_TOKEN_ADDRESS,
      fromPublicKey
    );

    const toTokenAccount = await getAssociatedTokenAddress(
      CYAI_TOKEN_ADDRESS,
      toPublicKey
    );

    // Create transaction
    const transaction = new Transaction();
    
    // Check if recipient needs token account
    const recipientAccount = await connection.getAccountInfo(toTokenAccount);
    if (!recipientAccount) {
      transaction.add(
        createAssociatedTokenAccountInstruction(
          fromPublicKey,
          toTokenAccount,
          toPublicKey,
          CYAI_TOKEN_ADDRESS
        )
      );
    }

    transaction.add(
      createTransferInstruction(
        fromTokenAccount,
        toTokenAccount,
        fromPublicKey,
        amount
      )
    );

    // Sign and send
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = fromPublicKey;
    
    const signedTx = await walletProvider.signTransaction(transaction);
    const txid = await connection.sendRawTransaction(signedTx.serialize());
    
    await confirmTransactionWithRetry(connection, txid);
    return txid;
  } catch (error) {
    console.error('Detailed transfer error:', {
      error,
      walletAddress,
      hasWalletProvider: !!walletProvider,
      treasuryAddress: TREASURY_ADDRESS,
       amount : BigInt(REQUIRED_CYAI) * BigInt(10 ** CYAI_DECIMALS)

    });
    throw error;
  }
}

export default function LaunchAgentPage() {
  const [previewAudio, setPreviewAudio] = useState<string | null>(null);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('af_bella');
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [cyaiBalance, setCyaiBalance] = useState<number | null>(null);
  const [isCheckingBalance, setIsCheckingBalance] = useState(false);
  const voiceManager = useRef(new VoiceManager());

  const [preview, setPreview] = useState<string | null>(null);
  const [domain, setDomain] = useState('');
  const [name, setName] = useState('');
  const [oneLiner, setOneLiner] = useState('');
  const [description, setDescription] = useState('');
  const [characterInfo, setCharacterInfo] = useState({
    bio: '',
    lore: '',
    knowledge: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const [openAiKey, setOpenAiKey] = useState<string>("");
  const knowledgeInputRef = useRef<HTMLInputElement>(null);
  const loreInputRef = useRef<HTMLInputElement>(null);
  const bioInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [avatarHash, setAvatarHash] = useState<string>('');
  const [coverHash, setCoverHash] = useState<string>('');


  const [clients, setClients] = useState<string[]>([]);
  const [telegramBotToken, setTelegramBotToken] = useState('');
  const [discordAppId, setDiscordAppId] = useState('');
  const [discordToken, setDiscordToken] = useState('');

  // Wallet connection
  const { address: ethAddress, isConnected: isEthConnected } = useAppKitAccount(); // Ethereum wallet
  const { publicKey: solAddress, connected: isSolConnected } = useWallet(); // Solana wallet
  const [wallet_address, setWalletAddress] = useState<string>('');
  const [solBalance, setSolBalance] = useState<number | null>(null);
  // Handle wallet address changes
  useEffect(() => {
    if (isEthConnected && ethAddress) {
      setWalletAddress(ethAddress);
    } else if (isSolConnected && solAddress) {
      setWalletAddress(solAddress.toBase58());
    } else {
      setWalletAddress('');
    }
  }, [isEthConnected, isSolConnected, ethAddress, solAddress]);


  const handleCheckBalance = async () => {
    if (!wallet_address) return;
    
    setIsCheckingBalance(true);
    try {
      const balance = await checkCYAIBalance(wallet_address);
      setCyaiBalance(balance);
      toast.success(`Your balance: ${balance} CYAI`);
    } catch (error) {
      toast.error('Failed to check balance');
    } finally {
      setIsCheckingBalance(false);
    }
  };
  // Handle AI generation
  const handleGenerateWithAI = async () => {
    if (!oneLiner || !description) {
      toast.error("Please provide a one-liner and description before generating with AI.");
      return;
    }

    setIsGenerating(true);
    try {
      const generatedInfo = await generateCharacterInfo(oneLiner, description);
      setCharacterInfo({
        bio: generatedInfo.bio,
        lore: generatedInfo.lore,
        knowledge: generatedInfo.knowledge,
      });
      toast.success("Character information generated successfully!");
    } catch (error) {
      console.error('Error generating character info:', error);
      toast.error("Failed to generate character information with AI.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle voice preview
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handlePreviewVoice = async (voiceId: string) => {
    console.log("Preview button clicked. Voice ID:", voiceId);
    setIsLoadingPreview(true);

    try {
      const response = await axios.post('/api/tts', {
        text: "Hello, I'm your AI assistant",
        voice: voiceId,
      }, { responseType: 'blob' });

      // Stop and clean up previous audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        URL.revokeObjectURL(audioRef.current.src);
      }

      const audioUrl = URL.createObjectURL(new Blob([response.data], { type: 'audio/mpeg' }));
      setPreviewAudio(audioUrl);

      // Create a new Audio object
      const newAudio = new Audio(audioUrl);
      audioRef.current = newAudio;

      newAudio.play()
        .then(() => {
          console.log("Audio playing successfully");
        })
        .catch((error) => {
          if (error.name === "AbortError") {
            console.warn("Audio play request was aborted");
          } else {
            console.error("Audio play error:", error);
            toast.error("Playback failed");
          }
        });

      newAudio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        setPreviewAudio(null);
      };

    } catch (error) {
      console.error('Error previewing voice:', error);
      toast.error('Failed to preview voice');
    } finally {
      setIsLoadingPreview(false);
    }
  };

  // Load available voices
  useEffect(() => {
    const loadVoices = async () => {
      const availableVoices = await voiceManager.current.fetchVoices();
      setVoices(availableVoices);
    };

    loadVoices();
  }, []);

  // Handle file upload to IPFS
  const uploadToIPFS = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('/api/ipfs', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.Hash;
    } catch (error) {
      console.error('IPFS upload error:', error);
      toast.error('Failed to upload image to IPFS');
      throw error;
    }
  };

  // Handle file change for avatar and cover images
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover') => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (type === 'avatar') {
          setAvatarPreview(e.target?.result as string);
        } else {
          setCoverPreview(e.target?.result as string);
        }
      };
      reader.readAsDataURL(file);

      try {
        const hash = await uploadToIPFS(file);
        if (type === 'avatar') {
          setAvatarHash(hash);
          toast.success('Avatar image uploaded successfully');
        } else {
          setCoverHash(hash);
          toast.success('Cover image uploaded successfully');
        }
      } catch (error) {
        toast.error(`Failed to upload ${type} image`);
      }
    }
  };

  // Handle JSON file upload for character info
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const json: AgentConfig = JSON.parse(e.target?.result as string);
          setCharacterInfo({
            bio: json.bio.join('\n'),
            lore: json.lore.join('\n'),
            knowledge: json.knowledge.join('\n')
          });
          toast.success("Character information loaded successfully!");
        } catch (error) {
          toast.error("Invalid JSON file format");
        }
      };
      reader.readAsText(file);
    }
  };

  const { walletProvider } = useAppKitProvider<Provider>("solana");


  const [showConfirmation, setShowConfirmation] = useState(false);
const [confirmationData, setConfirmationData] = useState({
  amount: 0,
  balance: 0,
});

// Replace your existing confirm() call with this:
const handleConfirmation = (balance: number) => {
  
  setConfirmationData({
    amount: REQUIRED_CYAI,
    balance: balance,

  });
  setShowConfirmation(true);
};

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!name || !wallet_address) {
      toast.error("Please complete all required fields");
      return;
    }

    if (!walletProvider) {
      toast.error("Wallet provider not available. Please reconnect your wallet.");
      return;
    }
    try {
      const isAdmin = ADMIN_ADDRESSES.includes(wallet_address);
    
      if (!isAdmin) {
        const solBalance = await checkSOLBalance(wallet_address);
        if (solBalance < 0.01) {
          toast.error(`Insufficient SOL for gas fees. You need at least 0.01 SOL (Current: ${solBalance.toFixed(4)} SOL)`);
          return;
        }
  
        // Check balance first
        const balance = await checkCYAIBalance(wallet_address);
        setCyaiBalance(balance);
        
        if (balance < REQUIRED_CYAI) {
          toast.error(`Insufficient CYAI balance. Required: ${REQUIRED_CYAI.toLocaleString()}, Your balance: ${balance}`);
          return;
        }
  
        // Show confirmation only for non-admin users
        handleConfirmation(balance);
        return;
      }
     
      // // Continue with agent creation
      // const formData = new FormData();
      // const dockerUrl = clients.includes('telegram') || clients.includes('discord') 
      //   ? 'ghcr.io/netsepio/cyrene:main' 
      //   : 'ghcr.io/netsepio/cyrene:latest';
      
      // const settings = {
      //   secrets: {} as Record<string, string>,
      //   voice: { model: "en_US-male-medium" },
      //   docker_url: dockerUrl,
      // };

      // if (clients.includes('telegram') && telegramBotToken) {
      //   settings.secrets.TELEGRAM_BOT_TOKEN = telegramBotToken;
      // }
      // if (clients.includes('discord')) {
      //   if (discordAppId) settings.secrets.DISCORD_APPLICATION_ID = discordAppId;
      //   if (discordToken) settings.secrets.DISCORD_API_TOKEN = discordToken;
      // }

      // formData.append('wallet_address', wallet_address);
      // formData.append('character_file', JSON.stringify({
      //   name,
      //   clients,
      //   oneLiner,
      //   description,
      //   bio: characterInfo.bio.split("\n"),
      //   lore: characterInfo.lore.split("\n"),
      //   knowledge: characterInfo.knowledge.split("\n"),
      //   messageExamples: [[
      //     { user: "{{user1}}", content: { text: "What is your role?" } },
      //     { user: name, content: { text: "I am here to help you" } },
      //   ]],
      //   postExamples: [],
      //   topics: [],
      //   adjectives: [""],
      //   plugins: [],
      //   style: { all: [""], chat: [""], post: [""] },
      //   organization: "cyrene",
      //   settings,
      //   modelProvider: "openai",
      // }));

      // formData.append('avatar_img', avatarHash);
      // formData.append('cover_img', coverHash);
      // formData.append('voice_model', selectedVoice);
      // formData.append('domain', domain);

      // const response = await axios.post('/api/createAgent', formData, {
      //   headers: { 'Content-Type': 'multipart/form-data' },
      // });

      // toast.success("Agent Created Successfully!", {
      //   duration: 4000,
      //   action: {
      //     label: "Chat Now",
      //     onClick: () => router.push(`/explore-agents/chat/${response.data.agent.id}`),
      //   },
      // });

      // setTimeout(() => {
      //   router.push(`/explore-agents/chat/${response.data.agent.id}`);
      // }, 2000);
    }  catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error:', error.message);
        toast.error(`Operation failed: ${error.message}`);
      } else {
        console.error('Unknown error:', error);
        toast.error('An unknown error occurred');
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  // Validate agent name
  const isValidName = (name: string): boolean => {
    const nameRegex = /^[a-z0-9][a-z0-9.-]*$/;
    return nameRegex.test(name);
  };

  return (
    <div className="min-h-screen pt-32 text-white py-20">
      <StarCanvas />
      <div className="max-w-6xl mx-auto px-4">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl font-bold text-center bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-16"
        >
          Launch Your Agent
        </motion.h1>

        <form onSubmit={handleSubmit} className="space-y-24">
          {/* Basic Information Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-[rgba(33,37,52,0.5)] backdrop-blur-xl rounded-2xl p-10 border border-blue-500/20"
          >
            <h2 className="text-3xl font-semibold mb-10 relative">
              Basic Information
              <span className="absolute bottom-0 left-0 w-64 h-1 bg-gradient-to-r from-blue-500 to-purple-500"></span>
            </h2>

            <div className="space-y-8">
              <div>
                <Label className="text-lg mb-2 text-blue-300">Name</Label>
                <Input
                  placeholder="Agent Name"
                  className="bg-[rgba(33,37,52,0.7)] border-none ring-1 ring-blue-500/30 focus-visible:ring-2 focus-visible:ring-blue-500 transition-all"
                  value={name}
                  onChange={(e) => {
                    const newValue = e.target.value.toLowerCase();
                    if (newValue === '' || isValidName(newValue)) {
                      setName(newValue);
                    }
                  }}
                  onBlur={() => {
                    if (name && !isValidName(name)) {
                      toast.error("Name must start with a lowercase letter or number and can only contain lowercase letters, numbers, dots, and hyphens");
                    }
                  }}
                />
                <p className="text-sm text-blue-300/70 mt-2">
                  Must start with a lowercase letter or number. Can contain lowercase letters, numbers, dots, and hyphens.
                </p>
              </div>

              <div>
  <Label className="text-lg mb-2 text-blue-300">Wallet Address</Label>
  <Input
    value={wallet_address || "Not connected"}
    disabled
    className="bg-[rgba(33,37,52,0.7)] border-none ring-1 ring-blue-500/30 focus-visible:ring-2 focus-visible:ring-blue-500 transition-all"
  />
  {ADMIN_ADDRESSES.includes(wallet_address) && (
    <p className="text-sm text-green-500 mt-2">
      Admin account detected - no payment required
    </p>
  )}
  {!wallet_address && (
    <p className="text-sm text-red-500 mt-2">
      Please connect your wallet to proceed.
    </p>
  )}
</div>

              <div>
                <Label className="text-lg mb-2 text-blue-300">CYAI Balance</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={
                      isCheckingBalance ? "Checking..." :
                      cyaiBalance !== null ? `${cyaiBalance.toLocaleString()} CYAI` : 
                      wallet_address ? "Check balance" : "Connect wallet"
                    }
                    disabled
                    className="bg-[rgba(33,37,52,0.7)] border-none ring-1 ring-blue-500/30 flex-1"
                  />
                  {wallet_address && (
                    <GlowButton
                      type="button"
                      onClick={handleCheckBalance}
                      disabled={isCheckingBalance}
                      className="px-4 py-2"
                    >
                      {isCheckingBalance ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      ) : "Check"}
                    </GlowButton>
                  )}
                </div>
                <p className="text-sm text-blue-300/70 mt-2">
                  {REQUIRED_CYAI.toLocaleString()} CYAI required to launch an agent
                </p>
                {cyaiBalance !== null && cyaiBalance < REQUIRED_CYAI && (
                  <p className="text-sm text-red-500 mt-2">
                    Insufficient balance. You need {REQUIRED_CYAI.toLocaleString()} CYAI.
                  </p>
                )}
              </div>

              <div>
  
  <div>
  <Label className="text-lg mb-2 text-blue-300">SOL Balance (for gas fees)</Label>
  <div className="flex items-center gap-2">
    <Input
      value={solBalance !== null ? `${solBalance.toFixed(4)} SOL` : "Checking..."}
      disabled
      className="bg-[rgba(33,37,52,0.7)] border-none ring-1 ring-blue-500/30 flex-1"
    />
    <GlowButton
      type="button"
      onClick={async () => {
        const balance = await checkSOLBalance(wallet_address);
        setSolBalance(balance);
      }}
      className="px-4 py-2"
    >
      Refresh
    </GlowButton>
  </div>
 
</div>
  <p className="text-sm text-blue-300/70 mt-2">
    Minimum 0.01 SOL required for transactions
  </p>
  {solBalance !== null && solBalance < 0.01 && (
    <p className="text-sm text-red-500 mt-2">
      Add SOL to your wallet to pay for gas fees
    </p>
  )}
</div>

              <div>
                <Label className="text-lg mb-2 text-blue-300">Upload Images</Label>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-blue-300 mb-2">Avatar Image</p>
                    <div className="grid grid-cols-2 gap-4">
                      <label className="col-span-1 border-2 border-dashed p-4 flex flex-col items-center justify-center cursor-pointer bg-[rgba(33,37,52,0.7)] border-blue-500/30 rounded-xl hover:border-blue-500 transition-all group">
                        <Upload size={24} className="text-blue-400 group-hover:scale-110 transition-transform" />
                        <p className="mt-2 text-center text-sm">Upload Avatar</p>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileChange(e, 'avatar')}
                        />
                      </label>
                      <div className="border p-4 flex flex-col items-center justify-center bg-[rgba(33,37,52,0.7)] border-blue-500/30 rounded-xl">
                        {avatarPreview ? (
                          <Image src={avatarPreview} alt="Avatar Preview" width={64} height={64} className="rounded-lg shadow-lg" />
                        ) : (
                          <>
                            <LucidImage size={24} className="text-blue-400" />
                            <p className="mt-2 text-center text-sm text-blue-300/70">Preview</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-blue-300 mb-2">Cover Image</p>
                    <div className="grid grid-cols-2 gap-4">
                      <label className="col-span-1 border-2 border-dashed p-4 flex flex-col items-center justify-center cursor-pointer bg-[rgba(33,37,52,0.7)] border-blue-500/30 rounded-xl hover:border-blue-500 transition-all group">
                        <Upload size={24} className="text-blue-400 group-hover:scale-110 transition-transform" />
                        <p className="mt-2 text-center text-sm">Upload Cover</p>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileChange(e, 'cover')}
                        />
                      </label>
                      <div className="border p-4 flex flex-col items-center justify-center bg-[rgba(33,37,52,0.7)] border-blue-500/30 rounded-xl">
                        {coverPreview ? (
                          <Image src={coverPreview} alt="Cover Preview" width={64} height={64} className="rounded-lg shadow-lg" />
                        ) : (
                          <>
                            <LucidImage size={24} className="text-blue-400" />
                            <p className="mt-2 text-center text-sm text-blue-300/70">Preview</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-lg mb-2 text-blue-300">One Liner</Label>
                <Input
                  placeholder="Write agent one liner"
                  className="bg-[rgba(33,37,52,0.7)] border-none ring-1 ring-blue-500/30 focus-visible:ring-2 focus-visible:ring-blue-500 transition-all"
                  value={oneLiner}
                  onChange={(e) => setOneLiner(e.target.value)}
                />
                <p className="text-sm text-blue-300/70 mt-2">Max 90 characters with spaces</p>
              </div>

              <div>
                <Label className="text-lg mb-2 text-blue-300">Description</Label>
                <Textarea
                  placeholder="Write agent description"
                  className="bg-[rgba(33,37,52,0.7)] border-none ring-1 ring-blue-500/30 focus-visible:ring-2 focus-visible:ring-blue-500 transition-all min-h-32"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
                <p className="text-sm text-blue-300/70 mt-2">Max 300 characters with spaces</p>
              </div>

              <div>
                <Label className="text-lg mb-2 text-blue-300">Voice</Label>
                <div>
                  <div className="space-y-2">
                    {/* Voice Selection Dropdown */}
                    <Select
                      value={selectedVoice}
                      onValueChange={(value) => setSelectedVoice(value)}
                    >
                      <SelectTrigger className="bg-[rgba(33,37,52,0.7)] border-none ring-1 ring-blue-500/30 focus-visible:ring-2 focus-visible:ring-blue-500 transition-all">
                        <SelectValue placeholder="Select a voice" />
                      </SelectTrigger>
                      <SelectContent className="bg-[rgba(33,37,52,0.9)] border border-blue-500/30 backdrop-blur-xl text-white">
                        {voices.map((voice) => (
                          <SelectItem
                            key={voice.id}
                            value={voice.id}
                            className="hover:bg-blue-500/10 focus:bg-blue-500/10"
                          >
                            {voice.name} ({voice.gender})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Preview Button with Loader */}
                    <div className="flex justify-end mt-4 py-2">
                     
                      <GlowButton
                       type="button"
                       onClick={() => handlePreviewVoice(selectedVoice)}
                       className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-all flex items-center gap-2"
                       disabled={isLoadingPreview}
                      >
                            {isLoadingPreview ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        ) : (
                          "Preview Voice"
                        )}
                      </GlowButton>
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  <div>
    <Label className="text-lg mb-2 text-blue-300">Integrations</Label>
    <div className="space-y-2 ">
  <div className="flex items-center gap-2">
    <input
      type="checkbox"
      id="telegram-client"
      checked={clients.includes('telegram')}
      onChange={(e) => {
        if (e.target.checked) {
          setClients([...clients, 'telegram']);
        } else {
          setClients(clients.filter(c => c !== 'telegram'));
        }
      }}
      className={`h-4 w-4 accent-blue-500 rounded-md transition-shadow duration-300 
        ${clients.includes('telegram') ? 'shadow-blue-500 shadow-md' : ''}`}
    />
    <Label htmlFor="telegram-client">Telegram</Label>
  </div>
  <div className="flex items-center gap-2">
    <input
      type="checkbox"
      id="discord-client"
      checked={clients.includes('discord')}
      onChange={(e) => {
        if (e.target.checked) {
          setClients([...clients, 'discord']);
        } else {
          setClients(clients.filter(c => c !== 'discord'));
        }
      }}
      className={`h-4 w-4 accent-violet-500 rounded-md transition-shadow duration-300 
        ${clients.includes('discord') ? 'shadow-violet-500 shadow-md' : ''}`}
    />
    <Label htmlFor="discord-client">Discord</Label>
  </div>
</div>


  </div>

  {clients.includes('telegram') && (
    <div>
      <Label className="text-lg mb-2 text-blue-300">Telegram Bot Token</Label>
      <Input
        placeholder="Enter Telegram Bot Token"
        value={telegramBotToken}
        onChange={(e) => setTelegramBotToken(e.target.value)}
        className="bg-[rgba(33,37,52,0.7)] border-none ring-1 ring-blue-500/30 focus-visible:ring-2 focus-visible:ring-blue-500 transition-all"
      />
    </div>
  )}

  {clients.includes('discord') && (
    <>
      <div>
        <Label className="text-lg mb-2 text-blue-300">Discord Application ID</Label>
        <Input
          placeholder="Enter Discord App ID"
          value={discordAppId}
          onChange={(e) => setDiscordAppId(e.target.value)}
          className="bg-[rgba(33,37,52,0.7)] border-none ring-1 ring-blue-500/30 focus-visible:ring-2 focus-visible:ring-blue-500 transition-all"
        />
      </div>
      <div>
        <Label className="text-lg mb-2 text-blue-300">Discord Bot Token</Label>
        <Input
          placeholder="Enter Discord Bot Token"
          value={discordToken}
          onChange={(e) => setDiscordToken(e.target.value)}
          className="bg-[rgba(33,37,52,0.7)] border-none ring-1 ring-blue-500/30 focus-visible:ring-2 focus-visible:ring-blue-500 transition-all"
        />
      </div>
    </>
  )}
</div>
            </div>
          </motion.div>

          {/* Character Information Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-[rgba(33,37,52,0.5)] backdrop-blur-xl rounded-2xl p-10 border border-purple-500/20"
          >
            <h2 className="text-3xl font-semibold mb-10 relative">
              Character Information
              <span className="absolute bottom-0 left-0 w-80 h-1 bg-gradient-to-r from-blue-500 to-purple-500"></span>
            </h2>

            <div className="flex gap-4 mb-8">
              <div className="relative">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="character-file"
                />
                <GlowButton
                  type="button"
                  onClick={() => document.getElementById('character-file')?.click()}
                  className="inline-flex items-center justify-center gap-2 px-6 py-2 whitespace-nowrap"
                >
                  Upload Character File
                </GlowButton>
              </div>
              <GlowButton
                type="button"
                className="inline-flex items-center justify-center gap-2 px-6 py-2 whitespace-nowrap"
                onClick={handleGenerateWithAI}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>Generating...</span>
                  </div>
                ) : (
                  <span>Generate with AI</span>
                )}
              </GlowButton>
            </div>

            {['bio', 'lore', 'knowledge'].map((field) => (
              <div key={field} className="mb-10">
                <Label className="text-lg mb-2 text-purple-300 capitalize">{field}</Label>
                <Textarea
                  placeholder={`Add agent ${field}`}
                  value={characterInfo[field as keyof typeof characterInfo]}
                  onChange={(e) => setCharacterInfo(prev => ({
                    ...prev,
                    [field]: e.target.value
                  }))}
                  className="bg-[rgba(33,37,52,0.7)] border-none ring-1 ring-purple-500/30 focus-visible:ring-2 focus-visible:ring-purple-500 transition-all min-h-32"
                />
              </div>
            ))}
          </motion.div>

          <div className="flex justify-center">
            <GlowButton
              type="submit"
              disabled={isSubmitting || !wallet_address || (cyaiBalance !== null && cyaiBalance < REQUIRED_CYAI)}
              className="px-12 py-4 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  <span>Processing...</span>
                </div>
              ) : 'Launch Agent'}
            </GlowButton>
          </div>
        </form>
      </div>
      {showConfirmation && (
  <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
    <div className="bg-gradient-to-br from-blue-900 to-purple-900 rounded-xl p-6 max-w-md w-full border border-purple-500 shadow-lg shadow-purple-500/20">
      <div className="text-center mb-6">
        <Sparkles className="w-10 h-10 mx-auto text-yellow-400 mb-3" />
        <h3 className="text-2xl font-bold text-white mb-2">Confirm Transaction</h3>
        <p className="text-blue-200">You&apos;re about to launch your AI agent!</p>
      </div>

      <div className="space-y-4 mb-6">
        <div className="flex justify-between items-center">
          <span className="text-blue-300">Amount:</span>
          <span className="font-mono text-white">
            {confirmationData.amount.toLocaleString()} <span className="text-yellow-400">CYAI</span>
          </span>
        </div>
        
        {/* <div className="flex justify-between items-center">
          <span className="text-blue-300">USD Value:</span>
          <span className="font-mono text-white">
            ${confirmationData.usdValue.toFixed(6)}
          </span>
        </div> */}
        
        <div className="flex justify-between items-center">
          <span className="text-blue-300">Recipient:</span>
          <span className="font-mono text-purple-300 text-sm truncate max-w-[200px]">
            {TREASURY_ADDRESS}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-blue-300">Your Balance:</span>
          <span className={`font-mono ${confirmationData.balance >= confirmationData.amount ? 'text-green-400' : 'text-red-400'}`}>
            {confirmationData.balance.toLocaleString()} CYAI
          </span>
        </div>
      </div>

      <div className="bg-blue-900/50 border border-blue-700 rounded-lg p-3 mb-4 text-blue-200 text-sm">
        <p>Transaction fee: ~0.0001 SOL</p>
        {/* <p className="mt-1">1 CYAI = ${(0.00006113).toFixed(8)} USD</p> */}
      </div>

      <div className="flex gap-3 justify-center">
        <button
           onClick={() => {
            setShowConfirmation(false);
            setIsSubmitting(false); // Reset submitting state if cancelled
          }}
          className="px-5 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors text-white"
        >
          Cancel
        </button>
        <button
  onClick={async () => {
    setShowConfirmation(false);
    try {
      setIsSubmitting(true);
      toast.info('Please approve the transaction in your wallet...');

      // 1. First do the CYAI transfer
      const txid = await transferCYAI(wallet_address, walletProvider);
      toast.success(
        <div>
          <p>Payment successful!</p>
          <a 
            href={`https://solscan.io/tx/${txid}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="underline"
          >
            View transaction
          </a>
        </div>
      );

      // 2. Then create the agent
      const formData = new FormData();
      const dockerUrl = clients.includes('telegram') || clients.includes('discord') 
        ? 'ghcr.io/netsepio/cyrene:main' 
        : 'ghcr.io/netsepio/cyrene:latest';
      
      const settings = {
        secrets: {} as Record<string, string>,
        voice: { model: "en_US-male-medium" },
        docker_url: dockerUrl,
      };

      if (clients.includes('telegram') && telegramBotToken) {
        settings.secrets.TELEGRAM_BOT_TOKEN = telegramBotToken;
      }
      if (clients.includes('discord')) {
        if (discordAppId) settings.secrets.DISCORD_APPLICATION_ID = discordAppId;
        if (discordToken) settings.secrets.DISCORD_API_TOKEN = discordToken;
      }

      formData.append('wallet_address', wallet_address);
      formData.append('character_file', JSON.stringify({
        name,
        clients,
        oneLiner,
        description,
        bio: characterInfo.bio.split("\n"),
        lore: characterInfo.lore.split("\n"),
        knowledge: characterInfo.knowledge.split("\n"),
        messageExamples: [[
          { user: "{{user1}}", content: { text: "What is your role?" } },
          { user: name, content: { text: "I am here to help you" } },
        ]],
        postExamples: [],
        topics: [],
        adjectives: [""],
        plugins: [],
        style: { all: [""], chat: [""], post: [""] },
        organization: "cyrene",
        settings,
        modelProvider: "openai",
      }));

      formData.append('avatar_img', avatarHash);
      formData.append('cover_img', coverHash);
      formData.append('voice_model', selectedVoice);
      formData.append('domain', domain);

      const response = await axios.post('/api/createAgent', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success("Agent Created Successfully!", {
        duration: 4000,
        action: {
          label: "Chat Now",
          onClick: () => router.push(`/explore-agents/chat/${response.data.agent.id}`),
        },
      });

      setTimeout(() => {
        router.push(`/explore-agents/chat/${response.data.agent.id}`);
      }, 2000);

    } catch (error) {
      setIsSubmitting(false);
      if (error instanceof Error) {
        toast.error(`Transaction failed: ${error.message}`);
      } else {
        toast.error('Transaction failed');
      }
    }
  }}
  className="px-5 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white flex items-center gap-2"
>
  <FileUp className="w-4 h-4" />
  Confirm & Sign
</button>
      </div>
    </div>
  </div>
)}
    </div>

    
  );
}