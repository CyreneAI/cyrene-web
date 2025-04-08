// app/nfts/page.tsx
'use client'

import { Suspense } from 'react';
import dynamic from 'next/dynamic';

// Dynamic import with SSR false
const NFTMetadata = dynamic(
  () => import('@/components/NFTMetadata'),
  { 
    ssr: false,
    loading: () => <div className="text-center py-8">Loading NFT data...</div>
  }
);

export default function NFTPage() {
  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-8 bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
          NFT Explorer
        </h1>
        <Suspense fallback={<div className="text-center py-8">Loading NFT component...</div>}>
          <NFTMetadata />
        </Suspense>
      </div>
    </div>
  );
}