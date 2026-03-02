"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import GameCanvas from "@/components/game/GameCanvas";
import ChatWindow from "@/components/chat/ChatWindow";
import FriendList from "@/components/chat/FriendList";
import { CharacterData, FurnitureItem, RoomData } from "@/types/game";
import { FURNITURE_CATALOG, WALLPAPERS, FLOORS } from "@/data/items";

const DEFAULT_CHARACTER: CharacterData = {
  id: "", userId: "",
  skinTone: "light", hairStyle: "short", hairColor: "black",
  eyeColor: "brown", top: "default_top", bottom: "default_bottom",
  shoes: "default_shoes", hat: "none", accessory: "none",
};

export default function RoomPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [character, setCharacter] = useState<CharacterData>(DEFAULT_CHARACTER);
  const [room, setRoom] = useState<RoomData | null>(null);
  const [furniture, setFurniture] = useState<FurnitureItem[]>([]);
  const [decorating, setDecorating] = useState(false);
  const [saving, setSaving] = useState(false);

  // Room editor state
  const [selectedWallpaper, setSelectedWallpaper] = useState("white");
  const [selectedFloor, setSelectedFloor] = useState("wood");
  const [selectedFurniture, setSelectedFurniture] = useState<string | null>(null);
  const [placingX, setPlacingX] = useState(4);
  const [placingY, setPlacingY] = useState(4);

  const fetchData = useCallback(async () => {
    const [charRes, roomRes] = await Promise.all([
      fetch("/api/character"),
      fetch("/api/room"),
    ]);
    if (charRes.ok) setCharacter(await charRes.json());
    if (roomRes.ok) {
      const r = await roomRes.json();
      setRoom(r);
      setSelectedWallpaper(r.wallpaper);
      setSelectedFloor(r.floor);
      try {
        setFurniture(JSON.parse(r.furniture));
      } catch {
        setFurniture([]);
      }
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated") fetchData();
  }, [status, router, fetchData]);

  const saveRoom = async () => {
    setSaving(true);
    await fetch("/api/room", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        wallpaper: selectedWallpaper,
        floor: selectedFloor,
        furniture,
      }),
    });
    setSaving(false);
    setDecorating(false);
  };

  const placeFurniture = () => {
    if (!selectedFurniture) return;
    const newItem: FurnitureItem = {
      instanceId: `${selectedFurniture}_${Date.now()}`,
      itemId: selectedFurniture,
      x: placingX,
      y: placingY,
    };
    setFurniture((prev) => [...prev, newItem]);
  };

  const removeFurniture = (instanceId: string) => {
    setFurniture((prev) => prev.filter((f) => f.instanceId !== instanceId));
  };

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center font-mono text-gray-400">로딩 중...</div>;
  }

  const username = (session?.user as { username?: string })?.username ?? session?.user?.name ?? "나";

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-purple-50 to-pink-50 p-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 bg-white/80 backdrop-blur rounded-xl px-4 py-2 border border-pink-100">
        <div>
          <span className="text-lg font-bold font-mono text-pink-500">PixelRoom</span>
          <span className="ml-2 text-xs font-mono text-gray-400">{username}의 방</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.push("/dressup")}
            className="px-3 py-1.5 bg-pink-400 text-white rounded-lg font-mono text-xs font-bold hover:bg-pink-500 transition-colors"
          >
            👗 꾸미기
          </button>
          <button
            onClick={() => setDecorating((d) => !d)}
            className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-colors
              ${decorating ? "bg-purple-500 text-white" : "bg-purple-400 text-white hover:bg-purple-500"}`}
          >
            🏠 방 편집
          </button>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="px-3 py-1.5 bg-gray-200 text-gray-600 rounded-lg font-mono text-xs hover:bg-gray-300 transition-colors"
          >
            로그아웃
          </button>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-3">
        {/* Main game area */}
        <div className="flex-1">
          {room && (
            <GameCanvas
              character={character}
              furniture={furniture}
              wallpaper={selectedWallpaper}
              floor={selectedFloor}
            />
          )}
          <p className="text-xs font-mono text-gray-400 mt-1 text-center">
            WASD 또는 방향키로 캐릭터를 이동하세요
          </p>
        </div>

        {/* Side panel */}
        <div className="xl:w-72 space-y-3">
          {/* Room decorator */}
          {decorating && (
            <div className="bg-white rounded-xl border-2 border-purple-200 p-3">
              <h3 className="font-bold font-mono text-purple-500 mb-2 text-sm">🏠 방 꾸미기</h3>

              {/* Wallpaper */}
              <div className="mb-2">
                <p className="text-xs font-mono text-gray-500 mb-1">벽지</p>
                <div className="flex flex-wrap gap-1">
                  {WALLPAPERS.map((w) => (
                    <button
                      key={w.id}
                      title={w.name}
                      onClick={() => setSelectedWallpaper(w.id)}
                      className={`w-7 h-7 rounded border-2 transition-all ${selectedWallpaper === w.id ? "border-purple-500 scale-110" : "border-gray-200"}`}
                      style={{ backgroundColor: w.color }}
                    />
                  ))}
                </div>
              </div>

              {/* Floor */}
              <div className="mb-2">
                <p className="text-xs font-mono text-gray-500 mb-1">바닥</p>
                <div className="flex flex-wrap gap-1">
                  {FLOORS.map((f) => (
                    <button
                      key={f.id}
                      title={f.name}
                      onClick={() => setSelectedFloor(f.id)}
                      className={`w-7 h-7 rounded border-2 transition-all ${selectedFloor === f.id ? "border-purple-500 scale-110" : "border-gray-200"}`}
                      style={{ backgroundColor: f.color }}
                    />
                  ))}
                </div>
              </div>

              {/* Furniture placement */}
              <div className="mb-2">
                <p className="text-xs font-mono text-gray-500 mb-1">가구 배치</p>
                <div className="grid grid-cols-2 gap-1 max-h-32 overflow-y-auto">
                  {FURNITURE_CATALOG.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedFurniture(item.id)}
                      className={`px-2 py-1 rounded text-xs font-mono border transition-all text-left
                        ${selectedFurniture === item.id ? "border-purple-400 bg-purple-50" : "border-gray-200 hover:border-purple-300"}`}
                    >
                      <span
                        className="inline-block w-2.5 h-2.5 rounded mr-1"
                        style={{ backgroundColor: item.color }}
                      />
                      {item.name}
                    </button>
                  ))}
                </div>
              </div>

              {selectedFurniture && (
                <div className="mb-2 p-2 bg-purple-50 rounded-lg">
                  <p className="text-xs font-mono text-purple-600 mb-1">배치 위치 (x, y)</p>
                  <div className="flex gap-1 items-center">
                    <input
                      type="number"
                      min={0} max={15}
                      value={placingX}
                      onChange={(e) => setPlacingX(Number(e.target.value))}
                      className="w-12 px-1 py-0.5 border rounded text-xs font-mono"
                    />
                    <span className="text-xs font-mono text-gray-400">,</span>
                    <input
                      type="number"
                      min={2} max={11}
                      value={placingY}
                      onChange={(e) => setPlacingY(Number(e.target.value))}
                      className="w-12 px-1 py-0.5 border rounded text-xs font-mono"
                    />
                    <button
                      onClick={placeFurniture}
                      className="px-2 py-0.5 bg-purple-400 text-white text-xs rounded font-mono"
                    >
                      배치
                    </button>
                  </div>
                </div>
              )}

              {/* Placed furniture list */}
              {furniture.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs font-mono text-gray-500 mb-1">배치된 가구</p>
                  <div className="max-h-20 overflow-y-auto space-y-0.5">
                    {furniture.map((f) => {
                      const cat = FURNITURE_CATALOG.find((c) => c.id === f.itemId);
                      return (
                        <div key={f.instanceId} className="flex items-center justify-between text-xs font-mono">
                          <span className="text-gray-600">{cat?.name} ({f.x},{f.y})</span>
                          <button
                            onClick={() => removeFurniture(f.instanceId)}
                            className="text-red-400 hover:text-red-500 font-bold"
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex gap-1">
                <button
                  onClick={saveRoom}
                  disabled={saving}
                  className="flex-1 py-1.5 bg-purple-400 hover:bg-purple-500 text-white rounded-lg font-mono text-xs font-bold"
                >
                  {saving ? "저장 중..." : "저장"}
                </button>
                <button
                  onClick={() => { setDecorating(false); fetchData(); }}
                  className="px-3 py-1.5 bg-gray-200 text-gray-600 rounded-lg font-mono text-xs"
                >
                  취소
                </button>
              </div>
            </div>
          )}

          {/* Chat */}
          {room && (
            <ChatWindow roomId={room.id} username={username} />
          )}

          {/* Friends */}
          <FriendList />
        </div>
      </div>
    </div>
  );
}
