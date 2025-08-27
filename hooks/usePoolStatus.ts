import { useState, useEffect, useRef, useCallback } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import { 
  DynamicBondingCurveClient, 
  deriveDammV2PoolAddress,
  DAMM_V1_MIGRATION_FEE_ADDRESS 
} from '@meteora-ag/dynamic-bonding-curve-sdk';
import { QUOTE_MINTS, type QuoteMintType } from '@/helper/meteoraServices/createConfig';
import { toast } from 'sonner';

// Define the inputs the hook needs
interface UsePoolStatusProps {
  configAddress?: string | null;
  contractAddress?: string | null;
  dbcPoolAddress?: string | null;
  quoteMint?: QuoteMintType | null;
  onDammDerive: (dammPoolAddress: string) => void;
}

// Global rate limiting and circuit breaker
class RateLimitManager {
  private static instance: RateLimitManager;
  private lastRequestTime = 0;
  private rateLimitedUntil = 0;
  private consecutiveErrors = 0;
  private activeRequests = new Set<string>();
  private readonly MIN_INTERVAL = 8000; // Increased to 8 seconds
  private readonly RATE_LIMIT_COOLDOWN = 120000; // Increased to 2 minutes
  private readonly MAX_CONSECUTIVE_ERRORS = 2; // Reduced to 2

  static getInstance(): RateLimitManager {
    if (!RateLimitManager.instance) {
      RateLimitManager.instance = new RateLimitManager();
    }
    return RateLimitManager.instance;
  }

  canMakeRequest(poolKey: string): boolean {
    const now = Date.now();
    
    if (now < this.rateLimitedUntil) {
      return false;
    }

    if (now - this.lastRequestTime < this.MIN_INTERVAL) {
      return false;
    }

    if (this.activeRequests.has(poolKey)) {
      return false;
    }

    if (this.consecutiveErrors >= this.MAX_CONSECUTIVE_ERRORS) {
      return false;
    }

    return true;
  }

  startRequest(poolKey: string): void {
    this.activeRequests.add(poolKey);
    this.lastRequestTime = Date.now();
  }

  endRequest(poolKey: string, wasError: boolean, was429: boolean): void {
    this.activeRequests.delete(poolKey);
    
    if (was429) {
      this.rateLimitedUntil = Date.now() + this.RATE_LIMIT_COOLDOWN;
      this.consecutiveErrors = Math.min(this.consecutiveErrors + 1, this.MAX_CONSECUTIVE_ERRORS);
      console.log(`Rate limited - cooling down until ${new Date(this.rateLimitedUntil).toISOString()}`);
    } else if (wasError) {
      this.consecutiveErrors = Math.min(this.consecutiveErrors + 1, this.MAX_CONSECUTIVE_ERRORS);
    } else {
      this.consecutiveErrors = 0;
    }
  }

  isInCooldown(): boolean {
    return Date.now() < this.rateLimitedUntil;
  }
}

// Connection with better error handling
const connection = new Connection(
  `https://mainnet.helius-rpc.com/?api-key=${process.env.NEXT_PUBLIC_HELIUS_API_KEY}`, 
  {
    commitment: "confirmed",
    confirmTransactionInitialTimeout: 30000,
    wsEndpoint: undefined,
  }
);

const client = new DynamicBondingCurveClient(connection, "confirmed");

// Global state to prevent redundant operations
const derivationStatusMap = new Map<string, boolean>();
const poolStatusCache = new Map<string, { 
  progress: number; 
  timestamp: number; 
  graduated: boolean;
}>();
const CACHE_DURATION = 45000; // Increased to 45 seconds

// Global set to track active polling instances
const activePollingInstances = new Set<string>();

export const usePoolStatus = ({
  configAddress,
  contractAddress,
  dbcPoolAddress,
  quoteMint,
  onDammDerive,
}: UsePoolStatusProps) => {
  const [isGraduated, setIsGraduated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Stable refs
  const isMountedRef = useRef(true);
  const rateLimitManager = RateLimitManager.getInstance();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const onDammDeriveRef = useRef(onDammDerive);
  
  // Keep the callback ref updated but don't use it as a dependency
  useEffect(() => {
    onDammDeriveRef.current = onDammDerive;
  }, [onDammDerive]);

  // Stable callback that doesn't change
  const stableOnDammDerive = useCallback((dammPoolAddress: string) => {
    onDammDeriveRef.current(dammPoolAddress);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (dbcPoolAddress) {
        activePollingInstances.delete(dbcPoolAddress);
      }
    };
  }, [dbcPoolAddress]);

  const checkStatusAndDerive = useCallback(async () => {
    if (!dbcPoolAddress || !configAddress || !contractAddress || !quoteMint) {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
      return false; // Return false to stop polling
    }

    const poolKey = dbcPoolAddress;
    
    // Check cache first
    const cached = poolStatusCache.get(poolKey);
    const now = Date.now();
    
    if (cached && now - cached.timestamp < CACHE_DURATION) {
      if (isMountedRef.current) {
        setIsGraduated(cached.graduated);
        setIsLoading(false);
        if (cached.graduated) {
          setError(null);
        }
      }
      
      // If already graduated and derived, stop polling
      if (cached.graduated && derivationStatusMap.get(poolKey)) {
        return false;
      }
    }

    // Check rate limiting
    if (!rateLimitManager.canMakeRequest(poolKey)) {
      if (rateLimitManager.isInCooldown()) {
        if (isMountedRef.current) {
          setError("Rate limited - waiting for cooldown");
          setIsLoading(false);
        }
      }
      return true; // Continue polling despite rate limit
    }

    if (isMountedRef.current) {
      setIsLoading(true);
      setError(null);
    }

    rateLimitManager.startRequest(poolKey);
    let wasError = false;
    let was429 = false;

    try {
      console.log(`Checking status for pool: ${poolKey}`);
      
      const dbcPoolPubkey = new PublicKey(dbcPoolAddress);
      const progress = await client.state.getPoolCurveProgress(dbcPoolPubkey);
      
      console.log(`Pool ${poolKey} progress: ${progress}`);

      // Update cache
      const graduated = progress >= 1;
      poolStatusCache.set(poolKey, {
        progress,
        timestamp: now,
        graduated
      });

      if (!graduated) {
        console.log(`Pool ${poolKey} not graduated yet (${(progress * 100).toFixed(2)}%)`);
        if (isMountedRef.current) {
          setIsGraduated(false);
          setError(null);
        }
        derivationStatusMap.set(poolKey, false);
        return true; // Continue polling
      } else {
        console.log(`Pool ${poolKey} has graduated!`);
        if (isMountedRef.current) {
          setIsGraduated(true);
          setError(null);
        }
        
        const hasAlreadyDerived = derivationStatusMap.get(poolKey) || false;
        
        if (!hasAlreadyDerived) {
          console.log(`Deriving DAMM address for pool: ${poolKey}`);

          const poolConfig = await client.state.getPoolConfig(new PublicKey(configAddress));
          const dammConfigKey = DAMM_V1_MIGRATION_FEE_ADDRESS[poolConfig.migrationFeeOption];
          
          if (!dammConfigKey) {
            throw new Error(`Invalid migration fee option: ${poolConfig.migrationFeeOption}`);
          }

          const tokenAMint = new PublicKey(contractAddress);
          const tokenBMint = new PublicKey(QUOTE_MINTS[quoteMint].address);

          const dammV2PoolAddress = deriveDammV2PoolAddress(
            dammConfigKey,
            tokenAMint,
            tokenBMint
          );

          console.log(`Derived DAMM Pool Address: ${dammV2PoolAddress.toString()}`);

          derivationStatusMap.set(poolKey, true);
          
          if (isMountedRef.current) {
            stableOnDammDerive(dammV2PoolAddress.toString());
          }
        }
        
        return false; // Stop polling - we're done
      }
    } catch (err: any) {
      wasError = true;
      
      if (err?.message?.includes('429') || err?.code === 429 || err?.status === 429) {
        was429 = true;
      }
      
      const errorMessage = err instanceof Error ? err.message : "Failed to check pool status";
      console.error(`Error checking status for pool ${poolKey}:`, errorMessage);
      
      if (isMountedRef.current) {
        setError(errorMessage);
        if (!was429) {
          toast.error(`Pool ${poolKey.slice(0, 8)}...: ${errorMessage}`);
        }
      }
      
      return true; // Continue polling on error
    } finally {
      rateLimitManager.endRequest(poolKey, wasError, was429);
      
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [dbcPoolAddress, configAddress, contractAddress, quoteMint, stableOnDammDerive]);

  useEffect(() => {
    if (!dbcPoolAddress) return;

    // Prevent multiple polling instances for the same pool
    if (activePollingInstances.has(dbcPoolAddress)) {
      console.log(`Polling already active for pool: ${dbcPoolAddress}`);
      return;
    }

    activePollingInstances.add(dbcPoolAddress);
    console.log(`Starting polling for pool: ${dbcPoolAddress}`);

    const startPolling = async () => {
      let shouldContinue = true;
      
      // Initial check
      shouldContinue = await checkStatusAndDerive();
      
      const poll = async () => {
        if (!isMountedRef.current || !shouldContinue) {
          return;
        }
        
        shouldContinue = await checkStatusAndDerive();
        
        if (shouldContinue && isMountedRef.current) {
          // Use exponential backoff with jitter
          const baseDelay = rateLimitManager.isInCooldown() ? 120000 : 45000; // 45s normal, 2min if in cooldown
          const jitter = Math.random() * 10000; // Add up to 10s jitter
          const delay = baseDelay + jitter;
          
          timeoutRef.current = setTimeout(poll, delay);
        } else {
          console.log(`Stopping polling for pool: ${dbcPoolAddress}`);
          activePollingInstances.delete(dbcPoolAddress);
        }
      };

      if (shouldContinue && isMountedRef.current) {
        const initialDelay = Math.random() * 5000; // Initial jitter up to 5s
        timeoutRef.current = setTimeout(poll, initialDelay);
      } else {
        activePollingInstances.delete(dbcPoolAddress);
      }
    };

    startPolling();

    // Cleanup
    return () => {
      console.log(`Cleanup polling for pool: ${dbcPoolAddress}`);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      activePollingInstances.delete(dbcPoolAddress);
    };
  }, [dbcPoolAddress, checkStatusAndDerive]);

  return { isGraduated, isLoading, error };
};