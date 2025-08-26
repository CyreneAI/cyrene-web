// import { useState, useEffect, useRef } from 'react';
// import { Connection, PublicKey } from '@solana/web3.js';
// import { 
//   DynamicBondingCurveClient, 
//   deriveDammV1PoolAddress,
//   DAMM_V1_MIGRATION_FEE_ADDRESS 
// } from '@meteora-ag/dynamic-bonding-curve-sdk';
// import { QUOTE_MINTS, type QuoteMintType } from '@/helper/meteoraServices/createConfig';
// import { toast } from 'sonner';

// // Define the inputs the hook needs
// interface UsePoolStatusProps {
//   configAddress?: string | null;
//   contractAddress?: string | null;
//   dbcPoolAddress?: string | null;
//   quoteMint?: QuoteMintType | null;
//   onDammDerive: (dammPoolAddress: string) => void;
// }

// const connection = new Connection("https://api.devnet.solana.com", "confirmed");
// const client = new DynamicBondingCurveClient(connection, "confirmed");

// // Create a Map to track derivation status per pool address (instead of global object)
// const derivationStatusMap = new Map<string, boolean>();

// export const usePoolStatus = ({
//   configAddress,
//   contractAddress,
//   dbcPoolAddress,
//   quoteMint,
//   onDammDerive,
// }: UsePoolStatusProps) => {
//   const [isGraduated, setIsGraduated] = useState(false);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
  
//   // Use ref to track if component is mounted to prevent state updates after unmount
//   const isMountedRef = useRef(true);
  
//   // Cleanup on unmount
//   useEffect(() => {
//     return () => {
//       isMountedRef.current = false;
//     };
//   }, []);

//   useEffect(() => {
//     let intervalId: NodeJS.Timeout | null = null;
    
//     const checkStatusAndDerive = async () => {
//       if (!dbcPoolAddress || !configAddress || !contractAddress || !quoteMint) {
//         if (isMountedRef.current) {
//           setIsLoading(false);
//         }
//         return;
//       }

//       // Use the specific pool address as the unique key
//       const poolKey = dbcPoolAddress;
      
//       if (isMountedRef.current) {
//         setIsLoading(true);
//         setError(null);
//       }

//       try {
//         console.log(`Checking status for pool: ${poolKey}`);
        
//         // 1. Check the progress of the specific DBC pool
//         const dbcPoolPubkey = new PublicKey(dbcPoolAddress);
//         const progress = await client.state.getPoolCurveProgress(dbcPoolPubkey);
        
//         console.log(`Pool ${poolKey} progress: ${progress}`);

//         if (progress < 1) {
//           // Not graduated yet
//           console.log(`Pool ${poolKey} not graduated yet (${(progress * 100).toFixed(2)}%)`);
//           if (isMountedRef.current) {
//             setIsGraduated(false);
//           }
//           // Reset derivation status for this specific pool
//           derivationStatusMap.set(poolKey, false);
//         } else {
//           // Pool has graduated
//           console.log(`Pool ${poolKey} has graduated!`);
//           if (isMountedRef.current) {
//             setIsGraduated(true);
//           }
          
//           // Check if we've already derived the DAMM address for this specific pool
//           const hasAlreadyDerived = derivationStatusMap.get(poolKey) || false;
          
//           if (!hasAlreadyDerived) {
//             console.log(`Deriving DAMM V1 address for pool: ${poolKey}`);

//             // 2. Fetch the pool's configuration to get necessary details
//             const poolConfig = await client.state.getPoolConfig(new PublicKey(configAddress));
            
//             // 3. Get the specific DAMM config key based on the migration fee option
//             const dammConfigKey = DAMM_V1_MIGRATION_FEE_ADDRESS[poolConfig.migrationFeeOption];
//             if (!dammConfigKey) {
//               throw new Error(`Invalid migration fee option: ${poolConfig.migrationFeeOption}`);
//             }

//             // 4. Get the mint addresses for the token pair
//             const tokenAMint = new PublicKey(contractAddress);
//             const tokenBMint = new PublicKey(QUOTE_MINTS[quoteMint].address);

//             // 5. Derive the final DAMM V1 pool address
//             const dammV1PoolAddress = deriveDammV1PoolAddress(
//               dammConfigKey,
//               tokenAMint,
//               tokenBMint
//             );

//             console.log(`Derived DAMM V1 Pool Address for ${poolKey}: ${dammV1PoolAddress.toString()}`);

//             // 6. Mark that we've derived the address for this specific pool
//             derivationStatusMap.set(poolKey, true);
            
//             // 7. Call the callback to notify the parent component
//             if (isMountedRef.current) {
//               onDammDerive(dammV1PoolAddress.toString());
//             }
//           } else {
//             console.log(`DAMM address already derived for pool: ${poolKey}`);
//           }
//         }
//       } catch (err) {
//         const errorMessage = err instanceof Error ? err.message : "Failed to check pool status";
//         console.error(`Error checking status for pool ${poolKey}:`, errorMessage, err);
        
//         if (isMountedRef.current) {
//           setError(errorMessage);
//           toast.error(`Pool ${poolKey.slice(0, 8)}...: ${errorMessage}`);
//         }
//       } finally {
//         if (isMountedRef.current) {
//           setIsLoading(false);
//         }
//       }
//     };

//     // Initial check
//     checkStatusAndDerive();
    
//     // Set up polling only if the pool hasn't graduated or if we haven't derived the DAMM address yet
//     const poolKey = dbcPoolAddress || '';
//     const hasAlreadyDerived = derivationStatusMap.get(poolKey) || false;
    
//     if (poolKey && (!isGraduated || !hasAlreadyDerived)) {
//       console.log(`Starting polling for pool: ${poolKey}`);
//       intervalId = setInterval(checkStatusAndDerive, 10000); // Check every 10 seconds
//     } else {
//       console.log(`No polling needed for pool: ${poolKey} (graduated: ${isGraduated}, derived: ${hasAlreadyDerived})`);
//     }

//     // Cleanup function
//     return () => {
//       if (intervalId) {
//         console.log(`Stopping polling for pool: ${poolKey}`);
//         clearInterval(intervalId);
//       }
//     };
//   }, [dbcPoolAddress, configAddress, contractAddress, quoteMint, isGraduated, onDammDerive]);

//   return { isGraduated, isLoading, error };
// };


import { useState, useEffect, useRef } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import { 
  DynamicBondingCurveClient, 
  deriveDammV2PoolAddress,
  DAMM_V1_MIGRATION_FEE_ADDRESS 
} from '@meteora-ag/dynamic-bonding-curve-sdk';
import { QUOTE_MINTS, type QuoteMintType } from '@/helper/meteoraServices/createConfig';
import { toast } from 'sonner';

// Define the inputs the hook needs
interface UsePoolStatusProps {
  configAddress?: string | null;
  contractAddress?: string | null;
  dbcPoolAddress?: string | null;
  quoteMint?: QuoteMintType | null;
  onDammDerive: (dammPoolAddress: string) => void;
}

// UPDATED: Use mainnet connection
const connection = new Connection(`https://mainnet.helius-rpc.com/?api-key=${process.env.NEXT_PUBLIC_HELIUS_API_KEY}`, "confirmed"); // replace with helius rpc
const client = new DynamicBondingCurveClient(connection, "confirmed");

// Create a Map to track derivation status per pool address (instead of global object)
const derivationStatusMap = new Map<string, boolean>();

export const usePoolStatus = ({
  configAddress,
  contractAddress,
  dbcPoolAddress,
  quoteMint,
  onDammDerive,
}: UsePoolStatusProps) => {
  const [isGraduated, setIsGraduated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Use ref to track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    
    const checkStatusAndDerive = async () => {
      if (!dbcPoolAddress || !configAddress || !contractAddress || !quoteMint) {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
        return;
      }

      // Use the specific pool address as the unique key
      const poolKey = dbcPoolAddress;
      
      if (isMountedRef.current) {
        setIsLoading(true);
        setError(null);
      }

      try {
        console.log(`Checking MAINNET status for pool: ${poolKey}`);
        
        // 1. Check the progress of the specific DBC pool
        const dbcPoolPubkey = new PublicKey(dbcPoolAddress);
        const progress = await client.state.getPoolCurveProgress(dbcPoolPubkey);
        
        console.log(`Pool ${poolKey} progress on MAINNET: ${progress}`);

        if (progress < 1) {
          // Not graduated yet
          console.log(`Pool ${poolKey} not graduated yet (${(progress * 100).toFixed(2)}%)`);
          if (isMountedRef.current) {
            setIsGraduated(false);
          }
          // Reset derivation status for this specific pool
          derivationStatusMap.set(poolKey, false);
        } else {
          // Pool has graduated
          console.log(`Pool ${poolKey} has graduated on MAINNET!`);
          if (isMountedRef.current) {
            setIsGraduated(true);
          }
          
          // Check if we've already derived the DAMM address for this specific pool
          const hasAlreadyDerived = derivationStatusMap.get(poolKey) || false;
          
          if (!hasAlreadyDerived) {
            console.log(`Deriving DAMM V1 address for MAINNET pool: ${poolKey}`);

            // 2. Fetch the pool's configuration to get necessary details
            const poolConfig = await client.state.getPoolConfig(new PublicKey(configAddress));
            
            // 3. Get the specific DAMM config key based on the migration fee option
            const dammConfigKey = DAMM_V1_MIGRATION_FEE_ADDRESS[poolConfig.migrationFeeOption];
            if (!dammConfigKey) {
              throw new Error(`Invalid migration fee option: ${poolConfig.migrationFeeOption}`);
            }

            // 4. Get the mint addresses for the token pair
            const tokenAMint = new PublicKey(contractAddress);
            const tokenBMint = new PublicKey(QUOTE_MINTS[quoteMint].address);

            // 5. Derive the final DAMM V1 pool address
            const dammV1PoolAddress = deriveDammV2PoolAddress(
              dammConfigKey,
              tokenAMint,
              tokenBMint
            );

            console.log(`Derived DAMM V1 Pool Address for MAINNET ${poolKey}: ${dammV1PoolAddress.toString()}`);

            // 6. Mark that we've derived the address for this specific pool
            derivationStatusMap.set(poolKey, true);
            
            // 7. Call the callback to notify the parent component
            if (isMountedRef.current) {
              onDammDerive(dammV1PoolAddress.toString());
            }
          } else {
            console.log(`DAMM address already derived for MAINNET pool: ${poolKey}`);
          }
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to check pool status";
        console.error(`Error checking MAINNET status for pool ${poolKey}:`, errorMessage, err);
        
        if (isMountedRef.current) {
          setError(errorMessage);
          toast.error(`Pool ${poolKey.slice(0, 8)}...: ${errorMessage}`);
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    // Initial check
    checkStatusAndDerive();
    
    // Set up polling only if the pool hasn't graduated or if we haven't derived the DAMM address yet
    const poolKey = dbcPoolAddress || '';
    const hasAlreadyDerived = derivationStatusMap.get(poolKey) || false;
    
    if (poolKey && (!isGraduated || !hasAlreadyDerived)) {
      console.log(`Starting MAINNET polling for pool: ${poolKey}`);
      intervalId = setInterval(checkStatusAndDerive, 10000); // Check every 10 seconds
    } else {
      console.log(`No MAINNET polling needed for pool: ${poolKey} (graduated: ${isGraduated}, derived: ${hasAlreadyDerived})`);
    }

    // Cleanup function
    return () => {
      if (intervalId) {
        console.log(`Stopping MAINNET polling for pool: ${poolKey}`);
        clearInterval(intervalId);
      }
    };
  }, [dbcPoolAddress, configAddress, contractAddress, quoteMint, isGraduated, onDammDerive]);

  return { isGraduated, isLoading, error };
};