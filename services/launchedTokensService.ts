import { supabase, LaunchedTokenData, LaunchedTokenDB, dbToFrontend, frontendToDb } from '@/lib/supabase';

export class LaunchedTokensService {
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
   * Update a launched token (mainly for adding DAMM pool address)
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
          // Check if token already exists in database
          const existing = await this.getLaunchedTokenByContract(token.contractAddress, walletAddress);
          
          if (!existing) {
            // Save to database
            const saved = await this.saveLaunchedToken(token, walletAddress);
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