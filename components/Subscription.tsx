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
    <div className="p-4 flex flex-col items-start gap-4 bg-[#1f1f2e] text-white rounded-xl border border-purple-700 shadow-lg max-w-md">
      <h2 className="text-lg font-semibold">🚀 CyreneAI Subscription</h2>

      {error && (
        <div className="text-red-400 text-sm p-2 bg-red-900/20 rounded-md w-full">
          {error}
        </div>
      )}

      {checkingStatus ? (
        <p className="text-sm text-gray-400">Checking subscription status...</p>
      ) : isSubscribed && expirationTime ? (
        <div className="space-y-2 w-full">
          <p className="text-green-400 font-medium">✅ Active Subscription</p>
          
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-gray-300">Expires on:</div>
            <div className="text-white font-semibold">
              {formatExpirationDate(expirationTime)}
            </div>
            
            <div className="text-gray-300">Days remaining:</div>
            <div className={daysRemaining && daysRemaining <= 7 ? "text-yellow-400 font-semibold" : "text-white font-semibold"}>
              {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}
              {daysRemaining && daysRemaining <= 7 && ' (renew soon)'}
            </div>
          </div>

          <p className="text-sm text-purple-300 mt-2">Enjoy your exclusive access to Erebrus DVpn.</p>
          
          {txHash && (
            <a
              href={`https://explorer.rise-technology.com/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 text-sm underline"
            >
              View transaction
            </a>
          )}
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-300">
            {canSubscribe 
              ? "Subscribe to access exclusive features"
              : "Unable to verify subscription status"}
          </p>
          <button
            onClick={handleStartSubscription}
            disabled={loading || !walletProvider || !canSubscribe}
            className={`px-4 py-2 rounded-xl ${
              loading || !walletProvider || !canSubscribe
                ? "bg-gray-500 cursor-not-allowed"
                : "bg-purple-600 hover:bg-purple-700"
            }`}
          >
            {loading
              ? "Processing..."
              : !walletProvider
              ? "Connect Wallet"
              : !canSubscribe
              ? "Subscription Status Unknown"
              : "Start Subscription"}
          </button>
          {!canSubscribe && !isSubscribed && (
            <p className="text-sm text-yellow-400">
              Please wait while we verify your subscription status...
            </p>
          )}
        </>
      )}
    </div>
  );
}