'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp, Volume2, VolumeX, Mic, MicOff, X, Send, MessageCircle } from 'lucide-react';
import VoiceManager from '@/utils/voiceUtils';
import { useAppKitAccount } from '@reown/appkit/react';
import Image from 'next/image';
import { toast } from 'sonner';

interface Message {
  isUser: boolean;
  text: string;
  audio?: string | null;
}

interface FixedChatProps {
  className?: string;
}

export const FixedChat: React.FC<FixedChatProps> = ({ className = '' }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isPlayingAudio, setIsPlayingAudio] = useState<{ [key: number]: boolean }>({});
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [selectedVoice] = useState<string>('af_bella');
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const voiceManager = useRef(new VoiceManager());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  const { address, isConnected } = useAppKitAccount();
  const [user, setUser] = useState<string>('');

  useEffect(() => {
    if (isConnected && address) {
      setUser(address);
    } else {
      setUser('');
    }
  }, [isConnected, address]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const scrollToBottom = () => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (text: string, user: string, forceVoiceMode?: boolean) => {
    if (!text.trim() || isLoading) return;

    setIsLoading(true);
    setTranscription('');

    const userMessageIndex = messages.length;
    setMessages((prev) => [...prev, { isUser: true, text }]);
    setInputValue('');

    try {
      let responseText: string = '';
      let audioUrl: string | null = null;

      const useVoiceMode = forceVoiceMode || isVoiceMode;
      
      const formData = new FormData();
      formData.append('text', text);
      formData.append('userId', user);
      formData.append('voice_mode', useVoiceMode.toString());

      const response = await fetch(`/api/chatCyrene`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      responseText = data[0].text;

      if (useVoiceMode) {
        try {
          audioUrl = await voiceManager.current.generateVoice(responseText, selectedVoice);
          if (audioUrl) {
            if (audioRef.current) {
              audioRef.current.pause();
              audioRef.current.currentTime = 0;
              audioRef.current.src = audioUrl;
              await audioRef.current.play().catch((err) => console.error('Audio playback error:', err));
            } else {
              const audio = new Audio(audioUrl);
              audioRef.current = audio;
              await audio.play().catch((err) => console.error('Audio playback error:', err));
            }
          }
        } catch (error) {
          console.error('Voice generation error:', error);
        }
      }

      setMessages((prev) => [
        ...prev,
        { isUser: false, text: responseText, audio: audioUrl }
      ]);
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      setMessages((prev) => prev.filter((_, i) => i !== userMessageIndex));
      toast.error('Failed to send message. Please try again.');
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
      async (text) => {
        setTranscription(text);
        const forceVoiceMode = true;
        await handleSubmit(text, user, forceVoiceMode);
      },
      () => setIsRecording(false)
    );
  };

  const toggleVoiceMode = async () => {
    if (isVoiceMode) {
      setIsVoiceMode(false);
      setIsRecording(false);
      voiceManager.current.stopListening();
    } else {
      await new Promise<void>((resolve) => {
        setIsVoiceMode(true);
        setInputValue('');
        resolve();
      });

      setIsRecording(true);
      voiceManager.current.startListening(
        async (text) => {
          setTranscription(text);
          const forceVoiceMode = true;
          await handleSubmit(text, user, forceVoiceMode);
        },
        () => setIsRecording(false)
      );
    }
  };

  const toggleAudio = (index: number) => {
    const message = messages[index];
    if (!message.audio) return;

    if (audioRef.current) {
      if (isPlayingAudio[index]) {
        audioRef.current.pause();
        setIsPlayingAudio((prev) => ({ ...prev, [index]: false }));
      } else {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.src = message.audio;
        audioRef.current.play().catch((err) => console.error('Audio playback error:', err));
        setIsPlayingAudio((prev) => ({ ...prev, [index]: true }));
      }
    } else {
      const audio = new Audio(message.audio);
      audioRef.current = audio;
      audio.play().catch((err) => console.error('Audio playback error:', err));
      setIsPlayingAudio((prev) => ({ ...prev, [index]: true }));
    }
  };

  return (
    <div className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 ${className}`}>
      <AnimatePresence>
        {isExpanded ? (
          // Expanded Chat Interface - Fixed sizing and spacing
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="w-[420px] h-[550px] bg-gray-900/98 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl flex flex-col"
          >
            {/* Header - Fixed height */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                  <Image
                    src="/cyrene_profile.png"
                    alt="Cyrene"
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm">Cyrene</h3>
                  <p className="text-gray-400 text-xs">AI Assistant</p>
                </div>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors flex-shrink-0"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Messages - Flexible height with proper scrolling */}
            <div className="flex-1 min-h-0 flex flex-col">
              <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin scrollbar-thumb-blue-500/50 scrollbar-track-transparent"
              >
                {/* Welcome message */}
                <div className="flex justify-start">
                  <div className="flex gap-3 max-w-[85%]">
                    <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                      <Image
                        src="/cyrene_chat.png"
                        alt="Cyrene"
                        width={32}
                        height={32}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="bg-gray-800/50 rounded-2xl rounded-tl-sm px-4 py-3">
                      <p className="text-white/90 text-sm leading-relaxed">
                        Hi, I&apos;m Cyrene. How can I assist you today?
                      </p>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                {messages.map((message, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex gap-3 max-w-[85%] ${message.isUser ? 'flex-row-reverse' : ''}`}>
                      {!message.isUser && (
                        <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                          <Image
                            src="/cyrene_chat.png"
                            alt="Cyrene"
                            width={32}
                            height={32}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div
                        className={`rounded-2xl px-4 py-3 ${
                          message.isUser
                            ? 'bg-blue-600 text-white rounded-tr-sm'
                            : 'bg-gray-800/50 text-white/90 rounded-tl-sm'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {!message.isUser && message.audio && (
                            <button
                              onClick={() => toggleAudio(index)}
                              className={`mt-0.5 transition-colors flex-shrink-0 ${
                                isPlayingAudio[index] ? 'text-blue-400' : 'text-white/60 hover:text-white/90'
                              }`}
                            >
                              {isPlayingAudio[index] ? (
                                <VolumeX className="w-4 h-4" />
                              ) : (
                                <Volume2 className="w-4 h-4" />
                              )}
                            </button>
                          )}
                          <p className="text-sm leading-relaxed">{message.text}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Voice Mode UI */}
              {isVoiceMode && (
                <div className="px-4 py-3 border-t border-white/10 flex-shrink-0">
                  <div className="flex flex-col items-center gap-3">
                    <motion.div className="relative w-16 h-16 flex items-center justify-center">
                      <motion.div
                        animate={{
                          scale: isRecording ? [1, 1.2, 1] : 1,
                          opacity: isRecording ? [0.2, 0.5, 0.2] : 0.2
                        }}
                        transition={{
                          repeat: isRecording ? Infinity : 0,
                          duration: 1.5
                        }}
                        className="absolute inset-0 bg-blue-500 rounded-full"
                      />
                      <button
                        onClick={handleVoiceInput}
                        className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                          isRecording
                            ? 'bg-blue-500 text-white hover:bg-blue-600'
                            : 'bg-white/5 text-white/60 hover:text-blue-500 hover:bg-white/10'
                        }`}
                      >
                        {isRecording ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                      </button>
                    </motion.div>
                    {transcription && (
                      <p className="text-white/60 text-xs text-center max-w-full truncate">{transcription}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Input - Fixed height */}
              <div className="p-4 border-t border-white/10 flex-shrink-0">
                <div className="relative">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSubmit(inputValue, user);
                    }}
                    className="relative"
                  >
                    <input
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder={isVoiceMode ? "Listening..." : "Ask Cyrene..."}
                      disabled={isLoading || isRecording}
                      className="w-full bg-white/5 backdrop-blur-sm text-white placeholder-white/40 rounded-xl px-4 py-3 pr-20 border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-sm"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                      <button
                        type="button"
                        onClick={toggleVoiceMode}
                        className={`p-2 rounded-lg transition-colors ${
                          isVoiceMode
                            ? "bg-blue-500/20 text-blue-500 hover:bg-blue-500/30"
                            : "hover:bg-white/10 text-white/40 hover:text-blue-500"
                        }`}
                      >
                        {isVoiceMode ? <X className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      </button>
                      <button
                        type="submit"
                        disabled={isLoading || !inputValue.trim()}
                        className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                      >
                        <ArrowUp
                          className={`w-4 h-4 transition-colors ${
                            inputValue && !isLoading ? "text-blue-500" : "text-white/40"
                          }`}
                        />
                      </button>
                    </div>
                  </form>

                  {/* Loading Indicator */}
                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute -top-8 left-1/2 -translate-x-1/2 flex gap-1"
                    >
                      <div className="w-1 h-1 bg-blue-500/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-1 h-1 bg-blue-500/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-1 h-1 bg-blue-500/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          // Collapsed Chat Button - Your Frame Design (Improved spacing)
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="relative cursor-pointer"
            onClick={() => setIsExpanded(true)}
          >
            <div className="w-[480px] h-[80px] relative">
              <div className="absolute w-full h-full top-0 left-0">
                {/* Main container with gradient border */}
                <div className="w-full bg-[#2f375533] rounded-[40px] backdrop-blur-[35px] h-full relative before:content-[''] before:absolute before:inset-0 before:p-px before:rounded-[40px] before:[background:linear-gradient(31deg,rgba(77,132,238,0.4)_0%,rgba(255,255,255,0.12)_50%,rgba(138,56,245,0.4)_100%)] before:[-webkit-mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] before:[-webkit-mask-composite:xor] before:[mask-composite:exclude] before:z-[1] before:pointer-events-none">
                  
                  {/* Right side button area */}
                  <div className="absolute w-[80px] h-[50px] top-[15px] right-[15px] bg-[#2f375533] rounded-[40px] backdrop-blur-[30px]" />
                  
                  {/* Text */}
                  <p className="absolute top-[30px] left-20 font-normal text-neutral-100 text-sm tracking-[0] leading-[18px] whitespace-nowrap">
                    Hi, I&apos;m Cyrene. How can I assist you today?
                  </p>
                  
                  {/* Avatar container - Fixed sizing */}
                  <div className="inline-flex h-[50px] w-[50px] items-center justify-center absolute top-[15px] left-[15px] bg-[#00000026] rounded-[40px] overflow-hidden">
                    <Image
                      src="/CyreneAI_logo_square.png"
                      alt="Cyrene AI Logo"
                      width={35}
                      height={20}
                      className="object-contain"
                    />
                  </div>
                </div>
              </div>
              
              {/* Icons - Better positioning */}
              <div className="absolute w-[60px] h-6 top-7 right-[25px] flex gap-2 items-center justify-center">
                <button className="w-6 h-6 text-white/60 hover:text-white transition-colors">
                  <Mic className="w-full h-full" />
                </button>
                <button className="w-6 h-6 text-white/60 hover:text-white transition-colors">
                  <MessageCircle className="w-full h-full" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};