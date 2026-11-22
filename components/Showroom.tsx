"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { won, type Progress } from "@/lib/finance";
import { ROOMS, type Focus } from "./house/kit";
import { ME } from "./house/Me";

const HouseCanvas = dynamic(() => import("./HouseCanvas"), { ssr: false });

const ORDER: Focus[] = ["me", null, "living", "kitchen", "master", "dress", "study", "bath", "entrance"];

export default function Showroom({ progress, saved, onClose }: { progress: Progress; saved: number; onClose: () => void }) {
  const [room, setRoom] = useState<Focus>("me");
  const [meLabel, setMeLabel] = useState(ME.label);
  const [dream, setDream] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const id = setInterval(() => setMeLabel(ME.room ? `지금 ${ROOMS[ME.room].name}에 있어요` : "집 안을 돌아다니는 중"), 400);
    return () => clearInterval(id);
  }, []);

  const r = room && room !== "me" ? ROOMS[room] : null;
  const items = (r ? r.items : []).map((id) => progress.milestones.find((m) => m.id === id)!).filter(Boolean);
  const sel = selected ? progress.milestones.find((m) => m.id === selected) : null;
  const roomCost = items.reduce((s, m) => s + m.cost, 0);
  const roomDone = items.filter((m) => m.fraction >= 1).length;

  return (
    <div className="showroom">
      <div className="sr-top">
        <button className="sr-close" onClick={onClose} aria-label="닫기">
          ✕
        </button>
        <div className="sr-title">
          <b>우리집 쇼룸</b>
          <small>{room === "me" ? "나 따라가기" : r ? r.name : "전체 보기"}</small>
        </div>
        <div className="sr-mode">
          <button className={dream ? "on" : ""} onClick={() => setDream(true)}>
            완성
          </button>
          <button
            className={!dream ? "on" : ""}
            onClick={() => {
              setDream(false);
              if (room === "me") setRoom("living");
            }}
          >
            지금
          </button>
        </div>
      </div>

      <div className="sr-canvas">
        <HouseCanvas fraction={progress.fraction} nextId={progress.next?.id ?? null} dream={dream} focus={room} onSelect={setSelected} />
      </div>

      <div className="sr-rooms">
        {ORDER.map((id) => (
          <button
            key={id ?? "all"}
            disabled={id === "me" && !dream}
            className={room === id ? "on" : ""}
            onClick={() => {
              setRoom(id);
              setSelected(null);
              setOpen(true);
            }}
          >
            {id === "me" ? "👧 나" : id ? ROOMS[id].name : "전체"}
          </button>
        ))}
      </div>

      <div className={`sr-panel ${open ? "" : "closed"}`}>
        <button className="sr-handle" onClick={() => setOpen(!open)} aria-label="패널 접기">
          <span />
        </button>
        {sel ? (
          <div className="sr-sel">
            <span className="chip-emoji">{sel.emoji}</span>
            <div>
              <b>{sel.name}</b>
              <small>{sel.detail}</small>
            </div>
            <div className="right">
              <strong>{won(sel.cost)}</strong>
              <small>{sel.fraction >= 1 ? "해금 ✓" : `${won(sel.end - saved)} 남음`}</small>
            </div>
          </div>
        ) : room === "me" ? (
          <div className="sr-room-head">
            <div>
              <b>{dream ? meLabel : "집이 완성되면 이사 올게요"}</b>
              <small>{dream ? "카메라가 나를 따라가요 · 손가락으로 각도를 바꿀 수 있어요" : "완성 모드에서 집 안을 돌아다니는 나를 볼 수 있어요"}</small>
            </div>
          </div>
        ) : r ? (
          <>
            <div className="sr-room-head">
              <div>
                <b>{r.name}</b>
                <small>{r.mood}</small>
              </div>
              <span className="badge">
                {roomDone}/{items.length} · {won(roomCost)}
              </span>
            </div>
            {open && (
              <ul className="sr-items">
                {items.map((m) => (
                  <li key={m.id} className={m.fraction >= 1 ? "done" : ""} onClick={() => setSelected(m.id)}>
                    <span>{m.fraction >= 1 ? "✅" : m.emoji}</span>
                    <span className="sr-name">{m.name}</span>
                    <span className="sr-cost">{won(m.cost)}</span>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <p className="hint">방을 골라 들어가 보세요 · 손가락으로 돌리고 확대할 수 있어요</p>
        )}
      </div>
    </div>
  );
}
