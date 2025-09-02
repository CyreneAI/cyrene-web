import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for database tables
export interface LaunchedTokenDB {
  id: string;
  wallet_address: string;
  contract_address: string;
  dbc_pool_address: string;
  config_address: string;
  quote_mint: 'SOL';
  token_name: string;
  token_symbol: string;
  damm_pool_address: string | null;
  metadata_uri: string | null; // New field for IPFS metadata URI
  launched_at: number;
  created_at: string;
  updated_at: string;
}

// Interface matching the frontend type
export interface LaunchedTokenData {
  contractAddress: string;
  dbcPoolAddress: string;
  configAddress: string;
  quoteMint: 'SOL';
  tokenName: string;
  tokenSymbol: string;
  dammPoolAddress?: string;
  metadataUri?: string; // New field for IPFS metadata URI
  launchedAt: number;
}

// Convert database row to frontend interface
export const dbToFrontend = (dbToken: LaunchedTokenDB): LaunchedTokenData => ({
  contractAddress: dbToken.contract_address,
  dbcPoolAddress: dbToken.dbc_pool_address,
  configAddress: dbToken.config_address,
  quoteMint: dbToken.quote_mint,
  tokenName: dbToken.token_name,
  tokenSymbol: dbToken.token_symbol,
  dammPoolAddress: dbToken.damm_pool_address || undefined,
  metadataUri: dbToken.metadata_uri || undefined,
  launchedAt: dbToken.launched_at
});

// Convert frontend interface to database row
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
  launched_at: token.launchedAt
});