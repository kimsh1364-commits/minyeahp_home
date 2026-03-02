"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Home() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") router.push("/room");
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center font-mono text-gray-400">
        로딩 중...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-sky-100 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Pixel art decorative stars */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
        {["★", "♥", "✿", "◆", "✦", "❋", "✩", "♡"].map((s, i) => (
          <span
            key={i}
            className="absolute font-mono text-pink-200 animate-pulse"
            style={{
              top: `${8 + i * 11}%`,
              left: `${3 + (i * 13) % 90}%`,
              fontSize: `${12 + (i % 4) * 5}px`,
              animationDelay: `${i * 0.3}s`,
            }}
          >
            {s}
          </span>
        ))}
      </div>

      {/* Main title */}
      <div className="text-center mb-8 relative z-10">
        <div className="text-5xl md:text-6xl mb-2 font-mono tracking-widest font-bold">
          <span className="text-pink-400">P</span>
          <span className="text-purple-400">i</span>
          <span className="text-sky-400">x</span>
          <span className="text-green-400">e</span>
          <span className="text-yellow-400">l</span>
          <span className="text-pink-400">R</span>
          <span className="text-purple-400">o</span>
          <span className="text-sky-400">o</span>
          <span className="text-green-400">m</span>
        </div>
        <p className="text-gray-500 font-mono text-sm">나만의 픽셀 아트 세계를 만들어보세요</p>
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8 relative z-10 max-w-2xl w-full">
        {[
          { emoji: "👗", title: "드레스업", desc: "캐릭터 꾸미기" },
          { emoji: "🏠", title: "방 꾸미기", desc: "나만의 공간" },
          { emoji: "🕹️", title: "키보드 이동", desc: "WASD로 걷기" },
          { emoji: "💬", title: "실시간 채팅", desc: "친구와 대화" },
        ].map((feat) => (
          <div
            key={feat.title}
            className="bg-white/80 backdrop-blur rounded-xl border-2 border-pink-100 p-3 text-center shadow-sm"
          >
            <div className="text-2xl mb-1">{feat.emoji}</div>
            <p className="font-bold font-mono text-gray-700 text-xs">{feat.title}</p>
            <p className="text-gray-400 font-mono text-[10px]">{feat.desc}</p>
          </div>
        ))}
      </div>

      {/* CTA buttons */}
      <div className="flex gap-3 relative z-10">
        <Link
          href="/register"
          className="px-6 py-3 bg-pink-400 hover:bg-pink-500 text-white font-bold font-mono rounded-xl transition-colors shadow-lg"
        >
          시작하기
        </Link>
        <Link
          href="/login"
          className="px-6 py-3 bg-white hover:bg-pink-50 text-pink-500 font-bold font-mono rounded-xl border-2 border-pink-300 transition-colors"
        >
          로그인
        </Link>
      </div>
    </div>
  );
}
