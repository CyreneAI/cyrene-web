import { supabase, LaunchedTokenData, LaunchedTokenDB, dbToFrontend, frontendToDb } from '@/lib/supabase';

export class LaunchedTokensService {
  /**
   * Get all launched tokens from all users (for explore page)
   */
  static async getAllLaunchedTokens(limit: number = 50, offset: number = 0): Promise<LaunchedTokenData[]> {
    try {
      const { data, error } = await supabase
        .from('launched_tokens')
        .select('*')
        .order('launched_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching all launched tokens:', error);
        throw new Error(`Failed to fetch launched tokens: ${error.message}`);
      }

      if (!data) return [];

      return data.map(dbToFrontend);
    } catch (error) {
      console.error('Service error fetching all launched tokens:', error);
      throw error;
    }
  }

  /**
   * Get launched tokens count (for pagination)
   */
  static async getTotalTokensCount(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('launched_tokens')
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error('Error fetching tokens count:', error);
        throw new Error(`Failed to fetch tokens count: ${error.message}`);
      }

      return count || 0;
    } catch (error) {
      console.error('Service error fetching tokens count:', error);
      throw error;
    }
  }

  /**
   * Search tokens by name or symbol
   */
  static async searchTokens(query: string, limit: number = 20): Promise<LaunchedTokenData[]> {
    try {
      const { data, error } = await supabase
        .from('launched_tokens')
        .select('*')
        .or(`token_name.ilike.%${query}%,token_symbol.ilike.%${query}%`)
        .order('launched_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error searching tokens:', error);
        throw new Error(`Failed to search tokens: ${error.message}`);
      }

      if (!data) return [];

      return data.map(dbToFrontend);
    } catch (error) {
      console.error('Service error searching tokens:', error);
      throw error;
    }
  }

  /**
   * Get all launched tokens for a specific wallet address
   */
  static async getLaunchedTokens(walletAddress: string): Promise<LaunchedTokenData[]> {
    try {
      const { data, error } = await supabase
        .from('launched_tokens')
        .select('*')
        .eq('wallet_address', walletAddress)
        .order('launched_at', { ascending: false });

      if (error) {
        console.error('Error fetching launched tokens:', error);
        throw new Error(`Failed to fetch launched tokens: ${error.message}`);
      }

      if (!data) return [];

      return data.map(dbToFrontend);
    } catch (error) {
      console.error('Service error fetching launched tokens:', error);
      throw error;
    }
  }

  /**
   * Save a new launched token
   */
  static async saveLaunchedToken(tokenData: LaunchedTokenData, walletAddress: string): Promise<LaunchedTokenData> {
    try {
      const dbData = frontendToDb(tokenData, walletAddress);

      const { data, error } = await supabase
        .from('launched_tokens')
        .insert([dbData])
        .select('*')
        .single();

      if (error) {
        console.error('Error saving launched token:', error);
        throw new Error(`Failed to save launched token: ${error.message}`);
      }

      if (!data) {
        throw new Error('No data returned from insert operation');
      }

      return dbToFrontend(data as LaunchedTokenDB);
    } catch (error) {
      console.error('Service error saving launched token:', error);
      throw error;
    }
  }

  /**
   * Update a launched token (mainly for adding DAMM pool address or trade status)
   */
  static async updateLaunchedToken(
    contractAddress: string, 
    walletAddress: string, 
    updates: Partial<LaunchedTokenData>
  ): Promise<LaunchedTokenData | null> {
    try {
      const dbUpdates: Partial<Omit<LaunchedTokenDB, 'id' | 'created_at' | 'updated_at'>> = {};
      
      if (updates.dammPoolAddress !== undefined) {
        dbUpdates.damm_pool_address = updates.dammPoolAddress;
      }
      if (updates.tokenName !== undefined) {
        dbUpdates.token_name = updates.tokenName;
      }
      if (updates.tokenSymbol !== undefined) {
        dbUpdates.token_symbol = updates.tokenSymbol;
      }
      if (updates.tradeStatus !== undefined) {
        dbUpdates.trade_status = updates.tradeStatus;
      }
      if (updates.metadataUri !== undefined) {
        dbUpdates.metadata_uri = updates.metadataUri;
      }
      // Add other fields as needed

      const { data, error } = await supabase
        .from('launched_tokens')
        .update(dbUpdates)
        .eq('contract_address', contractAddress)
        .eq('wallet_address', walletAddress)
        .select('*')
        .single();

      if (error) {
        console.error('Error updating launched token:', error);
        throw new Error(`Failed to update launched token: ${error.message}`);
      }

      if (!data) {
        console.warn('No token found to update');
        return null;
      }

      return dbToFrontend(data as LaunchedTokenDB);
    } catch (error) {
      console.error('Service error updating launched token:', error);
      throw error;
    }
  }

  /**
   * Update trade status for a specific token
   */
  static async updateTradeStatus(
    contractAddress: string, 
    walletAddress: string, 
    tradeStatus: boolean
  ): Promise<LaunchedTokenData | null> {
    try {
      const { data, error } = await supabase
        .from('launched_tokens')
        .update({ trade_status: tradeStatus })
        .eq('contract_address', contractAddress)
        .eq('wallet_address', walletAddress)
        .select('*')
        .single();

      if (error) {
        console.error('Error updating trade status:', error);
        throw new Error(`Failed to update trade status: ${error.message}`);
      }

      if (!data) {
        console.warn('No token found to update trade status');
        return null;
      }

      return dbToFrontend(data as LaunchedTokenDB);
    } catch (error) {
      console.error('Service error updating trade status:', error);
      throw error;
    }
  }

  /**
   * Delete a launched token
   */
  static async deleteLaunchedToken(contractAddress: string, walletAddress: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('launched_tokens')
        .delete()
        .eq('contract_address', contractAddress)
        .eq('wallet_address', walletAddress);

      if (error) {
        console.error('Error deleting launched token:', error);
        throw new Error(`Failed to delete launched token: ${error.message}`);
      }

      return true;
    } catch (error) {
      console.error('Service error deleting launched token:', error);
      throw error;
    }
  }

  /**
   * Get a specific launched token by contract address
   */
  static async getLaunchedTokenByContract(
    contractAddress: string, 
    walletAddress: string
  ): Promise<LaunchedTokenData | null> {
    try {
      const { data, error } = await supabase
        .from('launched_tokens')
        .select('*')
        .eq('contract_address', contractAddress)
        .eq('wallet_address', walletAddress)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        console.error('Error fetching launched token by contract:', error);
        throw new Error(`Failed to fetch launched token: ${error.message}`);
      }

      if (!data) return null;

      return dbToFrontend(data as LaunchedTokenDB);
    } catch (error) {
      console.error('Service error fetching launched token by contract:', error);
      throw error;
    }
  }

  /**
   * Migrate data from localStorage to Supabase
   */
  static async migrateFromLocalStorage(walletAddress: string): Promise<LaunchedTokenData[]> {
    try {
      const localStorageKey = `launched_tokens_${walletAddress}`;
      const localData = localStorage.getItem(localStorageKey);
      
      if (!localData) {
        return [];
      }

      const tokens: LaunchedTokenData[] = JSON.parse(localData);
      const migratedTokens: LaunchedTokenData[] = [];

      for (const token of tokens) {
        try {
          // Add default trade status for migrated tokens
          const tokenWithTradeStatus = {
            ...token,
            tradeStatus: token.tradeStatus ?? true // Default to enabled if not set
          };

          // Check if token already exists in database
          const existing = await this.getLaunchedTokenByContract(token.contractAddress, walletAddress);
          
          if (!existing) {
            // Save to database
            const saved = await this.saveLaunchedToken(tokenWithTradeStatus, walletAddress);
            migratedTokens.push(saved);
          } else {
            migratedTokens.push(existing);
          }
        } catch (error) {
          console.warn('Failed to migrate token:', token, error);
          // Continue with other tokens
        }
      }

      // Clear localStorage after successful migration
      localStorage.removeItem(localStorageKey);
      
      return migratedTokens;
    } catch (error) {
      console.error('Error migrating from localStorage:', error);
      throw error;
    }
  }

  /**
   * Subscribe to real-time updates for a wallet's tokens
   */
  static subscribeToTokenUpdates(
    walletAddress: string, 
    callback: (payload: any) => void
  ) {
    return supabase
      .channel(`launched_tokens_${walletAddress}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'launched_tokens',
        filter: `wallet_address=eq.${walletAddress}`
      }, callback)
      .subscribe();
  }
}