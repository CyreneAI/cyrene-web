// import {
//   PublicKey,
//   Connection,
//   Keypair,
//   Transaction,
// } from "@solana/web3.js";
// import { createMint } from "@solana/spl-token";
// import {
//   BaseFeeMode,
//   DynamicBondingCurveClient,
//   buildCurve,
// } from "@meteora-ag/dynamic-bonding-curve-sdk";

// // Initialize connection and client
// const connection = new Connection("https://api.devnet.solana.com", "confirmed");
// const client = new DynamicBondingCurveClient(connection, "confirmed");

// // Interface for wallet adapter (works with most Solana wallets)
// interface WalletAdapter {
//   publicKey: PublicKey | null;
//   signTransaction: (transaction: Transaction) => Promise<Transaction>;
//   signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
// }

// // Quote mint options
// export const QUOTE_MINTS = {
//   SOL: {
//     address: "So11111111111111111111111111111111111111112",
//     fullSymbol: "SOL",
//     decimals: 9,
//     name: "Solana",
//     coingeckoId: "solana"
//   },
//   CYAI: {
//     address: "6Tph3SxbAW12BSJdCevVV9Zujh97X69d5MJ4XjwKmray",
//     fullSymbol: "CYAI", 
//     decimals: 6,
//     name: "Cyrene AI",
//     coingeckoId: "cyrene-ai" // Replace with actual CoinGecko ID when available
//   }
// } as const;

// export type QuoteMintType = keyof typeof QUOTE_MINTS;

// // Interface for config parameters
// export interface CreateConfigParams {
//   totalTokenSupply: number;
//   migrationQuoteThreshold: number;
//   quoteMint: QuoteMintType; // Add quote mint selection
// }

// // Function to create a new mint and set up the pool
// export class createConfig {
//   public async setupConfig(
//     wallet: WalletAdapter,
//     params: CreateConfigParams
//   ): Promise<{
//     success: boolean;
//     signature?: string;
//     configAddress?: string;
//     error?: string;
//   }> {
//     try {
//       // Check if wallet is connected
//       if (!wallet.publicKey) {
//         throw new Error("Wallet not connected");
//       }

//       console.log("Connected wallet public key:", wallet.publicKey.toBase58());

//       // Get selected quote mint details
//       const selectedQuoteMint = QUOTE_MINTS[params.quoteMint];
//       console.log(`Using quote mint: ${selectedQuoteMint.name}`);

//       // Config Keypair Generate
//       let config = Keypair.generate();
//       console.log("Created config:", config.publicKey.toBase58());

//       // 1. Build the curve configuration (off-chain math)
//       const curveConfig = buildCurve({
//         totalTokenSupply: params.totalTokenSupply, // Taken from user input
//         percentageSupplyOnMigration: 20,
//         migrationQuoteThreshold: params.migrationQuoteThreshold, // Taken from user input
//         migrationOption: 1, // Option 1: DAMM V2
//         tokenBaseDecimal: 9, // 9 DECIMALS FOR MEME COIN
//         tokenQuoteDecimal: selectedQuoteMint.decimals, // Use selected quote mint decimals
//         lockedVestingParam: {
//           totalLockedVestingAmount: 0,
//           numberOfVestingPeriod: 0,
//           cliffUnlockAmount: 0,
//           totalVestingDuration: 0,
//           cliffDurationFromMigrationTime: 0,
//         },
//         baseFeeParams: {
//           baseFeeMode: BaseFeeMode.FeeSchedulerLinear,
//           feeSchedulerParam: {
//             startingFeeBps: 100,
//             endingFeeBps: 100,
//             numberOfPeriod: 0,
//             totalDuration: 0,
//           },
//         },
//         dynamicFeeEnabled: true,
//         activationType: 0,
//         collectFeeMode: 0, // 0: Quote Token
//         migrationFeeOption: 3, // 3: Fixed 200bps,
//         tokenType: 1, // Token2022
//         partnerLpPercentage: 0,
//         creatorLpPercentage: 0,
//         partnerLockedLpPercentage: 50,
//         creatorLockedLpPercentage: 50,
//         creatorTradingFeePercentage: 2,
//         leftover: 1,
//         tokenUpdateAuthority: 1,
//         migrationFee: {
//           feePercentage: 3,
//           creatorFeePercentage: 0,
//         },
//       });

//       // Create the config setup transaction
//       const configSetup = await client.partner.createConfig({
//         config: config.publicKey,
//         feeClaimer: new PublicKey("CWfBXH66Wa5JEPBYsqC3JWg1CLxaerumfX9e19pAwVRY"), // Stories wallet address
//         leftoverReceiver: new PublicKey("CWfBXH66Wa5JEPBYsqC3JWg1CLxaerumfX9e19pAwVRY"), // Stories wallet address
//         payer: wallet.publicKey, // Connected wallet address
//         quoteMint: new PublicKey(selectedQuoteMint.address), // Use selected quote mint
//         ...curveConfig,
//       });

//       console.log("Transaction created successfully");

//       // Get the latest blockhash
//       const { blockhash } = await connection.getLatestBlockhash("confirmed");
//       configSetup.recentBlockhash = blockhash;
//       configSetup.feePayer = wallet.publicKey;

//       // Sign with the config keypair first (this is done locally)
//       configSetup.partialSign(config);

//       console.log("Requesting wallet signature...");
      
//       // Request user to sign the transaction through their wallet
//       const signedTransaction = await wallet.signTransaction(configSetup);

//       console.log("Sending and confirming the transaction...");
      
//       // Send the signed transaction
//       const signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
//         skipPreflight: false,
//         preflightCommitment: "confirmed",
//       });

//       // Confirm the transaction
//       await connection.confirmTransaction(signature, "confirmed");

//       console.log("Config created successfully!");
//       console.log(`Transaction: https://solscan.io/tx/${signature}`);
//       console.log(`Config address: ${config.publicKey.toString()}`);

//       return {
//         success: true,
//         signature,
//         configAddress: config.publicKey.toString(),
//       };
//     } catch (error) {
//       console.error("Error creating config:", error);
//       return {
//         success: false,
//         error: error instanceof Error ? error.message : "Unknown error occurred",
//       };
//     }
//   }
// }

// // Alternative function for use with React components and wallet adapters
// export async function setupConfigWithWallet(
//   walletAdapter: WalletAdapter,
//   params: CreateConfigParams
// ): Promise<{
//   success: boolean;
//   signature?: string;
//   configAddress?: string;
//   error?: string;
// }> {
//   const configInstance = new createConfig();
//   return await configInstance.setupConfig(walletAdapter, params);
// }



import {
  PublicKey,
  Connection,
  Keypair,
  Transaction,
} from "@solana/web3.js";
import {
  BaseFeeMode,
  DynamicBondingCurveClient,
  buildCurve,
} from "@meteora-ag/dynamic-bonding-curve-sdk";

// Initialize connection and client for MAINNET
const connection = new Connection(`https://devnet.helius-rpc.com/?api-key=${process.env.NEXT_PUBLIC_HELIUS_API_KEY}`, "confirmed");// replace with helius r[c]
const client = new DynamicBondingCurveClient(connection, "confirmed");

// Interface for wallet adapter (works with most Solana wallets)
interface WalletAdapter {
  publicKey: PublicKey | null;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
}

// Quote mint options for MAINNET
export const QUOTE_MINTS = {
  SOL: {
    address: "So11111111111111111111111111111111111111112",
    fullSymbol: "SOL",
    decimals: 9,
    name: "Solana",
    coingeckoId: "solana"
  },
  CYAI: {
    address: "6Tph3SxbAW12BSJdCevVV9Zujh97X69d5MJ4XjwKmray", // Update this with actual mainnet CYAI address
    fullSymbol: "CYAI", 
    decimals: 6,
    name: "Cyrene AI",
    coingeckoId: "cyrene-ai"
  }
} as const;

export type QuoteMintType = keyof typeof QUOTE_MINTS;

// Interface for config parameters
export interface CreateConfigParams {
  totalTokenSupply: number;
  migrationQuoteThreshold: number;
  quoteMint: QuoteMintType;
}

// Function to create a new mint and set up the pool
export class createConfig {
  public async setupConfig(
    wallet: WalletAdapter,
    params: CreateConfigParams
  ): Promise<{
    success: boolean;
    signature?: string;
    configAddress?: string;
    error?: string;
  }> {
    try {
      // Check if wallet is connected
      if (!wallet.publicKey) {
        throw new Error("Wallet not connected");
      }

      console.log("Connected wallet public key:", wallet.publicKey.toBase58());

      // Get selected quote mint details
      const selectedQuoteMint = QUOTE_MINTS[params.quoteMint];
      console.log(`Using quote mint: ${selectedQuoteMint.name} on MAINNET`);

      // Config Keypair Generate
      let config = Keypair.generate();
      console.log("Created config:", config.publicKey.toBase58());

      // 1. Build the curve configuration (off-chain math)
      const curveConfig = buildCurve({
        totalTokenSupply: params.totalTokenSupply,
        percentageSupplyOnMigration: 20,
        migrationQuoteThreshold: params.migrationQuoteThreshold,
        migrationOption: 1, // Option 1: DAMM V2
        tokenBaseDecimal: 9, // 9 DECIMALS FOR MEME COIN
        tokenQuoteDecimal: selectedQuoteMint.decimals,
        lockedVestingParam: {
          totalLockedVestingAmount: 100000000,
          numberOfVestingPeriod: 6,
          cliffUnlockAmount: 100000000,
          totalVestingDuration: 15552000,
          cliffDurationFromMigrationTime: 15552000,
        },
        baseFeeParams: {
          baseFeeMode: BaseFeeMode.FeeSchedulerLinear,
          feeSchedulerParam: {
            startingFeeBps: 100,
            endingFeeBps: 100,
            numberOfPeriod: 0,
            totalDuration: 0,
          },
        },
        dynamicFeeEnabled: true,
        activationType: 0,
        collectFeeMode: 0, // 0: Quote Token
        migrationFeeOption: 3, // 3: Fixed 200bps
        tokenType: 1, // Token2022
        partnerLpPercentage: 0,
        creatorLpPercentage: 0,
        partnerLockedLpPercentage: 40,
        creatorLockedLpPercentage: 60,
        creatorTradingFeePercentage: 2,
        leftover: 1,
        tokenUpdateAuthority: 1,
        migrationFee: {
          feePercentage: 3,
          creatorFeePercentage: 0,
        },
      });

      // Create the config setup transaction
      const configSetup = await client.partner.createConfig({
        config: config.publicKey,
        feeClaimer: new PublicKey("FG75GTSYMimybJUBEcu6LkcNqm7fkga1iMp3v4nKnDQS"), 
        leftoverReceiver: new PublicKey("FG75GTSYMimybJUBEcu6LkcNqm7fkga1iMp3v4nKnDQS"), 
        payer: wallet.publicKey,
        quoteMint: new PublicKey(selectedQuoteMint.address),
        ...curveConfig,
      });

      console.log("Transaction created successfully");

      // Get the latest blockhash
      const { blockhash } = await connection.getLatestBlockhash("confirmed");
      configSetup.recentBlockhash = blockhash;
      configSetup.feePayer = wallet.publicKey;

      // Sign with the config keypair first (this is done locally)
      configSetup.partialSign(config);

      console.log("Requesting wallet signature...");
      
      // Request user to sign the transaction through their wallet
      const signedTransaction = await wallet.signTransaction(configSetup);

      console.log("Sending and confirming the transaction...");
      
      // Send the signed transaction
      const signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
        skipPreflight: false,
        preflightCommitment: "confirmed",
      });

      // Confirm the transaction
      await connection.confirmTransaction(signature, "confirmed");

      console.log("Config created successfully on MAINNET!");
      console.log(`Transaction: https://solscan.io/tx/${signature}`);
      console.log(`Config address: ${config.publicKey.toString()}`);

      return {
        success: true,
        signature,
        configAddress: config.publicKey.toString(),
      };
    } catch (error) {
      console.error("Error creating config:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }
}

// Alternative function for use with React components and wallet adapters
export async function setupConfigWithWallet(
  walletAdapter: WalletAdapter,
  params: CreateConfigParams
): Promise<{
  success: boolean;
  signature?: string;
  configAddress?: string;
  error?: string;
}> {
  const configInstance = new createConfig();
  return await configInstance.setupConfig(walletAdapter, params);
}