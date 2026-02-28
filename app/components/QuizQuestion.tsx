"use client";

type PersonalityType = "대담한 모험가" | "달콤한 열정가" | "건강 덕후" | "실용주의자";

type Answer = {
  emoji: string;
  text: string;
  type: PersonalityType;
};

type Question = {
  question: string;
  answers: Answer[];
};

type Props = {
  question: Question;
  questionIndex: number;
  totalQuestions: number;
  onAnswer: (type: PersonalityType) => void;
};

export default function QuizQuestion({ question, questionIndex, totalQuestions, onAnswer }: Props) {
  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-500">
            {questionIndex + 1} / {totalQuestions}
          </span>
          <span className="text-sm font-medium text-gray-500">
            {Math.round(((questionIndex + 1) / totalQuestions) * 100)}%
          </span>
        </div>
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${((questionIndex + 1) / totalQuestions) * 100}%`,
              background: "linear-gradient(to right, #f472b6, #facc15, #2dd4bf)",
            }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white rounded-3xl shadow-xl p-8">
        <h2 className="text-xl font-bold text-gray-800 mb-6 text-center leading-relaxed">
          Q{questionIndex + 1}. {question.question}
        </h2>

        <div className="flex flex-col gap-3">
          {question.answers.map((answer, i) => (
            <button
              key={i}
              onClick={() => onAnswer(answer.type)}
              className="flex items-center gap-4 w-full bg-gray-50 hover:bg-pink-50 border-2 border-transparent hover:border-pink-400 rounded-2xl px-5 py-4 text-left transition-all duration-200 cursor-pointer"
            >
              <span className="text-2xl flex-shrink-0">{answer.emoji}</span>
              <span className="text-gray-700 font-medium">{answer.text}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export type { Question, Answer, PersonalityType };
