import { NextResponse } from "next/server";

// 국토교통부 아파트 매매 실거래가 (공공데이터포털)
// 필요한 환경변수: MOLIT_API_KEY (공공데이터포털 "일반 인증키(Decoding)")
const ENDPOINT = "https://apis.data.go.kr/1613000/RTMSDataSvcAptTrade/getRTMSDataSvcAptTrade";

// 2026.2 화성시 분구 → 병점구(41595)
const LAWD_CDS = (process.env.LAWD_CDS ?? "41595").split(",").map((s) => s.trim()).filter(Boolean);
const APT_KEYWORD = process.env.APT_KEYWORD ?? "신한에스빌";
const APT_EXCLUDE = process.env.APT_EXCLUDE ?? "2단지,2차";
const UMD = process.env.APT_UMD ?? "병점동";
const MONTHS = 6; // 26평은 거래가 드물어서 6개월치를 가져오고
const RECENT = 3; // 최근 3개월에 2건 이상이면 3개월 평균을 씀
const CACHE = 21600; // 성공한 응답만 6시간 캐시

export const dynamic = "force-dynamic";

type Deal = { date: string; amount: number; area: number; floor: number; name: string };

function tag(xml: string, name: string) {
  const m = xml.match(new RegExp(`<${name}>\\s*([^<]*?)\\s*</${name}>`));
  return m ? m[1] : "";
}

async function fetchMonth(lawd: string, ymd: string, key: string): Promise<Deal[]> {
  const url = `${ENDPOINT}?serviceKey=${encodeURIComponent(key)}&LAWD_CD=${lawd}&DEAL_YMD=${ymd}&pageNo=1&numOfRows=1000`;
  let xml = "";
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(url, { next: { revalidate: CACHE }, signal: AbortSignal.timeout(12000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      xml = await res.text();
      if (!xml.includes("<resultCode>000</resultCode>")) throw new Error(xml.slice(0, 200));
      break;
    } catch (e) {
      if (attempt >= 2) throw e;
    }
  }
  const excludes = APT_EXCLUDE.split(",").map((s) => s.trim()).filter(Boolean);
  const items = xml.split("<item>").slice(1);
  return items
    .map((it) => ({
      name: tag(it, "aptNm"),
      umd: tag(it, "umdNm"),
      cancelled: tag(it, "cdealType").trim() !== "",
      amount: Number(tag(it, "dealAmount").replace(/,/g, "")),
      area: Number(tag(it, "excluUseAr")),
      floor: Number(tag(it, "floor")),
      date: `${tag(it, "dealYear")}-${tag(it, "dealMonth").padStart(2, "0")}-${tag(it, "dealDay").padStart(2, "0")}`,
    }))
    .filter(
      (d) =>
        d.name.includes(APT_KEYWORD) &&
        !excludes.some((e) => d.name.includes(e)) &&
        (!UMD || d.umd.includes(UMD)) &&
        !d.cancelled &&
        d.amount > 0,
    )
    .map(({ name, amount, area, floor, date }) => ({ name, amount, area, floor, date }));
}

export async function GET() {
  const key = process.env.MOLIT_API_KEY;
  if (!key) return NextResponse.json({ ok: false, reason: "no-key" });

  const now = new Date();
  const months: string[] = [];
  for (let i = 0; i < MONTHS; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  try {
    const results = await Promise.allSettled(months.flatMap((m) => LAWD_CDS.map((c) => fetchMonth(c, m, key))));
    const errors = results.filter((r) => r.status === "rejected").length;
    if (errors === results.length) throw new Error("all requests failed");

    const seen = new Set<string>();
    const deals: Deal[] = [];
    for (const r of results) {
      if (r.status !== "fulfilled") continue;
      for (const d of r.value) {
        const k = `${d.date}-${d.amount}-${d.area}-${d.floor}`;
        if (!seen.has(k)) (seen.add(k), deals.push(d));
      }
    }
    deals.sort((a, b) => b.date.localeCompare(a.date));

    // 전용면적(소수 첫째 자리 반올림)별 그룹
    const groups = new Map<number, Deal[]>();
    for (const d of deals) {
      const a = Math.round(d.area);
      groups.set(a, [...(groups.get(a) ?? []), d]);
    }
    const recentFrom = months[RECENT - 1].replace(/(\d{4})(\d{2})/, "$1-$2-01");
    const byArea = [...groups.entries()]
      .map(([area, list]) => {
        const recent = list.filter((d) => d.date >= recentFrom);
        const used = recent.length >= 2 ? recent : list;
        return {
          area,
          pyeong: Math.round((area * 1.33) / 3.3058), // 공급면적 대략 환산
          count: used.length,
          window: used === recent ? RECENT : MONTHS,
          avg: Math.round(used.reduce((s, d) => s + d.amount, 0) / used.length),
          deals: list.slice(0, 5),
        };
      })
      .sort((a, b) => a.area - b.area);

    return NextResponse.json({ ok: true, months, byArea, fetchedAt: new Date().toISOString() });
  } catch (e) {
    return NextResponse.json({ ok: false, reason: "fetch-failed", message: String(e) });
  }
}
