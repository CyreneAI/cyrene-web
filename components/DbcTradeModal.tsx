// import React, { useState, useEffect } from 'react';
// import { X, TrendingUp, Loader2, Activity, BarChart3 } from 'lucide-react';
// import { useAppKitAccount, useAppKitProvider } from '@reown/appkit/react';
// import {
//   PublicKey,
//   Transaction,
//   Connection
// } from '@solana/web3.js';
// import { DynamicBondingCurveClient } from '@meteora-ag/dynamic-bonding-curve-sdk';
// import { BN } from 'bn.js';
// import axios from 'axios';
// import { toast } from 'sonner';
// import type { Provider } from "@reown/appkit-adapter-solana/react";

// //================================================================//
// // 1. UPDATED: GENERIC PROPS INTERFACE                             //
// //================================================================//
// interface DbcTradeModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   poolAddress?: string; // The on-chain address of the DBC pool
//   tokenMintAddress?: string; // The token's mint address for charting
//   tokenName: string; // The display name of the token
//   tokenSymbol: string; // The token's symbol (e.g., "AGENT")
//   creatorName: string; // The name of the agent/creator
// }

// interface CustomPoolQuote {
//   amountOut: string;
//   minimumAmountOut: string;
//   tradingFee: string;
//   protocolFee: string;
// }

// // A reliable SOL/USDC pair to get the SOL price
// const SOL_USDC_PAIR_ADDRESS = '58oQChx4yWmvKdwLLZzBi4ChoCc2fqbAaGv_2aK_A8p';

// //================================================================//
// // HELPER FUNCTIONS                                                //
// //================================================================//
// async function getSolanaConnection(): Promise<Connection> {
//   const connection = new Connection(
//     // Using a reliable public RPC for mainnet-beta. Change to devnet if needed.
//     'https://api.devnet.solana.com',
//     {
//       commitment: "confirmed",
//       confirmTransactionInitialTimeout: 120000,
//     }
//   );
//   try {
//     await connection.getEpochInfo();
//     return connection;
//   } catch (error) {
//     console.error('Failed to connect to Solana RPC:', error);
//     throw new Error('Unable to connect to Solana RPC endpoint');
//   }
// }

// async function checkSOLBalance(walletAddress: string): Promise<number> {
//   const connection = await getSolanaConnection();
//   try {
//     const publicKey = new PublicKey(walletAddress);
//     const balance = await connection.getBalance(publicKey);
//     return balance / 1e9;
//   } catch (error) {
//     console.error("Error checking SOL balance:", error);
//     throw new Error("Failed to check SOL balance");
//   }
// }

// // Check if pool has graduated by checking progress
// async function checkPoolGraduation(poolAddress: string): Promise<boolean> {
//   try {
//     const connection = await getSolanaConnection();
//     const client = new DynamicBondingCurveClient(connection, "confirmed");
//     const poolPubkey = new PublicKey(poolAddress);
//     const progress = await client.state.getPoolCurveProgress(poolPubkey);
//     return progress >= 1; // >= 1 means graduated
//   } catch (error) {
//     console.error("Error checking pool graduation:", error);
//     return false;
//   }
// }

// //================================================================//
// // REUSABLE DBC TRADE MODAL COMPONENT                              //
// //================================================================//
// export const DbcTradeModal: React.FC<DbcTradeModalProps> = ({
//   isOpen,
//   onClose,
//   poolAddress,
//   tokenMintAddress,
//   tokenName,
//   tokenSymbol,
//   creatorName,
// }) => {
//   const { address, isConnected } = useAppKitAccount();
//   const { walletProvider: solanaWalletProvider } = useAppKitProvider<Provider>('solana');

//   // State for trading form and logic
//   const [customPoolQuote, setCustomPoolQuote] = useState<CustomPoolQuote | null>(null);
//   const [solAmount, setSolAmount] = useState<string>('0.1');
//   const [usdAmount, setUsdAmount] = useState<string>('');
//   const [slippage, setSlippage] = useState<number>(0.5);
//   const [loading, setLoading] = useState<boolean>(false);
//   const [txStatus, setTxStatus] = useState<string>('');
//   const [solBalance, setSolBalance] = useState<number | null>(null);
//   const [solPrice, setSolPrice] = useState<number>(0);
//   const [lastPriceUpdate, setLastPriceUpdate] = useState<number | null>(null);

//   // Pool progression state
//   const [poolProgression, setPoolProgression] = useState<string | null>(null);
//   const [isLoadingProgression, setIsLoadingProgression] = useState(false);
//   const [progressionError, setProgressionError] = useState<string | null>(null);
//   const [isPoolGraduated, setIsPoolGraduated] = useState<boolean>(false);

//   // Pool progression fetching function
//   const getPoolProgression = async () => {
//     if (!poolAddress) return;

//     setIsLoadingProgression(true);
//     setProgressionError(null);

//     try {
//       const connection = await getSolanaConnection();
//       const client = new DynamicBondingCurveClient(connection, "confirmed");
//       const poolPubkey = new PublicKey(poolAddress);
//       const progress = await client.state.getPoolCurveProgress(poolPubkey);
//       const hasGraduated = progress >= 1;
//       setIsPoolGraduated(hasGraduated);
//       const progressInPercent = Math.min(progress * 100, 100);
//       const formattedProgress = progressInPercent.toFixed(4) + "%";
//       setPoolProgression(formattedProgress);
//       if (hasGraduated) {
//         setCustomPoolQuote(null);
//         toast.info("This token has graduated! You can now trade it on Jupiter.");
//       }
//     } catch (error) {
//       console.error("Failed to get pool progression:", error);
//       setProgressionError("Failed to load pool progression");
//     } finally {
//       setIsLoadingProgression(false);
//     }
//   };

//   // Fetch SOL price from DexScreener
//   const fetchSolPrice = async () => {
//     try {
//       const response = await axios.get(`https://api.dexscreener.com/latest/dex/pairs/solana/${SOL_USDC_PAIR_ADDRESS}`);
//       const pair = response.data.pairs?.[0] || null;
//       if (pair?.priceUsd) {
//         const price = parseFloat(pair.priceUsd);
//         setSolPrice(price);
//         setLastPriceUpdate(Date.now());
//         setUsdAmount((parseFloat(solAmount) * price).toFixed(2));
//       }
//     } catch (error) {
//       console.error('Error fetching SOL price:', error);
//     }
//   };

//   // USD/SOL conversion helpers
//   const calculateUsdValue = (amount: string): string => {
//     if (!amount || solPrice === 0) return '0.00';
//     return (parseFloat(amount) * solPrice).toFixed(2);
//   };
//   const calculateSolFromUsd = (usdValue: string): string => {
//     if (!usdValue || solPrice === 0) return '0';
//     return (parseFloat(usdValue) / solPrice).toFixed(6);
//   };
//   const handleSolAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const value = e.target.value;
//     setSolAmount(value);
//     setUsdAmount(calculateUsdValue(value));
//   };
//   const handleUsdAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const value = e.target.value;
//     setUsdAmount(value);
//     setSolAmount(calculateSolFromUsd(value));
//   };

//   // Get quote from Meteora SDK
//   const getCustomPoolQuote = async () => {
//     if (!poolAddress) return;

//     const hasGraduated = await checkPoolGraduation(poolAddress);
//     if (hasGraduated) {
//       setIsPoolGraduated(true);
//       setCustomPoolQuote(null);
//       toast.info("This token has graduated! Trading is now available on Jupiter.");
//       return;
//     }

//     try {
//       const amountInLamports = parseFloat(solAmount) * 1e9;
//       if (isNaN(amountInLamports) || amountInLamports <= 0) {
//         setCustomPoolQuote(null);
//         return;
//       }
//       setLoading(true);
//       const connection = await getSolanaConnection();
//       const client = new DynamicBondingCurveClient(connection, "confirmed");
//       const poolPublicKey = new PublicKey(poolAddress);
//       const virtualPool = await client.state.getPool(poolPublicKey);
//       if (!virtualPool) throw new Error("Pool not found!");
//       const config = await client.state.getPoolConfig(virtualPool.config);
//       const slot = await connection.getSlot();
//       const blockTime = await connection.getBlockTime(slot);
//       const currentPoint = new BN(blockTime || 0);
//       const quote = await client.pool.swapQuote({
//         virtualPool,
//         config,
//         swapBaseForQuote: false,
//         amountIn: new BN(amountInLamports),
//         slippageBps: Math.floor(slippage * 100),
//         hasReferral: false,
//         currentPoint,
//       });
//       setCustomPoolQuote({
//         amountOut: quote.amountOut.toString(),
//         minimumAmountOut: quote.minimumAmountOut.toString(),
//         tradingFee: quote.fee.trading.toString(),
//         protocolFee: quote.fee.protocol.toString(),
//       });
//     } catch (error) {
//       console.error('Error getting custom pool quote:', error);
//       if (error instanceof Error && error.message.includes('completed')) {
//         setIsPoolGraduated(true);
//         setCustomPoolQuote(null);
//         toast.info("This token has graduated! You can now trade it on Jupiter.");
//       } else {
//         setCustomPoolQuote(null);
//         toast.error(error instanceof Error ? error.message : "Failed to get quote.");
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Execute swap transaction
//   const executeCustomPoolSwap = async () => {
//     if (!poolAddress || !address || !isConnected) {
//       toast.error('Missing required data for swap');
//       return;
//     }

//     const hasGraduated = await checkPoolGraduation(poolAddress);
//     if (hasGraduated) {
//       setIsPoolGraduated(true);
//       toast.info("This token has graduated! Please use Jupiter for trading.");
//       return;
//     }

//     try {
//       setTxStatus('Preparing swap...');
//       setLoading(true);
//       const amountInLamports = parseFloat(solAmount) * 1e9;
//       if (isNaN(amountInLamports) || amountInLamports <= 0) throw new Error('Invalid amount');
//       const connection = await getSolanaConnection();
//       const client = new DynamicBondingCurveClient(connection, "confirmed");
//       const poolPublicKey = new PublicKey(poolAddress);
//       setTxStatus('Creating transaction...');
//       const transaction = await client.pool.swap({
//         owner: new PublicKey(address),
//         amountIn: new BN(amountInLamports),
//         minimumAmountOut: new BN(customPoolQuote?.minimumAmountOut || 0),
//         swapBaseForQuote: false,
//         pool: poolPublicKey,
//         referralTokenAccount: null,
//         payer: new PublicKey(address),
//       });
//       setTxStatus('Awaiting wallet approval...');
//       const { blockhash } = await connection.getLatestBlockhash("finalized");
//       transaction.recentBlockhash = blockhash;
//       transaction.feePayer = new PublicKey(address);
//       const signedTx = await solanaWalletProvider!.signTransaction(transaction);
//       setTxStatus('Sending transaction...');
//       const signature = await connection.sendRawTransaction(signedTx.serialize());
//       setTxStatus('Confirming transaction...');
//       await connection.confirmTransaction(signature, 'confirmed');
//       toast.success('Swap successful!');
//       console.log(`Transaction: https://solscan.io/tx/${signature}`);
//       checkBalances();
//       getPoolProgression();
//     } catch (error) {
//       console.error('Swap failed:', error);
//       if (error instanceof Error && error.message.includes('completed')) {
//         setIsPoolGraduated(true);
//         toast.info("This token has just graduated! You can now trade it on Jupiter.");
//       } else {
//         toast.error(error instanceof Error ? error.message : 'Swap failed. See console for details.');
//       }
//     } finally {
//       setTxStatus('');
//       setLoading(false);
//     }
//   };

//   const checkBalances = async () => {
//     if (!address) return;
//     try {
//       const solBal = await checkSOLBalance(address);
//       setSolBalance(solBal);
//     } catch (error) {
//       console.error('Error checking balances:', error);
//     }
//   };

//   // Effects
//   useEffect(() => { if (address) checkBalances(); }, [address]);

//   useEffect(() => {
//     if (isOpen) {
//       fetchSolPrice();
//       if (poolAddress) {
//         getPoolProgression();
//       }
//       const interval = setInterval(fetchSolPrice, 30000);
//       return () => clearInterval(interval);
//     }
//   }, [isOpen, poolAddress]);

//   useEffect(() => {
//     if (poolAddress && solAmount && !isPoolGraduated) {
//       const debounceTimer = setTimeout(() => getCustomPoolQuote(), 500);
//       return () => clearTimeout(debounceTimer);
//     }
//   }, [solAmount, slippage, poolAddress, isPoolGraduated]);

//   useEffect(() => {
//     if (isOpen && poolAddress) {
//       const progressionInterval = setInterval(() => {
//         getPoolProgression();
//       }, 15000);
//       return () => clearInterval(progressionInterval);
//     }
//   }, [isOpen, poolAddress]);

//   if (!isOpen) return null;

//   const chartUrl = tokenMintAddress
//     ? `https://birdeye.so/tv-widget/${tokenMintAddress}?chain=solana&viewMode=pair&chartInterval=15&chartType=Candle&chartTimezone=America%2FNew_York&chartLeftToolbar=show&theme=dark`
//     : '';

//   return (
//     <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
//       <div className="bg-blue/10 backdrop-blur-md border border-black/20 rounded-2xl overflow-hidden shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col">
//         <div className="p-4 border-b border-black/20 flex-shrink-0">
//           <div className="flex justify-between items-center">
//             <div className="flex items-center space-x-3">
//               <TrendingUp className="w-6 h-6 text-[#3d71e9]" />
//               <div>
//                 <h2 className="text-xl font-bold text-white">
//                   {isPoolGraduated ? "Token Graduated!" : "Trade Now"}
//                 </h2>
//                 <p className="text-sm text-gray-300">{tokenName} by @{creatorName}</p>
//               </div>
//             </div>
//             <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors">
//               <X className="w-5 h-5 text-white" />
//             </button>
//           </div>
//         </div>

//         <div className="flex-1 overflow-hidden">
//           {!poolAddress ? (
//             <div className="text-center py-8">
//               <p className="text-white">Pool address is not available.</p>
//             </div>
//           ) : isPoolGraduated ? (
//             <div className="text-center py-8 space-y-4 overflow-y-auto h-full px-4">
//               <div className="text-6xl">🎉</div>
//               <h3 className="text-2xl font-bold text-white">Token Graduated!</h3>
//               <p className="text-gray-300">This token has successfully graduated and is now available for trading on decentralized exchanges.</p>
//               <a
//                 href={`https://jup.ag/swap/SOL-${tokenMintAddress || poolAddress}`}
//                 target="_blank"
//                 rel="noopener noreferrer"
//                 className="inline-block mt-4 px-6 py-3 bg-gradient-to-r from-[#3d71e9] to-[#799ef3] hover:opacity-90 text-white font-semibold rounded-xl transition-all"
//               >
//                 Trade on Jupiter
//               </a>
//             </div>
//           ) : (
//             <div className="flex h-full">
//               {/* Left Column: Trading UI */}
//               <div className="w-full md:w-[420px] flex-shrink-0 overflow-y-auto p-4 space-y-4 border-r border-black/20">
//                 <>
//                   {/* Pool Address Section */}
//                   <div className="bg-white/5 rounded-xl p-3 border border-white/10">
//                     <label className="block text-gray-300 text-sm mb-2">Pool Address</label>
//                     <div className="text-white font-mono text-xs break-all bg-black/20 p-2 rounded">
//                       {poolAddress}
//                     </div>
//                   </div>

//                   {/* Pool Progression Section */}
//                   <div className="bg-gradient-to-r from-[#3d71e9]/20 to-[#799ef3]/20 rounded-xl p-4 border border-[#3d71e9]/30">
//                     <div className="flex items-center gap-2 mb-3">
//                       <BarChart3 className="w-5 h-5 text-[#3d71e9]" />
//                       <h3 className="text-white font-semibold">Pool Progress to Graduation</h3>
//                       <button
//                         onClick={getPoolProgression}
//                         disabled={isLoadingProgression}
//                         className="ml-auto p-1 rounded hover:bg-white/10 transition-colors"
//                         title="Refresh progression"
//                       >
//                         <Activity className={`w-4 h-4 text-[#3d71e9] ${isLoadingProgression ? 'animate-spin' : ''}`} />
//                       </button>
//                     </div>

//                     {isLoadingProgression ? (
//                       <div className="flex items-center gap-2">
//                         <Loader2 className="w-4 h-4 text-[#3d71e9] animate-spin" />
//                         <span className="text-sm text-gray-300">Loading pool progression...</span>
//                       </div>
//                     ) : progressionError ? (
//                       <div className="text-sm text-red-400">{progressionError}</div>
//                     ) : poolProgression ? (
//                       <div className="space-y-3">
//                         <div className="flex justify-between items-center">
//                           <span className="text-sm text-gray-300">Progress:</span>
//                           <span className="font-bold text-lg text-[#3d71e9]">{poolProgression}</span>
//                         </div>
//                         <div className="relative w-full h-3 bg-black/30 rounded-full overflow-hidden">
//                           <div
//                             className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#3d71e9] to-[#799ef3] transition-all duration-500 ease-out"
//                             style={{ width: poolProgression || "0%" }}
//                           />
//                           <div
//                             className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#3d71e9]/60 to-[#799ef3]/60 blur-sm"
//                             style={{ width: poolProgression || "0%" }}
//                           />
//                         </div>
//                         <div className="text-xs text-gray-400">
//                           {parseFloat(poolProgression.replace('%', '')) >= 100
//                             ? "🎉 Pool graduated! Ready for AMM trading"
//                             : "Pool filling up - help it graduate to unlock AMM trading!"
//                           }
//                         </div>
//                       </div>
//                     ) : (
//                       <div className="text-sm text-gray-400">No progression data available</div>
//                     )}
//                   </div>

//                   {/* You Pay Section */}
//                   <div className="bg-[#3d71e9] rounded-xl p-3 border border-white/20">
//                     <div className="flex justify-between items-center mb-2">
//                       <span className="text-black font-medium text-sm">You pay</span>
//                       <div className="text-right text-black text-xs">
//                         Balance: {solBalance !== null ? solBalance.toFixed(4) : '-'} SOL
//                       </div>
//                     </div>
//                     <div className="flex items-center mb-2">
//                       <input
//                         type="number"
//                         value={solAmount}
//                         onChange={handleSolAmountChange}
//                         className="flex-1 bg-transparent text-black text-xl font-medium outline-none placeholder-gray-600"
//                         placeholder="0.0"
//                         min="0"
//                         step="0.1"
//                         disabled={isPoolGraduated}
//                       />
//                       <div className="bg-black/20 rounded-lg px-2 py-1">
//                         <span className="font-medium text-black text-sm">SOL</span>
//                       </div>
//                     </div>
//                     <div className="flex items-center border-t border-black/10 pt-2">
//                       <span className="text-black text-sm mr-2">≈</span>
//                       <input
//                         type="number"
//                         value={usdAmount}
//                         onChange={handleUsdAmountChange}
//                         className="flex-1 bg-transparent text-black text-sm font-medium outline-none placeholder-gray-600"
//                         placeholder="0.00"
//                         min="0"
//                         step="0.01"
//                         disabled={isPoolGraduated}
//                       />
//                       <div className="bg-black/20 rounded-lg px-2 py-1">
//                         <span className="font-medium text-black text-xs">USD</span>
//                       </div>
//                     </div>
//                     {solPrice > 0 && (
//                       <div className="text-xs text-black/70 mt-1">1 SOL ≈ ${solPrice.toFixed(2)} USD</div>
//                     )}
//                   </div>

//                   {/* You Receive Section */}
//                   <div className="bg-[#3d71e9] rounded-xl p-3 border border-white/20">
//                     <span className="text-black font-medium text-sm">You receive</span>
//                     <div className="flex items-center">
//                       <input
//                         type="text"
//                         value={customPoolQuote ? (parseFloat(customPoolQuote.amountOut) / 1e9).toFixed(4) : isPoolGraduated ? 'Token graduated' : '...'}
//                         readOnly
//                         className="flex-1 bg-transparent text-black text-xl font-medium outline-none"
//                       />
//                       <div className="bg-black/20 rounded-lg px-2 py-1">
//                         <span className="font-medium text-black text-sm">{tokenSymbol}</span>
//                       </div>
//                     </div>
//                     {customPoolQuote && (
//                       <div className="mt-1 text-xs text-black font-medium">
//                         Minimum: {(parseFloat(customPoolQuote.minimumAmountOut) / 1e9).toFixed(4)}
//                       </div>
//                     )}
//                   </div>

//                   {/* Trading Fees */}
//                   {customPoolQuote && (
//                     <div className="bg-white/5 rounded-xl p-3 border border-white/10 space-y-2 text-sm">
//                       <div className="flex justify-between">
//                         <span className="text-gray-300">Trading Fee:</span>
//                         <span className="font-medium text-white">
//                           {(parseFloat(customPoolQuote.tradingFee) / 1e9).toFixed(6)} SOL
//                         </span>
//                       </div>
//                       <div className="flex justify-between">
//                         <span className="text-gray-300">Protocol Fee:</span>
//                         <span className="font-medium text-white">
//                           {(parseFloat(customPoolQuote.protocolFee) / 1e9).toFixed(6)} SOL
//                         </span>
//                       </div>
//                     </div>
//                   )}

//                   {/* Transaction Status */}
//                   {txStatus && (
//                     <div className="bg-white/5 rounded-xl p-3 border border-white/10 flex items-center space-x-2">
//                       <Loader2 className="animate-spin h-4 w-4 text-[#3d71e9]" />
//                       <span className="text-white text-sm">{txStatus}</span>
//                     </div>
//                   )}
//                 </>
//               </div>

//               {/* Right Column: BirdEye Chart */}
//               <div className="flex-1 p-4 hidden md:flex items-center justify-center bg-black/10">
//                 {tokenMintAddress ? (
//                   <iframe
//                     key={tokenMintAddress}
//                     width="100%"
//                     height="100%"
//                     src={chartUrl}
//                     frameBorder="0"
//                     allowFullScreen
//                     className="rounded-xl border border-white/10"
//                   ></iframe>
//                 ) : (
//                   <div className="text-center text-gray-400">
//                     <BarChart3 className="w-12 h-12 mx-auto mb-4" />
//                     <p>Chart data is unavailable.</p>
//                     <p className="text-sm">Token mint address not provided.</p>
//                   </div>
//                 )}
//               </div>
//             </div>
//           )}
//         </div>

//         {/* Action Buttons */}
//         <div className="p-4 border-t border-black/20 flex-shrink-0">
//           {isPoolGraduated ? (
//             <div className="flex gap-2">
//               <button
//                 onClick={onClose}
//                 className="flex-1 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-xl transition-colors text-sm"
//               >
//                 Close
//               </button>
//               <a
//                 href={`https://jup.ag/swap/SOL-${tokenMintAddress || poolAddress}`}
//                 target="_blank"
//                 rel="noopener noreferrer"
//                 className="flex-1 py-2 bg-gradient-to-r from-[#3d71e9] to-[#799ef3] hover:opacity-90 text-black font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm text-center"
//               >
//                 Trade on Jupiter
//               </a>
//             </div>
//           ) : (
//             <div className="flex gap-2">
//               <button
//                 onClick={getCustomPoolQuote}
//                 disabled={loading || !poolAddress}
//                 className="flex-1 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl disabled:opacity-50 transition-colors text-sm"
//               >
//                 Refresh Quote
//               </button>
//               <button
//                 onClick={executeCustomPoolSwap}
//                 disabled={loading || !isConnected || !customPoolQuote || !poolAddress}
//                 className="flex-1 py-2 bg-gradient-to-r from-[#3d71e9] to-[#799ef3] hover:opacity-90 text-black font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
//               >
//                 {loading ? 'Processing...' : 'Swap Now'}
//               </button>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };



import React, { useState, useEffect } from 'react';
import { X, TrendingUp, Loader2, Activity, BarChart3 } from 'lucide-react';
import { useAppKitAccount, useAppKitProvider } from '@reown/appkit/react';
import {
  PublicKey,
  Transaction,
  Connection
} from '@solana/web3.js';
import { DynamicBondingCurveClient } from '@meteora-ag/dynamic-bonding-curve-sdk';
import { BN } from 'bn.js';
import axios from 'axios';
import { toast } from 'sonner';
import type { Provider } from "@reown/appkit-adapter-solana/react";

//================================================================//
// 1. UPDATED: GENERIC PROPS INTERFACE                             //
//================================================================//
interface DbcTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  poolAddress?: string; // The on-chain address of the DBC pool
  tokenMintAddress?: string; // The token's mint address for charting
  tokenName: string; // The display name of the token
  tokenSymbol: string; // The token's symbol (e.g., "AGENT")
  creatorName: string; // The name of the agent/creator
}

interface CustomPoolQuote {
  amountOut: string;
  minimumAmountOut: string;
  tradingFee: string;
  protocolFee: string;
}

// A reliable SOL/USDC pair to get the SOL price on mainnet
const SOL_USDC_PAIR_ADDRESS = '58oQChx4yWmvKdwLLZzBi4ChoCc2fqbAaGv_2aK_A8p';

//================================================================//
// HELPER FUNCTIONS - UPDATED FOR MAINNET                         //
//================================================================//
async function getSolanaConnection(): Promise<Connection> {
  const connection = new Connection(
    // UPDATED: Using mainnet-beta instead of devnet
    `https://mainnet.helius-rpc.com/?api-key=${process.env.NEXT_PUBLIC_HELIUS_API_KEY}`,
    {
      commitment: "confirmed",
      confirmTransactionInitialTimeout: 120000,
    }
  );
  try {
    await connection.getEpochInfo();
    return connection;
  } catch (error) {
    console.error('Failed to connect to Solana  RPC:', error);
    throw new Error('Unable to connect to Solana  RPC endpoint');
  }
}

async function checkSOLBalance(walletAddress: string): Promise<number> {
  const connection = await getSolanaConnection();
  try {
    const publicKey = new PublicKey(walletAddress);
    const balance = await connection.getBalance(publicKey);
    return balance / 1e9;
  } catch (error) {
    console.error("Error checking SOL balance on MAINNET:", error);
    throw new Error("Failed to check SOL balance");
  }
}

// Check if pool has graduated by checking progress
async function checkPoolGraduation(poolAddress: string): Promise<boolean> {
  try {
    const connection = await getSolanaConnection();
    const client = new DynamicBondingCurveClient(connection, "confirmed");
    const poolPubkey = new PublicKey(poolAddress);
    const progress = await client.state.getPoolCurveProgress(poolPubkey);
    return progress >= 1; // >= 1 means graduated
  } catch (error) {
    console.error("Error checking MAINNET pool graduation:", error);
    return false;
  }
}

//================================================================//
// REUSABLE DBC TRADE MODAL COMPONENT - UPDATED LAYOUT            //
//================================================================//
export const DbcTradeModal: React.FC<DbcTradeModalProps> = ({
  isOpen,
  onClose,
  poolAddress,
  tokenMintAddress,
  tokenName,
  tokenSymbol,
  creatorName,
}) => {
  const { address, isConnected } = useAppKitAccount();
  const { walletProvider: solanaWalletProvider } = useAppKitProvider<Provider>('solana');

  // State for trading form and logic
  const [customPoolQuote, setCustomPoolQuote] = useState<CustomPoolQuote | null>(null);
  const [solAmount, setSolAmount] = useState<string>('0.1');
  const [usdAmount, setUsdAmount] = useState<string>('');
  const [slippage, setSlippage] = useState<number>(0.5);
  const [loading, setLoading] = useState<boolean>(false);
  const [txStatus, setTxStatus] = useState<string>('');
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [solPrice, setSolPrice] = useState<number>(0);
  const [lastPriceUpdate, setLastPriceUpdate] = useState<number | null>(null);

  // Pool progression state
  const [poolProgression, setPoolProgression] = useState<string | null>(null);
  const [isLoadingProgression, setIsLoadingProgression] = useState(false);
  const [progressionError, setProgressionError] = useState<string | null>(null);
  const [isPoolGraduated, setIsPoolGraduated] = useState<boolean>(false);

  // Pool progression fetching function
  const getPoolProgression = async () => {
    if (!poolAddress) return;

    setIsLoadingProgression(true);
    setProgressionError(null);

    try {
      const connection = await getSolanaConnection();
      const client = new DynamicBondingCurveClient(connection, "confirmed");
      const poolPubkey = new PublicKey(poolAddress);
      const progress = await client.state.getPoolCurveProgress(poolPubkey);
      const hasGraduated = progress >= 1;
      setIsPoolGraduated(hasGraduated);
      const progressInPercent = Math.min(progress * 100, 100);
      const formattedProgress = progressInPercent.toFixed(4) + "%";
      setPoolProgression(formattedProgress);
      if (hasGraduated) {
        setCustomPoolQuote(null);
        toast.info("This token has graduated! You can now trade it on Jupiter.");
      }
    } catch (error) {
      console.error("Failed to get MAINNET pool progression:", error);
      setProgressionError("Failed to load pool progression");
    } finally {
      setIsLoadingProgression(false);
    }
  };

  // Fetch SOL price from DexScreener
  const fetchSolPrice = async () => {
    try {
      const response = await axios.get(`https://api.dexscreener.com/latest/dex/pairs/solana/${SOL_USDC_PAIR_ADDRESS}`);
      const pair = response.data.pairs?.[0] || null;
      if (pair?.priceUsd) {
        const price = parseFloat(pair.priceUsd);
        setSolPrice(price);
        setLastPriceUpdate(Date.now());
        setUsdAmount((parseFloat(solAmount) * price).toFixed(2));
      }
    } catch (error) {
      console.error('Error fetching SOL price from MAINNET:', error);
    }
  };

  // USD/SOL conversion helpers
  const calculateUsdValue = (amount: string): string => {
    if (!amount || solPrice === 0) return '0.00';
    return (parseFloat(amount) * solPrice).toFixed(2);
  };
  const calculateSolFromUsd = (usdValue: string): string => {
    if (!usdValue || solPrice === 0) return '0';
    return (parseFloat(usdValue) / solPrice).toFixed(6);
  };
  const handleSolAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSolAmount(value);
    setUsdAmount(calculateUsdValue(value));
  };
  const handleUsdAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUsdAmount(value);
    setSolAmount(calculateSolFromUsd(value));
  };

  // Get quote from Meteora SDK
  const getCustomPoolQuote = async () => {
    if (!poolAddress) return;

    const hasGraduated = await checkPoolGraduation(poolAddress);
    if (hasGraduated) {
      setIsPoolGraduated(true);
      setCustomPoolQuote(null);
      toast.info("This token has graduated! Trading is now available on Jupiter.");
      return;
    }

    try {
      const amountInLamports = parseFloat(solAmount) * 1e9;
      if (isNaN(amountInLamports) || amountInLamports <= 0) {
        setCustomPoolQuote(null);
        return;
      }
      setLoading(true);
      const connection = await getSolanaConnection();
      const client = new DynamicBondingCurveClient(connection, "confirmed");
      const poolPublicKey = new PublicKey(poolAddress);
      const virtualPool = await client.state.getPool(poolPublicKey);
      if (!virtualPool) throw new Error("Pool not found on MAINNET!");
      const config = await client.state.getPoolConfig(virtualPool.config);
      const slot = await connection.getSlot();
      const blockTime = await connection.getBlockTime(slot);
      const currentPoint = new BN(blockTime || 0);
      const quote = await client.pool.swapQuote({
        virtualPool,
        config,
        swapBaseForQuote: false,
        amountIn: new BN(amountInLamports),
        slippageBps: Math.floor(slippage * 100),
        hasReferral: false,
        currentPoint,
      });
      setCustomPoolQuote({
        amountOut: quote.amountOut.toString(),
        minimumAmountOut: quote.minimumAmountOut.toString(),
        tradingFee: quote.fee.trading.toString(),
        protocolFee: quote.fee.protocol.toString(),
      });
    } catch (error) {
      console.error('Error getting MAINNET custom pool quote:', error);
      if (error instanceof Error && error.message.includes('completed')) {
        setIsPoolGraduated(true);
        setCustomPoolQuote(null);
        toast.info("This token has graduated! You can now trade it on Jupiter.");
      } else {
        setCustomPoolQuote(null);
        toast.error(error instanceof Error ? error.message : "Failed to get quote.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Execute swap transaction
  const executeCustomPoolSwap = async () => {
    if (!poolAddress || !address || !isConnected) {
      toast.error('Missing required data for swap');
      return;
    }

    const hasGraduated = await checkPoolGraduation(poolAddress);
    if (hasGraduated) {
      setIsPoolGraduated(true);
      toast.info("This token has graduated! Please use Jupiter for trading.");
      return;
    }

    try {
      setTxStatus('Preparing swap...');
      setLoading(true);
      const amountInLamports = parseFloat(solAmount) * 1e9;
      if (isNaN(amountInLamports) || amountInLamports <= 0) throw new Error('Invalid amount');
      const connection = await getSolanaConnection();
      const client = new DynamicBondingCurveClient(connection, "confirmed");
      const poolPublicKey = new PublicKey(poolAddress);
      setTxStatus('Creating transaction...');
      const transaction = await client.pool.swap({
        owner: new PublicKey(address),
        amountIn: new BN(amountInLamports),
        minimumAmountOut: new BN(customPoolQuote?.minimumAmountOut || 0),
        swapBaseForQuote: false,
        pool: poolPublicKey,
        referralTokenAccount: null,
        payer: new PublicKey(address),
      });
      setTxStatus('Awaiting wallet approval...');
      const { blockhash } = await connection.getLatestBlockhash("finalized");
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = new PublicKey(address);
      const signedTx = await solanaWalletProvider!.signTransaction(transaction);
      setTxStatus('Sending transaction...');
      const signature = await connection.sendRawTransaction(signedTx.serialize());
      setTxStatus('Confirming transaction...');
      await connection.confirmTransaction(signature, 'confirmed');
      toast.success(' Swap successful!');
      console.log(` Transaction: https://solscan.io/tx/${signature}`);
      checkBalances();
      getPoolProgression();
    } catch (error) {
      console.error(' Swap failed:', error);
      if (error instanceof Error && error.message.includes('completed')) {
        setIsPoolGraduated(true);
        toast.info("This token has just graduated! You can now trade it on Jupiter.");
      } else {
        toast.error(error instanceof Error ? error.message : ' Swap failed. See console for details.');
      }
    } finally {
      setTxStatus('');
      setLoading(false);
    }
  };

  const checkBalances = async () => {
    if (!address) return;
    try {
      const solBal = await checkSOLBalance(address);
      setSolBalance(solBal);
    } catch (error) {
      console.error('Error checking balances:', error);
    }
  };

  // Effects
  useEffect(() => { if (address) checkBalances(); }, [address]);

  useEffect(() => {
    if (isOpen) {
      fetchSolPrice();
      if (poolAddress) {
        getPoolProgression();
      }
      const interval = setInterval(fetchSolPrice, 30000);
      return () => clearInterval(interval);
    }
  }, [isOpen, poolAddress]);

  useEffect(() => {
    if (poolAddress && solAmount && !isPoolGraduated) {
      const debounceTimer = setTimeout(() => getCustomPoolQuote(), 500);
      return () => clearTimeout(debounceTimer);
    }
  }, [solAmount, slippage, poolAddress, isPoolGraduated]);

  useEffect(() => {
    if (isOpen && poolAddress) {
      const progressionInterval = setInterval(() => {
        getPoolProgression();
      }, 15000);
      return () => clearInterval(progressionInterval);
    }
  }, [isOpen, poolAddress]);

  if (!isOpen) return null;

  const chartUrl = tokenMintAddress
    ? `https://birdeye.so/tv-widget/${tokenMintAddress}?chain=solana&viewMode=pair&chartInterval=15&chartType=Candle&chartTimezone=America%2FNew_York&chartLeftToolbar=show&theme=dark`
    : '';

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
      {/* Wider modal with fixed dimensions */}
      <div className="bg-blue/10 backdrop-blur-md border border-black/20 rounded-2xl overflow-hidden shadow-2xl w-full h-[90vh] flex flex-col" style={{ maxWidth: '95vw', width: '1400px' }}>
        
        {/* Header - Fixed Height */}
        <div className="p-4 border-b border-black/20 flex-shrink-0 h-20">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <TrendingUp className="w-6 h-6 text-[#3d71e9]" />
              <div>
                <h2 className="text-xl font-bold text-white">
                  {isPoolGraduated ? "Token Graduated!" : "Trade"}
                </h2>
                <p className="text-sm text-gray-300">{tokenName} ({tokenSymbol})</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors">
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Main Content - Fixed Height */}
        <div className="flex-1 overflow-hidden min-h-0">
          {!poolAddress ? (
            <div className="text-center py-8">
              <p className="text-white">Pool address is not available.</p>
            </div>
          ) : isPoolGraduated ? (
            <div className="text-center py-8 space-y-4 overflow-y-auto h-full px-4">
              <div className="text-6xl">🎉</div>
              <h3 className="text-2xl font-bold text-white">Token Graduated!</h3>
              <p className="text-gray-300">This token has successfully graduated and is now available for trading on decentralized exchanges.</p>
              <a
                href={`https://jup.ag/swap/SOL-${tokenMintAddress || poolAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-4 px-6 py-3 bg-gradient-to-r from-[#3d71e9] to-[#799ef3] hover:opacity-90 text-white font-semibold rounded-xl transition-all"
              >
                Trade on Jupiter
              </a>
            </div>
          ) : (
            <div className="flex h-full min-h-0">
              
              {/* Left Column: BirdEye Chart - Fixed Width */}
              <div className="flex-1 min-w-0 bg-black/10 border-r border-black/20" style={{ minWidth: '800px' }}>
                {tokenMintAddress ? (
                  <div className="w-full h-full p-4">
                    <iframe
                      key={tokenMintAddress}
                      width="100%"
                      height="100%"
                      src={chartUrl}
                      allowFullScreen
                      className="rounded-xl border border-white/10"
                      style={{ minHeight: '600px' }}
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-center text-gray-400">
                    <div>
                      <BarChart3 className="w-12 h-12 mx-auto mb-4" />
                      <p>Chart data is unavailable.</p>
                      <p className="text-sm">Token mint address not provided.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Trading UI - Fixed Width */}
              <div className="w-96 flex-shrink-0 overflow-y-auto p-4 space-y-4">
                
                {/* Pool Address Section */}
                <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                  <label className="block text-gray-300 text-sm mb-2">Pool Address</label>
                  <div className="text-white font-mono text-xs break-all bg-black/20 p-2 rounded">
                    {poolAddress}
                  </div>
                </div>

                {/* Pool Progression Section */}
                <div className="bg-gradient-to-r from-[#3d71e9]/20 to-[#799ef3]/20 rounded-xl p-4 border border-[#3d71e9]/30">
                  <div className="flex items-center gap-2 mb-3">
                    <BarChart3 className="w-5 h-5 text-[#3d71e9]" />
                    <h3 className="text-white font-semibold text-sm">Pool Progress</h3>
                    <button
                      onClick={getPoolProgression}
                      disabled={isLoadingProgression}
                      className="ml-auto p-1 rounded hover:bg-white/10 transition-colors"
                      title="Refresh progression"
                    >
                      <Activity className={`w-4 h-4 text-[#3d71e9] ${isLoadingProgression ? 'animate-spin' : ''}`} />
                    </button>
                  </div>

                  {isLoadingProgression ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 text-[#3d71e9] animate-spin" />
                      <span className="text-sm text-gray-300">Loading...</span>
                    </div>
                  ) : progressionError ? (
                    <div className="text-sm text-red-400">{progressionError}</div>
                  ) : poolProgression ? (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-300">Progress:</span>
                        <span className="font-bold text-lg text-[#3d71e9]">{poolProgression}</span>
                      </div>
                      <div className="relative w-full h-3 bg-black/30 rounded-full overflow-hidden">
                        <div
                          className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#3d71e9] to-[#799ef3] transition-all duration-500 ease-out"
                          style={{ width: poolProgression || "0%" }}
                        />
                        <div
                          className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#3d71e9]/60 to-[#799ef3]/60 blur-sm"
                          style={{ width: poolProgression || "0%" }}
                        />
                      </div>
                      <div className="text-xs text-gray-400">
                        {parseFloat(poolProgression.replace('%', '')) >= 100
                          ? "Pool graduated! Ready for AMM trading"
                          : "Pool filling up - help it graduate!"
                        }
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-400">No progression data available</div>
                  )}
                </div>

                {/* You Pay Section */}
                <div className="bg-[#3d71e9] rounded-xl p-3 border border-white/20">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-black font-medium text-sm">You pay</span>
                    <div className="text-right text-black text-xs">
                      Balance: {solBalance !== null ? solBalance.toFixed(4) : '-'} SOL
                    </div>
                  </div>
                  <div className="flex items-center mb-2">
                    <input
                      type="number"
                      value={solAmount}
                      onChange={handleSolAmountChange}
                      className="flex-1 bg-transparent text-black text-xl font-medium outline-none placeholder-gray-600"
                      placeholder="0.0"
                      min="0"
                      step="0.1"
                      disabled={isPoolGraduated}
                    />
                    <div className="bg-black/20 rounded-lg px-2 py-1">
                      <span className="font-medium text-black text-sm">SOL</span>
                    </div>
                  </div>
                  <div className="flex items-center border-t border-black/10 pt-2">
                    <span className="text-black text-sm mr-2">≈</span>
                    <input
                      type="number"
                      value={usdAmount}
                      onChange={handleUsdAmountChange}
                      className="flex-1 bg-transparent text-black text-sm font-medium outline-none placeholder-gray-600"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      disabled={isPoolGraduated}
                    />
                    <div className="bg-black/20 rounded-lg px-2 py-1">
                      <span className="font-medium text-black text-xs">USD</span>
                    </div>
                  </div>
                  {solPrice > 0 && (
                    <div className="text-xs text-black/70 mt-1">1 SOL ≈ ${solPrice.toFixed(2)} USD</div>
                  )}
                </div>

                {/* You Receive Section */}
                <div className="bg-[#3d71e9] rounded-xl p-3 border border-white/20">
                  <span className="text-black font-medium text-sm">You receive</span>
                  <div className="flex items-center">
                    <input
                      type="text"
                      value={customPoolQuote ? (parseFloat(customPoolQuote.amountOut) / 1e9).toFixed(4) : isPoolGraduated ? 'Token graduated' : '...'}
                      readOnly
                      className="flex-1 bg-transparent text-black text-xl font-medium outline-none"
                    />
                    <div className="bg-black/20 rounded-lg px-2 py-1">
                      <span className="font-medium text-black text-sm">{tokenSymbol}</span>
                    </div>
                  </div>
                  {customPoolQuote && (
                    <div className="mt-1 text-xs text-black font-medium">
                      Minimum: {(parseFloat(customPoolQuote.minimumAmountOut) / 1e9).toFixed(4)}
                    </div>
                  )}
                </div>

                {/* Trading Fees */}
                {customPoolQuote && (
                  <div className="bg-white/5 rounded-xl p-3 border border-white/10 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Trading Fee:</span>
                      <span className="font-medium text-white">
                        {(parseFloat(customPoolQuote.tradingFee) / 1e9).toFixed(6)} SOL
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Protocol Fee:</span>
                      <span className="font-medium text-white">
                        {(parseFloat(customPoolQuote.protocolFee) / 1e9).toFixed(6)} SOL
                      </span>
                    </div>
                  </div>
                )}

                {/* Transaction Status */}
                {txStatus && (
                  <div className="bg-white/5 rounded-xl p-3 border border-white/10 flex items-center space-x-2">
                    <Loader2 className="animate-spin h-4 w-4 text-[#3d71e9]" />
                    <span className="text-white text-sm">{txStatus}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons - Fixed Height */}
        <div className="p-4 border-t border-black/20 flex-shrink-0 h-20">
          {isPoolGraduated ? (
            <div className="flex gap-2 h-full">
              <button
                onClick={onClose}
                className="flex-1 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-xl transition-colors text-sm"
              >
                Close
              </button>
              <a
                href={`https://jup.ag/swap/SOL-${tokenMintAddress || poolAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2 bg-gradient-to-r from-[#3d71e9] to-[#799ef3] hover:opacity-90 text-black font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm text-center flex items-center justify-center"
              >
                Trade on Jupiter
              </a>
            </div>
          ) : (
            <div className="flex gap-2 h-full">
              <button
                onClick={getCustomPoolQuote}
                disabled={loading || !poolAddress}
                className="flex-1 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl disabled:opacity-50 transition-colors text-sm"
              >
                Refresh Quote
              </button>
              <button
                onClick={executeCustomPoolSwap}
                disabled={loading || !isConnected || !customPoolQuote || !poolAddress}
                className="flex-1 py-2 bg-gradient-to-r from-[#3d71e9] to-[#799ef3] hover:opacity-90 text-black font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
              >
                {loading ? 'Processing...' : 'Swap'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};