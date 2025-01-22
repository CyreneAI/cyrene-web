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
      <div className="container mx-auto px-8 flex flex-col items-center pt-32">
        <h1 className="text-6xl text-white font-medium mb-16" 
          style={{ 
            fontFamily: 'PingFang SC',
            textShadow: '0 0 20px rgba(79, 172, 254, 0.3)'
          }}
        >
          Cyrene AI
        </h1>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="relative w-96 h-96 md:w-[500px] md:h-[500px] mb-32"
        >
          <Image
            src="/Cyrene profile cropped _85 1.png"
            alt="Cyrene AI Avatar"
            fill
            className="object-cover rounded-3xl"
            priority
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="flex flex-col items-center gap-16 w-full max-w-3xl mb-48"
        >
          <h2 className="text-5xl text-white font-medium" 
            style={{ 
              fontFamily: 'PingFang SC',
              textShadow: '0 0 20px rgba(79, 172, 254, 0.3)'
            }}
          >
            What can I help you with?
          </h2>
          <div className="w-full relative max-w-xl">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Message Cyrene"
              className="w-full px-8 py-6 rounded-2xl bg-white/5 text-white text-xl 
                placeholder:text-white/40 border border-white/10 
                focus:outline-none focus:ring-1 focus:ring-blue-400/50 
                focus:border-blue-400/50 pr-16"
            />
            <div className={`absolute right-6 top-1/2 -translate-y-1/2 transition-colors ${inputValue ? 'text-blue-400' : 'text-white/40'}`}>
              <ArrowUp size={24} />
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
