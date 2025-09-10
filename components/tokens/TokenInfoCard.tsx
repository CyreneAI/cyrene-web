'use client'

import Image from 'next/image'
import React from 'react'

type Metric = {
  label: string
  value: string
}

interface TokenInfoCardProps {
  symbol: string
  name: string
  description: string
  image?: string
  marketCapDisplay: string
  metrics?: Metric[]
}

const TokenInfoCard: React.FC<TokenInfoCardProps> = ({
  symbol,
  name,
  description,
  image,
  marketCapDisplay,
  metrics = []
}) => {
  return (
    <div className="bg-[#040A25] rounded-[30px] p-6 mb-6">
      {/* Top metrics row */}
      {metrics.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-8 gap-y-2 pb-4 mb-4 border-b border-white/5 text-[13px]">
          {metrics.map((m, idx) => (
            <div key={idx} className="flex items-center gap-1 text-gray-300/90">
              <span className="text-gray-400/80">{m.label}</span>
              <span className="font-semibold text-white">{m.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Main content */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center overflow-hidden">
            {image ? (
              <Image src={image} alt={name} width={48} height={48} className="object-cover" />
            ) : (
              <span className="font-bold text-white">{symbol}</span>
            )}
          </div>
          <div>
            <h2 className="font-bold text-white text-xl">{name}</h2>
            <p className="text-gray-400 text-xs max-w-xl leading-relaxed mt-1 opacity-80">{description}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-gray-400 text-xs mb-1">Market Cap</div>
          <div className="text-white text-2xl font-extrabold">{marketCapDisplay}</div>
          <button aria-label="action" className="mt-2 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 5v14l11-7L8 5z" fill="currentColor" className="text-white" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default TokenInfoCard