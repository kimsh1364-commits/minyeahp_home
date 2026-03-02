"use client";

import { GameItem, ItemCategory } from "@/types/game";

interface Props {
  items: GameItem[];
  selected: string;
  onSelect: (id: string) => void;
  category: ItemCategory;
}

export default function ItemGrid({ items, selected, onSelect }: Props) {
  return (
    <div className="grid grid-cols-4 gap-2 overflow-y-auto max-h-64 pr-1">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onSelect(item.id)}
          title={item.name}
          className={`relative w-full aspect-square rounded-lg border-2 transition-all flex flex-col items-center justify-center gap-0.5
            ${selected === item.id
              ? "border-pink-500 bg-pink-50 shadow-md scale-105"
              : "border-gray-200 bg-white hover:border-pink-300 hover:scale-102"
            }`}
        >
          {item.color ? (
            <div
              className="w-6 h-6 rounded border border-black/20"
              style={{ backgroundColor: item.color }}
            />
          ) : (
            <div className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center text-xs">✦</div>
          )}
          <span className="text-[9px] text-gray-600 text-center leading-tight px-0.5 truncate w-full text-center font-mono">
            {item.name}
          </span>
          {selected === item.id && (
            <div className="absolute top-0.5 right-0.5 w-3 h-3 bg-pink-500 rounded-full flex items-center justify-center">
              <span className="text-white text-[8px]">✓</span>
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
