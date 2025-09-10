
import React from 'react'
import TradePanel from './TradePanel'


interface TradeCardProps {
  tokenName: string
  tokenPrice: number
  isConnected: boolean
  onConnectWallet: () => void
  onBuy?: (amount: number) => void
  onSell?: (amount: number) => void
  slippageText?: string
}

const TradeCard: React.FC<TradeCardProps> = ({
  tokenName,
  tokenPrice,
  isConnected,
  onConnectWallet,
  onBuy,
  onSell,
  slippageText = 'Slippage: 5%'
}) => {
  return (
    <div className="bg-[#040A25] rounded-[30px] p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-white text-lg">Trade</h3>
        <span className="text-xs text-gray-400">{slippageText}</span>
      </div>
      <TradePanel 
        tokenName={tokenName}
        tokenPrice={tokenPrice}
        isConnected={isConnected}
        onConnectWallet={onConnectWallet}
        onBuy={onBuy}
        onSell={onSell}
      />
    </div>
  )
}

export default TradeCard