"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ChatMessage } from "@/types/game";

interface Props {
  roomId: string;
  username: string;
}

export default function ChatWindow({ roomId, username }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchMessages = useCallback(async () => {
    const res = await fetch(`/api/messages?roomId=${roomId}`);
    if (res.ok) {
      const data = await res.json();
      setMessages(data);
    }
  }, [roomId]);

  useEffect(() => {
    fetchMessages();
    // Poll for new messages every 3 seconds
    pollRef.current = setInterval(fetchMessages, 3000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchMessages]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, content: input }),
      });
      if (res.ok) {
        const msg = await res.json();
        setMessages((prev) => [...prev, msg]);
        setInput("");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-64 bg-white/90 backdrop-blur rounded-xl border-2 border-pink-200 overflow-hidden">
      <div className="bg-pink-400 text-white px-3 py-1.5 text-sm font-bold font-mono flex items-center gap-2">
        <span>💬</span> 방 채팅
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {messages.length === 0 && (
          <p className="text-center text-gray-400 text-xs mt-4 font-mono">아직 메시지가 없어요</p>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-1.5 ${msg.user.username === username ? "flex-row-reverse" : ""}`}>
            <div
              className={`max-w-[80%] px-2 py-1 rounded-lg text-xs font-mono
                ${msg.user.username === username
                  ? "bg-pink-400 text-white rounded-tr-none"
                  : "bg-gray-100 text-gray-700 rounded-tl-none"
                }`}
            >
              {msg.user.username !== username && (
                <div className="font-bold text-pink-500 mb-0.5">{msg.user.username}</div>
              )}
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <form onSubmit={sendMessage} className="flex gap-1 p-2 border-t border-pink-100">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="메시지 입력..."
          maxLength={100}
          className="flex-1 px-2 py-1 text-xs rounded-lg border border-gray-200 focus:outline-none focus:border-pink-400 font-mono"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-3 py-1 bg-pink-400 text-white text-xs rounded-lg hover:bg-pink-500 disabled:opacity-50 font-mono font-bold transition-colors"
        >
          전송
        </button>
      </form>
    </div>
  );
}
