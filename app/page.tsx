"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import {
  buildMilestones,
  computeCosts,
  computeProgress,
  priceFromLive,
  projectEta,
  requiredMonthly,
  won,
  type Entry,
} from "@/lib/finance";
import { useEntries, useSettings } from "@/lib/store";

const HouseCanvas = dynamic(() => import("@/components/HouseCanvas"), {
  ssr: false,
  loading: () => <div className="canvas-loading">집을 불러오는 중…</div>,
});

type AreaGroup = { area: number; pyeong: number; count: number; window: number; avg: number; deals: { date: string; amount: number; floor: number }[] };
// 신한에스빌 1차 전용면적 → 부르는 평형
const PYEONG: Record<number, string> = { 67: "26평", 85: "31평" };

type PriceResp = { ok: boolean; reason?: string; byArea?: AreaGroup[]; fetchedAt?: string; months?: string[] };

export default function Home() {
  const [settings, setSettings] = useSettings();
  const [entries, setEntries] = useEntries();
  const [tab, setTab] = useState<"build" | "dream">("build");
  const [selected, setSelected] = useState<string | null>(null);
  const [sheet, setSheet] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [live, setLive] = useState<PriceResp | null>(null);

  // 앱 열 때마다 실거래가 갱신
  useEffect(() => {
    fetch("/api/price")
      .then((r) => r.json())
      .then(setLive)
      .catch(() => setLive({ ok: false, reason: "network" }));
  }, []);

  const areaGroup = useMemo(() => {
    const groups = live?.byArea ?? [];
    if (!groups.length) return null;
    if (settings.preferredArea != null) {
      const g = groups.find((g) => g.area === settings.preferredArea);
      if (g) return g;
    }
    // 기본: 26평(전용 약 67㎡)에 가장 가까운 면적
    return [...groups].sort((a, b) => Math.abs(a.area - 67) - Math.abs(b.area - 67))[0];
  }, [live, settings.preferredArea]);

  const price = areaGroup ? priceFromLive(areaGroup.avg, settings.priceBuffer) : settings.manualPrice;
  const costs = useMemo(() => computeCosts(price, settings), [price, settings]);
  const milestones = useMemo(() => buildMilestones(costs), [costs]);
  const saved = settings.startSeed + entries.reduce((s, e) => s + e.amount, 0);
  const progress = useMemo(() => computeProgress(milestones, saved), [milestones, saved]);
  const eta = useMemo(() => projectEta(saved, costs.target, settings), [saved, costs.target, settings]);
  const needMonthly = useMemo(() => requiredMonthly(saved, costs.target, settings), [saved, costs.target, settings]);
  const doneCount = progress.milestones.filter((m) => m.fraction >= 1).length;

  // 저축을 기록했을 때 새로 해금된 것 축하
  const addEntry = (e: Entry) => {
    setEntries([...entries, e]);
    const after = computeProgress(milestones, saved + e.amount).milestones.filter((m) => m.fraction >= 1);
    const unlocked = after.slice(doneCount);
    if (unlocked.length) {
      setToast(`🎉 ${unlocked.map((m) => `${m.emoji} ${m.name}`).join(", ")} 해금!`);
      setTab("build");
      setTimeout(() => setToast(null), 3500);
    }
  };

  const sel = selected ? progress.milestones.find((m) => m.id === selected) : null;
  const next = progress.next;
  const deadlineDate = new Date(`${settings.deadline}-01`);
  const onTime = eta && eta.date <= deadlineDate;

  return (
    <main className="app">
      <header className="top">
        <div>
          <p className="eyebrow">병점 신한에스빌 1단지 · 26평</p>
          <h1>{tab === "build" ? "우리집 짓는 중" : "완성된 우리집"}</h1>
        </div>
        <div className="pct">
          <strong>{(progress.ratio * 100).toFixed(1)}%</strong>
          <span>
            {won(saved)} / {won(costs.target)}
          </span>
        </div>
      </header>

      <div className="bar">
        <div className="bar-fill" style={{ width: `${progress.ratio * 100}%` }} />
        {progress.milestones
          .filter((m) => m.id === "keys" || m.id === "foundation")
          .map((m) => (
            <span key={m.id} className="bar-mark" style={{ left: `${(m.end / costs.target) * 100}%` }} title={m.name} />
          ))}
      </div>
      <div className="bar-legend">
        <span>계약금</span>
        <span style={{ left: `${(progress.milestones.find((m) => m.id === "keys")!.end / costs.target) * 100}%` }}>🔑 입주</span>
        <span>✨ 완성</span>
      </div>

      <section className="stage">
        <div className="tabs" role="tablist">
          <button role="tab" aria-selected={tab === "build"} className={tab === "build" ? "on" : ""} onClick={() => setTab("build")}>
            🏗️ 짓는 중
          </button>
          <button role="tab" aria-selected={tab === "dream"} className={tab === "dream" ? "on" : ""} onClick={() => setTab("dream")}>
            🏡 완성된 모습
          </button>
        </div>
        <div className="canvas">
          <HouseCanvas fraction={progress.fraction} nextId={next?.id ?? null} dream={tab === "dream"} onSelect={setSelected} />
        </div>
        <div className="stage-foot">
          {sel ? (
            <div className="chip">
              <span className="chip-emoji">{sel.emoji}</span>
              <div>
                <b>{sel.name}</b>
                <small>
                  {sel.detail} · {won(sel.cost)}
                </small>
              </div>
              <span className={`badge ${sel.fraction >= 1 ? "ok" : ""}`}>{sel.fraction >= 1 ? "해금" : `${won(sel.end - saved)} 남음`}</span>
            </div>
          ) : (
            <p className="hint">{tab === "build" ? "파란 실루엣이 다음에 들어올 거예요 · 눌러서 확인" : "가구를 눌러 가격을 확인하세요 · 드래그로 돌려보기"}</p>
          )}
        </div>
      </section>

      {next && (
        <section className="card next">
          <p className="label">다음 해금</p>
          <div className="next-row">
            <span className="big-emoji">{next.emoji}</span>
            <div className="grow">
              <b>{next.name}</b>
              <small>{next.detail}</small>
              <div className="mini-bar">
                <div style={{ width: `${next.fraction * 100}%` }} />
              </div>
            </div>
            <div className="right">
              <strong>{won(next.end - saved)}</strong>
              <small>남음</small>
            </div>
          </div>
        </section>
      )}

      <section className="card">
        <p className="label">언제 입주할 수 있을까</p>
        <p className="eta">
          {eta ? (
            <>
              지금 속도면 <b>{eta.date.getFullYear()}년 {eta.date.getMonth() + 1}월</b> 완성
              <span className={`badge ${onTime ? "ok" : "warn"}`}>{onTime ? "목표 안!" : `목표 ${settings.deadline.replace("-", ".")}`}</span>
            </>
          ) : (
            "지금 설정으로는 50년 안에 도달하지 못해요"
          )}
        </p>
        <p className="sub">
          {settings.deadline.replace("-", "년 ")}월까지 완성하려면 월 <b>{won(needMonthly)}</b> 필요 (연 {(settings.annualReturn * 100).toFixed(1)}% 운용 가정)
        </p>
        <div className="sliders">
          <Slider label="지금 월 저축" value={settings.monthlyNow} min={0} max={1000} step={10} unit="만" onChange={(v) => setSettings({ ...settings, monthlyNow: v })} />
          <Slider label="2027년부터 월 저축" value={settings.monthly2027} min={0} max={1000} step={10} unit="만" onChange={(v) => setSettings({ ...settings, monthly2027: v })} />
          <Slider label="연 수익률" value={Math.round(settings.annualReturn * 1000) / 10} min={0} max={12} step={0.5} unit="%" onChange={(v) => setSettings({ ...settings, annualReturn: v / 100 })} />
        </div>
      </section>

      <section className="card">
        <p className="label">목표 금액은 이렇게 계산했어요</p>
        <div className="price-src">
          {areaGroup ? (
            <>
              <span className="badge ok">실거래가 연동</span>
              <small>
                최근 {areaGroup.window}개월 {PYEONG[areaGroup.area] ?? `전용 ${areaGroup.area}㎡`} 평균 {won(areaGroup.avg)} ({areaGroup.count}건) + 여유 {Math.round(settings.priceBuffer * 100)}%
              </small>
            </>
          ) : (
            <>
              <span className="badge warn">직접 입력값</span>
              <small>
                {live == null
                  ? "실거래가 불러오는 중…"
                  : live.reason === "no-key"
                    ? "실거래가 API 키가 없어 직접 입력한 집값을 써요"
                    : live.ok
                      ? "최근 6개월 거래가 없어 직접 입력한 집값을 써요"
                      : "실거래가를 불러오지 못해 직접 입력한 집값을 써요"}
              </small>
            </>
          )}
        </div>
        {live?.byArea && live.byArea.length > 1 && (
          <div className="areas">
            {live.byArea.map((g) => (
              <button key={g.area} className={areaGroup?.area === g.area ? "on" : ""} onClick={() => setSettings({ ...settings, preferredArea: g.area })}>
                {PYEONG[g.area] ?? `전용 ${g.area}㎡`} · {won(g.avg)}
              </button>
            ))}
          </div>
        )}
        <dl className="calc">
          <Row k="집값 (계산용)" v={won(costs.price)} strong />
          <Row k="− 디딤돌 대출" v={won(costs.loan)} />
          <Row k="= 자기부담금" v={won(costs.equity)} />
          <Row k={`+ 취득세${settings.firstHomeTaxRelief ? " (생애최초 감면)" : ""}`} v={won(costs.acquisitionTax)} />
          <Row k="+ 중개보수" v={won(costs.brokerage)} />
          <Row k="+ 법무사·이사 등" v={won(costs.misc)} />
          <Row k="+ 인테리어·가구" v={won(costs.interior)} />
          <Row k="모아야 할 현금" v={won(costs.target)} strong />
        </dl>
      </section>

      <section className="card">
        <p className="label">짓는 순서</p>
        <ol className="timeline">
          {progress.milestones.map((m) => (
            <li key={m.id} className={m.fraction >= 1 ? "done" : m.id === next?.id ? "now" : ""} onClick={() => setSelected(m.id)}>
              <span className="t-emoji">{m.fraction >= 1 ? "✅" : m.emoji}</span>
              <span className="t-name">{m.name}</span>
              <span className="t-cost">{won(m.cost)}</span>
              {m.id === next?.id && (
                <span className="t-bar">
                  <span style={{ width: `${m.fraction * 100}%` }} />
                </span>
              )}
            </li>
          ))}
        </ol>
      </section>

      <section className="card">
        <p className="label">저축 기록</p>
        <ul className="history">
          {[...entries].reverse().map((e) => (
            <li key={e.id}>
              <span className="h-date">{e.date.slice(2).replace(/-/g, ".")}</span>
              <span className="h-memo">{e.memo || (e.amount >= 0 ? "저축" : "조정")}</span>
              <span className={`h-amt ${e.amount < 0 ? "neg" : ""}`}>
                {e.amount >= 0 ? "+" : ""}
                {won(e.amount)}
              </span>
              <button aria-label="삭제" onClick={() => confirm("이 기록을 지울까요?") && setEntries(entries.filter((x) => x.id !== e.id))}>
                ×
              </button>
            </li>
          ))}
          <li className="seed">
            <span className="h-date">{settings.startDate.slice(2).replace(/-/g, ".")}</span>
            <span className="h-memo">시작 시드</span>
            <span className="h-amt">{won(settings.startSeed)}</span>
            <span />
          </li>
        </ul>
      </section>

      <SettingsCard settings={settings} setSettings={setSettings} />

      <button className="fab" onClick={() => setSheet(true)}>
        + 저축하기
      </button>

      {sheet && <AddSheet onClose={() => setSheet(false)} onAdd={addEntry} />}
      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}

function Row({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className={strong ? "strong" : ""}>
      <dt>{k}</dt>
      <dd>{v}</dd>
    </div>
  );
}

function Slider({ label, value, min, max, step, unit, onChange }: { label: string; value: number; min: number; max: number; step: number; unit: string; onChange: (v: number) => void }) {
  return (
    <label className="slider">
      <span>
        {label} <b>{unit === "만" ? won(value) : `${value}${unit}`}</b>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

function AddSheet({ onClose, onAdd }: { onClose: () => void; onAdd: (e: Entry) => void }) {
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [minus, setMinus] = useState(false);
  const today = new Date();
  const [date, setDate] = useState(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`);
  const n = Number(amount);
  const quick = [
    { label: "월급날 저축", v: 100 },
    { label: "배달 참기", v: 2 },
    { label: "커피 참기", v: 0.5 },
  ];
  return (
    <div className="sheet-bg" onClick={onClose}>
      <form
        className="sheet"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          if (!n) return;
          onAdd({ id: crypto.randomUUID(), date, amount: minus ? -n : n, memo });
          onClose();
        }}
      >
        <h2>{minus ? "자산 조정 (−)" : "얼마 모았어요?"}</h2>
        <div className="quick">
          {quick.map((q) => (
            <button type="button" key={q.label} onClick={() => (setAmount(String(q.v)), setMemo(q.label), setMinus(false))}>
              {q.label} {won(q.v) === "0만" ? `${q.v * 10000}원` : won(q.v)}
            </button>
          ))}
        </div>
        <label>
          금액 (만원)
          <input inputMode="decimal" autoFocus value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))} placeholder="100" />
        </label>
        <label>
          메모
          <input value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="11월 월급" />
        </label>
        <label>
          날짜
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label className="check">
          <input type="checkbox" checked={minus} onChange={(e) => setMinus(e.target.checked)} />
          투자 손실·지출 등으로 줄어든 금액이에요
        </label>
        <button className="primary" disabled={!n}>
          {minus ? "기록하기" : "집에 보태기 🧱"}
        </button>
      </form>
    </div>
  );
}

function SettingsCard({ settings, setSettings }: { settings: ReturnType<typeof useSettings>[0]; setSettings: ReturnType<typeof useSettings>[1] }) {
  const num = (k: keyof typeof settings) => ({
    value: String(settings[k] ?? ""),
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setSettings({ ...settings, [k]: Number(e.target.value.replace(/[^0-9.]/g, "")) || 0 }),
    inputMode: "decimal" as const,
  });
  return (
    <details className="card settings">
      <summary>기본값 바꾸기</summary>
      <label>
        시작 시드 (만원)
        <input {...num("startSeed")} />
      </label>
      <label>
        디딤돌 대출 가정 (만원)
        <input {...num("loan")} />
      </label>
      <label>
        실거래가 없을 때 집값 (만원)
        <input {...num("manualPrice")} />
      </label>
      <label>
        실거래 평균에 얹는 여유 (%)
        <input value={String(Math.round(settings.priceBuffer * 100))} inputMode="decimal" onChange={(e) => setSettings({ ...settings, priceBuffer: (Number(e.target.value) || 0) / 100 })} />
      </label>
      <label>
        목표 시점
        <input type="month" value={settings.deadline} onChange={(e) => setSettings({ ...settings, deadline: e.target.value })} />
      </label>
      <label className="check">
        <input type="checkbox" checked={settings.firstHomeTaxRelief} onChange={(e) => setSettings({ ...settings, firstHomeTaxRelief: e.target.checked })} />
        생애최초 취득세 감면 (최대 200만) 적용
      </label>
      <p className="fine">기록은 이 브라우저에만 저장돼요. 디딤돌 한도·LTV와 취득세 감면은 매수 시점 기준으로 다시 확인하세요.</p>
    </details>
  );
}
