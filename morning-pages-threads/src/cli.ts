import { generatePost } from "./generate.js";
import { appendHistory, nextUnusedNote, readHistory, type PostKind } from "./history.js";
import { publishChain, refreshToken } from "./threads.js";
import { DAILY_THEMES, INFO_TOPICS, pickByDay } from "./topics.js";

// 사용법
//   npm run preview -- [--kind info|daily]   글만 만들어서 보여줌 (발행 안 함)
//   npm run post    -- [--kind info|daily]   만들어서 스레드에 발행 + data/history.json 기록
//   npm run refresh-token                    Threads 장기 토큰 갱신
// --kind 를 안 주면 한국 시간 기준 오후 3시 전엔 정보성, 이후엔 일상글.

try {
  process.loadEnvFile(".env");
} catch {
  // .env 가 없으면 이미 설정된 환경변수(GitHub Actions secrets 등)를 사용
}

const [command, ...rest] = process.argv.slice(2);

function parseKind(): PostKind {
  const i = rest.indexOf("--kind");
  const v = i >= 0 ? rest[i + 1] : undefined;
  if (v === "info" || v === "daily") return v;
  if (v) throw new Error(`--kind 는 info 또는 daily: ${v}`);
  const kstHour = (new Date().getUTCHours() + 9) % 24;
  return kstHour < 15 ? "info" : "daily";
}

async function makePost() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY 가 없어요. .env 에 넣거나 GitHub secret 으로 설정하세요.");
  }
  const kind = parseKind();
  const history = readHistory();
  const topic = kind === "info" ? pickByDay(INFO_TOPICS) : pickByDay(DAILY_THEMES);
  const note = kind === "daily" ? nextUnusedNote(history) : undefined;
  const post = await generatePost({ kind, topic, note, recent: history.slice(-8) });
  return { kind, topic, note, ...post };
}

async function main() {
  if (command === "preview") {
    const p = await makePost();
    console.log(`[${p.kind}] ${p.topic}${p.note ? ` / 메모: ${p.note}` : ""}\n각도: ${p.angle}\n`);
    p.parts.forEach((part, i) => {
      console.log(`----- ${i === 0 ? "본글" : `답글 ${i}`} (${[...part].length}자) -----`);
      console.log(part);
    });
    console.log("\n(발행 안 함)");
  } else if (command === "post") {
    const p = await makePost();
    const threadsId = await publishChain(p.parts);
    appendHistory({
      date: new Date().toISOString(),
      kind: p.kind,
      topic: p.topic,
      text: p.parts.join("\n---\n"),
      threadsId,
      noteUsed: p.note,
    });
    console.log(`발행 완료 (id ${threadsId}, 글 ${p.parts.length}개)\n\n${p.parts.join("\n---\n")}`);
  } else if (command === "refresh-token") {
    const t = await refreshToken();
    console.log(`새 토큰 발급됨, ${Math.round(t.expiresInSec / 86400)}일 유효.`);
    console.log("THREADS_ACCESS_TOKEN 을 새 값으로 바꿔주세요 (값은 보안상 여기 출력하지 않음).");
    console.log("GitHub Actions 에서는 워크플로가 secret 을 자동으로 갱신합니다.");
    if (process.env.GITHUB_OUTPUT) {
      // 워크플로에서만 사용: 마스킹 후 다음 단계로 전달
      console.log(`::add-mask::${t.accessToken}`);
      const fs = await import("node:fs");
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `token=${t.accessToken}\n`);
    }
  } else {
    console.log("명령: preview | post | refresh-token");
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
