import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { HistoryEntry, PostKind } from "./history.js";

export const THREADS_MAX_CHARS = 500; // Threads 텍스트 글 최대 길이

const PostSchema = z.object({
  text: z.string().describe("스레드에 그대로 올릴 본문. 줄바꿈 포함."),
  angle: z.string().describe("이번 글이 택한 각도를 한 줄로 (기록용)"),
});

const SYSTEM = `너는 '모닝페이지' 습관을 알리는 스레드(Threads) 계정의 글을 쓴다.
모닝페이지: 줄리아 캐머런 『아티스트 웨이』에서 나온 습관. 아침에 일어나자마자 손으로 3쪽, 떠오르는 대로 쓰고 다시 읽지 않는다.

# 계정 말투
- 친구한테 말하듯 편한 반말 섞인 구어체. 광고 문구·과장 금지. 이모지는 0~2개.
- 짧게: 보통 3~7줄. 한 줄은 짧게 끊는다. 해시태그는 쓰지 않거나 맨 끝에 1개만.

# 댓글이 달리게 쓰는 법
- 첫 줄에서 멈추게 한다 (공감되는 장면, 의외의 사실, 짧은 질문).
- 마지막은 대답하기 쉬운 질문으로 끝낸다: 보기 2개 고르기, 한 단어로 답하기, "나만 그래?" 류.
- 다 설명하지 말고 독자가 덧붙일 빈칸을 남긴다.
- "댓글 달아주세요" 같은 대놓고 하는 부탁, 링크, 분노 유발은 금지.

# 정직함
- 일상글이라도 계정 주인이 실제로 겪지 않은 구체적 사건(날짜, 사람, 숫자가 붙은 경험담)을 지어내지 않는다.
  대신 누구나 겪는 아침 장면을 2인칭/일반화로 그리거나, 질문으로 던진다.
- 메모(notes)가 주어지면 그 메모의 사실만 사용해 1인칭으로 쓴다. 메모에 없는 사실을 보태지 않는다.
- 정보성 글은 정확하게. 연구 결과나 수치를 지어내지 않는다. 확실하지 않으면 "~라고들 한다" 대신 아예 빼라.
- 의학적 효과(우울증 치료 등)를 단정하지 않는다.

본문은 반드시 ${THREADS_MAX_CHARS}자 이하.`;

export interface GenerateInput {
  kind: PostKind;
  topic: string;
  note?: string;
  recent: HistoryEntry[];
}

export async function generatePost(
  input: GenerateInput,
  client = new Anthropic(),
): Promise<{ text: string; angle: string }> {
  const recentText = input.recent.length
    ? input.recent
        .map((h) => `- [${h.kind}] ${h.topic}\n${indent(h.text)}`)
        .join("\n")
    : "(아직 없음)";

  const task =
    input.kind === "info"
      ? `정보성 글 하나를 써줘. 주제: ${input.topic}\n핵심 정보 1~2개만, 쉽게. 끝은 질문으로.`
      : input.note
        ? `일상글 하나를 써줘. 아래는 계정 주인이 직접 남긴 진짜 메모야. 이 내용만으로 1인칭 글을 써.\n메모: ${input.note}\n(참고 테마: ${input.topic})`
        : `일상글 하나를 써줘. 테마: ${input.topic}\n지어낸 경험담 말고, 누구나 공감할 아침 장면 + 가벼운 질문으로.`;

  const user = `${task}

# 최근에 올린 글 (같은 표현·같은 질문 반복 금지, 다른 각도로)
${recentText}`;

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
              : `${user}\n\n(직전 결과가 ${THREADS_MAX_CHARS}자를 넘었어. 더 짧게.)`,
        },
      ],
    });

    if (response.stop_reason === "refusal") {
      throw new Error(`생성 거절됨: ${response.stop_details?.explanation ?? "이유 없음"}`);
    }
    const post = response.parsed_output;
    if (!post) throw new Error(`생성 결과를 읽지 못함 (stop_reason: ${response.stop_reason})`);

    const text = post.text.trim();
    if ([...text].length <= THREADS_MAX_CHARS) return { text, angle: post.angle };
  }
  throw new Error(`두 번 시도했지만 ${THREADS_MAX_CHARS}자를 넘었어요.`);
}

function indent(s: string) {
  return s
    .split("\n")
    .map((l) => `    ${l}`)
    .join("\n");
}
