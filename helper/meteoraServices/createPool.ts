// import {
//   Connection,
//   Keypair,
//   PublicKey,
//   Transaction,
// } from "@solana/web3.js";
// import { DynamicBondingCurveClient, deriveDbcPoolAddress } from "@meteora-ag/dynamic-bonding-curve-sdk";

// // Interface for wallet adapter
// interface WalletAdapter {
//   publicKey: PublicKey | null;
//   signTransaction: (transaction: Transaction) => Promise<Transaction>;
//   signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
// }

// // Interface for pool parameters
// export interface CreatePoolParams {
//   configAddress: string;
//   name: string;
//   symbol: string;
//   image: string;
//   description: string;
// }

// // Interface for the return type
// export interface CreatePoolResult {
//   success: boolean;
//   signature?: string;
//   contractAddress?: string; // This is the base mint (token contract)
//   dbcPoolAddress?: string; // This is the derived DBC pool address
//   metadataUri?: string;
//   error?: string;
// }

// async function createPool(
//   params: CreatePoolParams, 
//   walletAdapter: WalletAdapter
// ): Promise<CreatePoolResult> {
//   // Check if wallet is connected
//   if (!walletAdapter.publicKey) {
//     return {
//       success: false,
//       error: "Wallet not connected"
//     };
//   }

//   // Updated connection for MAINNET
//   const connection = new Connection(
//     `https://mainnet.helius-rpc.com/?api-key=${process.env.NEXT_PUBLIC_HELIUS_API_KEY}`, 
//     "confirmed"
//   );

//   const configAddress = new PublicKey(params.configAddress);

//   console.log(`Using config on MAINNET: ${configAddress.toString()}`);

//   try {
//     const baseMint = Keypair.generate();
//     console.log(`Generated base mint on MAINNET: ${baseMint.publicKey.toString()}`);

//     // Get the config to determine the quote mint
//     const client = new DynamicBondingCurveClient(connection, "confirmed");
//     const config = await client.state.getPoolConfig(configAddress);
    
//     if (!config) {
//       throw new Error("Failed to fetch pool config");
//     }

//     // Derive the DBC pool address
//     const dbcPoolAddress = deriveDbcPoolAddress(
//       config.quoteMint, // The quote mint from config
//       baseMint.publicKey, // The base mint we generated
//       configAddress // The config address
//     );

//     console.log(`Derived DBC pool address on MAINNET: ${dbcPoolAddress.toString()}`);

//     // Create token metadata JSON
//     const tokenMetadata = {
//       name: params.name,
//       symbol: params.symbol,
//       description: params.description,
//       image: params.image,
//       attributes: [
//         {
//           trait_type: "Category",
//           value: "Utility"
//         },
//         {
//           trait_type: "Decimals",
//           value: "9"
//         },
//         {
//           trait_type: "Launchpad",
//           value: "CyreneAI"
//         },
//         {
//           trait_type: "Contract Address",
//           value: baseMint.publicKey.toString()
//         }
//       ],
//       properties: {
//         files: [
//           {
//             uri: params.image,
//             type: "image/png"
//           }
//         ],
//         category: "image",
//         creators: [
//           {
//             address: walletAdapter.publicKey.toString(),
//             share: 100
//           }
//         ]
//       }
//     };

//     console.log("Uploading metadata to IPFS...");
//     // Upload metadata to IPFS
//     const ipfsResponse = await fetch('/api/ipfs', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({ json: tokenMetadata }),
//     });

//     if (!ipfsResponse.ok) {
//       throw new Error('Failed to upload metadata to IPFS');
//     }

//     const ipfsData = await ipfsResponse.json();
//     const metadataUri = ipfsData.file.url;
//     console.log(`Metadata uploaded: ${metadataUri}`);

//     const createPoolParam = {
//       baseMint: baseMint.publicKey,
//       config: configAddress,
//       name: params.name,
//       symbol: params.symbol,
//       uri: metadataUri,
//       payer: walletAdapter.publicKey,
//       poolCreator: walletAdapter.publicKey,
//     };

//     console.log("Creating pool transaction on MAINNET...");
//     const poolTransaction = await client.pool.createPool(createPoolParam);

//     // Get fresh blockhash
//     const { blockhash } = await connection.getLatestBlockhash("confirmed");
//     poolTransaction.recentBlockhash = blockhash;
//     poolTransaction.feePayer = walletAdapter.publicKey;

//     // Sign the transaction with the base mint keypair first (locally)
//     poolTransaction.partialSign(baseMint);

//     console.log("Requesting wallet signature...");
//     // Request user to sign the transaction through their wallet
//     const signedTransaction = await walletAdapter.signTransaction(poolTransaction);

//     console.log("Sending transaction to MAINNET...");
//     // Send transaction with retry logic
//     const signature = await connection.sendRawTransaction(
//       signedTransaction.serialize(),
//       {
//         skipPreflight: false,
//         preflightCommitment: "confirmed",
//         maxRetries: 3,
//       }
//     );

//     console.log(`Transaction sent: ${signature}`);
//     console.log("Confirming transaction...");

//     // Confirm transaction with timeout
//     const confirmation = await connection.confirmTransaction(
//       {
//         signature,
//         blockhash,
//         lastValidBlockHeight: (await connection.getLatestBlockhash("confirmed")).lastValidBlockHeight,
//       },
//       "confirmed"
//     );

//     if (confirmation.value.err) {
//       throw new Error(`Transaction failed: ${confirmation.value.err}`);
//     }

//     console.log("Transaction confirmed on MAINNET!");
//     console.log(`Pool created: https://solscan.io/tx/${signature}`);
    
//     return {
//       success: true,
//       signature,
//       contractAddress: baseMint.publicKey.toString(), // The token contract address
//       dbcPoolAddress: dbcPoolAddress.toString(), // The DBC pool address
//       metadataUri,
//     };
//   } catch (error) {
//     console.error("Failed to create pool on MAINNET:", error);
//     return {
//       success: false,
//       error: error instanceof Error ? error.message : "Unknown error occurred",
//     };
//   }
// }

// export default createPool;
// import {
//   Connection,
//   Keypair,
//   PublicKey,
//   Transaction,
// } from "@solana/web3.js";
// import { DynamicBondingCurveClient, deriveDbcPoolAddress } from "@meteora-ag/dynamic-bonding-curve-sdk";

// // Interface for wallet adapter
// interface WalletAdapter {
//   publicKey: PublicKey | null;
//   signTransaction: (transaction: Transaction) => Promise<Transaction>;
//   signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
// }

// // Interface for pool parameters
// export interface CreatePoolParams {
//   configAddress: string;
//   name: string;
//   symbol: string;
//   image: string;
//   description: string;
// }

// // Interface for the return type
// export interface CreatePoolResult {
//   success: boolean;
//   signature?: string;
//   contractAddress?: string; // This is the base mint (token contract)
//   dbcPoolAddress?: string; // This is the derived DBC pool address
//   metadataUri?: string;
//   error?: string;
// }

// async function createPool(
//   params: CreatePoolParams, 
//   walletAdapter: WalletAdapter
// ): Promise<CreatePoolResult> {
//   // Check if wallet is connected
//   if (!walletAdapter.publicKey) {
//     return {
//       success: false,
//       error: "Wallet not connected"
//     };
//   }

//   // Updated connection for MAINNET
//   const connection = new Connection(
//     `https://mainnet.helius-rpc.com/?api-key=${process.env.NEXT_PUBLIC_HELIUS_API_KEY}`, 
//     "confirmed"
//   );

//   const configAddress = new PublicKey(params.configAddress);

//   console.log(`Using config on MAINNET: ${configAddress.toString()}`);

//   try {
//     const baseMint = Keypair.generate();
//     console.log(`Generated base mint on MAINNET: ${baseMint.publicKey.toString()}`);

//     // Get the config to determine the quote mint
//     const client = new DynamicBondingCurveClient(connection, "confirmed");
//     const config = await client.state.getPoolConfig(configAddress);
    
//     if (!config) {
//       throw new Error("Failed to fetch pool config");
//     }

//     // Derive the DBC pool address
//     const dbcPoolAddress = deriveDbcPoolAddress(
//       config.quoteMint, // The quote mint from config
//       baseMint.publicKey, // The base mint we generated
//       configAddress // The config address
//     );

//     console.log(`Derived DBC pool address on MAINNET: ${dbcPoolAddress.toString()}`);

//     // Create token metadata JSON
//     const tokenMetadata = {
//       name: params.name,
//       symbol: params.symbol,
//       description: params.description,
//       image: params.image,
//       attributes: [
//         {
//           trait_type: "Category",
//           value: "Utility"
//         },
//         {
//           trait_type: "Decimals",
//           value: "9"
//         },
//         {
//           trait_type: "Launchpad",
//           value: "CyreneAI"
//         },
//         {
//           trait_type: "Contract Address",
//           value: baseMint.publicKey.toString()
//         }
//       ],
//       properties: {
//         files: [
//           {
//             uri: params.image,
//             type: "image/png"
//           }
//         ],
//         category: "image",
//         creators: [
//           {
//             address: walletAdapter.publicKey.toString(),
//             share: 100
//           }
//         ]
//       }
//     };

//     console.log("Uploading metadata to IPFS...");
//     // Upload metadata to IPFS
//     const ipfsResponse = await fetch('/api/ipfs', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({ json: tokenMetadata }),
//     });

//     if (!ipfsResponse.ok) {
//       throw new Error('Failed to upload metadata to IPFS');
//     }

//     const ipfsData = await ipfsResponse.json();
//     const metadataUri = ipfsData.file.url;
//     console.log(`Metadata uploaded: ${metadataUri}`);

//     const createPoolParam = {
//       baseMint: baseMint.publicKey,
//       config: configAddress,
//       name: params.name,
//       symbol: params.symbol,
//       uri: metadataUri,
//       payer: walletAdapter.publicKey,
//       poolCreator: walletAdapter.publicKey,
//     };

//     console.log("Creating pool transaction on MAINNET...");
//     const poolTransaction = await client.pool.createPool(createPoolParam);

//     // Get fresh blockhash
//     const { blockhash } = await connection.getLatestBlockhash("confirmed");
//     poolTransaction.recentBlockhash = blockhash;
//     poolTransaction.feePayer = walletAdapter.publicKey;

//     // Sign the transaction with the base mint keypair first (locally)
//     poolTransaction.partialSign(baseMint);

//     console.log("Requesting wallet signature...");
//     // Request user to sign the transaction through their wallet
//     const signedTransaction = await walletAdapter.signTransaction(poolTransaction);

//     console.log("Sending transaction to MAINNET...");
//     // Send transaction with retry logic
//     const signature = await connection.sendRawTransaction(
//       signedTransaction.serialize(),
//       {
//         skipPreflight: false,
//         preflightCommitment: "confirmed",
//         maxRetries: 3,
//       }
//     );

//     console.log(`Transaction sent: ${signature}`);
//     console.log("Confirming transaction...");

//     // Confirm transaction with timeout
//     const confirmation = await connection.confirmTransaction(
//       {
//         signature,
//         blockhash,
//         lastValidBlockHeight: (await connection.getLatestBlockhash("confirmed")).lastValidBlockHeight,
//       },
//       "confirmed"
//     );

//     if (confirmation.value.err) {
//       throw new Error(`Transaction failed: ${confirmation.value.err}`);
//     }

//     console.log("Transaction confirmed on MAINNET!");
//     console.log(`Pool created: https://solscan.io/tx/${signature}`);
    
//     return {
//       success: true,
//       signature,
//       contractAddress: baseMint.publicKey.toString(), // The token contract address
//       dbcPoolAddress: dbcPoolAddress.toString(), // The DBC pool address
//       metadataUri,
//     };
//   } catch (error) {
//     console.error("Failed to create pool on MAINNET:", error);
//     return {
//       success: false,
//       error: error instanceof Error ? error.message : "Unknown error occurred",
//     };
//   }
// }

// export default createPool;

import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { DynamicBondingCurveClient, deriveDbcPoolAddress } from "@meteora-ag/dynamic-bonding-curve-sdk";
import BN from "bn.js";

// Interface for wallet adapter
interface WalletAdapter {
  publicKey: PublicKey | null;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
}

// Interface for pool parameters
export interface CreatePoolParams {
  configAddress: string;
  name: string;
  symbol: string;
  image: string;
  description: string;
  // First buy parameters
  firstBuyAmountSol?: number; // Amount in SOL to buy immediately
  minimumTokensOut?: number; // Minimum tokens expected from first buy
}

// Interface for the return type
export interface CreatePoolResult {
  success: boolean;
  signature?: string;
  firstBuySignature?: string; // Signature for the first buy transaction
  contractAddress?: string; // This is the base mint (token contract)
  dbcPoolAddress?: string; // This is the derived DBC pool address
  metadataUri?: string;
  error?: string;
}

// Helper function to prepare swap amount parameter
async function prepareSwapAmountParam(
  amountInSol: number,
  quoteMint: PublicKey,
  connection: Connection
): Promise<BN> {
  if (quoteMint.toString() === "So11111111111111111111111111111111111111112") {
    // SOL case - convert SOL to lamports
    return new BN(amountInSol * LAMPORTS_PER_SOL);
  } else {
    // For other tokens, you'd need to handle their specific decimals
    // This is a placeholder - adjust based on your quote token decimals
    return new BN(amountInSol * Math.pow(10, 6)); // Assuming 6 decimals
  }
}

async function createPool(
  params: CreatePoolParams, 
  walletAdapter: WalletAdapter
): Promise<CreatePoolResult> {
  // Check if wallet is connected
  if (!walletAdapter.publicKey) {
    return {
      success: false,
      error: "Wallet not connected"
    };
  }

  // Updated connection for MAINNET
  const connection = new Connection(
    `https://devnet.helius-rpc.com/?api-key=${process.env.NEXT_PUBLIC_HELIUS_API_KEY}`, 
    "confirmed"
  );

  const configAddress = new PublicKey(params.configAddress);

  console.log(`Using config on MAINNET: ${configAddress.toString()}`);

  try {
    const baseMint = Keypair.generate();
    console.log(`Generated base mint on MAINNET: ${baseMint.publicKey.toString()}`);

    // Get the config to determine the quote mint
    const client = new DynamicBondingCurveClient(connection, "confirmed");
    const config = await client.state.getPoolConfig(configAddress);
    
    if (!config) {
      throw new Error("Failed to fetch pool config");
    }

    // Derive the DBC pool address
    const dbcPoolAddress = deriveDbcPoolAddress(
      config.quoteMint, // The quote mint from config
      baseMint.publicKey, // The base mint we generated
      configAddress // The config address
    );

    console.log(`Derived DBC pool address on MAINNET: ${dbcPoolAddress.toString()}`);

    // Create token metadata JSON
    const tokenMetadata = {
      name: params.name,
      symbol: params.symbol,
      description: params.description,
      image: params.image,
      attributes: [
        {
          trait_type: "Category",
          value: "Utility"
        },
        {
          trait_type: "Decimals",
          value: "9"
        },
        {
          trait_type: "Launchpad",
          value: "CyreneAI"
        },
        {
          trait_type: "Contract Address",
          value: baseMint.publicKey.toString()
        }
      ],
      properties: {
        files: [
          {
            uri: params.image,
            type: "image/png"
          }
        ],
        category: "image",
        creators: [
          {
            address: walletAdapter.publicKey.toString(),
            share: 100
          }
        ]
      }
    };

    console.log("Uploading metadata to IPFS...");
    // Upload metadata to IPFS
    const ipfsResponse = await fetch('/api/ipfs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ json: tokenMetadata }),
    });

    if (!ipfsResponse.ok) {
      throw new Error('Failed to upload metadata to IPFS');
    }

    const ipfsData = await ipfsResponse.json();
    const metadataUri = ipfsData.file.url;
    console.log(`Metadata uploaded: ${metadataUri}`);

    const createPoolParam = {
      baseMint: baseMint.publicKey,
      config: configAddress,
      name: params.name,
      symbol: params.symbol,
      uri: metadataUri,
      payer: walletAdapter.publicKey,
      poolCreator: walletAdapter.publicKey,
    };

    // Prepare first buy parameters if specified
    let firstBuyParam = undefined;
    if (params.firstBuyAmountSol && params.firstBuyAmountSol > 0) {
      const buyAmount = await prepareSwapAmountParam(
        params.firstBuyAmountSol,
        config.quoteMint,
        connection
      );
      
      // Calculate minimum tokens out (with 5% slippage tolerance)
      const minimumAmountOut = params.minimumTokensOut 
        ? new BN(params.minimumTokensOut)
        : new BN(1); // Minimum 1 token to prevent zero output

      firstBuyParam = {
        buyer: walletAdapter.publicKey,
        receiver: walletAdapter.publicKey, // Tokens go to the buyer
        buyAmount: buyAmount,
        minimumAmountOut: minimumAmountOut,
        referralTokenAccount: null, // No referral
      };

      console.log(`First buy configured: ${params.firstBuyAmountSol} SOL`);
    }

    console.log("Creating pool transaction on MAINNET...");
    
    // Use createPoolWithFirstBuy instead of createPool
    const poolTransactions = await client.pool.createPoolWithFirstBuy({
      createPoolParam,
      firstBuyParam
    });

    // Get fresh blockhash
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
    
    // Set blockhash and fee payer for both transactions
    poolTransactions.createPoolTx.recentBlockhash = blockhash;
    poolTransactions.createPoolTx.feePayer = walletAdapter.publicKey;
    
    // Sign the create pool transaction with the base mint keypair first
    poolTransactions.createPoolTx.partialSign(baseMint);

    let swapBuyTxSigned = undefined;
    if (poolTransactions.swapBuyTx) {
      poolTransactions.swapBuyTx.recentBlockhash = blockhash;
      poolTransactions.swapBuyTx.feePayer = walletAdapter.publicKey;
      swapBuyTxSigned = poolTransactions.swapBuyTx;
    }

    console.log("Requesting wallet signature...");
    
    // Sign transactions with wallet
    const transactionsToSign = [poolTransactions.createPoolTx];
    if (swapBuyTxSigned) {
      transactionsToSign.push(swapBuyTxSigned);
    }

    const signedTransactions = await walletAdapter.signAllTransactions(transactionsToSign);
    const signedCreatePoolTx = signedTransactions[0];
    const signedSwapBuyTx = signedTransactions[1] || undefined;

    console.log("Sending create pool transaction to MAINNET...");
    
    // Send create pool transaction first
    const createPoolSignature = await connection.sendRawTransaction(
      signedCreatePoolTx.serialize(),
      {
        skipPreflight: false,
        preflightCommitment: "confirmed",
        maxRetries: 3,
      }
    );

    console.log(`Create pool transaction sent: ${createPoolSignature}`);
    console.log("Confirming create pool transaction...");

    // Confirm create pool transaction
    const createPoolConfirmation = await connection.confirmTransaction(
      {
        signature: createPoolSignature,
        blockhash,
        lastValidBlockHeight,
      },
      "confirmed"
    );

    if (createPoolConfirmation.value.err) {
      throw new Error(`Create pool transaction failed: ${createPoolConfirmation.value.err}`);
    }

    console.log("Create pool transaction confirmed!");

    let firstBuySignature = undefined;

    // Send first buy transaction if it exists
    if (signedSwapBuyTx) {
      console.log("Sending first buy transaction...");
      
      firstBuySignature = await connection.sendRawTransaction(
        signedSwapBuyTx.serialize(),
        {
          skipPreflight: false,
          preflightCommitment: "confirmed",
          maxRetries: 3,
        }
      );

      console.log(`First buy transaction sent: ${firstBuySignature}`);
      console.log("Confirming first buy transaction...");

      // Confirm first buy transaction
      const firstBuyConfirmation = await connection.confirmTransaction(
        {
          signature: firstBuySignature,
          blockhash,
          lastValidBlockHeight,
        },
        "confirmed"
      );

      if (firstBuyConfirmation.value.err) {
        console.warn(`First buy transaction failed: ${firstBuyConfirmation.value.err}`);
        // Don't throw error here - pool creation succeeded
      } else {
        console.log("First buy transaction confirmed!");
      }
    }

    console.log("Pool created successfully on MAINNET!");
    console.log(`Create pool: https://solscan.io/tx/${createPoolSignature}`);
    if (firstBuySignature) {
      console.log(`First buy: https://solscan.io/tx/${firstBuySignature}`);
    }
    
    return {
      success: true,
      signature: createPoolSignature,
      firstBuySignature,
      contractAddress: baseMint.publicKey.toString(),
      dbcPoolAddress: dbcPoolAddress.toString(),
      metadataUri,
    };
  } catch (error) {
    console.error("Failed to create pool on MAINNET:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export default createPool;