"use client";

import { useState, useEffect, useCallback } from "react";
import { Friend, FriendRequest } from "@/types/game";

export default function FriendList() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pending, setPending] = useState<FriendRequest[]>([]);
  const [search, setSearch] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchMsg, setSearchMsg] = useState("");

  const fetchFriends = useCallback(async () => {
    const res = await fetch("/api/friends");
    if (res.ok) {
      const data = await res.json();
      setFriends(data.friends);
      setPending(data.pendingRequests);
    }
  }, []);

  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  const sendRequest = async () => {
    if (!search.trim()) return;
    setSearchLoading(true);
    setSearchMsg("");
    const res = await fetch("/api/friends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "send", username: search }),
    });
    const data = await res.json();
    if (res.ok) {
      setSearchMsg("친구 요청을 보냈어요!");
      setSearch("");
    } else {
      setSearchMsg(data.error ?? "오류가 발생했어요");
    }
    setSearchLoading(false);
  };

  const respond = async (friendshipId: string, accept: boolean) => {
    await fetch("/api/friends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: accept ? "accept" : "reject", friendshipId }),
    });
    fetchFriends();
  };

  return (
    <div className="bg-white/90 backdrop-blur rounded-xl border-2 border-purple-200 overflow-hidden">
      <div className="bg-purple-400 text-white px-3 py-1.5 text-sm font-bold font-mono flex items-center gap-2">
        <span>👥</span> 친구 목록
      </div>

      <div className="p-2 space-y-2">
        {/* 친구 초대 */}
        <div className="flex gap-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendRequest()}
            placeholder="닉네임으로 초대"
            className="flex-1 px-2 py-1 text-xs rounded-lg border border-gray-200 focus:outline-none focus:border-purple-400 font-mono"
          />
          <button
            onClick={sendRequest}
            disabled={searchLoading}
            className="px-2 py-1 bg-purple-400 text-white text-xs rounded-lg hover:bg-purple-500 font-mono font-bold"
          >
            초대
          </button>
        </div>
        {searchMsg && (
          <p className="text-xs font-mono text-center text-purple-500">{searchMsg}</p>
        )}

        {/* 대기 중인 요청 */}
        {pending.length > 0 && (
          <div>
            <p className="text-xs font-bold font-mono text-gray-500 mb-1">받은 요청</p>
            {pending.map((req) => (
              <div key={req.id} className="flex items-center gap-1 py-1">
                <span className="flex-1 text-xs font-mono text-gray-700">{req.sender.username}</span>
                <button onClick={() => respond(req.id, true)} className="px-1.5 py-0.5 bg-green-400 text-white text-[10px] rounded font-mono">수락</button>
                <button onClick={() => respond(req.id, false)} className="px-1.5 py-0.5 bg-red-300 text-white text-[10px] rounded font-mono">거절</button>
              </div>
            ))}
          </div>
        )}

        {/* 친구 목록 */}
        <div className="max-h-36 overflow-y-auto">
          {friends.length === 0 ? (
            <p className="text-xs text-gray-400 font-mono text-center py-2">친구가 없어요. 초대해보세요!</p>
          ) : (
            friends.map((friend) => (
              <div key={friend.id} className="flex items-center gap-2 py-1 border-b border-gray-50">
                <div className="w-4 h-4 bg-purple-200 rounded-full flex items-center justify-center">
                  <span className="text-[8px]">★</span>
                </div>
                <span className="text-xs font-mono text-gray-700">{friend.username}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
