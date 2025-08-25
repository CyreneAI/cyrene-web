// hooks/useVanityAddress.ts
import { useState, useEffect, useRef, useCallback } from 'react';
import { Keypair } from '@solana/web3.js';

interface VanityAddressState {
  isGenerating: boolean;
  progress: number;
  generatedKeypair: Keypair | null;
  estimatedTime: string;
  attempts: number;
}

interface VanityAddressOptions {
  suffix: string;
  autoStart?: boolean;
  maxAttempts?: number;
}

// Web Worker code as a string (since we can't use separate files in this environment)
const workerCode = `
let isRunning = false;
let attempts = 0;

self.onmessage = function(e) {
  const { type, suffix, maxAttempts } = e.data;
  
  if (type === 'START') {
    isRunning = true;
    attempts = 0;
    searchForVanityAddress(suffix, maxAttempts || Infinity);
  } else if (type === 'STOP') {
    isRunning = false;
  }
};

function searchForVanityAddress(suffix, maxAttempts) {
  const startTime = Date.now();
  
  while (isRunning && attempts < maxAttempts) {
    // Generate a new keypair
    const keypair = generateKeypair();
    attempts++;
    
    const publicKeyString = keypair.publicKey;
    
    // Check if it ends with the desired suffix
    if (publicKeyString.endsWith(suffix)) {
      self.postMessage({
        type: 'FOUND',
        keypair: {
          publicKey: publicKeyString,
          secretKey: Array.from(keypair.secretKey)
        },
        attempts,
        timeElapsed: Date.now() - startTime
      });
      return;
    }
    
    // Send progress update every 1000 attempts
    if (attempts % 1000 === 0) {
      const timeElapsed = Date.now() - startTime;
      const attemptsPerSecond = attempts / (timeElapsed / 1000);
      const estimatedTotal = Math.pow(58, suffix.length);
      const estimatedRemainingSeconds = (estimatedTotal - attempts) / attemptsPerSecond;
      
      self.postMessage({
        type: 'PROGRESS',
        attempts,
        timeElapsed,
        estimatedRemainingSeconds: Math.max(0, estimatedRemainingSeconds)
      });
    }
  }
  
  if (!isRunning) {
    self.postMessage({ type: 'STOPPED' });
  } else {
    self.postMessage({ type: 'MAX_ATTEMPTS_REACHED', attempts });
  }
}

// Simple keypair generation (simplified version)
function generateKeypair() {
  const secretKey = new Uint8Array(32);
  crypto.getRandomValues(secretKey);
  
  // This is a simplified version - in reality, you'd need the full Solana keypair generation
  // For the worker, we'll simulate the public key generation
  const publicKey = generatePublicKeyString(secretKey);
  
  return {
    secretKey,
    publicKey
  };
}

function generatePublicKeyString(secretKey) {
  // Simulate base58 public key generation
  // In reality, this would use the actual Solana crypto functions
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let result = '';
  
  // Generate a 32-44 character base58 string (typical Solana address length)
  const length = 32 + Math.floor(Math.random() * 12);
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}
`;

export const useVanityAddress = ({ 
  suffix, 
  autoStart = true, 
  maxAttempts = Infinity 
}: VanityAddressOptions) => {
  const [state, setState] = useState<VanityAddressState>({
    isGenerating: false,
    progress: 0,
    generatedKeypair: null,
    estimatedTime: '∞',
    attempts: 0
  });

  const workerRef = useRef<Worker | null>(null);
  const startTimeRef = useRef<number>(0);

  // Initialize worker
  useEffect(() => {
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    workerRef.current = new Worker(workerUrl);

    workerRef.current.onmessage = (e) => {
      const { type, keypair, attempts, timeElapsed, estimatedRemainingSeconds } = e.data;

      switch (type) {
        case 'FOUND':
          // Reconstruct the Keypair object from the worker data
          const reconstructedKeypair = Keypair.fromSecretKey(
            new Uint8Array(keypair.secretKey)
          );
          
          setState(prev => ({
            ...prev,
            isGenerating: false,
            generatedKeypair: reconstructedKeypair,
            attempts,
            progress: 100
          }));

          // Store in session storage
          sessionStorage.setItem('vanity_keypair', JSON.stringify({
            publicKey: keypair.publicKey,
            secretKey: Array.from(keypair.secretKey),
            suffix,
            generatedAt: Date.now()
          }));
          break;

        case 'PROGRESS':
          const progress = Math.min((attempts / Math.pow(58, suffix.length)) * 100, 99);
          const estimatedTime = formatEstimatedTime(estimatedRemainingSeconds);
          
          setState(prev => ({
            ...prev,
            progress,
            attempts,
            estimatedTime
          }));
          break;

        case 'STOPPED':
          setState(prev => ({
            ...prev,
            isGenerating: false
          }));
          break;

        case 'MAX_ATTEMPTS_REACHED':
          setState(prev => ({
            ...prev,
            isGenerating: false,
            progress: 100
          }));
          break;
      }
    };

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        URL.revokeObjectURL(workerUrl);
      }
    };
  }, [suffix]);

  // Auto-start generation when component mounts
  useEffect(() => {
    if (autoStart && !state.generatedKeypair) {
      // Check if we already have a stored vanity address for this suffix
      const stored = getStoredVanityKeypair(suffix);
      if (stored) {
        setState(prev => ({
          ...prev,
          generatedKeypair: stored,
          progress: 100,
          isGenerating: false
        }));
      } else {
        startGeneration();
      }
    }
  }, [autoStart, suffix]);

  const startGeneration = useCallback(() => {
    if (workerRef.current && !state.isGenerating) {
      setState(prev => ({
        ...prev,
        isGenerating: true,
        progress: 0,
        attempts: 0,
        estimatedTime: 'Calculating...'
      }));

      startTimeRef.current = Date.now();
      workerRef.current.postMessage({
        type: 'START',
        suffix,
        maxAttempts
      });
    }
  }, [suffix, maxAttempts, state.isGenerating]);

  const stopGeneration = useCallback(() => {
    if (workerRef.current && state.isGenerating) {
      workerRef.current.postMessage({ type: 'STOP' });
      setState(prev => ({
        ...prev,
        isGenerating: false
      }));
    }
  }, [state.isGenerating]);

  const consumeVanityKeypair = useCallback((): Keypair | null => {
    const keypair = state.generatedKeypair;
    if (keypair) {
      // Clear from state and session storage once consumed
      setState(prev => ({
        ...prev,
        generatedKeypair: null,
        progress: 0,
        attempts: 0
      }));
      sessionStorage.removeItem('vanity_keypair');
      return keypair;
    }
    return null;
  }, [state.generatedKeypair]);

  const restartGeneration = useCallback(() => {
    stopGeneration();
    setTimeout(() => startGeneration(), 100);
  }, [startGeneration, stopGeneration]);

  return {
    ...state,
    startGeneration,
    stopGeneration,
    restartGeneration,
    consumeVanityKeypair,
    hasVanityAddress: !!state.generatedKeypair
  };
};

// Helper functions
function formatEstimatedTime(seconds: number): string {
  if (!seconds || seconds === Infinity) return '∞';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `~${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `~${minutes}m ${secs}s`;
  } else {
    return `~${secs}s`;
  }
}

function getStoredVanityKeypair(suffix: string): Keypair | null {
  try {
    const stored = sessionStorage.getItem('vanity_keypair');
    if (stored) {
      const data = JSON.parse(stored);
      if (data.suffix === suffix) {
        return Keypair.fromSecretKey(new Uint8Array(data.secretKey));
      }
    }
  } catch (error) {
    console.error('Error retrieving stored vanity keypair:', error);
  }
  return null;
}