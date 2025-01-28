"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowUp, Volume2, VolumeX, Mic, MicOff, X } from "lucide-react";
import { useState, useRef } from "react";
import Layout from "@/components/shared/layout";
import VoiceManager from '@/utils/voiceUtils';

// Mock responses for testing
const mockResponses = [
  "Hello! I'm doing great, thank you for asking. I'm here to help you explore the fascinating world of AI and technology. What would you like to know?",
  "I'm a multi-talented AI assistant with expertise in cybersecurity, blockchain, and decentralized systems. I can help with technical questions, provide guidance on various topics, and even engage in natural conversations with voice responses.",
  "That's a great question! I specialize in natural language processing, voice synthesis, and understanding complex technical concepts. I can help explain difficult topics in simple terms.",
  "I'd be happy to help you with that. My knowledge spans across various domains including AI, machine learning, cybersecurity, and blockchain technology."
];

interface Message {
  isUser: boolean;
  text: string;
  audio?: string | null;
}

export default function Home() {
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isPlayingAudio, setIsPlayingAudio] = useState<{[key: number]: boolean}>({});
  const audioRefs = useRef<{[key: number]: HTMLAudioElement | null}>({});
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState("");
  const voiceManager = useRef(new VoiceManager());

  const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';

  const handleSubmit = async (text: string) => {
    if (!text.trim() || isLoading) return;

    setIsLoading(true);
    setTranscription("");

    try {
      let responseText: string;
      
      if (useMockData) {
        const randomIndex = Math.floor(Math.random() * mockResponses.length);
        responseText = mockResponses[randomIndex];
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        const formData = new FormData();
        formData.append('text', text);
        formData.append('user', 'user');

        const response = await fetch('https://0667-2405-201-801c-10b3-8d43-5c12-bd30-55d6.ngrok-free.app/message', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) throw new Error('Failed to send message');
        const data = await response.json();
        responseText = data[0].text;
      }

      // Only generate voice in voice mode
      let audioUrl = null;
      if (isVoiceMode) {
        audioUrl = await voiceManager.current.generateVoice(responseText);
        if (audioUrl) {
          const audio = new Audio(audioUrl);
          audio.play();
        }
      }

      setMessages(prev => [
        ...prev,
        { isUser: true, text },
        { isUser: false, text: responseText, audio: audioUrl }
      ]);
      setInputValue('');
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceInput = () => {
    if (isRecording) {
      voiceManager.current.stopListening();
      setIsRecording(false);
      return;
    }

    setIsRecording(true);
    voiceManager.current.startListening(
      (text) => {
        setTranscription(text);
        handleSubmit(text);
      },
      () => setIsRecording(false)
    );
  };

  const exitVoiceMode = () => {
    setIsVoiceMode(false);
    setIsRecording(false);
    voiceManager.current.stopListening();
  };

  const toggleAudio = (index: number) => {
    const audio = audioRefs.current[index];
    if (!audio) return;

    if (isPlayingAudio[index]) {
      audio.pause();
      setIsPlayingAudio(prev => ({ ...prev, [index]: false }));
    } else {
      audio.play();
      setIsPlayingAudio(prev => ({ ...prev, [index]: true }));
    }
  };

  const toggleVoiceMode = () => {
    if (isVoiceMode) {
      exitVoiceMode();
    } else {
      setIsVoiceMode(true);
      setInputValue('');
      // Start listening immediately
      setIsRecording(true);
      voiceManager.current.startListening(
        (text) => {
          setTranscription(text);
          handleSubmit(text);
        },
        () => setIsRecording(false)
      );
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

          <div className="relative w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 mb-8">
            <Image
              src="/Cyrene profile cropped _85 1.png"
              alt="Cyrene AI"
              fill
              className="object-cover rounded-3xl"
            />
          </div>

          <div className="w-full max-w-xl flex flex-col items-center">
            {/* Messages List */}
            <div className="w-full space-y-4">
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
                    <div className="flex items-start gap-3">
                      {!message.isUser && message.audio && (
                        <button
                          onClick={() => toggleAudio(index)}
                          className="mt-1 text-white/60 hover:text-white/90 transition-colors"
                        >
                          {isPlayingAudio[index] ? (
                            <VolumeX className="w-4 h-4" />
                          ) : (
                            <Volume2 className="w-4 h-4" />
                          )}
                        </button>
                      )}
                      <p className="text-white/90 text-sm sm:text-base flex-1">
                        {message.text}
                      </p>
                    </div>
                    {message.audio && (
                      <audio
                        ref={(el) => {
                          if (el) audioRefs.current[index] = el;
                        }}
                        src={message.audio}
                        onEnded={() => setIsPlayingAudio(prev => ({ ...prev, [index]: false }))}
                        className="hidden"
                      />
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Voice Mode UI */}
            {isVoiceMode && (
              <div className="w-full flex flex-col items-center mb-4">
                <div className="relative w-32 h-32 flex items-center justify-center">
                  <motion.div
                    animate={{
                      scale: isRecording ? [1, 1.2, 1] : 1,
                    }}
                    transition={{
                      repeat: isRecording ? Infinity : 0,
                      duration: 1.5,
                    }}
                    className="absolute inset-0 bg-blue-500/10 rounded-full"
                  />
                  <button
                    onClick={handleVoiceInput}
                    className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center transition-colors ${
                      isRecording 
                        ? 'bg-blue-500 text-white hover:bg-blue-600' 
                        : 'bg-white/5 text-white/40 hover:text-blue-500'
                    }`}
                  >
                    {isRecording ? (
                      <MicOff className="w-8 h-8" />
                    ) : (
                      <Mic className="w-8 h-8" />
                    )}
                  </button>
                </div>

                {/* Transcription Display */}
                {transcription && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-white/90 text-center text-lg mt-4 w-full"
                  >
                    {transcription}
                  </motion.div>
                )}
              </div>
            )}

            {/* Input Form with Loading Indicator */}
            <div className="w-full sticky bottom-8 mt-16 mb-32">
              <div className="relative">
                <form onSubmit={(e) => {
                  e.preventDefault();
                  handleSubmit(inputValue);
                }} className="relative w-full">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={isVoiceMode ? "Listening..." : "Ask Cyrene..."}
                    disabled={isLoading || isRecording}
                    className="w-full bg-white/5 backdrop-blur-sm text-white placeholder-white/40 rounded-2xl px-6 py-4 sm:py-5 pr-32 border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-3">
                    <button
                      type="button"
                      onClick={toggleVoiceMode}
                      className={`p-2 rounded-full transition-colors ${
                        isVoiceMode 
                          ? 'bg-blue-500/20 text-blue-500 hover:bg-blue-500/30' 
                          : 'hover:bg-white/10 text-white/40 hover:text-blue-500'
                      }`}
                    >
                      {isVoiceMode ? <X className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </button>
                    <button 
                      type="submit"
                      disabled={isLoading || !inputValue.trim()}
                      className="p-2 rounded-full hover:bg-white/10"
                    >
                      <ArrowUp className={`w-5 h-5 transition-colors ${
                        inputValue && !isLoading ? 'text-blue-500' : 'text-white/40'
                      }`} />
                    </button>
                  </div>
                </form>

                {/* Loading Indicator */}
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute -top-8 left-1/2 -translate-x-1/2 flex gap-2 justify-center"
                  >
                    <div className="w-2 h-2 bg-blue-500/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-blue-500/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-blue-500/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
