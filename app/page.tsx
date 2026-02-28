"use client";

import { useState } from "react";
import QuizQuestion, { type PersonalityType, type Question } from "./components/QuizQuestion";
import QuizResult from "./components/QuizResult";

const questions: Question[] = [
  {
    question: "카페에서 줄 서다 처음 보는 메뉴를 발견했다. 당신은?",
    answers: [
      { emoji: "🤩", text: "바로 주문, 일단 먹어보고 판단", type: "대담한 모험가" },
      { emoji: "😊", text: "바리스타에게 맛이 어떤지 물어보기", type: "달콤한 열정가" },
      { emoji: "🌿", text: "재료 확인하고 건강한 것으로", type: "건강 덕후" },
      { emoji: "☕", text: "늘 마시던 걸로, 역시 믿을 건 단골 메뉴", type: "실용주의자" },
    ],
  },
  {
    question: "넷플릭스 마라톤을 한다면?",
    answers: [
      { emoji: "⚔️", text: "긴장감 넘치는 액션 시리즈", type: "대담한 모험가" },
      { emoji: "🌸", text: "따뜻한 로맨틱 코미디", type: "달콤한 열정가" },
      { emoji: "🧘", text: "잔잔한 자연 다큐멘터리", type: "건강 덕후" },
      { emoji: "🎯", text: "일단 뭐든 틀고 딴짓하기", type: "실용주의자" },
    ],
  },
  {
    question: "이번 주말 계획은?",
    answers: [
      { emoji: "🏔️", text: "즉흥 등산 또는 새로운 액티비티", type: "대담한 모험가" },
      { emoji: "🛁", text: "집에서 홈카페 & 달콤한 디저트", type: "달콤한 열정가" },
      { emoji: "🧗", text: "요가 또는 러닝", type: "건강 덕후" },
      { emoji: "🛋️", text: "밀린 할 일 처리", type: "실용주의자" },
    ],
  },
  {
    question: "마블 어벤져스 중 나와 가장 비슷한 캐릭터는?",
    answers: [
      { emoji: "🦸", text: "아이언맨 (혁신적, 강렬)", type: "대담한 모험가" },
      { emoji: "🌟", text: "스파이더맨 (따뜻하고 유쾌)", type: "달콤한 열정가" },
      { emoji: "🌿", text: "블랙 위도우 (건강하고 자기관리 철저)", type: "건강 덕후" },
      { emoji: "🛡️", text: "캡틴 아메리카 (실용적, 책임감)", type: "실용주의자" },
    ],
  },
  {
    question: "여행 스타일은?",
    answers: [
      { emoji: "🌋", text: "무계획 배낭여행, 즉흥적으로", type: "대담한 모험가" },
      { emoji: "🏖️", text: "리조트에서 여유롭게, 맛집 투어", type: "달콤한 열정가" },
      { emoji: "🚴", text: "자전거 여행 또는 하이킹 코스", type: "건강 덕후" },
      { emoji: "📋", text: "꼼꼼하게 계획 세우고 효율적으로", type: "실용주의자" },
    ],
  },
  {
    question: "아침에 일어나서 제일 먼저 하는 것은?",
    answers: [
      { emoji: "🏃", text: "바로 운동 또는 찬물 샤워", type: "대담한 모험가" },
      { emoji: "😴", text: "스누즈 한 번 더, 천천히 일어나기", type: "달콤한 열정가" },
      { emoji: "🧘", text: "스트레칭 또는 명상", type: "건강 덕후" },
      { emoji: "📱", text: "오늘 할 일 체크하기", type: "실용주의자" },
    ],
  },
];

type Stage = "start" | "quiz" | "result";

function getTopType(answers: PersonalityType[]): PersonalityType {
  const counts: Record<PersonalityType, number> = {
    "대담한 모험가": 0,
    "달콤한 열정가": 0,
    "건강 덕후": 0,
    "실용주의자": 0,
  };
  for (const a of answers) counts[a]++;
  return (Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]) as PersonalityType;
}

export default function Home() {
  const [stage, setStage] = useState<Stage>("start");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<PersonalityType[]>([]);

  function handleAnswer(type: PersonalityType) {
    const newAnswers = [...answers, type];
    setAnswers(newAnswers);
    if (currentQuestion + 1 < questions.length) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setStage("result");
    }
  }

  function handleRestart() {
    setStage("start");
    setCurrentQuestion(0);
    setAnswers([]);
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: "linear-gradient(135deg, #f472b6 0%, #facc15 50%, #2dd4bf 100%)" }}
    >
      {stage === "start" && (
        <div className="w-full max-w-lg mx-auto text-center">
          <div className="bg-white rounded-3xl shadow-xl p-10">
            <div className="text-6xl mb-4">☕</div>
            <h1 className="text-3xl font-bold text-gray-800 mb-3">
              나의 커피 성격은?
            </h1>
            <p className="text-gray-500 mb-2 text-lg">
              Basecamp Coffee
            </p>
            <p className="text-gray-600 mb-8 leading-relaxed">
              6개의 질문으로 당신에게 딱 맞는<br />
              커피 성격을 알아보세요!
            </p>
            <div className="flex gap-2 justify-center flex-wrap mb-8">
              {["대담한 모험가", "달콤한 열정가", "건강 덕후", "실용주의자"].map((t) => (
                <span key={t} className="bg-pink-50 text-pink-600 text-sm px-3 py-1 rounded-full font-medium">
                  {t}
                </span>
              ))}
            </div>
            <button
              onClick={() => setStage("quiz")}
              className="w-full py-4 rounded-2xl text-white font-bold text-lg transition-opacity hover:opacity-90 cursor-pointer"
              style={{ background: "linear-gradient(to right, #f472b6, #facc15, #2dd4bf)" }}
            >
              퀴즈 시작하기 →
            </button>
          </div>
        </div>
      )}

      {stage === "quiz" && (
        <QuizQuestion
          question={questions[currentQuestion]}
          questionIndex={currentQuestion}
          totalQuestions={questions.length}
          onAnswer={handleAnswer}
        />
      )}

      {stage === "result" && (
        <QuizResult
          type={getTopType(answers)}
          onRestart={handleRestart}
        />
      )}
    </div>
  );
}
