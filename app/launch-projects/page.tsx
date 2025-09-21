// app/launch-projects/page.tsx - COMPLETE FIXED VERSION WITH AUTO-SAVE
'use client';

import { useCallback, useEffect, useState, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Loader2, Upload, TrendingUp, ExternalLink, ChevronDown, AlertCircle, 
  RefreshCw, DollarSign, Zap, Image as LucidImage, Ban, Settings, 
  Users, Globe, Github, FileText, Plus, X, User, Lightbulb, 
  Rocket, Coins, MapPin, Linkedin, Twitter,
  Instagram
} from 'lucide-react';
import { toast } from 'sonner';
import StarCanvas from '@/components/StarCanvas';
import ConnectButton from '@/components/common/ConnectBtn';
import { setupConfigWithWallet, QUOTE_MINTS, type QuoteMintType } from '@/helper/meteoraServices/createConfig';
import createPool from '@/helper/meteoraServices/createPool';
import { PublicKey, Transaction } from '@solana/web3.js';
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import type { Provider } from "@reown/appkit-adapter-solana/vue";
import { usePoolStatus } from '@/hooks/usePoolStatus';
import { DbcTradeModal } from '@/components/DbcTradeModal';
import { LaunchedTokensService } from '@/services/launchedTokensService';
import { ProjectIdeasService } from '@/services/projectIdeasService';
import { LaunchedTokenData, ProjectIdeaData, TeamMember, ProjectCategory, ProjectIndustry } from '@/lib/supabase';
import React from 'react';
import { Copy, Check } from 'lucide-react';
import Image from "next/image";
import axios from 'axios';
import { useSearchParams } from 'next/navigation';
import { FaXTwitter } from 'react-icons/fa6';

interface TokenLaunchParams {
  totalTokenSupply: number;
  migrationQuoteThreshold: number;
  quoteMint: QuoteMintType;
  name: string;
  symbol: string;
  image: string;
  description: string;
  firstBuyAmountSol: number;
  minimumTokensOut: number;
  enableFirstBuy: boolean;
  tradeStatus: boolean;
}

interface ProjectFormData {
  projectName: string;
  projectDescription: string;
  projectCategory: string;
  projectIndustry: string;
  projectImage: string;
  githubUrl: string;
  websiteUrl: string;
  whitepaperUrl: string;
  twitterUrl: string; // NEW
  instagramUrl: string; // NEW
  linkedinUrl: string; 
  teamMembers: TeamMember[];
  projectStage: 'ideation' | 'cooking';
  tokenName: string;
  tokenSymbol: string;
  totalTokenSupply: number;
  migrationQuoteThreshold: number;
  quoteMint: QuoteMintType;
  enableFirstBuy: boolean;
  firstBuyAmountSol: number;
  minimumTokensOut: number;
  tradeStatus: boolean;
}

interface PriceData {
  [key: string]: {
    usd: number;
  };
}

interface ConversionRate {
  solToUsd: number;
  cyaiToUsd: number;
  solToCyai: number;
  cyaiToSol: number;
}

interface WalletAdapter {
  publicKey: PublicKey | null;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
  isConnected: boolean;
}

const useReownWalletAdapter = () => {
  const { address, isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider<Provider>("solana");
  
  return {
    publicKey: address ? new PublicKey(address) : null,
    isConnected,
    signTransaction: async (transaction: Transaction) => {
      if (!walletProvider || !address) {
        throw new Error("Wallet not connected");
      }
      return await walletProvider.signTransaction(transaction);
    },
    signAllTransactions: async (transactions: Transaction[]) => {
      if (!walletProvider || !address) {
        throw new Error("Wallet not connected");
      }
      return await walletProvider.signAllTransactions(transactions);
    }
  };
};

export default function LaunchProjectsPage() {
  const searchParams = useSearchParams();
  const ideaId = searchParams.get('ideaId');
  
  const [activeTab, setActiveTab] = useState<'info' | 'team' | 'fundraise'>('info');
  const [projectData, setProjectData] = useState<ProjectFormData>({
    projectName: '',
    projectDescription: '',
    projectCategory: '',
    projectIndustry: '',
    projectImage: '',
    githubUrl: '',
    websiteUrl: '',
    whitepaperUrl: '',
    twitterUrl: '', // NEW
    instagramUrl: '', // NEW
    linkedinUrl: '',
    teamMembers: [],
    projectStage: 'ideation',
    tokenName: '',
    tokenSymbol: '',
    totalTokenSupply: 1000000000,
    migrationQuoteThreshold: 101,
    quoteMint: 'SOL' as QuoteMintType,
    enableFirstBuy: true,
    firstBuyAmountSol: 0.1,
    minimumTokensOut: 1000000,
    tradeStatus: true
  });
  
  // 🔥 NEW: Track original data for comparison
  const [originalProjectData, setOriginalProjectData] = useState<ProjectFormData | null>(null);
  
  const [existingIdeaId, setExistingIdeaId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingIdea, setIsLoadingIdea] = useState(false);
  const [categories, setCategories] = useState<ProjectCategory[]>([]);
  const [industries, setIndustries] = useState<ProjectIndustry[]>([]);
  const [conversionRates, setConversionRates] = useState<ConversionRate | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);
  const [launchedTokens, setLaunchedTokens] = useState<LaunchedTokenData[]>([]);
  const [projectIdeas, setProjectIdeas] = useState<ProjectIdeaData[]>([]);
  const [selectedToken, setSelectedToken] = useState<LaunchedTokenData | null>(null);
  const [showTradeModal, setShowTradeModal] = useState(false);
  
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageHash, setImageHash] = useState<string>('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  
  const [newTeamMember, setNewTeamMember] = useState<TeamMember>({
    name: '',
    role: '',
    walletAddress: '',
    linkedinUrl: '',
    twitterUrl: '',
    githubUrl: '',
    bio: '',
    profileImage: ''
  });
  const [showAddMember, setShowAddMember] = useState(false);

  const walletAdapter = useReownWalletAdapter();
  const { address, isConnected } = useAppKitAccount();

  // 🔥 BETTER: Track actual unsaved changes
  const hasRealUnsavedChanges = useMemo(() => {
    if (!existingIdeaId || !originalProjectData) return false;
    
    return (
      projectData.migrationQuoteThreshold !== originalProjectData.migrationQuoteThreshold ||
      projectData.totalTokenSupply !== originalProjectData.totalTokenSupply ||
      projectData.enableFirstBuy !== originalProjectData.enableFirstBuy ||
      projectData.firstBuyAmountSol !== originalProjectData.firstBuyAmountSol ||
      projectData.minimumTokensOut !== originalProjectData.minimumTokensOut ||
      projectData.quoteMint !== originalProjectData.quoteMint ||
      projectData.tokenName !== originalProjectData.tokenName ||
      projectData.tokenSymbol !== originalProjectData.tokenSymbol ||
      projectData.projectName !== originalProjectData.projectName ||
      projectData.projectDescription !== originalProjectData.projectDescription
    );
  }, [projectData, originalProjectData, existingIdeaId]);

  // Load existing project idea if ideaId is provided
  useEffect(() => {
    const loadExistingIdea = async () => {
      if (ideaId && address && isConnected) {
        setIsLoadingIdea(true);
        try {
          const existingIdea = await ProjectIdeasService.getProjectIdeaById(ideaId, address);
          if (existingIdea) {
            setExistingIdeaId(ideaId);
            
            const loadedData = {
              projectName: existingIdea.projectName,
              projectDescription: existingIdea.projectDescription,
              projectCategory: existingIdea.projectCategory,
              projectIndustry: existingIdea.projectIndustry,
              projectImage: existingIdea.projectImage || '',
              githubUrl: existingIdea.githubUrl || '',
              websiteUrl: existingIdea.websiteUrl || '',
              whitepaperUrl: existingIdea.whitepaperUrl || '',
              twitterUrl: existingIdea.twitterUrl || '', // NEW
              instagramUrl: existingIdea.instagramUrl || '', // NEW
              linkedinUrl: existingIdea.linkedinUrl || '',
              teamMembers: existingIdea.teamMembers,
              projectStage: 'cooking' as const,
              tokenName: existingIdea.tokenName || existingIdea.projectName,
              tokenSymbol: existingIdea.tokenSymbol || existingIdea.projectName.substring(0, 5).toUpperCase(),
              totalTokenSupply: existingIdea.totalTokenSupply,
              migrationQuoteThreshold: existingIdea.migrationQuoteThreshold,
              quoteMint: existingIdea.quoteMint as QuoteMintType,
              enableFirstBuy: existingIdea.enableFirstBuy,
              firstBuyAmountSol: existingIdea.firstBuyAmountSol,
              minimumTokensOut: existingIdea.minimumTokensOut,
              tradeStatus: existingIdea.tradeStatus
            };
            
            setProjectData(loadedData);
            setOriginalProjectData(loadedData); // 🔥 Store for comparison

            if (existingIdea.projectImage) {
              setImagePreview(existingIdea.projectImage);
            }

            if (existingIdea.projectStage === 'ideation') {
              setActiveTab('fundraise');
            }
            
            toast.success('Project data loaded successfully!');
          } else {
            toast.error('Project idea not found');
          }
        } catch (error) {
          console.error('Error loading project idea:', error);
          toast.error('Failed to load project idea');
        } finally {
          setIsLoadingIdea(false);
        }
      }
    };

    loadExistingIdea();
  }, [ideaId, address, isConnected]);

  // Load categories and industries on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [categoriesData, industriesData] = await Promise.all([
          ProjectIdeasService.getProjectCategories(),
          ProjectIdeasService.getProjectIndustries()
        ]);
        setCategories(categoriesData);
        setIndustries(industriesData);
      } catch (error) {
        console.error('Error loading categories/industries:', error);
        toast.error('Failed to load form data');
      }
    };

    loadData();
  }, []);

  // Load user's projects when wallet connects
  useEffect(() => {
    if (address && isConnected) {
      loadUserProjects();
    }
  }, [address, isConnected]);

  const loadUserProjects = async () => {
    if (!address) return;
    
    try {
      const [tokens, ideas] = await Promise.all([
        LaunchedTokensService.getLaunchedTokens(address),
        ProjectIdeasService.getProjectIdeas(address)
      ]);
      
      setLaunchedTokens(tokens);
      setProjectIdeas(ideas);
    } catch (error) {
      console.error('Error loading user projects:', error);
      toast.error('Failed to load your projects');
    }
  };

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
      return response.data.file.cid;
    } catch (error) {
      console.error('IPFS upload error:', error);
      toast.error('Failed to upload image to IPFS');
      throw error;
    }
  };

  // Handle image file change
  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast.error('Image size must be less than 10MB');
        return;
      }

      setIsUploadingImage(true);
      
      try {
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);

        const hash = await uploadToIPFS(file);
        setImageHash(hash);
        
        const ipfsUrl = `https://ipfs.erebrus.io/ipfs/${hash}`;
        setProjectData(prev => ({
          ...prev,
          projectImage: ipfsUrl
        }));
        
        toast.success('Image uploaded successfully to IPFS');
      } catch (error) {
        toast.error('Failed to upload image');
        setImagePreview(null);
        setImageHash('');
      } finally {
        setIsUploadingImage(false);
      }
    }
  };

  const numberToWords = (num: number) => {
    if (num === 0) return 'Zero';
    
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
                  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
                  'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const scales = ['', 'Thousand', 'Million', 'Billion', 'Trillion'];
  
    const convertHundreds = (n: number) => {
      let result = '';
      if (n >= 100) {
        result += ones[Math.floor(n / 100)] + ' Hundred';
        n %= 100;
        if (n > 0) result += ' ';
      }
      if (n >= 20) {
        result += tens[Math.floor(n / 10)];
        n %= 10;
        if (n > 0) result += '-' + ones[n];
      } else if (n > 0) {
        result += ones[n];
      }
      return result;
    };
  
    let result = '';
    let scaleIndex = 0;
    while (num > 0) {
      const chunk = num % 1000;
      if (chunk !== 0) {
        const chunkWords = convertHundreds(chunk);
        result = chunkWords + (scales[scaleIndex] ? ' ' + scales[scaleIndex] : '') + (result ? ' ' + result : '');
      }
      num = Math.floor(num / 1000);
      scaleIndex++;
    }
    return result || 'Zero';
  };
  
  const formatWithCommas = (num : number) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  // Handle project info changes
  const handleProjectInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setProjectData(prev => ({
      ...prev,
      [name]: type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked
        : (name === 'totalTokenSupply' || name === 'migrationQuoteThreshold' || name === 'firstBuyAmountSol' || name === 'minimumTokensOut')
          ? Number(value)
          : value
    }));
  };

  // Handle team member changes
  const handleTeamMemberChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewTeamMember(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Add team member
  const addTeamMember = () => {
    if (!newTeamMember.name || !newTeamMember.role || !newTeamMember.walletAddress) {
      toast.error('Please fill in required fields (Name, Role, Wallet Address)');
      return;
    }

    setProjectData(prev => ({
      ...prev,
      teamMembers: [...prev.teamMembers, { ...newTeamMember }]
    }));

    setNewTeamMember({
      name: '',
      role: '',
      walletAddress: '',
      linkedinUrl: '',
      twitterUrl: '',
      githubUrl: '',
      bio: '',
      profileImage: ''
    });
    setShowAddMember(false);
    toast.success('Team member added successfully');
  };

  // Remove team member
  const removeTeamMember = (index: number) => {
    setProjectData(prev => ({
      ...prev,
      teamMembers: prev.teamMembers.filter((_, i) => i !== index)
    }));
    toast.success('Team member removed');
  };

  // Handle project stage change
  const handleStageChange = (stage: 'ideation' | 'cooking') => {
    setProjectData((prev) => ({
      ...prev,
      projectStage: stage
    }));
    
    if (stage === 'cooking') {
      setProjectData((prev) => ({
        ...prev,
        tokenName: prev.tokenName || prev.projectName,
        tokenSymbol: prev.tokenSymbol || prev.projectName.substring(0, 5).toUpperCase()
      }));
    }
  };

  // Save project (for ideation or cooking stage)
  const saveProject = async () => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!projectData.projectName || !projectData.projectDescription || 
        !projectData.projectCategory || !projectData.projectIndustry) {
      toast.error('Please fill in all required project information');
      return;
    }

    if (projectData.teamMembers.length === 0) {
      toast.error('Please add at least one team member');
      return;
    }

    if (projectData.projectStage === 'cooking') {
      if (!projectData.tokenName || !projectData.tokenSymbol) {
        toast.error('Please fill in token details for cooking stage');
        return;
      }
    }

    setIsSaving(true);
    
    try {
      const ideaData: ProjectIdeaData = {
        projectName: projectData.projectName,
        projectDescription: projectData.projectDescription,
        projectCategory: projectData.projectCategory,
        projectIndustry: projectData.projectIndustry,
        projectImage: projectData.projectImage,
        githubUrl: projectData.githubUrl,
        websiteUrl: projectData.websiteUrl,
        whitepaperUrl: projectData.whitepaperUrl,
        projectStage: projectData.projectStage,
        teamMembers: projectData.teamMembers,
        tokenName: projectData.tokenName,
        tokenSymbol: projectData.tokenSymbol,
        totalTokenSupply: projectData.totalTokenSupply,
        migrationQuoteThreshold: projectData.migrationQuoteThreshold,
        quoteMint: projectData.quoteMint,
        enableFirstBuy: projectData.enableFirstBuy,
        firstBuyAmountSol: projectData.firstBuyAmountSol,
        minimumTokensOut: projectData.minimumTokensOut,
        tradeStatus: projectData.tradeStatus,
        isLaunched: false
      };

      let savedIdea: ProjectIdeaData;

      if (existingIdeaId) {
        const updatedIdea = await ProjectIdeasService.updateProjectIdea(existingIdeaId, address, ideaData);
        if (!updatedIdea) {
          throw new Error('Failed to update project idea');
        }
        savedIdea = updatedIdea;
        toast.success('Project updated successfully!');
        
        // 🔥 UPDATE: Reset original data after save
        setOriginalProjectData({ ...projectData });
      } else {
        savedIdea = await ProjectIdeasService.saveProjectIdea(ideaData, address);
        setExistingIdeaId(savedIdea.id!);
        toast.success('Project idea saved!');
        setOriginalProjectData({ ...projectData });
      }
      
      setProjectIdeas(prev => {
        const filtered = prev.filter(p => p.id !== savedIdea.id);
        return [savedIdea, ...filtered];
      });
      
      if (projectData.projectStage === 'ideation') {
        resetForm();
      } else {
        setActiveTab('fundraise');
      }
      
    } catch (error) {
      console.error('Error saving project:', error);
      toast.error('Failed to save project');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setProjectData({
      projectName: '',
      projectDescription: '',
      projectCategory: '',
      projectIndustry: '',
      projectImage: '',
      githubUrl: '',
      websiteUrl: '',
      whitepaperUrl: '',
      twitterUrl: '', // NEW
      instagramUrl: '', // NEW
      linkedinUrl: '',
      teamMembers: [],
      projectStage: 'ideation',
      tokenName: '',
      tokenSymbol: '',
      totalTokenSupply: 1000000000,
      migrationQuoteThreshold: 210,
      quoteMint: 'SOL' as QuoteMintType,
      enableFirstBuy: true,
      firstBuyAmountSol: 0.1,
      minimumTokensOut: 1000000,
      tradeStatus: true
    });
    setImagePreview(null);
    setImageHash('');
    setExistingIdeaId(null);
    setOriginalProjectData(null);
    setActiveTab('info');
  };

  // 🔥 FIXED: Launch token with auto-save
  const launchToken = async () => {
    if (!walletAdapter.publicKey || !walletAdapter.isConnected || !address) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (projectData.projectStage !== 'cooking') {
      toast.error('You can only launch tokens in cooking stage');
      return;
    }

    if (!projectData.tokenName || !projectData.tokenSymbol || !projectData.projectImage) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!existingIdeaId) {
      toast.error('Please save the project first');
      return;
    }

    setIsLoading(true);
    
    try {
      // 🔥 AUTO-SAVE CHANGES BEFORE LAUNCH
      if (hasRealUnsavedChanges) {
        toast.info('Saving latest changes...');
        
        const ideaData: ProjectIdeaData = {
          projectName: projectData.projectName,
          projectDescription: projectData.projectDescription,
          projectCategory: projectData.projectCategory,
          projectIndustry: projectData.projectIndustry,
          projectImage: projectData.projectImage,
          githubUrl: projectData.githubUrl,
          websiteUrl: projectData.websiteUrl,
          whitepaperUrl: projectData.whitepaperUrl,
          projectStage: projectData.projectStage,
          teamMembers: projectData.teamMembers,
          tokenName: projectData.tokenName,
          tokenSymbol: projectData.tokenSymbol,
          totalTokenSupply: projectData.totalTokenSupply,
          migrationQuoteThreshold: projectData.migrationQuoteThreshold, // 🎯 Current form value
          quoteMint: projectData.quoteMint,
          enableFirstBuy: projectData.enableFirstBuy,
          firstBuyAmountSol: projectData.firstBuyAmountSol,
          minimumTokensOut: projectData.minimumTokensOut,
          tradeStatus: projectData.tradeStatus,
          isLaunched: false
        };

        await ProjectIdeasService.updateProjectIdea(existingIdeaId, address, ideaData);
        setOriginalProjectData({ ...projectData }); // Reset tracking
        toast.success('Changes saved!');
      }
      
      toast.info('Setting up configuration...');
      const configResult = await setupConfigWithWallet(walletAdapter, {
        totalTokenSupply: projectData.totalTokenSupply,
        migrationQuoteThreshold: projectData.migrationQuoteThreshold, // 🎯 Uses current form value
        quoteMint: projectData.quoteMint
      });
      
      if (!configResult.success || !configResult.configAddress) {
        throw new Error(configResult.error || 'Failed to create config');
      }

      toast.info('Creating token pool with first buy...');

      const poolResult = await createPool({
        configAddress: configResult.configAddress,
        name: projectData.tokenName,
        symbol: projectData.tokenSymbol,
        image: projectData.projectImage,
        description: projectData.projectDescription,
        firstBuyAmountSol: projectData.enableFirstBuy ? projectData.firstBuyAmountSol : undefined,
        minimumTokensOut: projectData.enableFirstBuy ? projectData.minimumTokensOut : undefined
      }, walletAdapter);

      if (!poolResult.success) {
        throw new Error(poolResult.error || 'Failed to create pool');
      }

      const tokenData: LaunchedTokenData = {
        contractAddress: poolResult.contractAddress || '',
        dbcPoolAddress: poolResult.dbcPoolAddress || '',
        configAddress: configResult.configAddress,
        quoteMint: projectData.quoteMint,
        tokenName: projectData.tokenName,
        tokenSymbol: projectData.tokenSymbol,
        metadataUri: poolResult.metadataUri,
        tradeStatus: projectData.tradeStatus,
        isHidden: false,
        launchedAt: Date.now(),
        projectIdeaId: existingIdeaId
      };

      const savedToken = await LaunchedTokensService.launchTokenFromProjectIdea(
        existingIdeaId,
        address,
        tokenData
      );
      
      setLaunchedTokens(prev => [savedToken, ...prev]);
      await loadUserProjects();
      
      toast.success('Token launched successfully with latest settings!');
      window.location.href = '/dashboard/agents?tab=tokens';
      
    } catch (error) {
      console.error('Token launch error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to launch token';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch real-time prices
  useEffect(() => {
    const fetchPrices = async () => {
      setPriceLoading(true);
      try {
        const response = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd'
        );
        const data: PriceData = await response.json();
        
        const cyaiPrice = 0.05;
        const solPrice = data.solana?.usd || 0;
        
        setConversionRates({
          solToUsd: solPrice,
          cyaiToUsd: cyaiPrice,
          solToCyai: solPrice > 0 && cyaiPrice > 0 ? solPrice / cyaiPrice : 0,
          cyaiToSol: solPrice > 0 && cyaiPrice > 0 ? cyaiPrice / solPrice : 0
        });
      } catch (error) {
        console.error('Error fetching prices:', error);
        setConversionRates({
          solToUsd: 250,
          cyaiToUsd: 0.05,
          solToCyai: 5000,
          cyaiToSol: 0.0002
        });
      } finally {
        setPriceLoading(false);
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);
  }, []);

  const calculateFirstBuyValue = () => {
    if (!conversionRates) return '$0.00';
    return `$${(projectData.firstBuyAmountSol * conversionRates.solToUsd).toFixed(2)}`;
  };

  if (!isConnected) {
    return (
      <>
        <div className="fixed inset-0 w-full h-full -z-20">
          <Image
            src="/abstract-luxury-gradient-blue-background-smooth-dark-blue-with-black-vignette-studio-banner 2 (1).png"
            alt="Background"
            fill
            className="object-cover"
            priority
          />
        </div>

        <StarCanvas/>
        <div className="flex flex-col items-center justify-center min-h-[60vh] pt-20">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-white">Connect your wallet</h2>
            <p className="text-gray-400">
              Please connect your wallet to launch tokens
            </p>
            <div className='px-20 py-3 ml-4'>
              <ConnectButton/>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (isLoadingIdea) {
    return (
      <>
        <StarCanvas/>
        <div className="flex flex-col items-center justify-center min-h-[60vh] pt-20">
          <div className="text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400 mx-auto" />
            <h2 className="text-2xl font-bold text-white">Loading Project</h2>
            <p className="text-gray-400">
              Loading your project data...
            </p>
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
    
      <div className="min-h-screen text-white py-20 px-4 mt-24">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">
              {existingIdeaId ? 'Launch Your Project' : 'Launch Your Project'}
            </h1>
            <p className="text-gray-400">
              {existingIdeaId ? 'Continue with your project and launch your token' : 'Build the future of Web3 with our comprehensive launch platform'}
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center space-x-4">
              <div className={`flex items-center space-x-2 ${activeTab === 'info' ? 'text-blue-400' : 'text-green-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                  activeTab === 'info' ? 'border-blue-400 bg-blue-400/20' : 'border-green-400 bg-green-400/20'
                }`}>
                  {activeTab === 'info' ? '1' : <Check className="w-4 h-4" />}
                </div>
                <span className="font-medium">Project Info</span>
              </div>
              
              <div className="w-12 h-0.5 bg-gray-600"></div>
              
              <div className={`flex items-center space-x-2 ${
                activeTab === 'team' ? 'text-blue-400' : 
                activeTab === 'fundraise' ? 'text-green-400' : 
                'text-gray-400'
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                  activeTab === 'team' ? 'border-blue-400 bg-blue-400/20' : 
                  activeTab === 'fundraise' ? 'border-green-400 bg-green-400/20' : 
                  'border-gray-400'
                }`}>
                  {activeTab === 'fundraise' ? <Check className="w-4 h-4" /> : '2'}
                </div>
                <span className="font-medium">Team Details</span>
              </div>
              
              {(projectData.projectStage === 'cooking' || existingIdeaId) && (
                <>
                  <div className="w-12 h-0.5 bg-gray-600"></div>
                  
                  <div className={`flex items-center space-x-2 ${activeTab === 'fundraise' ? 'text-blue-400' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                      activeTab === 'fundraise' ? 'border-blue-400 bg-blue-400/20' : 'border-gray-400'
                    }`}>
                      3
                    </div>
                    <span className="font-medium">Fundraise</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex justify-center mb-8">
            <div className="flex bg-gray-800/50 rounded-full p-1">
              <button
                onClick={() => setActiveTab('info')}
                className={`px-6 py-3 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                  activeTab === 'info'
                    ? 'bg-white text-black'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Lightbulb className="w-4 h-4" />
                Project Info
              </button>
              <button
                onClick={() => setActiveTab('team')}
                className={`px-6 py-3 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                  activeTab === 'team'
                    ? 'bg-white text-black'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Users className="w-4 h-4" />
                Team Details
              </button>
              {(projectData.projectStage === 'cooking' || existingIdeaId) && (
                <button
                  onClick={() => setActiveTab('fundraise')}
                  className={`px-6 py-3 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                    activeTab === 'fundraise'
                      ? 'bg-white text-black'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Rocket className="w-4 h-4" />
                  Fundraise
                </button>
              )}
            </div>
          </div>

          {/* Tab Content */}
          <div className="bg-gray-900/50 rounded-2xl p-8 border border-gray-700">
            {activeTab === 'info' && (
              <ProjectInfoTab
                projectData={projectData}
                categories={categories}
                industries={industries}
                onProjectInfoChange={handleProjectInfoChange}
                onImageChange={handleImageChange}
                imagePreview={imagePreview}
                isUploadingImage={isUploadingImage}
              />
            )}

            {activeTab === 'team' && (
              <TeamDetailsTab
                projectData={projectData}
                newTeamMember={newTeamMember}
                showAddMember={showAddMember}
                onStageChange={handleStageChange}
                onTeamMemberChange={handleTeamMemberChange}
                onAddTeamMember={addTeamMember}
                onRemoveTeamMember={removeTeamMember}
                setShowAddMember={setShowAddMember}
                onSaveProject={saveProject}
                isSaving={isSaving}
                isExistingIdea={!!existingIdeaId}
              />
            )}

            {activeTab === 'fundraise' && (projectData.projectStage === 'cooking' || existingIdeaId) && (
              <FundraiseTab
                projectData={projectData}
                conversionRates={conversionRates}
                onProjectInfoChange={handleProjectInfoChange}
                onLaunchToken={launchToken}
                isLoading={isLoading}
                calculateFirstBuyValue={calculateFirstBuyValue}
                hasUnsavedChanges={hasRealUnsavedChanges} // 🔥 Use better tracking
                onSaveProject={saveProject}
                isSaving={isSaving}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// Project Info Tab Component
interface ProjectInfoTabProps {
  projectData: ProjectFormData;
  categories: ProjectCategory[];
  industries: ProjectIndustry[];
  onProjectInfoChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  imagePreview: string | null;
  isUploadingImage: boolean;
}

const ProjectInfoTab: React.FC<ProjectInfoTabProps> = ({
  projectData,
  categories,
  industries,
  onProjectInfoChange,
  onImageChange,
  imagePreview,
  isUploadingImage
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Project Information</h2>
        <p className="text-gray-400">Tell us about your project vision and goals</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">
            Project Name *
          </label>
          <input
            type="text"
            name="projectName"
            value={projectData.projectName}
            onChange={onProjectInfoChange}
            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            placeholder="Enter your project name"
            required
          />
        </div>

        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">
            Project Category *
          </label>
          <select
            name="projectCategory"
            value={projectData.projectCategory}
            onChange={onProjectInfoChange}
            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
            required
          >
            <option value="">Select category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.name}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-gray-300 text-sm font-medium mb-2">
          Industry *
        </label>
        <select
          name="projectIndustry"
          value={projectData.projectIndustry}
          onChange={onProjectInfoChange}
          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
          required
        >
          <option value="">Select industry</option>
          {industries.map((industry) => (
            <option key={industry.id} value={industry.name}>
              {industry.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-gray-300 text-sm font-medium mb-2">
          Project Description *
        </label>
        <textarea
          name="projectDescription"
          value={projectData.projectDescription}
          onChange={onProjectInfoChange}
          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 min-h-[120px] resize-y"
          placeholder="Describe your project, its purpose, and unique value proposition..."
          required
          maxLength={5000}
        />
        <div className="text-right text-xs text-gray-500 mt-1">
          {projectData.projectDescription.length}/5000 characters
        </div>
      </div>

      <div>
        <label className="block text-gray-300 text-sm font-medium mb-2">
          Project Image
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block border-2 border-dashed border-gray-600 rounded-xl p-6 cursor-pointer hover:border-blue-500 transition-all group">
              <div className="text-center">
                {isUploadingImage ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                    <span className="text-sm text-blue-300">Uploading to IPFS...</span>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400 group-hover:text-blue-400 transition-colors" />
                    <p className="text-sm text-gray-400 group-hover:text-white">
                      Click to upload image
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PNG, JPG, GIF up to 10MB
                    </p>
                  </>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={onImageChange}
                className="hidden"
                disabled={isUploadingImage}
              />
            </label>
          </div>
          
          <div className="border border-gray-600 rounded-xl p-6 flex items-center justify-center bg-gray-800/50">
            {imagePreview ? (
              <div className="text-center">
                <Image
                  src={imagePreview}
                  alt="Project Preview"
                  width={120}
                  height={120}
                  className="rounded-lg mx-auto mb-2 object-cover"
                />
                <p className="text-xs text-green-400">✓ Uploaded to IPFS</p>
              </div>
            ) : (
              <div className="text-center text-gray-500">
                <LucidImage className="w-12 h-12 mx-auto mb-2" />
                <p className="text-sm">Image preview</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">
            <Github className="w-4 h-4 inline mr-1" />
            GitHub URL
          </label>
          <input
            type="url"
            name="githubUrl"
            value={projectData.githubUrl}
            onChange={onProjectInfoChange}
            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            placeholder="https://github.com/..."
          />
        </div>

        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">
            <Globe className="w-4 h-4 inline mr-1" />
            Website URL
          </label>
          <input
            type="url"
            name="websiteUrl"
            value={projectData.websiteUrl}
            onChange={onProjectInfoChange}
            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            placeholder="https://yourproject.com"
          />
        </div>

        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">
            <FileText className="w-4 h-4 inline mr-1" />
            Docs / Whitepaper URL
          </label>
          <input
            type="url"
            name="whitepaperUrl"
            value={projectData.whitepaperUrl}
            onChange={onProjectInfoChange}
            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            placeholder="https://docs.yourproject.com"
          />
        </div>
        <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              <FaXTwitter className="w-4 h-4 inline mr-1" />
              Twitter/X URL
            </label>
            <input
              type="url"
              name="twitterUrl"
              value={projectData.twitterUrl}
              onChange={onProjectInfoChange}
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              placeholder="https://twitter.com/..."
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              <Instagram className="w-4 h-4 inline mr-1" />
              Instagram URL
            </label>
            <input
              type="url"
              name="instagramUrl"
              value={projectData.instagramUrl}
              onChange={onProjectInfoChange}
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              placeholder="https://instagram.com/..."
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              <Linkedin className="w-4 h-4 inline mr-1" />
              LinkedIn URL
            </label>
            <input
              type="url"
              name="linkedinUrl"
              value={projectData.linkedinUrl}
              onChange={onProjectInfoChange}
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              placeholder="https://linkedin.com/company/..."
            />
          </div>
      </div>
    </motion.div>
  );
};

// Team Details Tab Component
interface TeamDetailsTabProps {
  projectData: ProjectFormData;
  newTeamMember: TeamMember;
  showAddMember: boolean;
  onStageChange: (stage: 'ideation' | 'cooking') => void;
  onTeamMemberChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onAddTeamMember: () => void;
  onRemoveTeamMember: (index: number) => void;
  setShowAddMember: (show: boolean) => void;
  onSaveProject: () => void;
  isSaving: boolean;
  isExistingIdea: boolean;
}

const TeamDetailsTab: React.FC<TeamDetailsTabProps> = ({
  projectData,
  newTeamMember,
  showAddMember,
  onStageChange,
  onTeamMemberChange,
  onAddTeamMember,
  onRemoveTeamMember,
  setShowAddMember,
  onSaveProject,
  isSaving,
  isExistingIdea
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Team Details</h2>
        <p className="text-gray-400">Add your team members and set project stage</p>
      </div>

      {!isExistingIdea && (
        <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Project Stage</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => onStageChange('ideation')}
              className={`p-4 rounded-lg border transition-all text-left ${
                projectData.projectStage === 'ideation'
                  ? 'border-blue-500 bg-blue-500/20'
                  : 'border-gray-600 hover:border-gray-500'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <Lightbulb className="w-6 h-6 text-yellow-400" />
                <h4 className="font-semibold text-white">Ideation</h4>
              </div>
              <p className="text-sm text-gray-300">
                Project is in early stages. Save your idea and launch token later.
              </p>
            </button>

            <button
              onClick={() => onStageChange('cooking')}
              className={`p-4 rounded-lg border transition-all text-left ${
                projectData.projectStage === 'cooking'
                  ? 'border-green-500 bg-green-500/20'
                  : 'border-gray-600 hover:border-gray-500'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <Rocket className="w-6 h-6 text-green-400" />
                <h4 className="font-semibold text-white">Cooking</h4>
              </div>
              <p className="text-sm text-gray-300">
                Ready to launch! Has traffic and ready for token launch.
              </p>
            </button>
          </div>
        </div>
      )}

      {isExistingIdea && (
        <div className="bg-gradient-to-r from-green-600/20 to-blue-600/20 border border-green-500/30 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <Rocket className="w-6 h-6 text-green-400" />
            <div>
              <h3 className="text-lg font-semibold text-white">Project Stage: Cooking</h3>
              <p className="text-gray-400">This project is ready for token launch</p>
            </div>
          </div>
        </div>
      )}

      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">Team Members</h3>
          <button
            onClick={() => setShowAddMember(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Member
          </button>
        </div>

        {projectData.teamMembers.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {projectData.teamMembers.map((member, index) => (
              <div key={index} className="bg-gray-800/50 rounded-lg p-4 border border-gray-600">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold text-white">{member.name}</h4>
                    <p className="text-sm text-blue-400">{member.role}</p>
                  </div>
                  <button
                    onClick={() => onRemoveTeamMember(index)}
                    className="text-red-400 hover:text-red-300 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-gray-400 font-mono mb-2">
                  {member.walletAddress.slice(0, 8)}...{member.walletAddress.slice(-4)}
                </p>
                {member.bio && (
                  <p className="text-sm text-gray-300">{member.bio}</p>
                )}
                <div className="flex gap-2 mt-2">
                  {member.linkedinUrl && (
                    <a href={member.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                      <Linkedin className="w-4 h-4" />
                    </a>
                  )}
                  {member.twitterUrl && (
                    <a href={member.twitterUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                      <FaXTwitter className="w-4 h-4" />
                    </a>
                  )}
                  {member.githubUrl && (
                    <a href={member.githubUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                      <Github className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {showAddMember && (
          <div className="bg-gray-800/30 rounded-lg p-6 border border-gray-600 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-semibold text-white">Add Team Member</h4>
              <button
                onClick={() => setShowAddMember(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={newTeamMember.name}
                  onChange={onTeamMemberChange}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  placeholder="Enter name"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Role *
                </label>
                <input
                  type="text"
                  name="role"
                  value={newTeamMember.role}
                  onChange={onTeamMemberChange}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  placeholder="e.g., Developer, Designer, Marketing"
                  required
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Wallet Address *
              </label>
              <input
                type="text"
                name="walletAddress"
                value={newTeamMember.walletAddress}
                onChange={onTeamMemberChange}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 font-mono"
                placeholder="Enter Solana wallet address"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  LinkedIn URL
                </label>
                <input
                  type="url"
                  name="linkedinUrl"
                  value={newTeamMember.linkedinUrl}
                  onChange={onTeamMemberChange}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  placeholder="https://linkedin.com/in/..."
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Twitter URL
                </label>
                <input
                  type="url"
                  name="twitterUrl"
                  value={newTeamMember.twitterUrl}
                  onChange={onTeamMemberChange}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  placeholder="https://twitter.com/..."
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  GitHub URL
                </label>
                <input
                  type="url"
                  name="githubUrl"
                  value={newTeamMember.githubUrl}
                  onChange={onTeamMemberChange}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  placeholder="https://github.com/..."
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Bio
              </label>
              <textarea
                name="bio"
                value={newTeamMember.bio}
                onChange={onTeamMemberChange}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 min-h-[80px] resize-y"
                placeholder="Brief description of experience and role..."
                maxLength={500}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={onAddTeamMember}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
              >
                Add Member
              </button>
              <button
                onClick={() => setShowAddMember(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {projectData.teamMembers.length === 0 && !showAddMember && (
          <div className="text-center py-8 bg-gray-800/30 rounded-lg border border-gray-600">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-500" />
            <p className="text-gray-400 mb-3">No team members added yet</p>
            <button
              onClick={() => setShowAddMember(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Add First Member
            </button>
          </div>
        )}
      </div>

      <div className="flex justify-end pt-6 border-t border-gray-600">
        <button
          onClick={onSaveProject}
          disabled={isSaving || projectData.teamMembers.length === 0}
          className="px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all"
        >
          {isSaving ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </div>
          ) : isExistingIdea ? (
            'Update Project'
          ) : (
            `Save ${projectData.projectStage === 'ideation' ? 'Project Idea' : 'Project & Continue'}`
          )}
        </button>
      </div>
    </motion.div>
  );
};

// Fundraise Tab Component - FIXED
// Complete Fixed FundraiseTab Component
interface FundraiseTabProps {
  projectData: ProjectFormData;
  conversionRates: ConversionRate | null;
  onProjectInfoChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onLaunchToken: () => void;
  isLoading: boolean;
  calculateFirstBuyValue: () => string;
  hasUnsavedChanges: boolean;
  onSaveProject: () => void;
  isSaving: boolean;
}

const FundraiseTab: React.FC<FundraiseTabProps> = ({
  projectData,
  conversionRates,
  onProjectInfoChange,
  onLaunchToken,
  isLoading,
  calculateFirstBuyValue,
  hasUnsavedChanges,
  onSaveProject,
  isSaving
}) => {
  // FIXED: Simply pass the event through - parent handles checkbox logic correctly
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    onProjectInfoChange(e);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Launch Your Token</h2>
        <p className="text-gray-400">Configure and launch your project token</p>
      </div>

      {/* Show warning if there are unsaved changes */}
      {hasUnsavedChanges && (
        <div className="bg-yellow-600/20 border border-yellow-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-400" />
            <div>
              <h4 className="font-semibold text-yellow-300">Unsaved Changes Detected</h4>
              <p className="text-sm text-yellow-200">Your changes will be automatically saved before launch</p>
            </div>
          </div>
        </div>
      )}

      {/* Token Information */}
      <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Token Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Token Name *
            </label>
            <input
              type="text"
              name="tokenName"
              value={projectData.tokenName}
              onChange={handleInputChange}
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Token Symbol *
            </label>
            <input
              type="text"
              name="tokenSymbol"
              value={projectData.tokenSymbol}
              onChange={handleInputChange}
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 uppercase"
              required
              maxLength={10}
            />
          </div>
        </div>
      </div>

      {/* Bot Protection Section - FIXED CHECKBOX */}
      <div className="bg-gradient-to-r from-cyan-600/20 to-purple-600/20 border border-cyan-500/30 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Zap className="w-6 h-6 text-cyan-400" />
          <h3 className="text-lg font-semibold text-white">Bot Protection</h3>
          <div className="px-2 py-1 bg-cyan-600 text-cyan-100 rounded text-xs font-medium">
            RECOMMENDED
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-start gap-4 p-4 bg-gray-800/50 rounded-lg border border-gray-600">
            <div className="relative">
              <input
                type="checkbox"
                id="enableFirstBuy"
                name="enableFirstBuy"
                checked={projectData.enableFirstBuy}
                onChange={handleInputChange} // This now works correctly
                className="sr-only"
                disabled={isLoading}
              />
              <label 
                htmlFor="enableFirstBuy" 
                className="flex items-center cursor-pointer select-none"
              >
                <div className={`
                  w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200
                  ${projectData.enableFirstBuy 
                    ? 'bg-cyan-500 border-cyan-500 shadow-lg shadow-cyan-500/30' 
                    : 'bg-gray-700 border-gray-500 hover:border-cyan-400'
                  }
                  ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}>
                  {projectData.enableFirstBuy && (
                    <Check className="w-3 h-3 text-white font-bold" />
                  )}
                </div>
                <span className="ml-3 text-gray-300 text-sm font-medium">
                  Enable instant first buy to prevent bots from front-running your token launch
                </span>
              </label>
            </div>
            
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
              projectData.enableFirstBuy 
                ? 'bg-green-600/20 text-green-400 border border-green-500/30' 
                : 'bg-gray-600/20 text-gray-400 border border-gray-500/30'
            }`}>
              {projectData.enableFirstBuy ? 'ENABLED' : 'DISABLED'}
            </div>
          </div>

          {projectData.enableFirstBuy && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-2">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    First Buy Amount (SOL)
                  </label>
                  <input
                    type="number"
                    name="firstBuyAmountSol"
                    value={projectData.firstBuyAmountSol}
                    onChange={handleInputChange}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500"
                    min="0.001"
                    max="10"
                    step="0.001"
                    disabled={isLoading}
                    required={projectData.enableFirstBuy}
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {conversionRates && `≈ ${calculateFirstBuyValue()}`}
                  </div>
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Minimum Tokens Expected
                  </label>
                  <input
                    type="number"
                    name="minimumTokensOut"
                    value={projectData.minimumTokensOut}
                    onChange={handleInputChange}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500"
                    min="1"
                    disabled={isLoading}
                    required={projectData.enableFirstBuy}
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    Slippage protection
                  </div>
                </div>
              </div>

              <div className="text-xs text-cyan-300 bg-cyan-900/20 border border-cyan-500/20 rounded-lg p-3">
                ✅ <strong>Bot Protection Active:</strong> Your purchase will be executed in the same transaction as pool creation, 
                preventing bots from buying before you can get your own tokens.
              </div>
            </motion.div>
          )}

          {!projectData.enableFirstBuy && (
            <div className="text-xs text-gray-400 bg-gray-800/50 rounded-lg p-3 border border-gray-600">
              ⚠️ <strong>Warning:</strong> Without first buy protection, bots may front-run your token launch. 
              Consider enabling this feature for better launch protection.
            </div>
          )}
        </div>
      </div>

      {/* Advanced Configuration */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Advanced Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Total Token Supply
            </label>
            <input
              type="number"
              name="totalTokenSupply"
              value={projectData.totalTokenSupply}
              onChange={handleInputChange}
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
              required
              disabled={isLoading}
              min="1"
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Migration Quote Threshold
            </label>
            <input
              type="number"
              name="migrationQuoteThreshold"
              value={projectData.migrationQuoteThreshold}
              onChange={handleInputChange}
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
              required
              disabled={isLoading}
              min="0.001"
              step="0.000001"
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Quote Token
            </label>
            <div className="relative">
              <select
                name="quoteMint"
                value={projectData.quoteMint}
                onChange={handleInputChange}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 appearance-none cursor-pointer"
                required
                disabled={isLoading}
              >
                {Object.entries(QUOTE_MINTS).map(([key, mint]) => (
                  <option key={key} value={key} className="bg-gray-800 text-white">
                    {mint.name} ({mint.fullSymbol}) ({mint.address.slice(0, 4)}...{mint.address.slice(-4)})
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Launch Button */}
      <button
        onClick={onLaunchToken}
        className="w-full bg-gradient-to-r from-green-600 to-cyan-600 hover:from-green-700 hover:to-cyan-700 text-white py-4 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={isLoading || !projectData.tokenName || !projectData.tokenSymbol || !projectData.projectImage}
      >
        {isLoading ? (
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Launching Token...</span>
          </div>
        ) : hasUnsavedChanges ? (
          <div className="flex items-center justify-center gap-2">
            <Rocket className="w-5 h-5" />
            <span>Save & Launch Token</span>
          </div>
        ) : projectData.enableFirstBuy ? (
          <div className="flex items-center justify-center gap-2">
            <Rocket className="w-5 h-5" />
            <span>Launch Token with First Buy ({projectData.firstBuyAmountSol} SOL)</span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2">
            <Rocket className="w-5 h-5" />
            <span>Launch Token</span>
          </div>
        )}
      </button>
    </motion.div>
  );
};