"use client";

import Image from "next/image";
import type { PersonalityType } from "./QuizQuestion";

type ResultData = {
  emoji: string;
  tagline: string;
  description: string;
  color: string;
  bgColor: string;
};

const results: Record<PersonalityType, ResultData> = {
  "동지형": {
    emoji: "🫂",
    tagline: "당신의 하루가 무너져도 괜찮아요. 저도 그래요.",
    description: "직접 그 무게를 느껴봤기 때문에 미녶을 찾아온 사람이에요. 말로 설명하기 힘든 하루가 있다는 걸, 미녶도 알아요. 혼자가 아니에요.",
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
  "이해하고 싶은 형": {
    emoji: "💛",
    tagline: "곁에 있어준다는 것만으로 충분해요.",
    description: "소중한 사람을 이해하고 싶어서 여기까지 온 사람이에요. 그 마음 자체가 이미 엄청난 사랑이에요. 미녶도 응원해요.",
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
  },
  "조용한 공감러": {
    emoji: "🌙",
    tagline: "말 못 해도 느끼고 있어요.",
    description: "정확히 뭔지 몰라도 미녶 툰이 마음에 걸렸다면, 그건 이유가 있는 거예요. 조용히 위로받아도 괜찮아요. 여기 있어요.",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  "응원단형": {
    emoji: "🌸",
    tagline: "미녶 보러 와줘서 고마워요 🥺",
    description: "그냥 좋아서, 응원하고 싶어서 찾아온 사람이에요. 그런 따뜻한 마음들이 미녶이 계속 그릴 수 있는 힘이 돼요. 진심으로 고마워요.",
    color: "text-pink-600",
    bgColor: "bg-pink-50",
  },
};

type Props = {
  type: PersonalityType;
  onRestart: () => void;
};

export default function QuizResult({ type, onRestart }: Props) {
  const result = results[type];

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
        {/* Image Header */}
        <div className="relative w-full h-56">
          <Image
            src="/minyeahp-quote.jpg"
            alt="인생, 살아만 있다면 어떻게든 된다."
            fill
            className="object-cover"
          />
        </div>

        {/* Content */}
        <div className="p-8 text-center">
          <div className="mb-2">
            <span className={`inline-block text-sm font-semibold px-3 py-1 rounded-full ${result.bgColor} ${result.color}`}>
              나의 미녶 독자 유형
            </span>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-3 mt-3">
            {type}
          </h2>
          <p className={`font-semibold mb-4 ${result.color}`}>
            &ldquo;{result.tagline}&rdquo;
          </p>
          <p className="text-gray-600 leading-relaxed mb-8">
            {result.description}
          </p>

          {/* Closing message */}
          <div
            className="rounded-2xl p-5 mb-8"
            style={{ background: "linear-gradient(135deg, #f3e8ff, #fce7f3)" }}
          >
            <p className="text-gray-500 text-sm mb-1">미녶의 한마디</p>
            <p className="text-gray-800 font-bold text-lg leading-relaxed">
              인생, 살아만 있다면 어떻게든 된다.
            </p>
            <p className="text-gray-600 text-sm mt-2 leading-relaxed">
              모든 결과에, 그럼에도 불구하고 잘 살아냅시다. 🌱
            </p>
          </div>

          <p className="text-gray-400 text-sm mb-6">@minyeahp_</p>

          <button
            onClick={onRestart}
            className="w-full py-4 rounded-2xl text-white font-bold text-lg transition-opacity hover:opacity-90 cursor-pointer"
            style={{ background: "linear-gradient(to right, #7c3aed, #a855f7, #eab308)" }}
          >
            다시 하기 🔄
          </button>
        </div>
      </div>
    </div>
  );
}
