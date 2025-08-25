// components/VanityAddressProgress.tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, CheckCircle, Clock, Hash, Loader2, Play, Pause, RotateCcw } from 'lucide-react';

interface VanityAddressProgressProps {
  isGenerating: boolean;
  progress: number;
  attempts: number;
  estimatedTime: string;
  hasVanityAddress: boolean;
  onStart: () => void;
  onStop: () => void;
  onRestart: () => void;
  suffix: string;
  className?: string;
}

export const VanityAddressProgress: React.FC<VanityAddressProgressProps> = ({
  isGenerating,
  progress,
  attempts,
  estimatedTime,
  hasVanityAddress,
  onStart,
  onStop,
  onRestart,
  suffix,
  className = ''
}) => {
  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`bg-gradient-to-r from-purple-900/20 to-blue-900/20 backdrop-blur-sm rounded-xl border border-purple-500/20 p-4 ${className}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
              {hasVanityAddress ? (
                <CheckCircle className="w-5 h-5 text-white" />
              ) : isGenerating ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Hash className="w-5 h-5 text-white" />
                </motion.div>
              ) : (
                <Zap className="w-5 h-5 text-white" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                Vanity Address Generator
              </h3>
              <p className="text-sm text-gray-400">
                Generating address ending with "{suffix}"
              </p>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center gap-2">
            {!hasVanityAddress && (
              <>
                {isGenerating ? (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onStop}
                    className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 rounded-lg flex items-center gap-1 text-sm transition-colors"
                  >
                    <Pause className="w-3 h-3" />
                    Pause
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onStart}
                    className="px-3 py-1.5 bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 text-green-400 rounded-lg flex items-center gap-1 text-sm transition-colors"
                  >
                    <Play className="w-3 h-3" />
                    Start
                  </motion.button>
                )}
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onRestart}
                  className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 rounded-lg flex items-center gap-1 text-sm transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  Restart
                </motion.button>
              </>
            )}
          </div>
        </div>

        {/* Status Content */}
        <div className="space-y-4">
          {hasVanityAddress ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center justify-center py-4 text-green-400"
            >
              <CheckCircle className="w-6 h-6 mr-2" />
              <span className="text-lg font-semibold">
                Vanity Address Ready!
              </span>
            </motion.div>
          ) : (
            <>
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Progress</span>
                  <span className="text-white font-medium">
                    {progress.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-700/50 rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full relative overflow-hidden"
                  >
                    {isGenerating && (
                      <motion.div
                        animate={{ x: [-100, 100] }}
                        transition={{ 
                          duration: 1.5, 
                          repeat: Infinity, 
                          ease: "easeInOut" 
                        }}
                        className="absolute inset-0 bg-white/20 w-full"
                        style={{ 
                          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)' 
                        }}
                      />
                    )}
                  </motion.div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-800/30 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Hash className="w-4 h-4 text-purple-400" />
                    <span className="text-sm text-gray-400">Attempts</span>
                  </div>
                  <div className="text-lg font-semibold text-white">
                    {isGenerating ? (
                      <motion.span
                        key={attempts}
                        initial={{ scale: 1.2 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        {formatNumber(attempts)}
                      </motion.span>
                    ) : (
                      formatNumber(attempts)
                    )}
                  </div>
                </div>

                <div className="bg-gray-800/30 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4 text-blue-400" />
                    <span className="text-sm text-gray-400">Est. Time</span>
                  </div>
                  <div className="text-lg font-semibold text-white">
                    {estimatedTime}
                  </div>
                </div>
              </div>

              {/* Status Message */}
              <div className="text-center py-2">
                {isGenerating ? (
                  <div className="flex items-center justify-center gap-2 text-blue-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">
                      Searching for address ending with "{suffix}"...
                    </span>
                  </div>
                ) : (
                  <div className="text-gray-400 text-sm">
                    Click "Start" to begin generating your vanity address
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Warning for long generation times */}
        {!hasVanityAddress && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-4 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg"
          >
            <p className="text-yellow-300 text-xs">
              💡 <strong>Tip:</strong> Vanity address generation can take a long time. 
              The process runs in the background, so you can continue using the app while it searches.
            </p>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};