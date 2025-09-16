// lib/supabase.ts - Updated with hidden token support
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Team Member Types
export interface TeamMember {
  id?: string;
  name: string;
  role: string;
  walletAddress: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  githubUrl?: string;
  bio?: string;
  profileImage?: string;
}

// Project Idea Types - Updated to match database schema with social media
export interface ProjectIdeaDB {
  id: string;
  wallet_address: string;
  project_name: string;
  project_description: string;
  project_category: string;
  project_industry: string;
  project_image?: string | null;
  github_url?: string | null;
  website_url?: string | null;
  whitepaper_url?: string | null;
  twitter_url?: string | null;
  instagram_url?: string | null;
  linkedin_url?: string | null;
  project_stage: 'ideation' | 'cooking';
  team_members: TeamMember[];
  token_name?: string | null;
  token_symbol?: string | null;
  total_token_supply: number;
  migration_quote_threshold: number;
  quote_mint: string;
  enable_first_buy: boolean;
  first_buy_amount_sol: number;
  minimum_tokens_out: number;
  trade_status: boolean;
  is_launched: boolean;
  launched_token_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectIdeaData {
  id?: string;
  projectName: string;
  projectDescription: string;
  projectCategory: string;
  projectIndustry: string;
  projectImage?: string;
  githubUrl?: string;
  websiteUrl?: string;
  whitepaperUrl?: string;
  twitterUrl?: string;
  instagramUrl?: string;
  linkedinUrl?: string;
  projectStage: 'ideation' | 'cooking';
  teamMembers: TeamMember[];
  tokenName?: string;
  tokenSymbol?: string;
  totalTokenSupply: number;
  migrationQuoteThreshold: number;
  quoteMint: string;
  enableFirstBuy: boolean;
  firstBuyAmountSol: number;
  minimumTokensOut: number;
  tradeStatus: boolean;
  isLaunched: boolean;
  launchedTokenId?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Updated launched token types with hidden support
export interface LaunchedTokenDB {
  id: string;
  wallet_address: string;
  contract_address: string;
  dbc_pool_address: string;
  config_address: string;
  quote_mint: 'SOL'| 'CYAI';
  token_name: string;
  token_symbol: string;
  damm_pool_address: string | null;
  metadata_uri: string | null;
  trade_status: boolean;
  is_hidden: boolean; // NEW: Hidden status
  launched_at: number;
  project_idea_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface LaunchedTokenData {
  contractAddress: string;
  dbcPoolAddress: string;
  configAddress: string;
  quoteMint: 'SOL'|'CYAI';
  tokenName: string;
  tokenSymbol: string;
  dammPoolAddress?: string;
  metadataUri?: string;
  tradeStatus: boolean;
  isHidden: boolean; // NEW: Hidden status
  launchedAt: number;
  projectIdeaId?: string;
}

// Updated convert functions for launched tokens with hidden support
export const dbToFrontend = (dbToken: LaunchedTokenDB): LaunchedTokenData => ({
  contractAddress: dbToken.contract_address,
  dbcPoolAddress: dbToken.dbc_pool_address,
  configAddress: dbToken.config_address,
  quoteMint: dbToken.quote_mint,
  tokenName: dbToken.token_name,
  tokenSymbol: dbToken.token_symbol,
  dammPoolAddress: dbToken.damm_pool_address || undefined,
  metadataUri: dbToken.metadata_uri || undefined,
  tradeStatus: dbToken.trade_status,
  isHidden: dbToken.is_hidden, // NEW
  launchedAt: dbToken.launched_at,
  projectIdeaId: dbToken.project_idea_id || undefined
});

export const frontendToDb = (token: LaunchedTokenData, walletAddress: string): Omit<LaunchedTokenDB, 'id' | 'created_at' | 'updated_at'> => ({
  wallet_address: walletAddress,
  contract_address: token.contractAddress,
  dbc_pool_address: token.dbcPoolAddress,
  config_address: token.configAddress,
  quote_mint: token.quoteMint,
  token_name: token.tokenName,
  token_symbol: token.tokenSymbol,
  damm_pool_address: token.dammPoolAddress || null,
  metadata_uri: token.metadataUri || null,
  trade_status: token.tradeStatus,
  is_hidden: token.isHidden, // NEW
  launched_at: token.launchedAt,
  project_idea_id: token.projectIdeaId || null
});

// Convert functions for Project Ideas (unchanged)
export const projectIdeaDbToFrontend = (dbIdea: ProjectIdeaDB): ProjectIdeaData => ({
  id: dbIdea.id,
  projectName: dbIdea.project_name,
  projectDescription: dbIdea.project_description,
  projectCategory: dbIdea.project_category,
  projectIndustry: dbIdea.project_industry,
  projectImage: dbIdea.project_image || undefined,
  githubUrl: dbIdea.github_url || undefined,
  websiteUrl: dbIdea.website_url || undefined,
  whitepaperUrl: dbIdea.whitepaper_url || undefined,
  twitterUrl: dbIdea.twitter_url || undefined,
  instagramUrl: dbIdea.instagram_url || undefined,
  linkedinUrl: dbIdea.linkedin_url || undefined,
  projectStage: dbIdea.project_stage,
  teamMembers: dbIdea.team_members || [],
  tokenName: dbIdea.token_name || undefined,
  tokenSymbol: dbIdea.token_symbol || undefined,
  totalTokenSupply: dbIdea.total_token_supply,
  migrationQuoteThreshold: dbIdea.migration_quote_threshold,
  quoteMint: dbIdea.quote_mint,
  enableFirstBuy: dbIdea.enable_first_buy,
  firstBuyAmountSol: dbIdea.first_buy_amount_sol,
  minimumTokensOut: dbIdea.minimum_tokens_out,
  tradeStatus: dbIdea.trade_status,
  isLaunched: dbIdea.is_launched,
  launchedTokenId: dbIdea.launched_token_id || undefined,
  createdAt: dbIdea.created_at,
  updatedAt: dbIdea.updated_at
});

export const projectIdeaFrontendToDb = (idea: ProjectIdeaData, walletAddress: string): Omit<ProjectIdeaDB, 'id' | 'created_at' | 'updated_at'> => ({
  wallet_address: walletAddress,
  project_name: idea.projectName,
  project_description: idea.projectDescription,
  project_category: idea.projectCategory,
  project_industry: idea.projectIndustry,
  project_image: idea.projectImage || null,
  github_url: idea.githubUrl || null,
  website_url: idea.websiteUrl || null,
  whitepaper_url: idea.whitepaperUrl || null,
  twitter_url: idea.twitterUrl || null,
  instagram_url: idea.instagramUrl || null,
  linkedin_url: idea.linkedinUrl || null,
  project_stage: idea.projectStage,
  team_members: idea.teamMembers,
  token_name: idea.tokenName || null,
  token_symbol: idea.tokenSymbol || null,
  total_token_supply: idea.totalTokenSupply,
  migration_quote_threshold: idea.migrationQuoteThreshold,
  quote_mint: idea.quoteMint,
  enable_first_buy: idea.enableFirstBuy,
  first_buy_amount_sol: idea.firstBuyAmountSol,
  minimum_tokens_out: idea.minimumTokensOut,
  trade_status: idea.tradeStatus,
  is_launched: idea.isLaunched,
  launched_token_id: idea.launchedTokenId || null
});

// Category and Industry types (unchanged)
export interface ProjectCategory {
  id: number;
  name: string;
  description: string;
}

export interface ProjectIndustry {
  id: number;
  name: string;
  description: string;
}