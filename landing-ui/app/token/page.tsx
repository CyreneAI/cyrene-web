"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import Layout from "@/components/shared/layout";

export default function Token() {
  return (
    <Layout>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 md:pt-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center gap-16 sm:gap-20 md:gap-24 mb-32 sm:mb-40 md:mb-48"
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl text-white font-medium mb-6 sm:mb-8" 
            style={{ 
              fontFamily: 'PingFang SC',
              textShadow: '0 0 20px rgba(79, 172, 254, 0.3)'
            }}
          >
            CyreneAI Token
          </h1>

          <div className="relative w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96">
            <Image
              src="/CyreneAI token NEW_800 5.png"
              alt="Cyrene Token"
              fill
              className="object-contain"
            />
          </div>

          <div className="w-full max-w-2xl mb-16 sm:mb-20 md:mb-24">
            <h2 className="text-2xl sm:text-2xl md:text-3xl text-white mb-8 sm:mb-10 md:mb-12 text-center" 
              style={{ 
                fontFamily: 'PingFang SC',
                textShadow: '0 0 20px rgba(79, 172, 254, 0.3)'
              }}
            >
              Tokenomics
            </h2>
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12 border border-white/10">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 text-white text-sm sm:text-base">
                <div>
                  <span className="text-white/60">Token Symbol:</span>
                  <span className="ml-2 sm:ml-4">CYRENE</span>
                </div>
                <div>
                  <span className="text-white/60">Token Name:</span>
                  <span className="ml-2 sm:ml-4">CyreneAI</span>
                </div>
                <div>
                  <span className="text-white/60">Token Type:</span>
                  <span className="ml-2 sm:ml-4">Utility</span>
                </div>
                <div>
                  <span className="text-white/60">Total Token Supply:</span>
                  <span className="ml-2 sm:ml-4">1,000,000,000</span>
                </div>
                <div>
                  <span className="text-white/60">Network:</span>
                  <span className="ml-2 sm:ml-4">Solana</span>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full max-w-5xl mx-auto">
            <h2 className="text-2xl sm:text-2xl md:text-3xl text-white mb-8 sm:mb-10 md:mb-12 text-center" 
              style={{ 
                fontFamily: 'PingFang SC',
                textShadow: '0 0 20px rgba(79, 172, 254, 0.3)'
              }}
            >
              Token Allocation
            </h2>
            <div className="relative w-full h-[600px] sm:h-[800px] md:h-[1000px] mb-16 sm:mb-20 md:mb-24">
              <Image
                src="/token allocation NEW 1 (1).png"
                alt="Token Allocation"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>

          <div className="w-full max-w-3xl">
            <h2 className="text-2xl sm:text-2xl md:text-3xl text-white mb-6 sm:mb-8 text-center" 
              style={{ 
                fontFamily: 'PingFang SC',
                textShadow: '0 0 20px rgba(79, 172, 254, 0.3)'
              }}
            >
              Product Timeline
            </h2>
            <div className="relative w-full h-[400px] sm:h-[500px] md:h-[600px]">
              <Image
                src="/product_timeline.png"
                alt="Product Timeline"
                fill
                className="object-contain"
              />
            </div>
          </div>

          <div className="flex flex-col items-center gap-6 sm:gap-8">
            <h2 className="text-2xl sm:text-2xl md:text-3xl text-white text-center" 
              style={{ 
                fontFamily: 'PingFang SC',
                textShadow: '0 0 20px rgba(79, 172, 254, 0.3)'
              }}
            >
              Buy Now
            </h2>
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32">
              <Image
                src="/CyreneAI token NEW_800 5.png"
                alt="Cyrene Token"
                fill
                className="object-contain"
              />
            </div>
            <a 
              href="https://swissborg.com"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl text-sm sm:text-base transition-colors"
            >
              GO TO SWISS BORG AND BUY
            </a>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
} 