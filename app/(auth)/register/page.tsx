"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", username: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm) {
      setError("비밀번호가 일치하지 않아요.");
      return;
    }
    if (form.password.length < 6) {
      setError("비밀번호는 6자 이상이어야 해요.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.email, username: form.username, password: form.password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "회원가입에 실패했어요.");
    } else {
      router.push("/login");
    }
  };

  const update = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-sky-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold font-mono text-purple-500 tracking-wider mb-1">PixelRoom</h1>
          <p className="text-sm font-mono text-gray-400">나만의 픽셀 아트 세계 시작하기</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border-2 border-purple-100 p-6">
          <h2 className="text-lg font-bold font-mono text-gray-700 mb-4 text-center">회원가입</h2>

          <form onSubmit={handleSubmit} className="space-y-3">
            {[
              { key: "email", label: "이메일", type: "email", placeholder: "your@email.com" },
              { key: "username", label: "닉네임", type: "text", placeholder: "픽셀토끼" },
              { key: "password", label: "비밀번호", type: "password", placeholder: "6자 이상" },
              { key: "confirm", label: "비밀번호 확인", type: "password", placeholder: "••••••••" },
            ].map(({ key, label, type, placeholder }) => (
              <div key={key}>
                <label className="block text-xs font-mono text-gray-500 mb-1">{label}</label>
                <input
                  type={type}
                  value={form[key as keyof typeof form]}
                  onChange={update(key)}
                  required
                  className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:border-purple-400 focus:outline-none text-sm font-mono"
                  placeholder={placeholder}
                />
              </div>
            ))}

            {error && (
              <p className="text-xs text-red-500 font-mono text-center bg-red-50 rounded-lg py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-purple-400 hover:bg-purple-500 text-white font-bold font-mono rounded-xl transition-colors disabled:opacity-50 text-sm"
            >
              {loading ? "가입 중..." : "시작하기"}
            </button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-xs font-mono text-gray-400">
              이미 계정이 있으신가요?{" "}
              <Link href="/login" className="text-purple-500 font-bold hover:underline">
                로그인
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
