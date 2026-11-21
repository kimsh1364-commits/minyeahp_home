// 모든 금액 단위: 만원

export type Settings = {
  startSeed: number; // 시작 시드
  startDate: string; // 시드 기준일 (YYYY-MM-DD)
  loan: number; // 디딤돌 대출 가정액
  manualPrice: number; // 실거래가를 못 불러올 때 쓰는 집값
  priceBuffer: number; // 실거래 평균에 얹는 여유 비율 (0.05 = 5%)
  monthlyNow: number; // 지금 월 저축액
  monthly2027: number; // 2027년부터 월 저축액
  annualReturn: number; // 연 수익률 (0.04 = 4%)
  deadline: string; // 목표 입주 시점 (YYYY-MM)
  firstHomeTaxRelief: boolean; // 생애최초 취득세 감면 적용
  preferredArea: number | null; // 실거래 추적할 전용면적(㎡)
};

export const DEFAULT_SETTINGS: Settings = {
  startSeed: 5000,
  startDate: "2026-11-21",
  loan: 20000,
  manualPrice: 40000,
  priceBuffer: 0.05,
  monthlyNow: 100,
  monthly2027: 150,
  annualReturn: 0.04,
  deadline: "2031-11",
  firstHomeTaxRelief: true,
  preferredArea: null,
};

export type Entry = { id: string; date: string; amount: number; memo: string };

export type MilestoneGroup = "buy" | "interior" | "furnish";

export type Milestone = {
  id: string;
  name: string;
  detail: string;
  cost: number;
  group: MilestoneGroup;
  emoji: string;
};

// 인테리어: 총 1억. 참고 견적(2,630만)의 기본 공사 + 사진 무드(우드·스텐·모자이크) 업그레이드
export const INTERIOR: Milestone[] = [
  { id: "demolition", name: "철거·설비·방수", detail: "기존 우물천장·아트월·욕조 철거, 폐기물, 욕실 방수", cost: 600, group: "interior", emoji: "🔨" },
  { id: "sash", name: "샷시 교체", detail: "전체 샷시 (참고 견적 290~380만 → 확장 포함 여유)", cost: 1000, group: "interior", emoji: "🪟" },
  { id: "carpentry", name: "목공·몰딩·문", detail: "천장 몰딩, 걸레받이, 방문 4개 오크 도어", cost: 700, group: "interior", emoji: "🚪" },
  { id: "wallpaper", name: "도배 (버터 크림)", detail: "전체 광폭합지 → 버터 크림톤 벽", cost: 250, group: "interior", emoji: "🎨" },
  { id: "floor", name: "원목 마루", detail: "장판 대신 허니 오크 마루", cost: 1200, group: "interior", emoji: "🪵" },
  { id: "electric", name: "전기·매입등", detail: "콘센트·스위치 교체, 매입 핀조명", cost: 300, group: "interior", emoji: "💡" },
  { id: "kitchen", name: "우드 주방", detail: "허니 원목 하부장, 스텐 상판, 버터 체커 타일, 우드 후드, 오픈 선반", cost: 1600, group: "interior", emoji: "🍳" },
  { id: "island", name: "주방 아일랜드", detail: "원목 아일랜드 + 스텐 상판", cost: 600, group: "interior", emoji: "🧺" },
  { id: "bath", name: "모자이크 욕실", detail: "세이지 모자이크, 페니 타일 띠·거울 액자, 벽걸이 세면대, 욕조", cost: 1000, group: "interior", emoji: "🛁" },
  { id: "entrance", name: "중문·신발장", detail: "우드 유리 중문, 버터 체커 바닥, 신발장, 둥근 거울", cost: 400, group: "interior", emoji: "👟" },
  { id: "balcony", name: "베란다 타일·탄성", detail: "테라코타 체커 타일, 바이오 세라믹 탄성", cost: 300, group: "interior", emoji: "🪴" },
  { id: "lights", name: "조명", detail: "버터 펜던트, 플리츠 스탠드, 버섯 조명, 욕실 벽등", cost: 200, group: "furnish", emoji: "🏮" },
  { id: "sofa", name: "거실 소파", detail: "버터 코듀로이 소파, 체커 러그, 원목 커피테이블", cost: 300, group: "furnish", emoji: "🛋️" },
  { id: "dining", name: "식탁·의자", detail: "원목 원형 식탁 + 버건디 줄무늬 빈티지 체어 3", cost: 250, group: "furnish", emoji: "🍽️" },
  { id: "bed", name: "안방 침대", detail: "물결 헤드보드 원목 침대, 버터 깅엄 이불, 협탁", cost: 300, group: "furnish", emoji: "🛏️" },
  { id: "desk", name: "서재 책상", detail: "원목 책상, 빈티지 체어, 코르크 보드", cost: 150, group: "furnish", emoji: "🪑" },
  { id: "storage", name: "수납가구", detail: "드레스룸 붙박이장·행거, 거실 수납장, 서재 책장", cost: 200, group: "furnish", emoji: "🗄️" },
  { id: "appliances", name: "가전", detail: "레트로 버터 냉장고, 세탁기, 식기세척기, 브라운관 TV", cost: 500, group: "furnish", emoji: "🧊" },
  { id: "decor", name: "소품·식물", detail: "물결 우드 거울, 깅엄 커튼, 포스터, 화분, 비스트로 세트", cost: 150, group: "furnish", emoji: "🌿" },
];

export const INTERIOR_TOTAL = INTERIOR.reduce((s, m) => s + m.cost, 0);

export type Costs = {
  price: number;
  loan: number;
  equity: number; // 집값 - 대출
  deposit: number; // 계약금 10%
  balance: number; // 잔금 (자기부담)
  acquisitionTax: number;
  brokerage: number;
  misc: number;
  fees: number;
  interior: number;
  target: number;
};

export function computeCosts(price: number, s: Settings): Costs {
  const loan = Math.min(s.loan, price);
  const equity = price - loan;
  const deposit = Math.round(price * 0.1);
  const balance = Math.max(0, equity - deposit);
  // 6억 이하: 취득세 1% + 지방교육세 0.1%
  let acquisitionTax = Math.round(price * 0.011);
  if (s.firstHomeTaxRelief) acquisitionTax = Math.max(0, acquisitionTax - 200);
  // 중개보수 2억~9억 상한 0.4% + 부가세
  const brokerage = Math.round(price * 0.004 * 1.1);
  const misc = 300; // 법무사·채권·이사·관리비 예치 등
  const fees = acquisitionTax + brokerage + misc;
  const target = equity + fees + INTERIOR_TOTAL;
  return { price, loan, equity, deposit, balance, acquisitionTax, brokerage, misc, fees, interior: INTERIOR_TOTAL, target };
}

// 돈을 실제로 쓰는 순서 = 집이 지어지는 순서
export function buildMilestones(c: Costs): Milestone[] {
  const b = c.balance;
  const part = (r: number) => Math.round(b * r);
  const outer = part(0.4);
  const inner = part(0.25);
  const windows = part(0.2);
  const doors = b - outer - inner - windows;
  return [
    { id: "foundation", name: "계약금", detail: `집값의 10% · 땅을 다지고 기둥을 세워요`, cost: c.deposit, group: "buy", emoji: "📝" },
    { id: "outerWalls", name: "잔금 ① 외벽", detail: "잔금의 40% · 외벽이 올라가요", cost: outer, group: "buy", emoji: "🧱" },
    { id: "innerWalls", name: "잔금 ② 내벽", detail: "잔금의 25% · 방이 나뉘어요", cost: inner, group: "buy", emoji: "🧱" },
    { id: "windows", name: "잔금 ③ 창문", detail: "잔금의 20% · 창이 생겨요", cost: windows, group: "buy", emoji: "🪟" },
    { id: "doors", name: "잔금 ④ 문", detail: "잔금의 15% · 잔금 완납!", cost: doors, group: "buy", emoji: "🚪" },
    { id: "keys", name: "취득세·중개·이사", detail: `취득세 ${c.acquisitionTax} · 중개 ${c.brokerage} · 기타 ${c.misc}`, cost: c.fees, group: "buy", emoji: "🔑" },
    ...INTERIOR,
  ];
}

export type Progress = {
  milestones: (Milestone & { start: number; end: number; fraction: number })[];
  fraction: Record<string, number>;
  next: (Milestone & { start: number; end: number; fraction: number }) | null;
  ratio: number;
};

export function computeProgress(ms: Milestone[], saved: number): Progress {
  let acc = 0;
  const out = ms.map((m) => {
    const start = acc;
    acc += m.cost;
    const fraction = m.cost <= 0 ? 1 : Math.min(1, Math.max(0, (saved - start) / m.cost));
    return { ...m, start, end: acc, fraction };
  });
  const fraction: Record<string, number> = {};
  out.forEach((m) => (fraction[m.id] = m.fraction));
  return { milestones: out, fraction, next: out.find((m) => m.fraction < 1) ?? null, ratio: acc ? Math.min(1, saved / acc) : 0 };
}

function monthlyAt(date: Date, s: Settings) {
  return date.getFullYear() >= 2027 ? s.monthly2027 : s.monthlyNow;
}

// 매달 저축 + 연수익률(월복리)로 목표 도달 시점
export function projectEta(saved: number, target: number, s: Settings, from = new Date()) {
  let bal = saved;
  const r = Math.pow(1 + s.annualReturn, 1 / 12) - 1;
  const d = new Date(from.getFullYear(), from.getMonth(), 1);
  for (let i = 0; i <= 600; i++) {
    if (bal >= target) return { months: i, date: new Date(d) };
    d.setMonth(d.getMonth() + 1);
    bal = bal * (1 + r) + monthlyAt(d, s);
  }
  return null;
}

// 마감일까지 맞추려면 필요한 월 저축액
export function requiredMonthly(saved: number, target: number, s: Settings, from = new Date()) {
  const [y, m] = s.deadline.split("-").map(Number);
  const n = (y - from.getFullYear()) * 12 + (m - 1 - from.getMonth());
  if (n <= 0) return Math.max(0, target - saved);
  const r = Math.pow(1 + s.annualReturn, 1 / 12) - 1;
  const grown = saved * Math.pow(1 + r, n);
  const annuity = r === 0 ? n : (Math.pow(1 + r, n) - 1) / r;
  return Math.max(0, Math.ceil((target - grown) / annuity));
}

export function won(man: number) {
  const sign = man < 0 ? "-" : "";
  const v = Math.abs(Math.round(man));
  const eok = Math.floor(v / 10000);
  const rest = v % 10000;
  if (eok && rest) return `${sign}${eok}억 ${rest.toLocaleString()}만`;
  if (eok) return `${sign}${eok}억`;
  return `${sign}${rest.toLocaleString()}만`;
}

export function priceFromLive(avg: number, buffer: number) {
  return Math.ceil((avg * (1 + buffer)) / 1000) * 1000; // 천만원 단위 올림
}
