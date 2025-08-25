// components/VanityNotificationSystem.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, CheckCircle, AlertCircle, Hash } from 'lucide-react';

interface VanityNotificationProps {
  isGenerating: boolean;
  hasKeypair: boolean;
  attempts: number;
  attemptsPerSecond: number;
  estimatedTime: string;
  error: string | null;
  difficulty: string;
  onDismiss?: () => void;
}

export const VanityNotificationSystem: React.FC<VanityNotificationProps> = ({
  isGenerating,
  hasKeypair,
  attempts,
  attemptsPerSecond,
  estimatedTime,
  error,
  difficulty,
  onDismiss
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [hasShownSuccess, setHasShownSuccess] = useState(false);

  // Auto-hide success notification after 10 seconds
  useEffect(() => {
    if (hasKeypair && !hasShownSuccess) {
      setHasShownSuccess(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [hasKeypair, hasShownSuccess]);

  // Reset visibility when generation starts again
  useEffect(() => {
    if (isGenerating) {
      setIsVisible(true);
      setHasShownSuccess(false);
    }
  }, [isGenerating]);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  if (!isVisible) return null;

  // Don't show if nothing is happening
  if (!isGenerating && !hasKeypair && !error) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100, x: 50 }}
        animate={{ opacity: 1, y: 0, x: 0 }}
        exit={{ opacity: 0, y: 100, x: 50 }}
        className="fixed bottom-6 right-6 z-50 max-w-sm"
      >
        <div className="bg-gray-900/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className={`px-4 py-3 flex items-center justify-between ${
            hasKeypair ? 'bg-gradient-to-r from-green-600/20 to-emerald-600/20 border-b border-green-500/30' :
            error ? 'bg-gradient-to-r from-red-600/20 to-rose-600/20 border-b border-red-500/30' :
            'bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-b border-purple-500/30'
          }`}>
            <div className="flex items-center gap-3">
              {hasKeypair ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : error ? (
                <AlertCircle className="w-5 h-5 text-red-400" />
              ) : (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Hash className="w-5 h-5 text-purple-400" />
                </motion.div>
              )}
              <div>
                <h4 className="font-semibold text-white text-sm">
                  {hasKeypair ? 'Vanity Address Ready!' :
                   error ? 'Generation Error' :
                   'Generating Vanity Address'}
                </h4>
                <p className="text-xs text-gray-400">
                  {hasKeypair ? 'Address ending with CYAI found' :
                   error ? 'Something went wrong' :
                   `Searching for CYAI suffix (${difficulty})`}
                </p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="text-gray-400 hover:text-white transition-colors p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4">
            {hasKeypair ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center"
              >
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <p className="text-green-400 font-medium mb-1">Success!</p>
                <p className="text-gray-300 text-sm">
                  Your custom CYAI address is ready to use for token deployment.
                </p>
                <div className="mt-3 text-xs text-gray-400">
                  Found after {attempts.toLocaleString()} attempts
                </div>
              </motion.div>
            ) : error ? (
              <div className="text-center">
                <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <AlertCircle className="w-6 h-6 text-white" />
                </div>
                <p className="text-red-400 font-medium mb-1">Error</p>
                <p className="text-gray-300 text-sm">{error}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Progress stats */}
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-gray-800/50 rounded-lg p-2">
                    <div className="text-white font-semibold text-sm">
                      {attempts.toLocaleString()}
                    </div>
                    <div className="text-gray-400 text-xs">Attempts</div>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-2">
                    <div className="text-white font-semibold text-sm">
                      {attemptsPerSecond.toLocaleString()}/s
                    </div>
                    <div className="text-gray-400 text-xs">Speed</div>
                  </div>
                </div>

                {/* Time estimate */}
                <div className="text-center">
                  <div className="text-gray-400 text-xs mb-1">Estimated time remaining</div>
                  <div className="text-white font-medium">{estimatedTime}</div>
                </div>

                {/* Animated progress indicator */}
                <div className="flex items-center justify-center">
                  <div className="flex space-x-1">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [0.3, 1, 0.3]
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          delay: i * 0.2
                        }}
                        className="w-2 h-2 bg-purple-400 rounded-full"
                      />
                    ))}
                  </div>
                </div>

                {/* Difficulty indicator */}
                <div className="text-center">
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    difficulty === 'Easy' ? 'bg-green-900/50 text-green-300' :
                    difficulty === 'Medium' ? 'bg-yellow-900/50 text-yellow-300' :
                    difficulty === 'Hard' ? 'bg-orange-900/50 text-orange-300' :
                    'bg-red-900/50 text-red-300'
                  }`}>
                    {difficulty} Difficulty
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer actions */}
          {isGenerating && (
            <div className="px-4 py-3 bg-gray-800/50 border-t border-white/10">
              <div className="text-xs text-gray-400 text-center">
                💡 Generation continues in the background. You can close this notification and keep using the app.
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

// Utility component for showing vanity address benefits
export const VanityAddressBenefits: React.FC = () => {
  return (
    <div className="bg-gradient-to-r from-purple-900/10 to-blue-900/10 rounded-lg p-4 border border-purple-500/20">
      <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
        <Zap className="w-5 h-5 text-purple-400" />
        Why Use a Vanity Address?
      </h4>
      <div className="space-y-2 text-sm">
        <div className="flex items-start gap-3">
          <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0" />
          <div>
            <span className="text-white font-medium">Brand Recognition:</span>
            <span className="text-gray-300 ml-1">Make your token easily identifiable with CYAI suffix</span>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
          <div>
            <span className="text-white font-medium">Trust & Credibility:</span>
            <span className="text-gray-300 ml-1">Custom addresses appear more professional and legitimate</span>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0" />
          <div>
            <span className="text-white font-medium">Memorable:</span>
            <span className="text-gray-300 ml-1">Easier for users to remember and verify your token contract</span>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0" />
          <div>
            <span className="text-white font-medium">Marketing Value:</span>
            <span className="text-gray-300 ml-1">Unique addresses can be used in marketing and branding</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced status indicator with more details
export const VanityStatusIndicator: React.FC<{
  isGenerating: boolean;
  hasKeypair: boolean;
  attempts: number;
  estimatedTime: string;
  difficulty: string;
  onToggleDetails?: () => void;
}> = ({ 
  isGenerating, 
  hasKeypair, 
  attempts, 
  estimatedTime, 
  difficulty, 
  onToggleDetails 
}) => {
  if (!isGenerating && !hasKeypair) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed top-4 right-4 z-40"
    >
      <div 
        className={`bg-gray-900/95 backdrop-blur-sm border rounded-lg p-3 shadow-lg cursor-pointer transition-all hover:shadow-xl ${
          hasKeypair ? 'border-green-500/30 bg-green-900/10' : 'border-purple-500/30'
        }`}
        onClick={onToggleDetails}
      >
        <div className="flex items-center gap-3">
          {hasKeypair ? (
            <CheckCircle className="w-5 h-5 text-green-400" />
          ) : (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Hash className="w-5 h-5 text-purple-400" />
            </motion.div>
          )}
          
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-white">
              {hasKeypair ? 'CYAI Address Ready!' : 'Generating CYAI Address'}
            </div>
            <div className="text-xs text-gray-400">
              {hasKeypair ? 'Click to view details' : 
               `${attempts.toLocaleString()} attempts • ${estimatedTime} • ${difficulty}`
              }
            </div>
          </div>

          {isGenerating && (
            <div className="text-right">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Session storage utilities for vanity addresses
export const VanityStorageUtils = {
  store: (suffix: string, keypair: any, metadata?: any) => {
    const data = {
      publicKey: keypair.publicKey.toBase58(),
      secretKey: Array.from(keypair.secretKey),
      suffix,
      generatedAt: Date.now(),
      metadata
    };
    sessionStorage.setItem(`vanity_keypair_${suffix}`, JSON.stringify(data));
  },

  retrieve: (suffix: string) => {
    try {
      const stored = sessionStorage.getItem(`vanity_keypair_${suffix}`);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error retrieving vanity keypair:', error);
      return null;
    }
  },

  clear: (suffix: string) => {
    sessionStorage.removeItem(`vanity_keypair_${suffix}`);
  },

  clearAll: () => {
    const keys = Object.keys(sessionStorage).filter(key => key.startsWith('vanity_keypair_'));
    keys.forEach(key => sessionStorage.removeItem(key));
  },

  list: () => {
    const keys = Object.keys(sessionStorage).filter(key => key.startsWith('vanity_keypair_'));
    return keys.map(key => {
      try {
        return JSON.parse(sessionStorage.getItem(key) || '{}');
      } catch {
        return null;
      }
    }).filter(Boolean);
  }
};