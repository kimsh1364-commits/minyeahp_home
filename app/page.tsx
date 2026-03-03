"use client";

import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function Home() {
  const { status } = useSession();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim().length < 2) {
      setError("닉네임은 2글자 이상이어야 해요.");
      return;
    }
    setError("");
    setLoading(true);
    const res = await signIn("credentials", {
      username: username.trim(),
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("입장에 실패했어요. 다시 시도해주세요.");
    } else {
      router.push("/room");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-sky-100 flex flex-col items-center justify-center p-6 relative overflow-hidden">
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

      <div className="bg-white/90 backdrop-blur rounded-2xl shadow-lg border-2 border-pink-100 p-6 w-full max-w-sm relative z-10">
        <h2 className="text-center font-bold font-mono text-gray-700 mb-1">닉네임으로 시작하기</h2>
        <p className="text-center text-xs font-mono text-gray-400 mb-4">
          처음이면 자동으로 계정이 만들어져요 ✦
        </p>
        <form onSubmit={handleStart} className="space-y-3">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="닉네임 입력 (2자 이상)"
            maxLength={20}
            required
            className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 focus:border-pink-400 focus:outline-none text-sm font-mono text-center"
          />
          {error && (
            <p className="text-xs text-red-500 font-mono text-center bg-red-50 rounded-lg py-2">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-pink-400 hover:bg-pink-500 text-white font-bold font-mono rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? "입장 중..." : "입장하기 ✦"}
          </button>
        </form>
      </div>
    </div>
  );
}
