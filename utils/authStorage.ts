// utils/authStorage.ts - Centralized auth management
import Cookies from 'js-cookie';

export type ChainType = 'solana' | 'evm';

export interface AuthData {
  token: string;
  wallet: string;
  userId: string;
  timestamp: number;
}

class AuthStorageManager {
  private static instance: AuthStorageManager;
  private authCache: Map<string, AuthData | null> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static getInstance(): AuthStorageManager {
    if (!AuthStorageManager.instance) {
      AuthStorageManager.instance = new AuthStorageManager();
    }
    return AuthStorageManager.instance;
  }

  private getCookieOptions() {
    return {
      expires: 7,
      path: '/',
      sameSite: 'Strict' as const,
      secure: process.env.NODE_ENV === 'production'
    };
  }

  private getCacheKey(chainType: ChainType, wallet?: string): string {
    return `${chainType}_${wallet || 'current'}`;
  }

  setAuthData(chainType: ChainType, token: string, walletAddress: string, userId: string): void {
    const authData: AuthData = {
      token,
      wallet: walletAddress.toLowerCase(),
      userId,
      timestamp: Date.now()
    };

    const options = this.getCookieOptions();
    
    // Set cookies
    Cookies.set(`erebrus_token_${chainType}`, token, options);
    Cookies.set(`erebrus_wallet_${chainType}`, walletAddress.toLowerCase(), options);
    Cookies.set(`erebrus_userid_${chainType}`, userId, options);

    // Update cache
    const cacheKey = this.getCacheKey(chainType, walletAddress);
    this.authCache.set(cacheKey, authData);

    console.log(`Auth data set for ${chainType} chain:`, walletAddress.slice(0, 6) + '...');
  }

  getAuthData(chainType: ChainType, walletAddress?: string): AuthData | null {
    const cacheKey = this.getCacheKey(chainType, walletAddress);
    
    // Check cache first
    const cached = this.authCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached;
    }

    // Get from cookies
    const token = Cookies.get(`erebrus_token_${chainType}`);
    const wallet = Cookies.get(`erebrus_wallet_${chainType}`);
    const userId = Cookies.get(`erebrus_userid_${chainType}`);

    if (!token || !wallet || !userId) {
      this.authCache.set(cacheKey, null);
      return null;
    }

    const authData: AuthData = {
      token,
      wallet: wallet.toLowerCase(),
      userId,
      timestamp: Date.now()
    };

    // Update cache
    this.authCache.set(cacheKey, authData);
    return authData;
  }

  isAuthenticated(chainType: ChainType, walletAddress: string): boolean {
    const authData = this.getAuthData(chainType, walletAddress);
    
    if (!authData) {
      return false;
    }

    // Check if wallet matches
    const isValid = authData.wallet.toLowerCase() === walletAddress.toLowerCase();
    
    console.log(`Auth check for ${chainType}:`, {
      wallet: walletAddress.slice(0, 6) + '...',
      hasAuth: !!authData,
      walletMatch: isValid
    });

    return isValid;
  }

  clearAuthData(chainType: ChainType): void {
    const options = { path: '/' };
    
    // Clear cookies
    Cookies.remove(`erebrus_token_${chainType}`, options);
    Cookies.remove(`erebrus_wallet_${chainType}`, options);
    Cookies.remove(`erebrus_userid_${chainType}`, options);

    // Clear cache
    this.authCache.clear();

    console.log(`Auth data cleared for ${chainType} chain`);
  }

  clearAllAuthData(): void {
    this.clearAuthData('solana');
    this.clearAuthData('evm');
  }

  // Check if user has valid auth for any chain (useful for cross-chain scenarios)
  hasValidAuthForAnyChain(walletAddress: string): { chainType: ChainType; authData: AuthData } | null {
    const chains: ChainType[] = ['solana', 'evm'];
    
    for (const chainType of chains) {
      const authData = this.getAuthData(chainType);
      if (authData && authData.wallet.toLowerCase() === walletAddress.toLowerCase()) {
        return { chainType, authData };
      }
    }
    
    return null;
  }
}

export const authStorage = AuthStorageManager.getInstance();