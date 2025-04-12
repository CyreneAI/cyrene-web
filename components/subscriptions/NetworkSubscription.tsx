'use client';

import { useAppKitProvider } from "@reown/appkit/react";
import { BrowserProvider } from "ethers";
import { useEffect, useState } from "react";
import RiseSubscription from "./rise/Subscription";
import MonadSubscription from "./monad/Subscription";
import { NETWORK_CONFIG } from "@/lib/networks";

// Define the EIP1193 provider interface with proper types
interface Eip1193Provider {
  request: <T = unknown>(args: { 
    method: string; 
    params?: unknown[] 
  }) => Promise<T>;
  on?: (event: string, listener: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, listener: (...args: unknown[]) => void) => void;
}

export default function NetworkSubscription() {
    const { walletProvider } = useAppKitProvider("eip155") as { 
        walletProvider: Eip1193Provider | null 
    };
    const [networkId, setNetworkId] = useState<number | null>(null);
    const [networkName, setNetworkName] = useState<string>("");
    
    useEffect(() => {
        if (!walletProvider) return;
        
        const detectNetwork = async () => {
            try {
                // Create provider with proper type assertion
                const provider = new BrowserProvider(
                    walletProvider as unknown as Eip1193Provider
                );
                const network = await provider.getNetwork();
                setNetworkId(Number(network.chainId));
                setNetworkName(network.name);
            } catch (error) {
                console.error("Failed to detect network:", error);
            }
        };
        
        detectNetwork();
    }, [walletProvider]);
    
    if (!walletProvider) {
        return (
            <div className="max-w-md mx-auto p-6 bg-gray-900 rounded-xl border border-gray-700">
                <div className="text-center text-gray-300">
                    Please connect your wallet to view subscription options
                </div>
            </div>
        );
    }

    if (!networkId) {
        return (
            <div className="max-w-md mx-auto p-6 bg-gray-900 rounded-xl border border-gray-700">
                <div className="text-center text-gray-300">
                    Detecting network...
                </div>
            </div>
        );
    }

    switch (networkId) {
        case 11155931: // Rise Testnet ID
            return <RiseSubscription />;
        case 10143: // Monad Testnet ID
            return <MonadSubscription />;
        default:
            return (
                <div className="max-w-md mx-auto p-6 bg-gray-900 rounded-xl border border-gray-700">
                    <div className="text-center text-yellow-400">
                        Subscription not available on {networkName}
                    </div>
                    <div className="mt-4 text-sm text-gray-400 text-center">
                        Please switch to Rise Testnet or Monad Testnet to subscribe
                    </div>
                </div>
            );
    }
}