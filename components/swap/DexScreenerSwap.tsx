'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAppKitAccount, useAppKitProvider } from '@reown/appkit/react';
import { PublicKey, VersionedTransaction, Connection, Transaction } from '@solana/web3.js';
import axios from 'axios';
import { toast } from 'sonner';
import Image from 'next/image';


// CYAI token constants
const CYAI_TOKEN_ADDRESS = new PublicKey('6Tph3SxbAW12BSJdCevVV9Zujh97X69d5MJ4XjwKmray');

const CYAI_DECIMALS = 6;
const PAIR_ADDRESS = '4UN6WPJhfB9eoQq4XUwWiDj7NguW4iw9rx4iGBUguXcT';
const SOL_TOKEN = 'So11111111111111111111111111111111111111112';
const PRICE_REFRESH_INTERVAL = 10000; // 10 seconds
const QUOTE_EXPIRY_TIME = 10000; // 30 seconds

interface PairData {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  labels?: string[];
  baseToken: {
    address: string;
    name: string;
    symbol: string;
    logoURI?: string;
  };
  quoteToken: {
    address: string;
    name: string;
    symbol: string;
    logoURI?: string;
  };
  priceNative: string;
  priceUsd: string;
  txns: {
    h24?: {
      buys: number;
      sells: number;
    };
    m5?: {
      buys: number;
      sells: number;
    };
  };
  volume: {
    h24?: number;
    m5?: number;
  };
  priceChange: {
    h24?: number;
    m5?: number;
  };
  liquidity?: {
    usd?: number;
    base?: number;
    quote?: number;
  };
  fdv?: number;
  marketCap?: number;
  pairCreatedAt?: number;
  info?: {
    imageUrl?: string;
    websites?: {
      url: string;
    }[];
    socials?: {
      platform: string;
      handle: string;
    }[];
  };
  boosts?: {
    active?: number;
  };
}

interface TokenData {
  pairs: PairData[];
}

interface QuoteResponse {
  outAmount: string;
  priceImpactPct: string;
  [key: string]: unknown;
}
const formatSolUsdPrice = (pairData: PairData | null) => {
  if (!pairData || !pairData.priceNative || parseFloat(pairData.priceNative) === 0) return '0.00';
  const CYAIPriceUsd = parseFloat(pairData.priceUsd);
  const solToCYAI = parseFloat(pairData.priceNative);
  return (CYAIPriceUsd / solToCYAI).toFixed(2);
};
const formatPrice = (quote: QuoteResponse) => {
  const solAmount = parseFloat(quote.inAmount as string) / 1e9;
  const CYAIAmount = parseFloat(quote.outAmount) / (10 ** CYAI_DECIMALS);
  return (CYAIAmount / solAmount).toFixed(4);
};

const formatLargeNumber = (num?: number) => {
  if (num === undefined) return 'N/A';
  if (num >= 1000000000) {
    return `$${(num / 1000000000).toFixed(2)}B`;
  }
  if (num >= 1000000) {
    return `$${(num / 1000000).toFixed(2)}M`;
  }
  if (num >= 1000) {
    return `$${(num / 1000).toFixed(2)}K`;
  }
  return `$${num.toFixed(2)}`;
};

const formatDate = (timestamp?: number) => {
  if (!timestamp) return 'N/A';
  return new Date(timestamp).toLocaleDateString();
};

async function getSolanaConnection(): Promise<Connection> {
  const endpoints = [
    {
      url: `https://mainnet.helius-rpc.com/?api-key=${process.env.NEXT_PUBLIC_HELIUS_API_KEY}`,
      type: 'helius'
    },
    {
      url: 'https://api.mainnet-beta.solana.com',
      type: 'mainnet'
    },
    {
      url: 'https://solana-api.projectserum.com',
      type: 'serum'
    },
    {
      url: 'https://rpc.ankr.com/solana',
      type: 'ankr'
    }
  ];

  for (const endpoint of endpoints) {
    try {
      const connection = new Connection(endpoint.url, 'confirmed');
      await connection.getEpochInfo();
      console.log(`Connected to ${endpoint.type} RPC`);
      return connection;
    } catch (error) {
      console.warn(`Failed to connect to ${endpoint.type} RPC:`, error);
      continue;
    }
  }

  throw new Error('Unable to connect to any Solana RPC endpoint');
}

async function checkCYAIBalance(walletAddress: string): Promise<number> {
  const connection = await getSolanaConnection();
  try {
    const publicKey = new PublicKey(walletAddress);
    const accounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
      mint: CYAI_TOKEN_ADDRESS,
    });

    if (accounts.value.length === 0) return 0;
    return accounts.value[0].account.data.parsed.info.tokenAmount.uiAmount;
  } catch (error) {
    console.error('Balance check error:', error);
    throw new Error('Failed to check CYAI balance');
  }
}

async function checkSOLBalance(walletAddress: string): Promise<number> {
  const connection = await getSolanaConnection();
  try {
    const publicKey = new PublicKey(walletAddress);
    const balance = await connection.getBalance(publicKey);
    return balance / 1e9;
  } catch (error) {
    console.error("Error checking SOL balance:", error);
    throw new Error("Failed to check SOL balance");
  }
}

interface AppKitProviderType {
  signTransaction: (transaction: VersionedTransaction) => Promise<VersionedTransaction>;
  // Add other methods you use from walletProvider
}


export const DexScreenerSwap = () => {
  const { address, isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider<AppKitProviderType>("solana");
  const [pairData, setPairData] = useState<PairData | null>(null);
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [amount, setAmount] = useState<string>('1');
  const [slippage, setSlippage] = useState<number>(0.5);
  const [loading, setLoading] = useState<boolean>(false);
  const [txStatus, setTxStatus] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'swap' | 'info'>('swap');
  const [CYAIBalance, setCYAIBalance] = useState<number | null>(null);
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
const [quoteExpiry, setQuoteExpiry] = useState<number | null>(null);

const calculateSolToUsd = (solAmount: string) => {
  if (!pairData || !solAmount) return '0.00';
  const solPriceUsd = parseFloat(formatSolUsdPrice(pairData));
  const amount = parseFloat(solAmount) || 0;
  return (amount * solPriceUsd).toFixed(2);
};

const fetchPairData =  useCallback(async () => {
  try {
    const [pairResponse, tokenResponse] = await Promise.all([
      axios.get(`https://api.dexscreener.com/latest/dex/pairs/solana/${PAIR_ADDRESS}`),
      axios.get(`https://api.dexscreener.com/latest/dex/tokens/${CYAI_TOKEN_ADDRESS.toString()}`)
    ]);
    
    const pair = pairResponse.data.pairs?.[0] || null;
    setPairData(pair);
    
    setTokenData({
      pairs: tokenResponse.data.pairs || []
    });
    
    setLastUpdated(Date.now());
  } catch (error) {
    console.error('Error fetching data:', error);
    toast.error('Failed to fetch market data');
  } finally {
    setLoading(false);
  }
}, []);

const getQuote = useCallback(async () => {
  try {
    if (!amount || parseFloat(amount) <= 0) return;
    
    setLoading(true);
    const response = await axios.get(
      `https://quote-api.jup.ag/v6/quote?inputMint=${SOL_TOKEN}&outputMint=${CYAI_TOKEN_ADDRESS.toString()}&amount=${parseFloat(amount) * 10 ** 9}&slippageBps=${slippage * 100}`
    );
    
    const quoteData = response.data;
    if (quoteData.priceImpactPct) {
      quoteData.priceImpactPct = parseFloat(quoteData.priceImpactPct).toFixed(2);
    }
    
    setQuote(quoteData);
    setQuoteExpiry(Date.now() + QUOTE_EXPIRY_TIME);
  } catch (error) {
    console.error('Error getting quote:', error);
    toast.error('Failed to get swap quote');
  } finally {
    setLoading(false);
  }
}, [amount, slippage]);

const isQuoteValid = () => {
  if (!quote || !quoteExpiry) return false;
  return Date.now() < quoteExpiry;
};

const executeSwap = async () => {
  if (!isQuoteValid()) {
    toast.error('Price quote expired. Please refresh the quote.');
    await getQuote();
    return;
  }
    try {
      setTxStatus('Preparing transaction...');
      setLoading(true);
      
      const swapResponse = await axios.post('https://quote-api.jup.ag/v6/swap', {
        quoteResponse: quote,
        userPublicKey: address?.toString() || '',
        wrapAndUnwrapSol: true,
      });
      
      const swapTransactionBuf = Buffer.from(swapResponse.data.swapTransaction, 'base64');
      const transaction = VersionedTransaction.deserialize(swapTransactionBuf);
      
      setTxStatus('Awaiting wallet approval...');
      
      const signedTx = await walletProvider.signTransaction(transaction);
      const rawTransaction = signedTx.serialize();
      const connection = await getSolanaConnection();
      const txid = await connection.sendRawTransaction(rawTransaction, {
        skipPreflight: true,
      });
      
      setTxStatus('Confirming transaction...');
      await connection.confirmTransaction(txid, 'confirmed');
      
      toast.success(`Swap successful! TX: ${txid}`);
      setTxStatus('');
      setLoading(false);
      
      fetchPairData();
      checkBalances();
    } catch (error) {
      console.error('Swap failed:', error);
      toast.error('Swap failed. See console for details.');
      setTxStatus('');
      setLoading(false);
    }
  };

  const checkBalances = useCallback(async () => {
    if (!address) return;
    
    try {
      const [CYAIBal, solBal] = await Promise.all([
        checkCYAIBalance(address).catch(() => 0),
        checkSOLBalance(address).catch(() => 0)
      ]);
      setCYAIBalance(CYAIBal);
      setSolBalance(solBal);
    } catch (error) {
      console.error('Error checking balances:', error);
      toast.error('Failed to check balances');
    }
  }, [address]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (activeTab === 'swap') {
        fetchPairData();
        if (amount && isConnected) {
          getQuote();
        }
      }
    }, PRICE_REFRESH_INTERVAL);
  
    return () => clearInterval(interval);
  }, [activeTab, amount, isConnected, fetchPairData, getQuote]);

  useEffect(() => {
    fetchPairData();
    const interval = setInterval(fetchPairData, 30000);
    return () => clearInterval(interval);
  }, [fetchPairData]);

  useEffect(() => {
    if (address) {
      checkBalances();
    }
  }, [address, checkBalances]);

  useEffect(() => {
    if (amount && isConnected) {
      const debounceTimer = setTimeout(() => {
        getQuote();
      }, 500);
      return () => clearTimeout(debounceTimer);
    }
  }, [amount, slippage, isConnected, getQuote]);

  if (loading && !pairData) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-[rgba(33,37,52,0.5)] backdrop-blur-xl rounded-2xl overflow-hidden shadow-lg border border-blue-500/20 max-w-xl mx-auto">
      {/* Header with logo */}
      <div className="p-4 border-b border-blue-500/20">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            {pairData?.baseToken.logoURI && (
              <Image 
              src={pairData.baseToken.logoURI || '/default-token.png'} 
              alt={pairData.baseToken.symbol}
              width={32}
              height={32}
              className="rounded-full"
            />
            )}
            <h2 className="text-xl font-bold text-white">CYAI Swap</h2>
          </div>
          <div className={`text-lg font-bold ${
            (pairData?.priceChange.h24 || 0) >= 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            {(pairData?.priceChange.h24 || 0).toFixed(2)}%
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-blue-500/20">
        <button
          onClick={() => setActiveTab('swap')}
          className={`flex-1 py-3 font-medium text-base transition-colors ${
            activeTab === 'swap' 
              ? 'text-white border-b-2 border-blue-500' 
              : 'text-[#8A8A8A] hover:text-white'
          }`}
        >
          Swap
        </button>
        <button
          onClick={() => setActiveTab('info')}
          className={`flex-1 py-3 font-medium text-base transition-colors ${
            activeTab === 'info' 
              ? 'text-white border-b-2 border-blue-500' 
              : 'text-[#8A8A8A] hover:text-white'
          }`}
        >
          Token Info
        </button>
      </div>

      {/* Content Area */}
      <div className="p-4">
        {activeTab === 'swap' ? (
          <>
            {/* Swap Form */}
            <div className="space-y-4">
              {/* Input Section */}
            {/* Input Section */}
<div className="bg-[rgba(33,37,52,0.5)] rounded-xl p-3 border border-blue-500/20">
  <div className="flex justify-between items-center mb-2">
    <span className="text-[#AAAAAA] text-sm">You pay</span>
    <div className="flex flex-col items-end">
      <span className="text-xs text-[#AAAAAA]">
        Balance: {solBalance !== null ? solBalance.toFixed(4) : '-'} SOL
      </span>
      <span className="text-xs text-[#777777]">
        ≈ ${calculateSolToUsd(amount)} USD
      </span>
    </div>
  </div>
  <div className="flex items-center">
    <input
      type="number"
      value={amount}
      onChange={(e) => setAmount(e.target.value)}
      className="flex-1 bg-transparent text-white text-xl outline-none placeholder-[#555555]"
      placeholder="0.0"
      min="0"
      step="0.1"
    />
    <div className="bg-[rgba(109,116,139,0.1)] rounded-lg px-3 py-1.5">
      <span className="font-medium text-white text-sm">SOL</span>
    </div>
  </div>
</div>

              {/* Output Section */}
              <div className="bg-[rgba(33,37,52,0.5)] rounded-xl p-3 border border-blue-500/20">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[#AAAAAA] text-sm">You receive</span>
                  <span className="text-xs text-[#AAAAAA]">
                    Balance: {CYAIBalance !== null ? CYAIBalance.toLocaleString() : '-'} CYAI
                  </span>
                </div>
                <div className="flex items-center">
                  <input
                    type="text"
                    value={quote ? (parseFloat(quote.outAmount) / 10 ** CYAI_DECIMALS).toFixed(4) : '0.0'}
                    readOnly
                    className="flex-1 bg-transparent text-white text-xl outline-none"
                  />
                  <div className="bg-[rgba(109,116,139,0.1)] rounded-lg px-3 py-1.5">
                    <span className="font-medium text-white text-sm">CYAI</span>
                  </div>
                </div>
              </div>

              {/* Price Info */}
              {quote && (
                <div className="bg-[rgba(33,37,52,0.5)] rounded-xl p-3 border border-blue-500/20 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[#AAAAAA] text-sm">Exchange Rate</span>
                    <span className="font-medium text-white text-sm">
                      1 SOL = {formatPrice(quote)} CYAI
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#AAAAAA] text-sm">SOL Price</span>
                    <span className="font-medium text-white text-sm">
                      ${formatSolUsdPrice(pairData)} USD
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#AAAAAA] text-sm">Minimum Received</span>
                    <span className="font-medium text-white text-sm">
                      {(parseFloat(quote.outAmount) / 10 ** CYAI_DECIMALS * (1 - slippage / 100)).toFixed(4)} CYAI
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#AAAAAA] text-sm">Price Impact</span>
                    <span className={`text-sm ${parseFloat(quote.priceImpactPct) > 1 ? 'text-red-400' : 'text-green-400'}`}>
                      {quote.priceImpactPct}%
                    </span>
                  </div>
                </div>
              )}

              {/* Slippage Settings */}
              <div className="bg-[rgba(33,37,52,0.5)] rounded-xl p-4 border border-blue-500/20">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[#AAAAAA] font-medium text-sm">Slippage Tolerance</span>
                  <span className="text-sm text-blue-400 font-semibold">
                    {slippage}%
                  </span>
                </div>
                {/* Presets row */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {[0.5, 1, 2].map((value) => (
                    <button
                      key={value}
                      onClick={() => setSlippage(value)}
                      aria-pressed={slippage === value}
                      className={`py-2.5 rounded-lg text-sm font-semibold transition-all ${
                        slippage === value 
                          ? 'bg-blue-600 text-white hover:bg-blue-700 ring-2 ring-blue-400/50 shadow-lg shadow-blue-500/20' 
                          : 'bg-[rgba(109,116,139,0.15)] text-[#AAAAAA] hover:bg-gray-700/50 border border-gray-700/50'
                      }`}
                    >
                      {value}%
                    </button>
                  ))}
                </div>
                {/* Custom value row */}
                <div className="space-y-1.5">
                  <label className="text-xs text-[#AAAAAA] font-medium uppercase tracking-wider">Custom Amount</label>
                  <div className="relative">
                    <div className="flex items-center gap-2 bg-[rgba(109,116,139,0.15)] border border-gray-700 rounded-lg p-1 hover:border-blue-500/30 transition-colors">
                      <input
                        type="number"
                        value={slippage}
                        onChange={(e) => setSlippage(Math.min(10, Math.max(0.1, parseFloat(e.target.value) || 0.5)))}
                        onWheel={(e) => (e.target as HTMLElement).blur()}
                        className="flex-1 bg-transparent py-2 px-2.5 text-white text-sm font-medium outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        min="0.1"
                        max="10"
                        step="0.1"
                        inputMode="decimal"
                      />
                      <div className="flex flex-col gap-0.5 pr-1">
                        <button
                          onClick={() => setSlippage(Math.min(10, slippage + 0.1))}
                          className="w-7 h-4 flex items-center justify-center bg-gray-700 hover:bg-blue-600 rounded text-white transition-colors group"
                          aria-label="Increase slippage"
                        >
                          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setSlippage(Math.max(0.1, slippage - 0.1))}
                          className="w-7 h-4 flex items-center justify-center bg-gray-700 hover:bg-blue-600 rounded text-white transition-colors group"
                          aria-label="Decrease slippage"
                        >
                          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>
                      <span className="text-[#AAAAAA] font-medium pr-1.5 text-sm">%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    fetchPairData();
                    getQuote();
                  }}
                  disabled={loading}
                  className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg disabled:opacity-50 transition-colors font-medium text-sm"
                >
                  Refresh
                </button>
                <button
                  onClick={executeSwap}
                  disabled={loading || !quote || !isConnected || !isQuoteValid()}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white text-base font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {!isConnected ? 'Connect Wallet' : loading ? 'Processing...' : 'Swap Now'}
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Token Info Tab */
          <div className="space-y-4">
            {/* Market Data Grid */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Market Cap', value: pairData?.marketCap },
                { label: 'FDV', value: pairData?.fdv },
                { label: 'Liquidity', value: pairData?.liquidity?.usd },
                { label: 'Volume (24h)', value: pairData?.volume?.h24 },
                { label: 'Transactions (24h)', value: pairData?.txns.h24 ? (pairData.txns.h24.buys + pairData.txns.h24.sells) : undefined },
                { label: 'Created', value: pairData?.pairCreatedAt ? formatDate(pairData.pairCreatedAt) : undefined },
              ].map((item, index) => (
                <div key={index} className="bg-[rgba(33,37,52,0.5)] rounded-xl p-4 border border-blue-500/20">
                  <p className="text-[#AAAAAA] text-sm mb-1">{item.label}</p>
                  <p className="text-white font-medium">
                    {item.value ? 
                      (typeof item.value === 'number' ? formatLargeNumber(item.value) : item.value) 
                      : 'N/A'}
                  </p>
                </div>
              ))}
            </div>

            {/* Token Details */}
            <div className="bg-[rgba(33,37,52,0.5)] rounded-xl p-6 border border-blue-500/20">
              <h3 className="text-xl font-bold text-white mb-4">Token Details</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-[#AAAAAA]">Pair Address</span>
                  <span className="text-[#00A3FF] font-mono text-sm break-all text-right">
                    {pairData?.pairAddress || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#AAAAAA]">Base Token</span>
                  <span className="text-white">
                    {pairData?.baseToken.symbol} ({pairData?.baseToken.name})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#AAAAAA]">Quote Token</span>
                  <span className="text-white">
                    {pairData?.quoteToken.symbol} ({pairData?.quoteToken.name})
                  </span>
                </div>
              </div>
            </div>

            {/* View on DexScreener Button */}
            <a
              href={`https://dexscreener.com/solana/${PAIR_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full py-4 bg-blue-600 hover:bg-blue-700 text-center rounded-lg font-medium transition-colors text-white"
            >
              View on DexScreener
            </a>
          </div>
        )}
      </div>
    </div>
  );
};