import axios from 'axios';

// Types for DexScreener API response
interface DexScreenerToken {
  address: string;
  name: string;
  symbol: string;
}

interface DexScreenerPair {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  baseToken: DexScreenerToken;
  quoteToken: DexScreenerToken;
  priceNative: string;
  priceUsd: string;
  txns: {
    m5: { buys: number; sells: number };
    h1: { buys: number; sells: number };
    h6: { buys: number; sells: number };
    h24: { buys: number; sells: number };
  };
  volume: {
    h24: number;
    h6: number;
    h1: number;
    m5: number;
  };
  priceChange: {
    m5: number;
    h1: number;
    h6: number;
    h24: number;
  };
  liquidity?: {
    usd: number;
    base: number;
    quote: number;
  };
  fdv?: number;
  marketCap?: number;
  pairCreatedAt?: number;
  info?: {
    imageUrl?: string;
    websites?: Array<{ url: string }>;
    socials?: Array<{ type: string; url: string }>;
    holders?: number;
  };
}

interface DexScreenerResponse {
  schemaVersion: string;
  pairs: DexScreenerPair[] | null;
}

// Types for token metadata
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

// Cache for API responses to avoid rate limiting
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 30000; // 30 seconds

function getCachedData(key: string) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
}

function setCachedData(key: string, data: any) {
  cache.set(key, { data, timestamp: Date.now() });
}

/**
 * Fetch token data from DexScreener API
 */
export async function fetchDexScreenerData(tokenAddress: string): Promise<DexScreenerPair | null> {
  try {
    const cacheKey = `dexscreener-${tokenAddress}`;
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const response = await axios.get<DexScreenerResponse>(
      `https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`,
      {
        timeout: 10000,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; TokenDataService/1.0)'
        }
      }
    );

    if (response.data.pairs && response.data.pairs.length > 0) {
      // Return the pair with highest liquidity or volume
      const bestPair = response.data.pairs.reduce((best, current) => {
        const bestLiquidity = best.liquidity?.usd || 0;
        const currentLiquidity = current.liquidity?.usd || 0;
        return currentLiquidity > bestLiquidity ? current : best;
      });

      setCachedData(cacheKey, bestPair);
      return bestPair;
    }

    return null;
  } catch (error) {
    console.error('Error fetching DexScreener data:', error);
    return null;
  }
}

/**
 * Fetch token metadata from IPFS or HTTP URL
 */
export async function fetchTokenData(metadataUri: string): Promise<TokenMetadata | null> {
  try {
    const cacheKey = `metadata-${metadataUri}`;
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    // Convert IPFS URIs to HTTP URLs if needed
    let url = metadataUri;
    if (metadataUri.startsWith('ipfs://')) {
      url = metadataUri.replace('ipfs://', 'https://ipfs.io/ipfs/');
    }

    const response = await axios.get<TokenMetadata>(url, {
      timeout: 10000,
      headers: {
        'Accept': 'application/json'
      }
    });

    const metadata = response.data;

    // Convert IPFS image URLs if needed
    if (metadata.image && metadata.image.startsWith('ipfs://')) {
      metadata.image = metadata.image.replace('ipfs://', 'https://ipfs.io/ipfs/');
    }

    setCachedData(cacheKey, metadata);
    return metadata;
  } catch (error) {
    console.error('Error fetching token metadata:', error);
    return null;
  }
}

/**
 * Get token price history for charting
 */
export async function fetchTokenPriceHistory(
  tokenAddress: string, 
  timeframe: '1h' | '4h' | '1d' | '1w' = '1d'
): Promise<Array<{ timestamp: number; price: number; volume: number }> | null> {
  try {
    const cacheKey = `price-history-${tokenAddress}-${timeframe}`;
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    // This would typically call a price history API
    // For now, we'll generate sample data based on current price
    const currentData = await fetchDexScreenerData(tokenAddress);
    if (!currentData) return null;

    const currentPrice = parseFloat(currentData.priceUsd);
    const currentVolume = currentData.volume.h24;

    // Generate sample price history (this should be replaced with real API call)
    const hours = timeframe === '1h' ? 24 : timeframe === '4h' ? 96 : timeframe === '1d' ? 168 : 672;
    const interval = timeframe === '1h' ? 3600000 : timeframe === '4h' ? 14400000 : timeframe === '1d' ? 86400000 : 604800000;
    
    const history = [];
    const now = Date.now();
    
    for (let i = hours; i >= 0; i--) {
      const timestamp = now - (i * interval);
      
      // Generate realistic price fluctuations
      const randomFactor = 0.95 + Math.random() * 0.1; // ±5% variation
      const trendFactor = 1 + (Math.sin(i / (hours / 4)) * 0.02); // Gentle trend
      const price = currentPrice * randomFactor * trendFactor;
      
      const volumeFactor = 0.5 + Math.random(); // Volume variation
      const volume = currentVolume * volumeFactor;
      
      history.push({
        timestamp,
        price,
        volume
      });
    }

    setCachedData(cacheKey, history);
    return history;
  } catch (error) {
    console.error('Error fetching price history:', error);
    return null;
  }
}

/**
 * Search for tokens by name or symbol
 */
export async function searchTokens(query: string): Promise<DexScreenerPair[]> {
  try {
    const cacheKey = `search-${query.toLowerCase()}`;
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const response = await axios.get<DexScreenerResponse>(
      `https://api.dexscreener.com/latest/dex/search/?q=${encodeURIComponent(query)}`,
      {
        timeout: 10000,
        headers: {
          'Accept': 'application/json'
        }
      }
    );

    const results = response.data.pairs || [];
    setCachedData(cacheKey, results);
    return results;
  } catch (error) {
    console.error('Error searching tokens:', error);
    return [];
  }
}

/**
 * Get trending tokens
 */
export async function fetchTrendingTokens(): Promise<DexScreenerPair[]> {
  try {
    const cacheKey = 'trending-tokens';
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    // This would typically call a trending tokens API
    // For now, we'll return empty array since DexScreener doesn't have a trending endpoint
    const results: DexScreenerPair[] = [];
    
    setCachedData(cacheKey, results);
    return results;
  } catch (error) {
    console.error('Error fetching trending tokens:', error);
    return [];
  }
}

/**
 * Validate if a token address exists and is tradeable
 */
export async function validateTokenAddress(tokenAddress: string): Promise<boolean> {
  try {
    const data = await fetchDexScreenerData(tokenAddress);
    return data !== null;
  } catch (error) {
    console.error('Error validating token address:', error);
    return false;
  }
}

/**
 * Get token holders information (this would typically come from a blockchain indexer)
 */
export async function fetchTokenHolders(tokenAddress: string): Promise<Array<{
  address: string;
  balance: number;
  percentage: number;
}> | null> {
  try {
    // This would typically call a blockchain indexer API like Moralis, Alchemy, etc.
    // For now, we'll return mock data
    console.log('Fetching holders for token:', tokenAddress);
    
    // Mock data - replace with real API call
    return [
      { address: '0x1234...5678', balance: 1000000, percentage: 32.5 },
      { address: '0x2345...6789', balance: 400000, percentage: 12.9 },
      { address: '0x3456...7890', balance: 380000, percentage: 12.88 },
      { address: '0x4567...8901', balance: 320000, percentage: 10.9 },
      { address: '0x5678...9012', balance: 290000, percentage: 9.82 },
    ];
  } catch (error) {
    console.error('Error fetching token holders:', error);
    return null;
  }
}