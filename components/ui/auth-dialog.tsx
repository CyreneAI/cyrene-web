"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { motion } from "framer-motion"
import ConnectButton from '@/components/common/ConnectBtn'

interface AuthDialogProps {
  agentName: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function AuthDialog({ agentName, isOpen, onClose, onSuccess }: AuthDialogProps) {
  const [isConnecting, setIsConnecting] = useState(false)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="relative bg-gray-900 border border-gray-800 rounded-xl max-w-md w-full mx-4 p-6 shadow-2xl"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full p-1 hover:bg-gray-800 transition-colors"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>

        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-xl font-bold text-white">
              Connect Your Wallet
            </h3>
            <p className="mt-2 text-gray-400">
              To chat with {agentName}, please connect your wallet
            </p>
          </div>

          <div className="flex justify-center">
            <ConnectButton 
            //   onConnect={() => {
            //     setIsConnecting(true);
            //     // The ConnectButton should handle its own connection state
            //     // and call onSuccess when done
            //     onSuccess();
            //     onClose();
            //   }}
            />
          </div>

          <p className="text-xs text-center text-gray-500">
            By connecting, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </motion.div>
    </div>
  )
}