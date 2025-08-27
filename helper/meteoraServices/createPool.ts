import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
} from "@solana/web3.js";
import { DynamicBondingCurveClient, deriveDbcPoolAddress } from "@meteora-ag/dynamic-bonding-curve-sdk";

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
}

// Interface for the return type
export interface CreatePoolResult {
  success: boolean;
  signature?: string;
  contractAddress?: string; // This is the base mint (token contract)
  dbcPoolAddress?: string; // This is the derived DBC pool address
  metadataUri?: string;
  error?: string;
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
    `https://mainnet.helius-rpc.com/?api-key=${process.env.NEXT_PUBLIC_HELIUS_API_KEY}`, 
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

    console.log("Creating pool transaction on MAINNET...");
    const poolTransaction = await client.pool.createPool(createPoolParam);

    // Get fresh blockhash
    const { blockhash } = await connection.getLatestBlockhash("confirmed");
    poolTransaction.recentBlockhash = blockhash;
    poolTransaction.feePayer = walletAdapter.publicKey;

    // Sign the transaction with the base mint keypair first (locally)
    poolTransaction.partialSign(baseMint);

    console.log("Requesting wallet signature...");
    // Request user to sign the transaction through their wallet
    const signedTransaction = await walletAdapter.signTransaction(poolTransaction);

    console.log("Sending transaction to MAINNET...");
    // Send transaction with retry logic
    const signature = await connection.sendRawTransaction(
      signedTransaction.serialize(),
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

    console.log("Transaction confirmed on MAINNET!");
    console.log(`Pool created: https://solscan.io/tx/${signature}`);
    
    return {
      success: true,
      signature,
      contractAddress: baseMint.publicKey.toString(), // The token contract address
      dbcPoolAddress: dbcPoolAddress.toString(), // The DBC pool address
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