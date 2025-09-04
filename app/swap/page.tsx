'use client';

import StarCanvas from "@/components/StarCanvas";
import { DexScreenerSwap } from "../../components/swap/DexScreenerSwap";
import Image from "next/image";

export default function SwapPage() {
  return (
    <>
             <div className="absolute top-0 left-0 w-full overflow-hidden -z-10 pointer-events-none">
      <div className="w-[2661px]  text-[370px] opacity-10 tracking-[24.96px] leading-[70%] font-moonhouse text-transparent text-left inline-block [-webkit-text-stroke:3px_#c8c8c8] [paint-order:stroke_fill] mix-blend-overlay">
        CYRENE
      </div>
    </div>

    <div className="min-h-screen flex flex-col items-center pt-24 pb-12">
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