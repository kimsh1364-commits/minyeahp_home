"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError("이메일 또는 비밀번호가 올바르지 않아요.");
    } else {
      router.push("/room");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-sky-100 flex items-center justify-center p-4">
      {/* Pixel art decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {["★", "♥", "✿", "◆", "✦"].map((s, i) => (
          <span
            key={i}
            className="absolute text-pink-200 font-mono select-none animate-pulse"
            style={{
              top: `${10 + i * 18}%`,
              left: `${5 + i * 20}%`,
              fontSize: `${14 + (i % 3) * 6}px`,
              animationDelay: `${i * 0.4}s`,
            }}
          >
            {s}
          </span>
        ))}
      </div>

      <div className="w-full max-w-sm">
        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold font-mono text-pink-500 tracking-wider mb-1">
            PixelRoom
          </h1>
          <p className="text-sm font-mono text-gray-400">나만의 픽셀 아트 세계</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border-2 border-pink-100 p-6">
          <h2 className="text-lg font-bold font-mono text-gray-700 mb-4 text-center">로그인</h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-mono text-gray-500 mb-1">이메일</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:border-pink-400 focus:outline-none text-sm font-mono"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-gray-500 mb-1">비밀번호</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:border-pink-400 focus:outline-none text-sm font-mono"
                placeholder="••••••••"
              />
            </div>
            {error && (
              <p className="text-xs text-red-500 font-mono text-center bg-red-50 rounded-lg py-2">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-pink-400 hover:bg-pink-500 text-white font-bold font-mono rounded-xl transition-colors disabled:opacity-50 text-sm"
            >
              {loading ? "로그인 중..." : "로그인"}
            </button>
          </form>
          <div className="mt-4 text-center">
            <p className="text-xs font-mono text-gray-400">
              계정이 없으신가요?{" "}
              <Link href="/register" className="text-pink-500 font-bold hover:underline">
                회원가입
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
