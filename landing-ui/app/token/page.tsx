"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import Layout from "@/landing-ui/components/shared/layout";

export default function Token() {
  return (
    <Layout>
      <div className="container mx-auto px-8 pt-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center gap-24"
        >
          <h1 className="text-5xl text-white font-medium mb-8" 
            style={{ 
              fontFamily: 'PingFang SC',
              textShadow: '0 0 20px rgba(79, 172, 254, 0.3)'
            }}
          >
            CyreneAI Token
          </h1>

          <div className="relative w-72 h-72">
            <Image
              src="/CyreneAI token NEW_800 5.png"
              alt="Cyrene Token"
              fill
              className="object-contain"
            />
          </div>

          <div className="w-full max-w-2xl mb-24">
            <h2 className="text-3xl text-white mb-12 text-center" 
              style={{ 
                fontFamily: 'PingFang SC',
                textShadow: '0 0 20px rgba(79, 172, 254, 0.3)'
              }}
            >
              Tokenomics
            </h2>
            <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-12 border border-white/10">
              <div className="grid grid-cols-2 gap-8 text-white">
                <div>
                  <span className="text-white/60">Token Symbol:</span>
                  <span className="ml-4">CYRENE</span>
                </div>
                <div>
                  <span className="text-white/60">Network:</span>
                  <span className="ml-4">TBA</span>
                </div>
                <div>
                  <span className="text-white/60">Total Supply:</span>
                  <span className="ml-4">1,000,000,000</span>
                </div>
                <div>
                  <span className="text-white/60">Token Type:</span>
                  <span className="ml-4">Native</span>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full max-w-3xl mx-auto">
            <h2 className="text-3xl text-white mb-12 text-center" 
              style={{ 
                fontFamily: 'PingFang SC',
                textShadow: '0 0 20px rgba(79, 172, 254, 0.3)'
              }}
            >
              Token Allocation
            </h2>
            <div className="relative w-full aspect-[3/4] mb-24">
              <Image
                src="/token allocation NEW 1 (1).png"
                alt="Token Allocation"
                fill
                className="object-contain"
              />
            </div>
          </div>

          <div className="w-full max-w-3xl">
            <h2 className="text-3xl text-white mb-8 text-center" 
              style={{ 
                fontFamily: 'PingFang SC',
                textShadow: '0 0 20px rgba(79, 172, 254, 0.3)'
              }}
            >
              Product Timeline
            </h2>
            <div className="relative w-full h-[600px]">
              <Image
                src="/product_timeline.png"
                alt="Product Timeline"
                fill
                className="object-contain"
              />
            </div>
          </div>

          <div className="flex flex-col items-center gap-8">
            <h2 className="text-3xl text-white text-center" 
              style={{ 
                fontFamily: 'PingFang SC',
                textShadow: '0 0 20px rgba(79, 172, 254, 0.3)'
              }}
            >
              Buy Now
            </h2>
            <div className="relative w-32 h-32">
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
              className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-xl transition-colors"
            >
              GO TO SWISS BORG AND BUY
            </a>
          </div>

          <div className="mt-auto py-12 w-full text-center">
            <p className="text-4xl text-white/90" 
              style={{ 
                fontFamily: 'PingFang SC',
                textShadow: '0 0 20px rgba(79, 172, 254, 0.3)'
              }}
            >
              Always here for you.
            </p>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
} 