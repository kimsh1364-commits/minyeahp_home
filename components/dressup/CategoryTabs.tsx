"use client";

interface Tab {
  id: string;
  label: string;
  emoji: string;
}

interface Props {
  tabs: Tab[];
  active: string;
  onChange: (id: string) => void;
}

export default function CategoryTabs({ tabs, active, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-1 mb-3">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`px-3 py-1.5 rounded-full text-xs font-mono font-bold transition-all
            ${active === tab.id
              ? "bg-pink-400 text-white shadow"
              : "bg-gray-100 text-gray-600 hover:bg-pink-100"
            }`}
        >
          {tab.emoji} {tab.label}
        </button>
      ))}
    </div>
  );
}
