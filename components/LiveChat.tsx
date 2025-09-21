"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useAppKitAccount } from "@reown/appkit/react";
import { Send, Users, Loader2, Radio } from 'lucide-react';
import { toast } from 'sonner';

export interface LiveChatMessage {
  id: string;
  roomId: string;
  walletAddress: string;
  username: string;
  message: string;
  timestamp: number;
  type: 'normal' | 'system' | 'moderator';
}

interface LiveChatProps {
  roomId: string;
  isStreamLive: boolean;
  className?: string;
  title?: string;
  autoCreateRoom?: boolean;
}

export default function LiveChat({ 
  roomId, 
  isStreamLive, 
  className = "", 
  title = "Live Chat",
  autoCreateRoom = true
}: LiveChatProps) {
  const { address, isConnected } = useAppKitAccount();
  const [messages, setMessages] = useState<LiveChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [stats, setStats] = useState({
    participantCount: 0,
    onlineCount: 0,
    messageCount: 0
  });
  
  const listRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load messages function
  const loadMessages = useCallback(async () => {
    if (!isStreamLive) {
      setMessages([]);
      setLoading(false);
      return;
    }

    try {
      console.log('Loading messages for room:', `chat_${roomId}`);
      
      const response = await fetch('/api/chat/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          roomId: `chat_${roomId}`, 
          walletAddress: address 
        })
      });

      if (response.ok) {
        const { messages: latestMessages, stats: roomStats } = await response.json();
        console.log('Loaded messages:', latestMessages?.length || 0);
        
        setMessages(latestMessages || []);
        setStats({
          participantCount: roomStats?.participantCount || 0,
          onlineCount: roomStats?.onlineCount || 0,
          messageCount: roomStats?.messageCount || 0
        });
      } else {
        console.error('Failed to load messages:', response.status);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  }, [roomId, isStreamLive, address]);

  // Create room if needed
  const createRoom = useCallback(async () => {
    if (!isStreamLive || !autoCreateRoom) return;

    try {
      console.log('Creating chat room for:', roomId);
      
      const response = await fetch('/api/chat/room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          streamId: roomId, 
          roomId: `chat_${roomId}` 
        })
      });

      if (response.ok) {
        console.log('Chat room created successfully');
      } else {
        console.log('Chat room creation failed (might already exist)');
      }
    } catch (error) {
      console.error('Error creating chat room:', error);
    }
  }, [roomId, isStreamLive, autoCreateRoom]);

  // Initialize chat
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await createRoom();
      await loadMessages();
    };
    
    init();
  }, [createRoom, loadMessages]);

  // Set up polling
  useEffect(() => {
    if (isStreamLive) {
      pollIntervalRef.current = setInterval(loadMessages, 2000);
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [isStreamLive, loadMessages]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages.length]);

  // Send message
  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || !isConnected || !address || sending || !isStreamLive) return;

    setSending(true);
    setInput("");

    try {
      console.log('Sending message:', trimmed);
      
      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: `chat_${roomId}`,
          walletAddress: address,
          message: trimmed,
          type: 'normal'
        })
      });

      if (response.ok) {
        console.log('Message sent successfully');
        // Reload messages immediately
        setTimeout(loadMessages, 100);
      } else {
        const errorData = await response.json();
        console.error('Failed to send message:', errorData);
        toast.error(errorData.error || 'Failed to send message');
        setInput(trimmed); // Restore input on error
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      setInput(trimmed); // Restore input on error
    } finally {
      setSending(false);
    }
  };

  const formatUsername = (walletAddress: string) => {
    return `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`;
  };

  const canChat = isStreamLive && isConnected && !sending;

  return (
    <div className={`bg-[#040A25] rounded-[30px] p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white/90 font-medium flex items-center gap-2">
          {title}
          {isStreamLive ? (
            <div className="flex items-center gap-1 px-2 py-1 bg-red-500/20 rounded-full">
              <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
              <Radio className="w-3 h-3 text-red-400" />
              <span className="text-xs text-red-300">LIVE</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 px-2 py-1 bg-gray-500/20 rounded-full">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              <span className="text-xs text-gray-300">OFFLINE</span>
            </div>
          )}
        </h3>
        
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            <span>{stats.onlineCount}</span>
            <span className="text-gray-500">online</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={listRef}
        className="h-[320px] lg:h-[420px] overflow-y-auto pr-2 space-y-3 rounded-xl bg-black/20 p-3 border border-white/5"
      >
        {loading ? (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Loading chat…
          </div>
        ) : !isStreamLive ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 text-sm">
            <Radio className="w-8 h-8 mb-2 text-gray-500" />
            <div>Stream is offline</div>
            <div className="text-xs mt-1">Chat will be available when stream goes live</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            Be the first to chat!
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.walletAddress === address ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                msg.type === 'system' 
                  ? 'bg-yellow-500/20 text-yellow-200 border border-yellow-500/30'
                  : msg.walletAddress === address 
                    ? 'bg-blue-600/80 text-white' 
                    : 'bg-white/5 text-white/90'
              }`}>
                <div className="flex items-center justify-between text-[10px] opacity-70 mb-1">
                  <span>{msg.username || formatUsername(msg.walletAddress)}</span>
                  <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="break-words">{msg.message}</div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <div className="mt-3">
        <div className="flex items-center gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={
              !isStreamLive ? "Stream is offline" :
              !isConnected ? "Connect wallet to chat" :
              sending ? "Sending..." :
              "Type a message…"
            }
            disabled={!canChat}
            rows={1}
            className="flex-1 resize-none bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-white/20 disabled:opacity-50"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!canChat || !input.trim()}
            className="h-10 w-10 flex items-center justify-center rounded-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
        
        {/* Status */}
        {!isStreamLive && (
          <p className="mt-2 text-xs text-gray-400">Stream is offline. Chat is disabled until stream goes live.</p>
        )}
        {!isConnected && isStreamLive && (
          <p className="mt-2 text-xs text-gray-400">Connect your wallet to participate in chat.</p>
        )}
        
        {/* Stats */}
        <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
          <span>{stats.participantCount} participants</span>
          <span>{stats.messageCount} messages</span>
          <span>Room: {roomId.slice(0, 8)}...</span>
        </div>
      </div>
    </div>
  );
}