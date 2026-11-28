// Threads(Meta) 공식 API로 텍스트 글 발행.
// 문서: https://developers.facebook.com/docs/threads/posts
// 발행은 2단계: ① 컨테이너 만들기 → ② 컨테이너 발행하기

const BASE = "https://graph.threads.net/v1.0";

interface ThreadsConfig {
  userId: string;
  accessToken: string;
}

export function threadsConfigFromEnv(): ThreadsConfig {
  const userId = process.env.THREADS_USER_ID;
  const accessToken = process.env.THREADS_ACCESS_TOKEN;
  if (!userId || !accessToken) {
    throw new Error("THREADS_USER_ID 와 THREADS_ACCESS_TOKEN 환경변수가 필요해요 (.env 참고).");
  }
  return { userId, accessToken };
}

async function call(url: string, params: Record<string, string>, method: "GET" | "POST") {
  const qs = new URLSearchParams(params);
  const res = await fetch(method === "GET" ? `${url}?${qs}` : url, {
    method,
    body: method === "POST" ? qs : undefined,
  });
  const body = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    const err = body.error as { message?: string } | undefined;
    throw new Error(`Threads API ${res.status}: ${err?.message ?? JSON.stringify(body)}`);
  }
  return body;
}

export async function publishText(
  text: string,
  cfg = threadsConfigFromEnv(),
  replyToId?: string,
): Promise<string> {
  const params: Record<string, string> = { media_type: "TEXT", text, access_token: cfg.accessToken };
  if (replyToId) params.reply_to_id = replyToId; // 내 글에 답글로 이어 달기
  const container = await call(`${BASE}/${cfg.userId}/threads`, params, "POST");
  const creationId = String(container.id);

  // 문서 권장: 컨테이너 생성 후 잠깐 기다렸다가 발행
  await new Promise((r) => setTimeout(r, 5_000));

  const published = await call(
    `${BASE}/${cfg.userId}/threads_publish`,
    { creation_id: creationId, access_token: cfg.accessToken },
    "POST",
  );
  return String(published.id);
}

/**
 * 본글 + 답글 이어 달기 (예: "이것만 따라해!" 본글 → 방법 답글).
 * 각 답글은 바로 앞 글에 달려서 1/2, 2/2 처럼 이어 보입니다. 반환값은 본글 id.
 */
export async function publishChain(parts: string[], cfg = threadsConfigFromEnv()): Promise<string> {
  const rootId = await publishText(parts[0], cfg);
  let prevId = rootId;
  for (const part of parts.slice(1)) {
    prevId = await publishText(part, cfg, prevId);
  }
  return rootId;
}

/**
 * 장기 토큰(60일)을 새 60일짜리로 갱신. 만료 전에 주기적으로 돌려야 함.
 * 발급 후 24시간이 지난, 아직 만료되지 않은 장기 토큰만 갱신됩니다.
 */
export async function refreshToken(cfg = threadsConfigFromEnv()) {
  const body = await call(
    "https://graph.threads.net/refresh_access_token",
    { grant_type: "th_refresh_token", access_token: cfg.accessToken },
    "GET",
  );
  return { accessToken: String(body.access_token), expiresInSec: Number(body.expires_in) };
}
