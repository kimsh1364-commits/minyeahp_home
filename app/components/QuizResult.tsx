"use client";

import Image from "next/image";
import type { PersonalityType } from "./QuizQuestion";

type ResultData = {
  coffee: string;
  tagline: string;
  image: string;
  description: string;
};

const results: Record<PersonalityType, ResultData> = {
  "대담한 모험가": {
    coffee: "더블 에스프레소",
    tagline: "강렬함이 곧 삶",
    image: "/espresso.jpg",
    description: "당신은 강렬하고 대담합니다. 매 순간을 최대치로 살아가는 당신에게 딱 맞는 커피예요.",
  },
  "달콤한 열정가": {
    coffee: "카라멜 라떼",
    tagline: "쓴맛엔 인생이 없다",
    image: "/caramel-latte.jpg",
    description: "따뜻하고 달콤한 것을 사랑하는 당신. 삶의 작은 즐거움을 누구보다 잘 아는 사람이에요.",
  },
  "건강 덕후": {
    coffee: "오트밀크 아메리카노",
    tagline: "매 잔에 웰니스를",
    image: "/oat-americano.jpg",
    description: "몸과 마음의 균형을 중시하는 당신. 건강한 선택이 습관이 된 진정한 웰니스 라이프의 주인공.",
  },
  "실용주의자": {
    coffee: "큰 드립커피",
    tagline: "일단 되게 만들어",
    image: "/drip-coffee.jpg",
    description: "효율과 실용을 최우선으로 하는 당신. 복잡한 것보다 확실하게 작동하는 것을 선호하죠.",
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
        {/* Image */}
        <div className="relative h-56 w-full">
          <Image
            src={result.image}
            alt={result.coffee}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="absolute bottom-4 left-6 right-6">
            <p className="text-white/80 text-sm font-medium">{result.tagline}</p>
            <h3 className="text-white text-2xl font-bold">{result.coffee}</h3>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 text-center">
          <div className="mb-2">
            <span className="inline-block bg-pink-100 text-pink-600 text-sm font-semibold px-3 py-1 rounded-full">
              당신의 커피 성격
            </span>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            {type}
          </h2>
          <p className="text-gray-600 leading-relaxed mb-8">
            {result.description}
          </p>

          <div className="bg-gradient-to-r from-pink-50 to-yellow-50 rounded-2xl p-4 mb-8">
            <p className="text-gray-700 font-medium">
              ☕ Basecamp Coffee 추천 메뉴
            </p>
            <p className="text-pink-600 font-bold text-lg mt-1">{result.coffee}</p>
          </div>

          <button
            onClick={onRestart}
            className="w-full py-4 rounded-2xl text-white font-bold text-lg transition-opacity hover:opacity-90 cursor-pointer"
            style={{ background: "linear-gradient(to right, #f472b6, #facc15, #2dd4bf)" }}
          >
            다시 하기 🔄
          </button>
        </div>
      </div>
    </div>
  );
}
