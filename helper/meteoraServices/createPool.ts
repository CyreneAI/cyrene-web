import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
} from "@solana/web3.js";
import { DynamicBondingCurveClient, deriveDbcPoolAddress } from "@meteora-ag/dynamic-bonding-curve-sdk";
import bs58 from "bs58";

// Interface for pool parameters
export interface CreatePoolParams {
  configAddress: string;
  name: string;
  symbol: string;
  image: string;
  description: string;
  vanityKeypair?: Keypair; // Optional vanity keypair
}

// Interface for the return type
export interface CreatePoolResult {
  success: boolean;
  signature?: string;
  contractAddress?: string; // This is the base mint (token contract)
  dbcPoolAddress?: string; // This is the derived DBC pool address
  metadataUri?: string;
  error?: string;
  isVanityAddress?: boolean; // Flag to indicate if vanity address was used
}

const privateKey = process.env.NEXT_PUBLIC_PRIVATE_KEY;

async function createPool(params: CreatePoolParams): Promise<CreatePoolResult> {
  const keypairData = bs58.decode(privateKey!);
  const secretKey = Uint8Array.from(keypairData);
  const wallet = Keypair.fromSecretKey(secretKey);

  const connection = new Connection(
    "https://api.devnet.solana.com",
    "confirmed"
  );

  const configAddress = new PublicKey(params.configAddress);

  console.log(`Using config: ${configAddress.toString()}`);

  try {
    // Use vanity keypair if provided, otherwise generate a new one
    const baseMint = params.vanityKeypair || Keypair.generate();
    const isVanityAddress = !!params.vanityKeypair;
    
    if (isVanityAddress) {
      console.log(`Using vanity base mint: ${baseMint.publicKey.toString()}`);
      console.log(`Vanity address verification - ends with CYAI: ${baseMint.publicKey.toString().endsWith('CYAI')}`);
    } else {
      console.log(`Generated standard base mint: ${baseMint.publicKey.toString()}`);
    }

    // Get the config to determine the quote mint
    const client = new DynamicBondingCurveClient(connection, "confirmed");
    const config = await client.state.getPoolConfig(configAddress);
    
    if (!config) {
      throw new Error("Failed to fetch pool config");
    }

    // Derive the DBC pool address
    const dbcPoolAddress = deriveDbcPoolAddress(
      config.quoteMint, // The quote mint from config
      baseMint.publicKey, // The base mint (vanity or generated)
      configAddress // The config address
    );

    console.log(`Derived DBC pool address: ${dbcPoolAddress.toString()}`);

    // Create token metadata JSON with vanity address info
    const tokenMetadata = {
      name: params.name,
      symbol: params.symbol,
      description: `${params.description}${isVanityAddress ? ' 💎 Features vanity address ending with CYAI' : ''}`,
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
        ...(isVanityAddress ? [{
          trait_type: "Address Type",
          value: "Vanity (CYAI suffix)"
        }] : []),
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
            address: wallet.publicKey.toString(),
            share: 100
          }
        ],
        // Add vanity address info to properties
        ...(isVanityAddress ? {
          vanityAddress: {
            suffix: "CYAI",
            contractAddress: baseMint.publicKey.toString(),
            generatedAt: new Date().toISOString()
          }
        } : {})
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
      payer: wallet.publicKey,
      poolCreator: wallet.publicKey,
    };

    console.log("Creating pool transaction...");
    const poolTransaction = await client.pool.createPool(createPoolParam);

    // Get fresh blockhash
    const { blockhash } = await connection.getLatestBlockhash("confirmed");
    poolTransaction.recentBlockhash = blockhash;
    poolTransaction.feePayer = wallet.publicKey;

    // Sign the transaction with both wallet and base mint keypair
    poolTransaction.partialSign(baseMint, wallet);

    console.log("Sending transaction...");
    // Send transaction with retry logic
    const signature = await connection.sendRawTransaction(
      poolTransaction.serialize(),
      {
        skipPreflight: false,
        preflightCommitment: "confirmed",
        maxRetries: 3,
      }
    );

    console.log(`Transaction sent: ${signature}`);
    console.log("Confirming transaction...");

    // Confirm transaction with timeout
    const confirmation = await connection.confirmTransaction(
      {
        signature,
        blockhash,
        lastValidBlockHeight: (await connection.getLatestBlockhash("confirmed")).lastValidBlockHeight,
      },
      "confirmed"
    );

    if (confirmation.value.err) {
      throw new Error(`Transaction failed: ${confirmation.value.err}`);
    }

    console.log("Transaction confirmed!");
    console.log(`Pool created: https://solscan.io/tx/${signature}?cluster=devnet`);
    
    if (isVanityAddress) {
      console.log(`🎉 Successfully deployed token with vanity address: ${baseMint.publicKey.toString()}`);
    }
    
    return {
      success: true,
      signature,
      contractAddress: baseMint.publicKey.toString(), // The token contract address
      dbcPoolAddress: dbcPoolAddress.toString(), // The DBC pool address
      metadataUri,
      isVanityAddress
    };
  } catch (error) {
    console.error("Failed to create pool:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      isVanityAddress: !!params.vanityKeypair
    };
  }
}

export default createPool;

// import {
//   Connection,
//   Keypair,
//   PublicKey,
//   Transaction,
// } from "@solana/web3.js";
// import { DynamicBondingCurveClient, deriveDbcPoolAddress } from "@meteora-ag/dynamic-bonding-curve-sdk";
// import bs58 from "bs58";

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

// const privateKey = process.env.NEXT_PUBLIC_PRIVATE_KEY;

// async function createPool(params: CreatePoolParams): Promise<CreatePoolResult> {
//   const keypairData = bs58.decode(privateKey!);
//   const secretKey = Uint8Array.from(keypairData);
//   const wallet = Keypair.fromSecretKey(secretKey);

//   const connection = new Connection(
//     "https://api.devnet.solana.com",
//     "confirmed"
//   );

//   const configAddress = new PublicKey(params.configAddress);

//   console.log(`Using config: ${configAddress.toString()}`);

//   try {
//     const baseMint = Keypair.generate();
//     console.log(`Generated base mint: ${baseMint.publicKey.toString()}`);

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

//     console.log(`Derived DBC pool address: ${dbcPoolAddress.toString()}`);

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
//             address: wallet.publicKey.toString(),
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
//       payer: wallet.publicKey,
//       poolCreator: wallet.publicKey,
//     };

//     console.log("Creating pool transaction...");
//     const poolTransaction = await client.pool.createPool(createPoolParam);

//     // Get fresh blockhash
//     const { blockhash } = await connection.getLatestBlockhash("confirmed");
//     poolTransaction.recentBlockhash = blockhash;
//     poolTransaction.feePayer = wallet.publicKey;

//     // Sign the transaction
//     poolTransaction.partialSign(baseMint, wallet);

//     console.log("Sending transaction...");
//     // Send transaction with retry logic
//     const signature = await connection.sendRawTransaction(
//       poolTransaction.serialize(),
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

//     console.log("Transaction confirmed!");
//     console.log(`Pool created: https://solscan.io/tx/${signature}?cluster=devnet`);
    
//     return {
//       success: true,
//       signature,
//       contractAddress: baseMint.publicKey.toString(), // The token contract address
//       dbcPoolAddress: dbcPoolAddress.toString(), // The DBC pool address
//       metadataUri,
//     };
//   } catch (error) {
//     console.error("Failed to create pool:", error);
//     return {
//       success: false,
//       error: error instanceof Error ? error.message : "Unknown error occurred",
//     };
//   }
// }

// export default createPool;