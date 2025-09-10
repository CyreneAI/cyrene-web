'use client'

import Image from 'next/image'
import React from 'react'

interface TokenHeaderProps {
  symbol: string
  name: string
  description: string
  price: number
  priceChange?: {
    percentage: number
    period: string  // e.g., "24h"
  }
  image?: string
}

const TokenHeader: React.FC<TokenHeaderProps> = ({
  symbol,
  name,
  description,
  price,
  priceChange = { percentage: 2.4, period: "24h" },
  image
}) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center overflow-hidden">
          {image ? (
            <Image 
              src={image} 
              alt={name} 
              width={48} 
              height={48} 
              className="object-cover"
            />
          ) : (
            <span className="font-bold text-white">{symbol}</span>
          )}
        </div>
        <div>
          <h2 className="font-bold text-white text-xl">{name}</h2>
          <p className="text-gray-400 text-xs max-w-xl leading-relaxed mt-1 opacity-75">{description}</p>
        </div>
      </div>
      <div className="text-right">
        <div className="text-white text-2xl font-bold">${(price / 1000).toFixed(2)}k</div>
        <div className={`${priceChange.percentage >= 0 ? 'text-green-500' : 'text-red-500'} text-sm`}>
          {priceChange.percentage >= 0 ? '+' : ''}{priceChange.percentage}% ({priceChange.period})
        </div>
      </div>
    </div>
  )
}

export default TokenHeader