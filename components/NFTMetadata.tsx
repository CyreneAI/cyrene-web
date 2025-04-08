// components/NFTMetadata.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAppKitProvider } from "@reown/appkit/react";
import { Contract, BrowserProvider } from "ethers";
import type { Eip1193Provider } from "ethers";
import { ERC721_ABI } from '@/abi/erc721';

interface NFTMetadata {
  name?: string;
  description?: string;
  image?: string;
  attributes?: Array<{
    trait_type: string;
    value: string;
  }>;
}

const NFT_CONTRACT_ADDRESS = '0xa5c3c7207B4362431bD02D0E02af3B8a73Bb35eD';

const switchToRiseTestnet = async () => {
  const chainIdHex = '0xaa39db'; // 11155931 in hex
  const ethereum = window.ethereum as unknown as Eip1193Provider;

  try {
    await ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: chainIdHex }],
    });
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
      } catch (addError) {
        console.error('Error adding Rise Testnet:', addError);
      }
    } else {
      console.error('Error switching network:', switchError);
    }
  }
};

export default function NFTMetadata() {
  const [tokenId, setTokenId] = useState<string>('1');
  const [metadata, setMetadata] = useState<NFTMetadata | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);

  const { walletProvider } = useAppKitProvider<'eip1193'>('eip155');

  // Function to get the current chain ID
  const getChainId = async () => {
    if (walletProvider && (walletProvider as any).request) {
      try {
        const id = await (walletProvider as any).request({ method: 'eth_chainId' });
        const numericId = parseInt(id, 16);
        setChainId(numericId);
      } catch (e) {
        console.error('Failed to fetch chain ID:', e);
      }
    }
  };

  const fetchMetadata = async () => {
    if (!tokenId || !walletProvider) return;

    setLoading(true);
    setError(null);

    try {
      const ethersProvider = new BrowserProvider(walletProvider as unknown as Eip1193Provider);
      const contract = new Contract(NFT_CONTRACT_ADDRESS, ERC721_ABI, ethersProvider);

      const tokenURI = await contract.tokenURI(tokenId);

      let metadataUrl = tokenURI;
      if (tokenURI.startsWith('ipfs://')) {
        metadataUrl = `https://ipfs.io/ipfs/${tokenURI.replace('ipfs://', '')}`;
      } else if (!tokenURI.startsWith('http')) {
        metadataUrl = `https://ipfs.io/ipfs/${tokenURI}`;
      }

      const response = await fetch(metadataUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch metadata');
      }

      const metadata = await response.json();
      setMetadata(metadata);
    } catch (err) {
      console.error('Error fetching NFT metadata:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getChainId();
  }, [walletProvider]);

  useEffect(() => {
    if (walletProvider && chainId === 11155931) {
      fetchMetadata();
    }
  }, [tokenId, walletProvider, chainId]);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10">
      <h2 className="text-2xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
        NFT Metadata Explorer
      </h2>

      <div className="mb-6">
        <label className="block text-gray-300 mb-2">Token ID</label>
        <input
          type="text"
          value={tokenId}
          onChange={(e) => setTokenId(e.target.value)}
          className="w-full bg-white/5 text-white rounded-lg px-4 py-2 border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        />
      </div>

      <button
        onClick={fetchMetadata}
        disabled={loading || chainId !== 11155931}
        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white disabled:opacity-50"
      >
        {loading ? 'Loading...' : 'Fetch Metadata'}
      </button>

      {chainId !== 11155931 && (
        <div className="mt-4 p-3 bg-yellow-500/10 text-yellow-300 rounded-lg">
          Please switch to <strong>RISE Testnet</strong> to view your NFTs.
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-500/10 text-red-300 rounded-lg">
          Error: {error}
        </div>
      )}

      {metadata && chainId === 11155931 && (
        <div className="mt-6 p-4 bg-white/5 rounded-lg">
          <h3 className="text-xl font-semibold mb-3 text-white">Metadata</h3>
          <pre className="text-sm text-gray-300 overflow-auto max-h-96">
            {JSON.stringify(metadata, null, 2)}
          </pre>

          {metadata.image && (
            <div className="mt-4">
              <h4 className="text-lg font-medium mb-2 text-white">Image</h4>
              <div className="max-w-xs">
                <img
                  src={metadata.image.startsWith('ipfs://')
                    ? `https://ipfs.io/ipfs/${metadata.image.replace('ipfs://', '')}`
                    : metadata.image}
                  alt="NFT"
                  className="rounded-lg border border-white/10"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
