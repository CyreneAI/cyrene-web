"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { useState } from "react";
import Layout from "@/components/shared/layout";

export default function Home() {
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Array<{ isUser: boolean; text: string }>>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue;
    setMessages(prev => [...prev, { isUser: true, text: userMessage }]);
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('text', inputValue);
      formData.append('user', 'user');

      const response = await fetch('https://ai.us01.erebrus.io/b450db11-332b-0fc2-a144-92824a34f699/message', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      if (data && data.length > 0) {
        setMessages(prev => [...prev, { isUser: false, text: data[0].text }]);
      }

      // Clear input after successful send
      setInputValue("");
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
            <div className="w-full max-w-xl space-y-4">
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[80%] rounded-2xl p-4 sm:p-5 backdrop-blur-sm border
                      ${message.isUser 
                        ? 'bg-blue-500/20 border-blue-500/30 rounded-tr-sm' 
                        : 'bg-white/5 border-white/10 rounded-tl-sm'
                      }`}
                  >
                    <p 
                      className="text-white/90 text-sm sm:text-base"
                      style={{ fontFamily: 'PingFang SC' }}
                    >
                      {message.text}
                    </p>
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="bg-white/5 backdrop-blur-sm rounded-2xl rounded-tl-sm p-4 sm:p-5 border border-white/10">
                    <div className="flex gap-2">
                      <div className="w-2 h-2 bg-blue-500/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-blue-500/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-blue-500/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
            <form onSubmit={handleSubmit} className="relative w-full max-w-xl">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="ask cyrene"
                disabled={isLoading}
                className="w-full bg-white/5 backdrop-blur-sm text-white placeholder-white/40 rounded-2xl px-6 py-4 sm:py-5 pr-12 border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ fontFamily: 'PingFang SC' }}
              />
              <button 
                type="submit"
                disabled={isLoading || !inputValue.trim()}
                className="absolute right-4 top-1/2 -translate-y-1/2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowUp 
                  className={`w-5 h-5 sm:w-6 sm:h-6 transition-colors ${
                    inputValue && !isLoading ? 'text-blue-500' : 'text-white/40'
                  }`}
                />
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
