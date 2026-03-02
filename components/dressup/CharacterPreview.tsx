"use client";

import { useState, useEffect } from "react";
import PixelCharacter from "@/components/game/PixelCharacter";
import { CharacterData } from "@/types/game";

interface Props {
  character: CharacterData;
}

export default function CharacterPreview({ character }: Props) {
  const [frame, setFrame] = useState(0);
  const [direction, setDirection] = useState<"down" | "left" | "right" | "up">("down");

  useEffect(() => {
    const interval = setInterval(() => {
      setFrame((f) => (f + 1) % 4);
    }, 200);
    return () => clearInterval(interval);
  }, []);

  const directions: Array<"down" | "left" | "right" | "up"> = ["down", "left", "right", "up"];
  const labels = ["앞", "왼쪽", "오른쪽", "뒤"];

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="bg-gradient-to-b from-sky-200 to-green-200 rounded-xl p-4 border-2 border-stone-300">
        <PixelCharacter character={character} direction={direction} frame={frame} scale={4} />
      </div>
      <div className="flex gap-1">
        {directions.map((dir, i) => (
          <button
            key={dir}
            onClick={() => setDirection(dir)}
            className={`px-2 py-1 text-xs rounded font-mono border transition-colors
              ${direction === dir
                ? "bg-pink-400 text-white border-pink-500"
                : "bg-white text-gray-600 border-gray-300 hover:bg-pink-50"
              }`}
          >
            {labels[i]}
          </button>
        ))}
      </div>
    </div>
  );
}
