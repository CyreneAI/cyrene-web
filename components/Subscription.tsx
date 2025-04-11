'use client';

import { useAppKitProvider } from "@reown/appkit/react";
import { Contract, BrowserProvider } from "ethers";
import type { Provider } from "@reown/appkit/react";
import { useEffect, useState, useCallback } from "react";

const subscriptionSC = "0xFb323A5F6ffD982cF1A4b08B826B62c07ae91620";
const subscriptionABI = [
    {
        "inputs": [],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "inputs": [],
        "name": "AccessControlBadConfirmation",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "account",
                "type": "address"
            },
            {
                "internalType": "bytes32",
                "name": "neededRole",
                "type": "bytes32"
            }
        ],
        "name": "AccessControlUnauthorizedAccount",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "sender",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "tokenId",
                "type": "uint256"
            },
            {
                "internalType": "address",
                "name": "owner",
                "type": "address"
            }
        ],
        "name": "ERC721IncorrectOwner",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "operator",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "tokenId",
                "type": "uint256"
            }
        ],
        "name": "ERC721InsufficientApproval",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "approver",
                "type": "address"
            }
        ],
        "name": "ERC721InvalidApprover",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "operator",
                "type": "address"
            }
        ],
        "name": "ERC721InvalidOperator",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "owner",
                "type": "address"
            }
        ],
        "name": "ERC721InvalidOwner",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "receiver",
                "type": "address"
            }
        ],
        "name": "ERC721InvalidReceiver",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "sender",
                "type": "address"
            }
        ],
        "name": "ERC721InvalidSender",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "tokenId",
                "type": "uint256"
            }
        ],
        "name": "ERC721NonexistentToken",
        "type": "error"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "owner",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "approved",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "tokenId",
                "type": "uint256"
            }
        ],
        "name": "Approval",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "owner",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "operator",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "bool",
                "name": "approved",
                "type": "bool"
            }
        ],
        "name": "ApprovalForAll",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "bytes32",
                "name": "role",
                "type": "bytes32"
            },
            {
                "indexed": true,
                "internalType": "bytes32",
                "name": "previousAdminRole",
                "type": "bytes32"
            },
            {
                "indexed": true,
                "internalType": "bytes32",
                "name": "newAdminRole",
                "type": "bytes32"
            }
        ],
        "name": "RoleAdminChanged",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "bytes32",
                "name": "role",
                "type": "bytes32"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "account",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "sender",
                "type": "address"
            }
        ],
        "name": "RoleGranted",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "bytes32",
                "name": "role",
                "type": "bytes32"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "account",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "sender",
                "type": "address"
            }
        ],
        "name": "RoleRevoked",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "tokenId",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "newExpirationTime",
                "type": "uint256"
            }
        ],
        "name": "SubscriptionExtended",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "tokenId",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "owner",
                "type": "address"
            }
        ],
        "name": "SubscriptionRevoked",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "tokenId",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "owner",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "expirationTime",
                "type": "uint256"
            }
        ],
        "name": "SubscriptionStart",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "from",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "to",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "tokenId",
                "type": "uint256"
            }
        ],
        "name": "Transfer",
        "type": "event"
    },
    {
        "inputs": [],
        "name": "ADMIN_ROLE",
        "outputs": [
            {
                "internalType": "bytes32",
                "name": "",
                "type": "bytes32"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "DEFAULT_ADMIN_ROLE",
        "outputs": [
            {
                "internalType": "bytes32",
                "name": "",
                "type": "bytes32"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "DEFAULT_SUBSCRIPTION_PERIOD",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "OPERATOR_ROLE",
        "outputs": [
            {
                "internalType": "bytes32",
                "name": "",
                "type": "bytes32"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "activeTokenURI",
        "outputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "to",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "tokenId",
                "type": "uint256"
            }
        ],
        "name": "approve",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "owner",
                "type": "address"
            }
        ],
        "name": "balanceOf",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "counter",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "to",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "expirationTime",
                "type": "uint256"
            }
        ],
        "name": "delegateStartSubscription",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "name": "expiration",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "expiredTokenURI",
        "outputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "tokenId",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "newExpirationTime",
                "type": "uint256"
            }
        ],
        "name": "extendSubscription",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "tokenId",
                "type": "uint256"
            }
        ],
        "name": "getApproved",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "role",
                "type": "bytes32"
            }
        ],
        "name": "getRoleAdmin",
        "outputs": [
            {
                "internalType": "bytes32",
                "name": "",
                "type": "bytes32"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "role",
                "type": "bytes32"
            },
            {
                "internalType": "address",
                "name": "account",
                "type": "address"
            }
        ],
        "name": "grantRole",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "role",
                "type": "bytes32"
            },
            {
                "internalType": "address",
                "name": "account",
                "type": "address"
            }
        ],
        "name": "hasRole",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "owner",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "operator",
                "type": "address"
            }
        ],
        "name": "isApprovedForAll",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "tokenId",
                "type": "uint256"
            }
        ],
        "name": "isValid",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "name",
        "outputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "tokenId",
                "type": "uint256"
            }
        ],
        "name": "ownerOf",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "role",
                "type": "bytes32"
            },
            {
                "internalType": "address",
                "name": "callerConfirmation",
                "type": "address"
            }
        ],
        "name": "renounceRole",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "role",
                "type": "bytes32"
            },
            {
                "internalType": "address",
                "name": "account",
                "type": "address"
            }
        ],
        "name": "revokeRole",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "tokenId",
                "type": "uint256"
            }
        ],
        "name": "revokeSubscription",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "from",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "to",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "tokenId",
                "type": "uint256"
            }
        ],
        "name": "safeTransferFrom",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "from",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "to",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "tokenId",
                "type": "uint256"
            },
            {
                "internalType": "bytes",
                "name": "data",
                "type": "bytes"
            }
        ],
        "name": "safeTransferFrom",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "operator",
                "type": "address"
            },
            {
                "internalType": "bool",
                "name": "approved",
                "type": "bool"
            }
        ],
        "name": "setApprovalForAll",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "activeURI",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "expiredURI",
                "type": "string"
            }
        ],
        "name": "setTokenURI",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "startSubscription",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "bytes4",
                "name": "interfaceId",
                "type": "bytes4"
            }
        ],
        "name": "supportsInterface",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "symbol",
        "outputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "tokenId",
                "type": "uint256"
            }
        ],
        "name": "tokenURI",
        "outputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "from",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "to",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "tokenId",
                "type": "uint256"
            }
        ],
        "name": "transferFrom",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

export default function StartSubscription() {
    const { walletProvider } = useAppKitProvider<Provider>("eip155");
    const [loading, setLoading] = useState(false);
    const [txHash, setTxHash] = useState("");
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [checkingStatus, setCheckingStatus] = useState(true);
    const [tokenId, setTokenId] = useState<bigint | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [canSubscribe, setCanSubscribe] = useState(false);
    const [expirationTime, setExpirationTime] = useState<number | null>(null);
    const [daysRemaining, setDaysRemaining] = useState<number | null>(null);

  const checkSubscriptionStatus = useCallback(async () => {
    if (!walletProvider) return;

    try {
      setCheckingStatus(true);
      setError(null);
      const provider = new BrowserProvider(walletProvider);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();
      const contract = new Contract(subscriptionSC, subscriptionABI, provider);

      // Check if user has any tokens
      const balance = await contract.balanceOf(userAddress);
      
      if (balance > BigInt(0)) {
        // Try to find the user's token ID
        const foundTokenId = await getOwnedTokenId(contract, userAddress);
        
        if (foundTokenId !== null) {
          setTokenId(foundTokenId);
          const expiry = await contract.expiration(foundTokenId);
          const expiryNumber = Number(expiry);
          setExpirationTime(expiryNumber);
          
          // Calculate days remaining
          const now = Math.floor(Date.now() / 1000);
          const secondsRemaining = expiryNumber - now;
          const days = Math.floor(secondsRemaining / (60 * 60 * 24));
          setDaysRemaining(days > 0 ? days : 0);
          
          // Check if subscription is valid
          try {
            const valid = await contract.isValid(foundTokenId);
            setIsSubscribed(valid);
            setCanSubscribe(!valid);
          } catch {
            setIsSubscribed(false);
            setCanSubscribe(true);
          }
          return;
        }
      }
      
      // If no token found or balance is 0
      setIsSubscribed(false);
      setCanSubscribe(true);
      setExpirationTime(null);
      setDaysRemaining(null);
    } catch (error) {
      console.error("Error checking subscription status:", error);
      setError("Failed to check subscription status");
      setIsSubscribed(false);
      setCanSubscribe(false);
    } finally {
      setCheckingStatus(false);
    }
  }, [walletProvider]);

  const getOwnedTokenId = async (contract: Contract, userAddress: string) => {
    const balance = await contract.balanceOf(userAddress);
    if (balance === BigInt(0)) return null;
  
    // Try to find the token ID by checking recent token IDs
    for (let i = BigInt(0); i < BigInt(10); i++) {
      try {
        const owner = await contract.ownerOf(i);
        if (owner.toLowerCase() === userAddress.toLowerCase()) {
          return i;
        }
      } catch {
        // Token doesn't exist, continue
      }
    }
    return null;
  };

  const formatExpirationDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  };

  const handleStartSubscription = async () => {
    if (!walletProvider) return;
  
    setLoading(true);
    setError(null);
  
    try {
      const provider = new BrowserProvider(walletProvider);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();
      const contract = new Contract(subscriptionSC, subscriptionABI, signer);
  
      const tx = await contract.startSubscription();
      setTxHash(tx.hash);
      await tx.wait();
      
      // Refresh status after successful subscription
      await checkSubscriptionStatus();
      alert("🎉 Subscription started successfully!");
    } catch (err: unknown) {
      console.error("Subscription failed", err);
      let errorMessage = "Subscription failed";
      
      if (err instanceof Error) {
        errorMessage = err.message.includes("user rejected transaction") 
          ? "❌ Transaction was cancelled" 
          : `❌ ${err.message}`;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      setError(errorMessage);
      await checkSubscriptionStatus();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSubscriptionStatus();
  }, [checkSubscriptionStatus]);

  return (
    <div className="max-w-md mx-auto p-6 bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border border-gray-700 shadow-xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-indigo-500/10 rounded-xl">
          <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Premium Subscription</h2>
          <p className="text-sm text-gray-400">Unlock exclusive Erebrus features</p>
        </div>
      </div>

      {/* Status Card */}
      <div className={`mb-6 p-5 rounded-xl border ${isSubscribed ? 'border-green-500/30 bg-green-900/10' : 'border-gray-700 bg-gray-800/50'}`}>
        {checkingStatus ? (
          <div className="flex items-center gap-3">
            <div className="animate-pulse h-4 w-4 rounded-full bg-blue-400"></div>
            <span className="text-gray-300">Checking your subscription status...</span>
          </div>
        ) : isSubscribed ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-1 bg-green-500/20 rounded-full">
                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="font-medium text-green-400">Active Subscription</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <p className="text-gray-400">Expiration</p>
                <p className="font-medium text-white">
                  {expirationTime ? formatExpirationDate(expirationTime) : '--'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-gray-400">Days Remaining</p>
                <p className={`font-medium ${daysRemaining && daysRemaining <= 7 ? 'text-yellow-400' : 'text-white'}`}>
                  {daysRemaining ?? '--'} {daysRemaining && daysRemaining <= 7 && '⏳'}
                </p>
              </div>
            </div>
            
            <div className="pt-3 border-t border-gray-700">
              <p className="text-sm text-gray-300">Enjoy your premium access to all Erebrus features</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-1 bg-yellow-500/20 rounded-full">
                <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <span className="font-medium text-yellow-400">No Active Subscription</span>
            </div>
            <p className="text-sm text-gray-300">
              Subscribe now to unlock premium features and exclusive content
            </p>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-3 flex items-start gap-2 bg-red-900/30 border border-red-700/50 rounded-lg">
          <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm text-red-300">{error}</span>
        </div>
      )}

      {/* Action Section */}
      <div className="space-y-4">
        {!isSubscribed && canSubscribe && (
          <button
            onClick={handleStartSubscription}
            disabled={loading || !walletProvider}
            className={`w-full py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all ${
              loading || !walletProvider
                ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-indigo-500/20"
            }`}
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : !walletProvider ? (
              "Connect Wallet to Subscribe"
            ) : (
              "Start Premium Subscription"
            )}
          </button>
        )}

        {txHash && (
          <a
            href={`https://explorer.rise-technology.com/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300"
          >
            View transaction details
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        )}
      </div>

      {/* Features List */}
      {!isSubscribed && (
        <div className="mt-8 pt-6 border-t border-gray-700">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Premium Benefits</h3>
          <ul className="space-y-3">
            {[
              "Unlimited access to all AI models",
              "Priority customer support",
              "Exclusive content and features",
              "Higher processing limits",
              "Ad-free experience"
            ].map((feature, index) => (
              <li key={index} className="flex items-start">
                <svg className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-300">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}