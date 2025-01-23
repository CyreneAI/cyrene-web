"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { useState } from "react";
import Layout from "@/components/shared/layout";

export default function Home() {
  const [inputValue, setInputValue] = useState("");

  return (
    <Layout>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 md:pt-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center"
        >
          <h1 
            className="text-3xl sm:text-4xl md:text-5xl text-white font-medium mb-12 sm:mb-16"
            style={{ 
              fontFamily: 'PingFang SC',
              textShadow: '0 0 20px rgba(79, 172, 254, 0.3)'
            }}
          >
            Hi, I&apos;m Cyrene
          </h1>

          <div className="relative w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 mb-16 sm:mb-20 md:mb-24">
            <Image
              src="/Cyrene profile cropped _85 1.png"
              alt="Cyrene AI"
              fill
              className="object-cover rounded-3xl"
            />
          </div>

          <div className="flex flex-col items-center gap-8 sm:gap-12 md:gap-16 mb-32 sm:mb-40 md:mb-48">
            <div className="relative w-full max-w-xl">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="ask cyrene"
                className="w-full bg-white/5 backdrop-blur-sm text-white placeholder-white/40 rounded-2xl px-6 py-4 sm:py-5 pr-12 border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-sm sm:text-base"
                style={{ fontFamily: 'PingFang SC' }}
              />
              <ArrowUp 
                className={`absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 sm:w-6 sm:h-6 transition-colors ${
                  inputValue ? 'text-blue-500' : 'text-white/40'
                }`}
              />
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
