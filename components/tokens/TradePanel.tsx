'use client'

import React, { useState } from 'react'

// Define types
interface TradePanelProps {
  tokenName: string;
  tokenPrice: number;
  onBuy?: (amount: number) => void;
  onSell?: (amount: number) => void;
  isConnected: boolean;
  onConnectWallet: () => void;
  hideHeaderAndExtras?: boolean;
}

// Format price for display
const formatPrice = (price: number) => {
  if (price >= 1000) {
    return `$${(price / 1000).toFixed(2)}k`;
  }
  return `$${price.toFixed(2)}`;
};

const TradePanel: React.FC<TradePanelProps> = ({
  tokenName,
  tokenPrice,
  onBuy,
  onSell,
  isConnected,
  onConnectWallet,
  hideHeaderAndExtras = false,
}) => {
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState<string>('');
  
  // Calculate price based on amount
  const calculatedPrice = amount ? parseFloat(amount) * tokenPrice : 0;
  
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow only numbers and decimals
    const value = e.target.value.replace(/[^0-9.]/g, '');
    setAmount(value);
  };
  
  const handleSubmit = () => {
    if (!isConnected || !amount) return;
    
    const parsedAmount = parseFloat(amount);
    if (parsedAmount <= 0) return;
    
    if (activeTab === 'buy' && onBuy) {
      onBuy(parsedAmount);
    } else if (activeTab === 'sell' && onSell) {
      onSell(parsedAmount);
    }
  };

  return (
    <div className="w-full">
      {!hideHeaderAndExtras && (
        <div className="flex justify-between items-center mb-4 ">
          <h3 className="font-bold text-white text-lg">Trade</h3>
          <span className="text-xs text-gray-400 font-normal">Last Price: {formatPrice(tokenPrice)}</span>
        </div>
      )}
      
      {/* Buy/Sell Toggle */}
      <div className="flex bg-[#040A25] rounded-lg mb-4">
        <button 
          className={`flex-1 py-2 text-center rounded-lg text-white font-medium transition-colors ${
            activeTab === 'buy' ? 'bg-blue-500' : 'hover:bg-[#151530]'
          }`}
          onClick={() => setActiveTab('buy')}
        >
          Buy
        </button>
        <button 
          className={`flex-1 py-2 text-center rounded-lg text-white font-medium transition-colors ${
            activeTab === 'sell' ? 'bg-red-500' : 'hover:bg-[#151530]'
          }`}
          onClick={() => setActiveTab('sell')}
        >
          Sell
        </button>
      </div>

      {/* Amount Fields */}
      <div className="mb-4">
        <label className="block text-gray-400 mb-1 text-sm">Amount</label>
        <input 
          type="text" 
          className="w-full bg-[#040A25] border border-gray-700/50 rounded-lg p-2 text-white"
          placeholder="0"
          value={amount}
          onChange={handleAmountChange}
        />
      </div>

      <div className="mb-4">
        <label className="block text-gray-400 mb-1 text-sm">Price</label>
        <input 
          type="text" 
          className="w-full bg-[#040A25] border border-gray-700/50 rounded-lg p-2 text-white"
          placeholder="$0"
          value={calculatedPrice ? `$${calculatedPrice.toFixed(2)}` : ''}
          disabled
        />
      </div>

      {/* Connect/Trade Button */}
      {isConnected ? (
        <button 
          className={`w-full py-3 rounded-lg font-medium mt-4 ${
            activeTab === 'buy' 
              ? 'bg-blue-600 hover:bg-blue-700 text-white' 
              : 'bg-red-600 hover:bg-red-700 text-white'
          }`}
          onClick={handleSubmit}
        >
          {activeTab === 'buy' ? 'Buy' : 'Sell'} {tokenName}
        </button>
      ) : (
        <button 
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium mt-4"
          onClick={onConnectWallet}
        >
          Connect Wallet
        </button>
      )}

      {!hideHeaderAndExtras && (
        <>
          {/* Stats Placeholder */}
          <div className="mt-8">
            <h4 className="font-medium text-white mb-3">Flywheel Statistics</h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-[#040A25] p-3 rounded-lg">
                <div className="text-gray-400 text-xs">Purchased</div>
                <div className="text-white font-medium">$0</div>
              </div>
              <div className="bg-[#040A25] p-3 rounded-lg">
                <div className="text-gray-400 text-xs">Token Burned</div>
                <div className="text-white font-medium">0.000%</div>
              </div>
            </div>
          </div>

          {/* Team Size */}
          <div className="mt-4">
            <h4 className="font-medium text-white mb-3">Team</h4>
            <div className="bg-[#040A25] p-3 rounded-lg">
              <div className="text-gray-400 text-xs">Size</div>
              <div className="text-white font-medium">2</div>
            </div>
          </div>

          {/* Holders Distribution */}
          <div className="mt-4">
            <h4 className="font-medium text-white mb-3">Holders Distribution</h4>
            <div className="bg-[#040A25] p-3 rounded-lg">
              <div className="flex justify-between items-center text-xs text-gray-400 mb-1">
                <span>Top 1</span>
                <span>48.5%</span>
              </div>
              <div className="w-full bg-gray-800/50 rounded-full h-1.5 mb-2">
                <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '48.5%' }}></div>
              </div>
              
              <div className="flex justify-between items-center text-xs text-gray-400 mb-1">
                <span>Top 10</span>
                <span>76.2%</span>
              </div>
              <div className="w-full bg-gray-800/50 rounded-full h-1.5 mb-2">
                <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '76.2%' }}></div>
              </div>
              
              <div className="flex justify-between items-center text-xs text-gray-400 mb-1">
                <span>Others</span>
                <span>23.8%</span>
              </div>
              <div className="w-full bg-gray-800/50 rounded-full h-1.5">
                <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '23.8%' }}></div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default TradePanel