'use client';

import StarCanvas from "@/components/StarCanvas";
import { DexScreenerSwap } from "../../components/swap/DexScreenerSwap";
import Image from "next/image";

export default function SwapPage() {
  return (
    <>
        <StarCanvas />

    <div className="min-h-screen flex flex-col items-center pt-24 pb-12">
    <div className="absolute top-20 left-10 w-72 h-72 bg-[#0162FF] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" />
        <div className="absolute top-40 right-10 w-72 h-72 bg-[#A63FE1] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-[#3985FF] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000" />
      {/* Logo Section - Same as your page.tsx */}
      <div className="w-full max-w-[1400px] mb-16 flex justify-center">
        <div className="relative w-[300px] h-[100px] sm:w-[600px] sm:h-[200px]">
          <Image
            src="/CyreneAI logo_text.svg"
            alt="Stories Logo"
            fill
            priority
            className="object-contain"
          />
        </div>
      </div>

      {/* Swap Container */}
      <div className="w-full max-w-[1400px] px-4">
        <DexScreenerSwap />
      </div>
    </div>
    </>

  );
}