"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useSearchParams, useRouter } from "next/navigation";
import StarCanvas from "@/components/StarCanvas";
import { Github, Globe, FileText, Users, Lightbulb, Rocket, Wallet, Linkedin, Twitter, Github as GithubIcon, ArrowLeft, Heart, UserPlus, Loader2, AlertCircle, Instagram, ChartArea } from "lucide-react";
import { ProjectIdeasService } from '@/services/projectIdeasService';
import { LaunchedTokensService } from '@/services/launchedTokensService';
import { ProjectIdeaData, LaunchedTokenData } from '@/lib/supabase';
import { useSocialInteractions } from '@/hooks/useSocialInteractions';
import { useAppKitAccount } from "@reown/appkit/react";
import { toast } from 'sonner';
import { FaXTwitter } from "react-icons/fa6";

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

export default function ProjectPreviewPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { address, isConnected } = useAppKitAccount();
  const ideaId = searchParams.get('ideaId');
  const tokenAddress = searchParams.get('tokenAddress');
  
  // Data states
  const [projectIdea, setProjectIdea] = useState<ProjectIdeaData | null>(null);
  const [launchedToken, setLaunchedToken] = useState<LaunchedTokenData | null>(null);
  const [tokenMetadata, setTokenMetadata] = useState<TokenMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  
  // One-liner states
  const [oneLiner, setOneLiner] = useState<string>('');
  const [isGeneratingOneLiner, setIsGeneratingOneLiner] = useState(false);
  const [oneLinerError, setOneLinerError] = useState<string | null>(null);

  // Social interactions hook
  const {
    stats,
    isLoading: socialLoading,
    isLiking,
    isFollowingAction,
    toggleLike,
    toggleFollow
  } = useSocialInteractions(currentProjectId || '', isConnected ? address : undefined);

  // Generate one-liner from description
  const generateOneLiner = async (description: string) => {
    if (!description || description.trim().length === 0) {
      return;
    }

    setIsGeneratingOneLiner(true);
    setOneLinerError(null);

    try {
      const response = await fetch('/api/one-liner', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ description }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate one-liner: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.oneLiner) {
        setOneLiner(data.oneLiner);
      } else {
        throw new Error('No one-liner returned from API');
      }
    } catch (error) {
      console.error('Error generating one-liner:', error);
      setOneLinerError('Failed to generate tagline');
      // Fallback to original description
      setOneLiner(description);
    } finally {
      setIsGeneratingOneLiner(false);
    }
  };

  // Fetch token metadata from IPFS
  const fetchTokenMetadata = async (metadataUri: string): Promise<TokenMetadata | null> => {
    try {
      const response = await fetch(metadataUri);
      if (!response.ok) {
        throw new Error(`Failed to fetch metadata: ${response.statusText}`);
      }
      
      const metadata: TokenMetadata = await response.json();
      return metadata;
    } catch (error) {
      console.error('Error fetching token metadata:', error);
      return null;
    }
  };

  // Load project data
  useEffect(() => {
    const loadProjectData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        if (ideaId) {
          // Load project idea using public access method
          const idea = await ProjectIdeasService.getPublicProjectIdeaById(ideaId);
          
          if (idea) {
            setProjectIdea(idea);
            setCurrentProjectId(idea.id!);
          } else {
            setError('Project idea not found');
          }
        } else if (tokenAddress) {
          // Load launched token with project idea details
          const result = await LaunchedTokensService.getPublicTokenWithProjectIdea(tokenAddress);
          
          if (result) {
            setLaunchedToken(result.token);
            if (result.projectIdea) {
              setProjectIdea(result.projectIdea);
              setCurrentProjectId(result.projectIdea.id!);
            } else {
              // Use token contract address as project ID if no project idea
              setCurrentProjectId(result.token.contractAddress);
            }
            
            // Load token metadata if available
            if (result.token.metadataUri) {
              const metadata = await fetchTokenMetadata(result.token.metadataUri);
              setTokenMetadata(metadata);
            }
          } else {
            setError('Token not found');
          }
        } else {
          setError('No project ID or token address provided');
        }
      } catch (err) {
        console.error('Error loading project data:', err);
        setError('Failed to load project data');
        toast.error('Failed to load project data');
      } finally {
        setIsLoading(false);
      }
    };

    loadProjectData();
  }, [ideaId, tokenAddress]);

  // Generate one-liner when project data is loaded
  useEffect(() => {
    const projectData = getProjectData();
    if (projectData && projectData.description) {
      generateOneLiner(projectData.description);
    }
  }, [projectIdea, launchedToken, tokenMetadata]);

  // Get project data for display
  const getProjectData = () => {
    if (projectIdea) {
      return {
        name: projectIdea.projectName,
        description: projectIdea.projectDescription,
        category: projectIdea.projectCategory,
        industry: projectIdea.projectIndustry,
        image: projectIdea.projectImage,
        githubUrl: projectIdea.githubUrl,
        websiteUrl: projectIdea.websiteUrl,
        whitepaperUrl: projectIdea.whitepaperUrl,
        twitterUrl: projectIdea.twitterUrl, // NEW
      instagramUrl: projectIdea.instagramUrl, // NEW
      linkedinUrl: projectIdea.linkedinUrl,
        teamMembers: projectIdea.teamMembers,
        stage: projectIdea.isLaunched ? 'cooking' : projectIdea.projectStage || 'ideation',
        tokenName: projectIdea.tokenName,
        tokenSymbol: projectIdea.tokenSymbol,
        isLaunched: projectIdea.isLaunched,
        createdAt: projectIdea.createdAt
      };
    } else if (launchedToken) {
      return {
        name: tokenMetadata?.name || launchedToken.tokenName,
        description: tokenMetadata?.description || 'Token launched on the platform',
        category: 'Token',
        industry: 'Cryptocurrency',
        image: tokenMetadata?.image || `https://api.dicebear.com/7.x/shapes/svg?seed=${launchedToken.contractAddress}`,
        githubUrl: '',
        websiteUrl: '',
        whitepaperUrl: '',
        twitterUrl: '', // NEW
        instagramUrl: '', // NEW
        linkedinUrl: '',
        teamMembers: [],
        stage: 'cooking',
        tokenName: launchedToken.tokenName,
        tokenSymbol: launchedToken.tokenSymbol,
        isLaunched: true,
        contractAddress: launchedToken.contractAddress,
        launchedAt: launchedToken.launchedAt,
        quoteMint: launchedToken.quoteMint,
        tradeStatus: launchedToken.tradeStatus
      };
    }
    return null;
  };

  const projectData = getProjectData();

  if (isLoading) {
    return (
      <>
        <div className="absolute top-0 left-0 w-full overflow-hidden -z-10 pointer-events-none">
          <div className="w-[2661px] text-[370px] opacity-10 tracking-[24.96px] leading-[70%] font-moonhouse text-transparent text-left inline-block [-webkit-text-stroke:3px_#c8c8c8] [paint-order:stroke_fill] mix-blend-overlay">
            CYRENE
          </div>
        </div>

        <div className="min-h-screen text-white py-20 px-4 mt-24">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center">
                <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-blue-400" />
                <p className="text-gray-400">Loading project details...</p>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error || !projectData) {
    return (
      <>
        <div className="absolute top-0 left-0 w-full overflow-hidden -z-10 pointer-events-none">
          <div className="w-[2661px] text-[370px] opacity-10 tracking-[24.96px] leading-[70%] font-moonhouse text-transparent text-left inline-block [-webkit-text-stroke:3px_#c8c8c8] [paint-order:stroke_fill] mix-blend-overlay">
            CYRENE
          </div>
        </div>

        <div className="min-h-screen text-white py-20 px-4 mt-24">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
                <p className="text-red-400 mb-4">{error || 'Project not found'}</p>
                <button
                  onClick={() => router.push('/explore-projects')}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Back to Explore
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  const isCooking = projectData.stage === 'cooking' || projectData.isLaunched;

  const formatDate = (timestamp: number | string) => {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <>
      {/* CYRENE outline text */}
      <div className="absolute top-0 left-0 w-full overflow-hidden -z-10 pointer-events-none">
        <div className="w-[2661px] text-[370px] opacity-10 tracking-[24.96px] leading-[70%] font-moonhouse text-transparent text-left inline-block [-webkit-text-stroke:3px_#c8c8c8] [paint-order:stroke_fill] mix-blend-overlay">
          CYRENE
        </div>
      </div>

      <div className="min-h-screen text-white py-20 px-4 mt-24">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Back link */}
          <div className="flex items-center">
            <button 
              onClick={() => router.push('/explore-projects')}
              className="inline-flex items-center gap-2 bg-white text-black rounded-full px-5 py-2 hover:bg-gray-100 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Explore
            </button>
          </div>

          {/* Hero Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Title + Meta */}
            <div className="lg:col-span-2 space-y-6">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <h1 className="text-4xl md:text-5xl font-bold">{projectData.name}</h1>
          {/* UPDATED: Social Media Links in Hero - Right beside the project name */}
          <div className="flex items-center gap-3 mt-2 mb-3">
            {projectData.twitterUrl && (
              <a 
                href={projectData.twitterUrl}
                className="p-2 rounded-full bg-gray-800/60 border border-gray-600/50 hover:bg-gray-700/80 transition-all"
                title="Twitter/X"
              >
                <FaXTwitter className="w-5 h-5 text-blue-400" />
              </a>
            )}
            {projectData.instagramUrl && (
              <a 
                href={projectData.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-gray-800/60 border border-gray-600/50 hover:bg-gray-700/80 transition-all"
                title="Instagram"
              >
                <Instagram className="w-5 h-5 text-pink-400" />
              </a>
            )}
            {projectData.linkedinUrl && (
              <a 
                href={projectData.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-gray-800/60 border border-gray-600/50 hover:bg-gray-700/80 transition-all"
                title="LinkedIn"
              >
                <Linkedin className="w-5 h-5 text-blue-500" />
              </a>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-3 max-w-3xl">
        {isGeneratingOneLiner ? (
          <div className="flex items-center gap-2 text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Tagline...</span>
          </div>
        ) : oneLinerError ? (
          <p className="text-gray-300">{projectData.description}</p>
        ) : oneLiner ? (
          <p className="text-gray-300 text-lg italic">{oneLiner}</p>
        ) : (
          <p className="text-gray-300">{projectData.description}</p>
        )}
      </div>
    </motion.div>

              {/* Badges */}
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-gray-600/50 bg-gray-800/40 px-4 py-2 text-sm">
                  Category: <span className="font-medium text-white">{projectData.category}</span>
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-gray-600/50 bg-gray-800/40 px-4 py-2 text-sm">
                  Industry: <span className="font-medium text-white">{projectData.industry}</span>
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-gray-600/50 px-4 py-2 text-sm bg-white text-black">
                  {isCooking ? <Rocket className="w-4 h-4" /> : <Lightbulb className="w-4 h-4" />}
                  {isCooking ? "Cooking" : "Ideation"}
                </span>
                {projectData.tradeStatus !== undefined && (
                  <span className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm ${
                    projectData.tradeStatus 
                      ? 'border-green-500/50 bg-green-500/20 text-green-300'
                      : 'border-red-500/50 bg-red-500/20 text-red-300'
                  }`}>
                    Trading: {projectData.tradeStatus ? 'Active' : 'Graduated'}
                  </span>
                )}
              </div>

              {/* Links */}
              <div className="flex flex-wrap gap-3 pt-2">
                {projectData.githubUrl && (
                  <a 
                    className="inline-flex items-center gap-2 rounded-full bg-white text-black px-5 py-2 hover:bg-gray-100 transition" 
                    href={projectData.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Github className="w-4 h-4" /> GitHub
                  </a>
                )}
                {projectData.websiteUrl && (
                  <a 
                    className="inline-flex items-center gap-2 rounded-full bg-white text-black px-5 py-2 hover:bg-gray-100 transition" 
                    href={projectData.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Globe className="w-4 h-4" /> Website
                  </a>
                )}
                {projectData.whitepaperUrl && (
                  <a 
                    className="inline-flex items-center gap-2 rounded-full bg-white text-black px-5 py-2 hover:bg-gray-100 transition" 
                    href={projectData.whitepaperUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FileText className="w-4 h-4" /> Whitepaper
                  </a>
                )}
                                  {launchedToken && (
                    <button 
                      onClick={() => {
                        const params = new URLSearchParams({
                          tokenAddress: launchedToken.contractAddress,
                          tokenName: launchedToken.tokenName,
                          tokenSymbol: launchedToken.tokenSymbol,
                          poolAddress: launchedToken.dbcPoolAddress || '',
                          metadataUri: launchedToken.metadataUri || '',
                          tradeStatus: launchedToken.tradeStatus ? 'active' : 'graduated'
                        });
                        router.push(`/trade?${params.toString()}`);
                      }}
                      className="inline-flex items-center gap-2 rounded-full bg-blue-600 text-black px-5 py-2 hover:bg-blue-700 transition" 
                       
                    rel="noopener noreferrer"
                    >
                      <ChartArea className="w-4 h-4" />  Trade
                    </button>
                  )}
              </div>

              {/* Real-time Social Stats */}
              <div className="flex items-center gap-3 pt-2">
                {socialLoading ? (
                  <div className="flex items-center gap-3">
                    <div className="inline-flex items-center gap-2 rounded-full border border-gray-600/50 bg-gray-800/40 px-4 py-2 text-sm">
                      <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                      <span className="text-gray-400">Loading...</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="inline-flex items-center gap-2 rounded-full border border-gray-600/50 bg-gray-800/40 px-4 py-2 text-sm">
                      <Heart className="w-4 h-4 text-rose-400" />
                      <span className="font-medium text-white">{stats.likeCount.toLocaleString()} likes</span>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-gray-600/50 bg-gray-800/40 px-4 py-2 text-sm">
                      <Users className="w-4 h-4 text-blue-300" />
                      <span className="font-medium text-white">{stats.followerCount.toLocaleString()} followers</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Right: Hero image / poster */}
            <div className="lg:col-span-1">
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-gray-600/50">
                {/* Blurred background */}
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `url(${projectData.image || "/Cyrene cover_85 2.png"})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    filter: "blur(20px) brightness(0.7)", // blur only bg
                    transform: "scale(1.2)", // prevent edge cut-off
                  }}
                />

                {/* Foreground crisp image */}
                <Image
                  src={projectData.image || "/Cyrene cover_85 2.png"}
                  alt="Project cover"
                  fill
                  className="object-contain p-[7.5%] relative z-10 rounded-2xl"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/Cyrene cover_85 2.png";
                  }}
                />
              </div>
            </div>
          </div>

          {/* Glass Container */}
          <div className="relative">
            <div className="absolute inset-0 bg-[#434a6033] rounded-[32px] backdrop-blur-[30px]" />
            <div className="relative z-10 p-6 md:p-10 space-y-10">
              {/* Project Overview */}
              <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-4">
                  <h2 className="text-2xl font-bold">Overview</h2>
                  <p className="text-gray-300 leading-relaxed">
                    {projectData.description}
                  </p>
                  {projectData.createdAt && (
                    <p className="text-sm text-gray-400">
                      Created on {formatDate(projectData.createdAt)}
                    </p>
                  )}
                  {projectData.launchedAt && (
                    <p className="text-sm text-gray-400">
                      Token launched on {formatDate(projectData.launchedAt)}
                    </p>
                  )}
                </div>

                {/* Snapshot */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Snapshot</h3>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-center justify-between rounded-xl bg-gray-800/40 border border-gray-600/50 px-4 py-3">
                      <span className="text-gray-400">Project Name</span>
                      <span className="text-white font-medium">{projectData.name}</span>
                    </li>
                    <li className="flex items-center justify-between rounded-xl bg-gray-800/40 border border-gray-600/50 px-4 py-3">
                      <span className="text-gray-400">Category</span>
                      <span className="text-white font-medium">{projectData.category}</span>
                    </li>
                    <li className="flex items-center justify-between rounded-xl bg-gray-800/40 border border-gray-600/50 px-4 py-3">
                      <span className="text-gray-400">Industry</span>
                      <span className="text-white font-medium">{projectData.industry}</span>
                    </li>
                    <li className="flex items-center justify-between rounded-xl bg-gray-800/40 border border-gray-600/50 px-4 py-3">
                      <span className="text-gray-400">Stage</span>
                      <span className="inline-flex items-center gap-2 rounded-full bg-white text-black px-3 py-1 text-xs font-medium">
                        {isCooking ? <Rocket className="w-3 h-3" /> : <Lightbulb className="w-3 h-3" />}
                        {isCooking ? "Cooking" : "Ideation"}
                      </span>
                    </li>
                    {projectData.tokenName && (
                      <li className="flex items-center justify-between rounded-xl bg-gray-800/40 border border-gray-600/50 px-4 py-3">
                        <span className="text-gray-400">Token</span>
                        <span className="text-white font-medium font-mono">${projectData.tokenSymbol}</span>
                      </li>
                    )}
                    {projectData.contractAddress && (
                      <li className="flex items-center justify-between rounded-xl bg-gray-800/40 border border-gray-600/50 px-4 py-3">
                        <span className="text-gray-400">Contract</span>
                        <span className="text-white font-medium font-mono text-xs">
                          {projectData.contractAddress.slice(0, 8)}...{projectData.contractAddress.slice(-4)}
                        </span>
                      </li>
                    )}
                    {projectData.quoteMint && (
                      <li className="flex items-center justify-between rounded-xl bg-gray-800/40 border border-gray-600/50 px-4 py-3">
                        <span className="text-gray-400">Quote Token</span>
                        <span className="text-white font-medium">{projectData.quoteMint}</span>
                      </li>
                    )}
                  </ul>
                </div>
              </section>

              {/* Divider */}
              <div className="border-t border-gray-600/60" />

              {/* Team Section */}
              {projectData.teamMembers && projectData.teamMembers.length > 0 && (
                <section>
                  <div className="flex items-center gap-3 mb-6">
                    <Users className="w-6 h-6 text-blue-400" />
                    <h2 className="text-2xl font-bold">Team</h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projectData.teamMembers.map((member, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 12 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.2 }}
                        transition={{ duration: 0.25, delay: idx * 0.03 }}
                        className="rounded-2xl bg-gray-800/40 border border-gray-600/50 p-5 flex flex-col gap-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border border-gray-600/60 flex items-center justify-center">
                              {member.profileImage ? (
                                <img
                                  src={member.profileImage}
                                  alt={member.name}
                                  className="w-full h-full rounded-full object-cover"
                                />
                              ) : (
                                <span className="text-white font-semibold text-lg">
                                  {member.name.charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div>
                              <div className="text-white font-semibold">{member.name}</div>
                              <div className="text-sm text-blue-300">{member.role}</div>
                            </div>
                          </div>
                          <div
                            onClick={() => {
                              navigator.clipboard.writeText(member.walletAddress)
                            }}
                            className="text-xs inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-700/60 border border-gray-600/50 cursor-pointer hover:bg-gray-700/80 transition"
                          >
                            <Wallet className="w-3 h-3 text-gray-300" />
                            <span className="font-mono text-gray-300">
                              {member.walletAddress.slice(0, 4)}...{member.walletAddress.slice(-4)}
                            </span>
                          </div>
                        </div>

                        {member.bio && (
                          <p className="text-sm text-gray-300 leading-relaxed line-clamp-3">{member.bio}</p>
                        )}

                        <div className="flex items-center gap-3 pt-1">
                          {member.linkedinUrl && (
                            <a href={member.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300" aria-label="LinkedIn">
                              <Linkedin className="w-4 h-4" />
                            </a>
                          )}
                          {member.twitterUrl && (
                            <a href={member.twitterUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300" aria-label="Twitter">
                              <FaXTwitter className="w-4 h-4" />
                            </a>
                          )}
                          {member.githubUrl && (
                            <a href={member.githubUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300" aria-label="GitHub">
                              <GithubIcon className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </section>
              )}

              {/* CTA for investors - Real-time Social Interactions */}
              <div className="pt-2">
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={toggleLike}
                    disabled={isLiking || socialLoading}
                    className={`inline-flex items-center gap-2 rounded-full px-6 py-3 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
                      stats.isLiked 
                        ? 'bg-rose-600 text-white hover:bg-rose-700' 
                        : 'bg-white text-black hover:bg-gray-100'
                    }`}
                    aria-pressed={stats.isLiked}
                  >
                    {isLiking ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Heart 
                        className={`w-4 h-4 ${stats.isLiked ? 'text-white' : 'text-black'}`} 
                        fill={stats.isLiked ? 'currentColor' : 'none'} 
                      />
                    )}
                    {stats.isLiked ? 'Liked' : 'Like'} · {stats.likeCount.toLocaleString()}
                  </button>
                  
                  <button
                    onClick={toggleFollow}
                    disabled={isFollowingAction || socialLoading}
                    className={`inline-flex items-center gap-2 rounded-full px-6 py-3 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
                      stats.isFollowing 
                        ? 'bg-blue-600 text-white hover:bg-blue-700' 
                        : 'bg-white text-black hover:bg-gray-100'
                    }`}
                    aria-pressed={stats.isFollowing}
                  >
                    {isFollowingAction ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <UserPlus className="w-4 h-4" />
                    )}
                    {stats.isFollowing ? 'Following' : 'Follow'} · {stats.followerCount.toLocaleString()}
                  </button>
                  
                  <button
                    onClick={() => toast.info("Adding soon 🚀")}
                    className="bg-white text-black rounded-full px-6 py-3 hover:bg-gray-100 transition font-medium"
                  >
                    Contact Team
                  </button>
                  
                  {/* {launchedToken && (
                    <button 
                      onClick={() => {
                        const params = new URLSearchParams({
                          tokenAddress: launchedToken.contractAddress,
                          tokenName: launchedToken.tokenName,
                          tokenSymbol: launchedToken.tokenSymbol,
                          poolAddress: launchedToken.dbcPoolAddress || '',
                          metadataUri: launchedToken.metadataUri || '',
                          tradeStatus: launchedToken.tradeStatus ? 'active' : 'graduated'
                        });
                        router.push(`/trade?${params.toString()}`);
                      }}
                      className="bg-blue-600 text-white rounded-full px-6 py-3 hover:bg-blue-700 transition font-medium"
                    >
                      Trade Token
                    </button>
                  )} */}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}