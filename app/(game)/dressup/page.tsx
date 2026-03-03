"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import CharacterPreview from "@/components/dressup/CharacterPreview";
import ItemGrid from "@/components/dressup/ItemGrid";
import CategoryTabs from "@/components/dressup/CategoryTabs";
import { CharacterData } from "@/types/game";
import {
  SKIN_TONES, HAIR_COLORS, EYE_COLORS, HAIR_STYLES,
  TOPS, BOTTOMS, SHOES, HATS, ACCESSORIES
} from "@/data/items";

const TABS = [
  { id: "skinTone", label: "피부", emoji: "🌸" },
  { id: "hairStyle", label: "헤어", emoji: "💇" },
  { id: "hairColor", label: "헤어색", emoji: "🎨" },
  { id: "eyeColor", label: "눈색", emoji: "👁" },
  { id: "top", label: "상의", emoji: "👕" },
  { id: "bottom", label: "하의", emoji: "👖" },
  { id: "shoes", label: "신발", emoji: "👟" },
  { id: "hat", label: "모자", emoji: "🎩" },
  { id: "accessory", label: "액세서리", emoji: "✨" },
];

const ITEM_MAP: Record<string, typeof TOPS> = {
  skinTone: SKIN_TONES,
  hairStyle: HAIR_STYLES,
  hairColor: HAIR_COLORS,
  eyeColor: EYE_COLORS,
  top: TOPS,
  bottom: BOTTOMS,
  shoes: SHOES,
  hat: HATS,
  accessory: ACCESSORIES,
};

const DEFAULT_CHARACTER: CharacterData = {
  id: "", userId: "",
  skinTone: "light", hairStyle: "short_cut", hairColor: "black",
  eyeColor: "brown", top: "t_shirt", bottom: "jeans",
  shoes: "default_shoes", hat: "none", accessory: "none",
};

export default function DressupPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [character, setCharacter] = useState<CharacterData>(DEFAULT_CHARACTER);
  const [activeTab, setActiveTab] = useState("skinTone");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const fetchCharacter = useCallback(async () => {
    const res = await fetch("/api/character");
    if (res.ok) setCharacter(await res.json());
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated") fetchCharacter();
  }, [status, router, fetchCharacter]);

  const handleSelect = (id: string) => {
    setCharacter((prev) => ({ ...prev, [activeTab]: id }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    await fetch("/api/character", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(character),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center font-mono text-gray-400">로딩 중...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-sky-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold font-mono text-pink-500">👗 드레스업</h1>
            <p className="text-xs font-mono text-gray-400">캐릭터를 꾸며보세요!</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push("/room")}
              className="px-3 py-2 bg-white border-2 border-gray-200 text-gray-600 rounded-xl font-mono text-sm hover:border-pink-300 transition-colors"
            >
              🏠 내 방
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className={`px-4 py-2 rounded-xl font-mono font-bold text-sm transition-all
                ${saved
                  ? "bg-green-400 text-white"
                  : "bg-pink-400 hover:bg-pink-500 text-white"
                } disabled:opacity-50`}
            >
              {saved ? "저장 완료!" : saving ? "저장 중..." : "저장하기"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Character Preview */}
          <div className="bg-white rounded-2xl border-2 border-pink-100 p-4 flex flex-col items-center">
            <p className="text-sm font-bold font-mono text-gray-600 mb-3">
              {session?.user?.name}
            </p>
            <CharacterPreview character={character} />
          </div>

          {/* Item Selector */}
          <div className="md:col-span-2 bg-white rounded-2xl border-2 border-pink-100 p-4">
            <CategoryTabs tabs={TABS} active={activeTab} onChange={setActiveTab} />
            <ItemGrid
              items={ITEM_MAP[activeTab] ?? []}
              selected={character[activeTab as keyof CharacterData] as string}
              onSelect={handleSelect}
              category={activeTab as never}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
