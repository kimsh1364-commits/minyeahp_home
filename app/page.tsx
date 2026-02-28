"use client";

import { useState } from "react";
import QuizQuestion, { type PersonalityType, type Question } from "./components/QuizQuestion";
import QuizResult from "./components/QuizResult";

const questions: Question[] = [
  {
    question: "미녶 계정을 처음 발견한 계기는?",
    answers: [
      { emoji: "🔍", text: "나도 비슷한 증상이 있어서 검색하다가", type: "동지형" },
      { emoji: "💛", text: "친구/가족이 이런 증상이 있어서 이해하고 싶었어", type: "이해하고 싶은 형" },
      { emoji: "📱", text: "그냥 알고리즘에 떴는데 계속 보게 됐어", type: "조용한 공감러" },
      { emoji: "🌸", text: "미녶 팬이라 처음부터 쭉 봐왔어", type: "응원단형" },
    ],
  },
  {
    question: "미녶 툰을 보다가 가장 많이 드는 생각은?",
    answers: [
      { emoji: "😶", text: "\"이거 내 얘기잖아...\"", type: "동지형" },
      { emoji: "💭", text: "\"아, 이런 기분이구나. 이제 좀 이해될 것 같아\"", type: "이해하고 싶은 형" },
      { emoji: "🥲", text: "\"왜인지 모르게 울컥해\"", type: "조용한 공감러" },
      { emoji: "🥺", text: "\"미녶 오늘도 수고했다\"", type: "응원단형" },
    ],
  },
  {
    question: "힘든 날, 나는?",
    answers: [
      { emoji: "🫙", text: "혼자 조용히 버팀. 설명하기가 너무 힘들어", type: "동지형" },
      { emoji: "🤲", text: "힘든 사람 곁에 있어주고 싶어서 뭘 할 수 있는지 찾아봄", type: "이해하고 싶은 형" },
      { emoji: "🎧", text: "뭔가 공감되는 콘텐츠 찾아보며 위로받음", type: "조용한 공감러" },
      { emoji: "🌟", text: "좋아하는 사람/콘텐츠 보면서 기운 차림", type: "응원단형" },
    ],
  },
  {
    question: "공황장애나 폐쇄공포증이라는 단어를 들으면?",
    answers: [
      { emoji: "💓", text: "심장이 쿵함. 나의 일상이니까", type: "동지형" },
      { emoji: "👤", text: "내 소중한 사람 얼굴이 떠오름", type: "이해하고 싶은 형" },
      { emoji: "🤔", text: "뭔가 아는 것 같기도 하고... 더 알고 싶어짐", type: "조용한 공감러" },
      { emoji: "😄", text: "미녶이 생각남", type: "응원단형" },
    ],
  },
  {
    question: "미녶 툰의 한 컷을 저장한다면?",
    answers: [
      { emoji: "🖤", text: "내가 말로 못 했던 감정이 담긴 컷", type: "동지형" },
      { emoji: "📤", text: "주변 사람에게 보여주고 싶은 컷", type: "이해하고 싶은 형" },
      { emoji: "💾", text: "왠지 모르게 마음에 걸리는 컷", type: "조용한 공감러" },
      { emoji: "🤣", text: "미녶이 특히 귀엽거나 웃긴 컷", type: "응원단형" },
    ],
  },
];

type Stage = "start" | "quiz" | "result";

function getTopType(answers: PersonalityType[]): PersonalityType {
  const counts: Record<PersonalityType, number> = {
    "동지형": 0,
    "이해하고 싶은 형": 0,
    "조용한 공감러": 0,
    "응원단형": 0,
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
      style={{ background: "linear-gradient(135deg, #c084fc 0%, #f472b6 50%, #fb923c 100%)" }}
    >
      {stage === "start" && (
        <div className="w-full max-w-lg mx-auto text-center">
          <div className="bg-white rounded-3xl shadow-xl p-10">
            <div className="text-6xl mb-4">🫶</div>
            <h1 className="text-3xl font-bold text-gray-800 mb-3">
              나는 어떤 미녶 독자일까?
            </h1>
            <p className="text-gray-500 mb-2 text-lg">
              @minyeahp_
            </p>
            <p className="text-gray-600 mb-8 leading-relaxed">
              5개의 질문으로 알아보는<br />
              나의 미녶 독자 유형!
            </p>
            <div className="flex gap-2 justify-center flex-wrap mb-8">
              {["동지형", "이해하고 싶은 형", "조용한 공감러", "응원단형"].map((t) => (
                <span key={t} className="bg-purple-50 text-purple-600 text-sm px-3 py-1 rounded-full font-medium">
                  {t}
                </span>
              ))}
            </div>
            <button
              onClick={() => setStage("quiz")}
              className="w-full py-4 rounded-2xl text-white font-bold text-lg transition-opacity hover:opacity-90 cursor-pointer"
              style={{ background: "linear-gradient(to right, #c084fc, #f472b6, #fb923c)" }}
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
