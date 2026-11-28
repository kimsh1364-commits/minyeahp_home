import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { HistoryEntry, PostKind } from "./history.js";

export const THREADS_MAX_CHARS = 500; // Threads 글 하나 최대 길이

const PostSchema = z.object({
  parts: z
    .array(z.string())
    .describe(
      "스레드에 순서대로 올릴 글들. 첫 번째가 본글, 나머지는 본글에 이어 다는 답글. 각각 줄바꿈 포함.",
    ),
  angle: z.string().describe("이번 글이 택한 각도를 한 줄로 (기록용)"),
});

const SYSTEM = `너는 '모닝페이지' 습관을 알리는 스레드(Threads) 계정의 글을 쓴다.
모닝페이지: 줄리아 캐머런 『아티스트 웨이』에서 나온 습관. 아침에 일어나자마자 손으로 3쪽, 떠오르는 대로 쓰고 다시 읽지 않는다.

# 말투
- 친한 언니/친구가 단톡방에서 말하듯 반말. 독자는 "사람들"로 부른다 (예: "~한 사람들은 명심해"). "치니들", "너네" 같은 호칭은 쓰지 않는다.
- 한 줄은 짧게 끊고, 2~3줄마다 빈 줄로 문단을 나눈다. 이모지는 0~1개, 해시태그 없음.

# 정보성 글 구조 (본글 + 답글 1~2개)
본글은 아래 4단으로, 각 단은 2~3줄:
1. 콕 집어 부르기: 구체적인 증상·상황을 2~3개 나열해서 "이런 사람들 명심해" 식으로 대상을 부른다.
   독자가 "어 난데?" 하고 멈추게. 막연한 "요즘 힘드신 분" 금지, 장면이 보이게 구체적으로.
2. 흔한 오해 깨기: 다들 하는 방식이 왜 효과가 없는지 단호하게. (예: "일기처럼 예쁘게 쓰려고 하면 3일도 못 간다")
3. 진짜 이유: 왜 그런지 원리를 1~2문장으로 쉽게.
4. 예고: 방법의 개수를 꼭 숫자로 밝힌다. "딱 3가지만 따라 해봐!" 처럼. ("이것만", "이대로" 처럼 숫자 없는 예고 금지)
   본글에서 방법을 다 말하지 않는다.
답글: 예고에서 말한 개수와 정확히 같은 수의 방법을 "1. 2. 3." 번호로. 기본은 3가지.
- 바로 따라 할 수 있게 구체적으로 (시간, 분량, 기간 등. 예: "4주 동안은 다시 읽지 말고 덮기").
- 덧붙일 팁은 번호를 늘리지 말고 해당 번호 바로 아래 "(📌 ...)" 한 줄로.
- 번호 목록 뒤 빈 줄, 그다음 한 줄 정리(선택) + 가벼운 질문 한 줄로 끝낸다.

# 정보성 예시 (계정 주인이 직접 다듬은 실제 글. 형식은 이대로, 문장은 베끼지 말 것)
본글:
아침마다 머리가 멍하고
할 일은 많은데 손에 안 잡히고
자기 전엔 걱정 때문에 뒤척이는 사람들은 명심해.

플래너에 할 일만 빼곡히 적어봤자
머릿속 소음은 그대로야.

생각이 정리가 안 되는 건 의지가 약해서가 아니라
머릿속에 쌓인 말이 나갈 데가 없어서야.
종이에 먼저 다 쏟아내야 비로소 자리가 생겨.

딱 3가지만 따라 해봐!
답글:
1. 눈 뜨자마자 폰 보기 전에 노트부터 펴기
2. 손으로, 생각나는 대로 3쪽 (부담되면 1쪽부터)
(📌문장이 이상해도, 같은 말 반복해도 그냥 계속 쓰기)
3. 다 쓰면 4주 동안은 다시 읽지 말고 덮기

이게 『아티스트 웨이』에 나오는 '모닝페이지'야.
다들 아침에 제일 먼저 하는 게 뭐야?

# 일상글 구조 (본글 하나, 답글 없음)
같은 말투로 3~6줄. 콕 집어 부르기 또는 공감 장면으로 시작해서 대답하기 쉬운 질문으로 끝낸다.

# 정직함 (말투가 세도 내용은 정확하게)
- 연구 결과, 수치, 기간별 효과("3주면 바뀐다")를 사실처럼 지어내지 않는다. "3주만 해봐"는 권유로만.
- "의학적으로", "치료된다" 같은 단정 금지. 불안·우울을 고친다고 하지 않는다.
- "내가 수십 번 말했지" 처럼 계정이 실제로 하지 않은 과거 발언을 지어내지 않는다.
- 계정 주인이 겪지 않은 구체적 사건을 1인칭으로 지어내지 않는다. 메모(notes)가 주어지면 그 사실만 쓴다.
- "히든 비법", "100% 효과" 같은 과장 광고 문구 대신 "이것만 해봐" 정도로.
- 링크, "댓글 달아주세요" 금지.

모든 글(본글, 답글 각각) ${THREADS_MAX_CHARS}자 이하.`;

export interface GenerateInput {
  kind: PostKind;
  topic: string;
  note?: string;
  recent: HistoryEntry[];
}

export async function generatePost(
  input: GenerateInput,
  client = new Anthropic(),
): Promise<{ parts: string[]; angle: string }> {
  const recentText = input.recent.length
    ? input.recent.map((h) => `- [${h.kind}] ${h.topic}\n${indent(h.text)}`).join("\n")
    : "(아직 없음)";

  const task =
    input.kind === "info"
      ? `정보성 글을 써줘 (본글 1개 + 답글 1~2개). 주제: ${input.topic}`
      : input.note
        ? `일상글 본글 하나만 써줘. 아래는 계정 주인이 직접 남긴 진짜 메모야. 이 내용만으로 1인칭 글을 써.\n메모: ${input.note}\n(참고 테마: ${input.topic})`
        : `일상글 본글 하나만 써줘. 테마: ${input.topic}\n지어낸 경험담 말고, 누구나 공감할 장면 + 가벼운 질문으로.`;

  const user = `${task}

# 최근에 올린 글 (같은 표현·같은 질문·같은 증상 나열 반복 금지, 다른 각도로)
${recentText}`;

  let problem = "";
  for (let attempt = 1; attempt <= 2; attempt++) {
    const response = await client.beta.messages.parse({
      model: "claude-opus-5-5",
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default", // 안전 분류기가 거절하면 서버에서 다른 모델로 자동 재시도
      output_config: { effort: "medium", format: zodOutputFormat(PostSchema) },
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content:
            attempt === 1
              ? user
              : `${user}\n\n(직전 결과가 규칙에 안 맞았어: ${problem}. 고쳐서 다시 써줘.)`,
        },
      ],
    });

    if (response.stop_reason === "refusal") {
      throw new Error(`생성 거절됨: ${response.stop_details?.explanation ?? "이유 없음"}`);
    }
    const post = response.parsed_output;
    if (!post) throw new Error(`생성 결과를 읽지 못함 (stop_reason: ${response.stop_reason})`);

    let parts = post.parts.map((p) => p.trim()).filter(Boolean);
    if (input.kind === "daily") parts = parts.slice(0, 1);
    if (input.kind === "info") parts = parts.slice(0, 3);
    if (parts.length === 0) throw new Error("빈 글이 생성됐어요.");
    problem = findProblem(input.kind, parts);
    if (!problem) return { parts, angle: post.angle };
  }
  throw new Error(`두 번 시도했지만 규칙에 안 맞았어요: ${problem}`);
}

/** 규칙 위반을 찾아 설명을 돌려줌. 문제 없으면 빈 문자열. */
export function findProblem(kind: PostKind, parts: string[]): string {
  if (parts.some((p) => [...p].length > THREADS_MAX_CHARS)) return `${THREADS_MAX_CHARS}자 넘는 글이 있음`;
  if (kind !== "info") return "";
  if (parts.length < 2) return "방법을 담은 답글이 없음";
  const steps = parts
    .slice(1)
    .join("\n")
    .split("\n")
    .filter((l) => /^\d+\.\s/.test(l.trim())).length;
  if (steps === 0) return "답글 방법에 1. 2. 3. 번호가 없음";
  const teaser = parts[0].trim().split("\n").pop() ?? "";
  const korean = ["", "한", "두", "세", "네", "다섯"][steps] ?? "";
  if (!teaser.includes(`${steps}가지`) && !(korean && teaser.includes(`${korean} 가지`)))
    return `본글 마지막 줄에 방법 개수(${steps}가지)가 숫자로 없음: "${teaser}"`;
  return "";
}

function indent(s: string) {
  return s
    .split("\n")
    .map((l) => `    ${l}`)
    .join("\n");
}
