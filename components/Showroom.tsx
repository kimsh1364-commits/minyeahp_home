"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { won, type Progress } from "@/lib/finance";
import { ROOMS, type RoomId } from "./house/House";

const HouseCanvas = dynamic(() => import("./HouseCanvas"), { ssr: false });

const ORDER: (RoomId | null)[] = [null, "living", "kitchen", "master", "dress", "study", "bath", "entrance"];

export default function Showroom({ progress, saved, onClose }: { progress: Progress; saved: number; onClose: () => void }) {
  const [room, setRoom] = useState<RoomId | null>("living");
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

  const r = room ? ROOMS[room] : null;
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
          <small>{r ? r.name : "전체 보기"}</small>
        </div>
        <div className="sr-mode">
          <button className={dream ? "on" : ""} onClick={() => setDream(true)}>
            완성
          </button>
          <button className={!dream ? "on" : ""} onClick={() => setDream(false)}>
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
            className={room === id ? "on" : ""}
            onClick={() => {
              setRoom(id);
              setSelected(null);
              setOpen(true);
            }}
          >
            {id ? ROOMS[id].name : "전체"}
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
