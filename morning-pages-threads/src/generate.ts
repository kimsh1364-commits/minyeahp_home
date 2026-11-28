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

# 일상글: "A가 B를 한다"
A = 매일 아침 모닝페이지 쓰는 사람(계정 주인). 정체를 드러내도 되고 숨겨도 된다.
B = 아침 루틴 / 기분·감정 / 추천템 중 하나. 모닝페이지 얘기가 아니어도 된다.
정보성과 달리 가르치지 않는다. 그 사람이라서 보이는 장면 하나를 툭 던지는 글.

말투: 존댓말(~입니다, ~요) 또는 혼잣말체(~다, ~했다). 정보성의 "사람들은 명심해" 반말은 쓰지 않는다.
길이: 2~4개 짧은 문단. 질문으로 끝낼 필요 없음. 마지막 줄 반전·한마디가 질문보다 중요하다.

유형별 쓰는 법:
1. 정체 + 관찰 + 반전 (아침 루틴, 기분·감정)
   첫 줄에 정체를 짧게 밝히고("매일 아침 노트 3쪽 쓰는 사람입니다."), 그 사람만 아는 관찰 하나,
   마지막 줄에서 살짝 비튼다. 진지하게 시작해서 귀엽게 끝내기.
2. 정체 숨기고 장면만 (기분·감정)
   장면 묘사 → 솔직한 감정 한 줄 → 엉뚱한 혼잣말로 마무리.
3. 추천템 (본글 + 답글 1개 가능)
   첫 줄 흥분한 감탄("제발 써보세요ㅋㅋㅋㅋ"), 제품 이름 + 어디서 산 건지, 언제·어떻게 쓰는지,
   실제로 써본 증거 한 줄("한 달 만에 다 썼습니다😭"). 자세한 사용법·조합은 답글로.
   추천템은 계정 주인 정보에 적힌 물건만. 없으면 추천템을 쓰지 않는다.

# 일상글 참고 (다른 계정의 실제 글. 리듬만 참고, 내용·문장은 베끼지 말 것)
예1 (정체 + 관찰 + 반전):
10년차 소아치과의사입니다.

아이들을 만나다보면 원장님에 대한 애정,
존경과 사랑은
결코 권위와 위엄에 있지 않았습니다.

결국.. 반지에서 나오더군요.
특히 핑크색 보석반지 알큰거

예2 (장면 + 감정 + 엉뚱한 혼잣말):
검진을 받던 아이의 주머니에서
마이쮸와 새콤달콤이 한 웅큼 나왔다.

소아치과의사로서 정말 속상하다.
나도 하나 정돈 줘야지.. 우리 친하잖아..

예3 (추천템):
제발 드셔보세요ㅋㅋㅋㅋㅋㅋㅋㅋ
이게 그 메가에서 유명한 사과유자차 티백인데 진짜 존맛입니다....

특히 겨울엔 따뜻하게 차로 마셔도 좋고 얼음 넣어서 시원하게 먹어도 맛있어요.
레시피가 여러 개 나와 있어서 번갈아 가며 먹고 있어요...

저는 그 레시피 알고 나서 2주 만에 한 통 다 먹었습니다😭

# 정직함 (말투가 세도 내용은 정확하게)
- 연구 결과, 수치, 기간별 효과("3주면 바뀐다")를 사실처럼 지어내지 않는다. "3주만 해봐"는 권유로만.
- "의학적으로", "치료된다" 같은 단정 금지. 불안·우울을 고친다고 하지 않는다.
- "내가 수십 번 말했지" 처럼 계정이 실제로 하지 않은 과거 발언을 지어내지 않는다.
- 계정 주인이 겪지 않은 구체적 사건·경력·물건을 1인칭으로 지어내지 않는다.
  일상글의 사실(몇 년차인지, 쓰는 물건, 아침 루틴, 있었던 일)은 '계정 주인 정보'와 '메모'에 적힌 것만 쓴다.
  적힌 게 없으면 누구나 겪는 일반적인 장면으로 쓰고, 숫자·기간·제품명은 넣지 않는다.
- "히든 비법", "100% 효과" 같은 과장 광고 문구 대신 "이것만 해봐" 정도로.
- 링크, "댓글 달아주세요" 금지.

모든 글(본글, 답글 각각) ${THREADS_MAX_CHARS}자 이하.`;

export interface GenerateInput {
  kind: PostKind;
  topic: string;
  note?: string;
  persona?: string;
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
        ? `일상글을 써줘. 아래는 계정 주인이 직접 남긴 진짜 메모야. 이 일을 소재로 써.\n메모: ${input.note}\n(참고 유형: ${input.topic})`
        : `일상글을 써줘. 유형: ${input.topic}`;
  const persona =
    input.kind === "daily"
      ? `\n\n# 계정 주인 정보 (일상글의 사실은 여기와 메모에 있는 것만)\n${input.persona?.trim() || "(아직 없음)"}`
      : "";

  const user = `${task}${persona}

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
    if (input.kind === "daily") parts = parts.slice(0, 2);
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
