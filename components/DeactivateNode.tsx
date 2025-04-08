'use client';

import { useState } from 'react';
import { useAppKitProvider, useAppKitAccount } from "@reown/appkit/react";
import { Contract, BrowserProvider } from "ethers";
import type { Eip1193Provider } from "ethers";
import { NETSEPIO_ABI } from '@/abi/netsepio';

interface DeactivateNodeProps {
  nodeId: string;
  onDeactivated?: () => void;
}

const NETSEPIO_CONTRACT_ADDRESS = '0xa5c3c7207B4362431bD02D0E02af3B8a73Bb35eD';

export default function DeactivateNode({ nodeId, onDeactivated }: DeactivateNodeProps) {
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const { address } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider<'eip1193'>('eip155');

  const switchToRiseTestnet = async () => {
    const chainIdHex = '0xaa39db';
    const ethereum = window.ethereum as unknown as Eip1193Provider;

    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdHex }],
      });
      return true;
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: chainIdHex,
                chainName: 'RISE Testnet',
                nativeCurrency: {
                  name: 'Ethereum',
                  symbol: 'ETH',
                  decimals: 18,
                },
                rpcUrls: ['https://testnet.riselabs.xyz'],
                blockExplorerUrls: ['https://testnet.explorer.riselabs.xyz'],
              },
            ],
          });
          return true;
        } catch (addError) {
          console.error('Error adding Rise Testnet:', addError);
          return false;
        }
      }
      console.error('Error switching network:', switchError);
      return false;
    }
  };

  const handleDeactivate = async () => {
    if (!walletProvider || !address) {
      setError('Wallet not connected');
      return;
    }

    setIsDeactivating(true);
    setError(null);
    setSuccess(null);

    try {
      const switched = await switchToRiseTestnet();
      if (!switched) {
        throw new Error('Failed to switch to RISE Testnet');
      }

      const ethersProvider = new BrowserProvider(walletProvider as unknown as Eip1193Provider);
      const signer = await ethersProvider.getSigner();
      const contract = new Contract(NETSEPIO_CONTRACT_ADDRESS, NETSEPIO_ABI, signer);

      const tx = await contract.deactivateNode(nodeId);
      await tx.wait();
      
      setSuccess(`Node "${nodeId}" deactivated successfully!`);
      if (onDeactivated) onDeactivated();
    } catch (err) {
      console.error('Error deactivating node:', err);
      setError(err instanceof Error ? err.message : 'Failed to deactivate node');
    } finally {
      setIsDeactivating(false);
      setShowConfirm(false);
    }
  };

  return (
    <div className="mt-6">
      <div className="flex items-center gap-4">
        <div>
          <h4 className="text-lg font-medium text-white">Node Status</h4>
          <p className="text-gray-400">ID: {nodeId}</p>
        </div>
        <button
          onClick={() => setShowConfirm(true)}
          disabled={isDeactivating}
          className="ml-auto px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-white disabled:opacity-50"
        >
          Deactivate Node
        </button>
      </div>

      {error && (
        <div className="mt-2 p-2 bg-red-500/10 text-red-400 rounded-lg text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-2 p-2 bg-green-500/10 text-green-400 rounded-lg text-sm">
          {success}
        </div>
      )}

      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 p-6 rounded-xl max-w-md w-full border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">Confirm Deactivation</h3>
            <p className="text-gray-300 mb-2">You are about to deactivate node:</p>
            <p className="font-mono text-white bg-gray-700 p-2 rounded mb-6">{nodeId}</p>
            <p className="text-gray-300 mb-6">This action cannot be undone.</p>
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 border border-gray-600 text-gray-300 hover:bg-gray-700 rounded-lg"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeactivate}
                disabled={isDeactivating}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-white disabled:opacity-50"
              >
                {isDeactivating ? 'Deactivating...' : 'Confirm Deactivation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}