// hooks/useWalletConnection.ts
import { useAppKitAccount } from '@reown/appkit/react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useEffect, useState } from 'react';

export const useWalletConnection = () => {
  // Ethereum wallet
  const { address: ethAddress, isConnected: isEthConnected } = useAppKitAccount();
  
  // Solana wallet
  const wallet = useWallet();
  const { publicKey: solAddress, connected: isSolConnected } = wallet;

  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  useEffect(() => {
    if (isEthConnected && ethAddress) {
      setWalletAddress(ethAddress);
    } else if (isSolConnected && solAddress) {
      setWalletAddress(solAddress.toBase58());
    } else {
      setWalletAddress(null);
    }
  }, [isEthConnected, isSolConnected, ethAddress, solAddress]);

  return {
    isConnected: isEthConnected || isSolConnected,
    walletAddress,
    ethAddress,
    solAddress: solAddress?.toBase58(),
    wallet // Full wallet object for Solana
  };
};