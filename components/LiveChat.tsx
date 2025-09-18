"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAppKitAccount } from "@reown/appkit/react";
import Image from "next/image";
import { Send } from 'lucide-react'

export interface ChatMessage {
  id: string;
  room_id: string; // tokenAddress (or custom id)
  wallet_address: string;
  username?: string | null;
  message: string;
  created_at: string; // ISO
}

interface LiveChatProps {
  roomId: string; // e.g., tokenAddress
  className?: string;
  title?: string;
}

// Minimal schema expectation (Postgres):
// create table live_chat_messages (
//   id uuid primary key default gen_random_uuid(),
//   room_id text not null,
//   wallet_address text not null,
//   username text,
//   message text not null,
//   created_at timestamptz not null default now()
// );
// create index on live_chat_messages(room_id);
// enable RLS and add policies to allow insert/select for anon keyed by room_id if needed.

export default function LiveChat({ roomId, className = "", title = "Live Chat" }: LiveChatProps) {
  const { address, isConnected } = useAppKitAccount();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Fetch last 100 messages
  useEffect(() => {
    let ignore = false;
    const fetchMessages = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data, error } = await supabase
          .from("live_chat_messages")
          .select("id, room_id, wallet_address, username, message, created_at")
          .eq("room_id", roomId)
          .order("created_at", { ascending: true })
          .limit(200);
        if (error) throw error;
        if (!ignore) setMessages(data as ChatMessage[]);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Failed to load chat";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();
    return () => {
      ignore = true;
    };
  }, [roomId]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`chat:${roomId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "live_chat_messages", filter: `room_id=eq.${roomId}` },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          setMessages((prev) => [...prev, newMsg]);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [roomId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    if (!isConnected || !address) return;

    const username = address.slice(0, 4) + "..." + address.slice(-4);

    setInput("");
    const { error } = await supabase.from("live_chat_messages").insert({
      room_id: roomId,
      wallet_address: address,
      username,
      message: trimmed,
    });
    if (error) {
      setError(error.message);
      // Revert input on error
      setInput(trimmed);
    }
  };

  return (
    <div className={`bg-[#040A25] rounded-[30px] p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white/90 font-medium">{title}</h3>
        <span className="text-xs text-gray-400">Room: {short(roomId)}</span>
      </div>

      <div
        ref={listRef}
        className="h-[320px] lg:h-[420px] overflow-y-auto pr-2 space-y-3 rounded-xl bg-black/20 p-3 border border-white/5"
      >
        {loading ? (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">Loading chat…</div>
        ) : error ? (
          <div className="flex items-center justify-center h-full text-red-400 text-sm">{error}</div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">Be the first to chat!</div>
        ) : (
          messages.map((m) => <MessageBubble key={m.id} msg={m} self={m.wallet_address === address} />)
        )}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            // Enter sends message, Shift+Enter inserts newline
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder={isConnected ? "Type a message…" : "Connect wallet to chat"}
          disabled={!isConnected}
          rows={1}
          className="flex-1 resize-none bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-white/20"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!isConnected || !input.trim()}
          aria-label="Send message"
          title="Send"
          className="h-10 w-10 flex items-center justify-center rounded-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
        >
          <Send size={16} />
        </button>
      </div>

      {!isConnected && (
        <p className="mt-2 text-xs text-gray-400">Connect your wallet to participate in chat. Read-only mode is enabled.</p>
      )}
    </div>
  );
}

function MessageBubble({ msg, self }: { msg: ChatMessage; self: boolean }) {
  return (
    <div className={`flex ${self ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${self ? "bg-blue-600/80 text-white" : "bg-white/5 text-white/90"}`}>
        <div className="text-[10px] opacity-70 mb-0.5">{msg.username || short(msg.wallet_address)}</div>
        <div>{msg.message}</div>
        <div className="text-[10px] opacity-50 mt-0.5">{new Date(msg.created_at).toLocaleTimeString()}</div>
      </div>
    </div>
  );
}

function short(s: string) {
  if (!s) return "";
  return s.length > 10 ? `${s.slice(0, 4)}…${s.slice(-4)}` : s;
}
